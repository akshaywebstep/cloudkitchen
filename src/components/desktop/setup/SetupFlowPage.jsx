import React, { useEffect, useState } from "react";
import {
  Check,
  CreditCard,
  FileCheck2,
  ShieldCheck,
  Lock,
  LogOut,
  Loader2,
  AlertCircle,
  CalendarDays,
  Repeat,
  BadgeCheck,
  Sparkles,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../ui/Card";
import { Field } from "../../ui/Field";
import { FileField } from "../../ui/FileField";
import { api, getApiErrorMessage } from "../../../api";
import {
  getPlanPrice,
  getPlanTitle,
  hasActiveKitchenSubscription,
  hasSelectedSubscription,
  isKitchenOnboardingCompleted,
} from "../../../utils/helpers";

/* ---------------------------------------------------------------------
 * Card formatting + validation helpers
 * ------------------------------------------------------------------- */

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(011|5)/.test(digits)) return "Discover";
  if (/^(60|65|81|82|50)/.test(digits)) return "Rupay";
  return "";
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const isAmex = /^3[47]/.test(digits);
  if (isAmex) {
    // Amex: 4-6-5
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value, previous = "") {
  const wasDeleting = value.length < previous.length;
  let digits = value.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "";

  // auto-correct first digit if month can't start with it (e.g. typed "3" alone -> "03")
  if (digits.length === 1 && Number(digits[0]) > 1) {
    digits = `0${digits}`;
  }
  if (digits.length >= 2) {
    let month = Number(digits.slice(0, 2));
    if (month === 0) month = 1;
    if (month > 12) month = 12;
    digits = String(month).padStart(2, "0") + digits.slice(2);
  }

  const month = digits.slice(0, 2);
  const year = digits.slice(2, 4);

  if (!year) return month;
  if (wasDeleting && value.length <= 3) return month; // let backspace remove the slash cleanly
  return `${month}/${year}`;
}

function formatCvc(value) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function formatPostalCode(value) {
  return value.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 10);
}

function formatCardholderName(value) {
  return value.replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 60);
}



function validateDemoPayment(paymentForm) {
  const digits = paymentForm.cardNumber.replace(/\D/g, "");
  const nameTrimmed = paymentForm.name.trim();

  if (!nameTrimmed) return "Card holder name is required.";
  if (nameTrimmed.length < 2 || !/[a-zA-Z]/.test(nameTrimmed)) return "Enter a valid card holder name.";

  if (!digits) return "Card number is required.";
  if (digits.length < 13 || digits.length > 19) return "Card number must be 13–19 digits.";

  const expiryMatch = paymentForm.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) return "Expiry must be in MM/YY format.";
  const expMonth = Number(expiryMatch[1]);
  const expYear = Number(expiryMatch[2]);
  if (expMonth < 1 || expMonth > 12) return "Expiry month must be between 01 and 12.";

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return "This card has expired.";
  }
  if (expYear > currentYear + 20) return "Enter a valid expiry year.";

  const cvcLen = /^3[47]/.test(digits) ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLen}}$`).test(paymentForm.cvc.trim())) {
    return `CVC must be ${cvcLen} digits for this card.`;
  }

  if (!paymentForm.postalCode.trim() || paymentForm.postalCode.trim().length < 3) {
    return "Enter a valid postal code.";
  }

  return "";
}

/* ---------------------------------------------------------------------
 * Root page
 * ------------------------------------------------------------------- */

export function SetupFlowPage({ mode, step, apiState, onLogout, onOnboardingCompleted, onPlanSelected, onCheckExistingSubscription, onStepChange }) {
  const onboardingDone = isKitchenOnboardingCompleted(apiState?.kitchen);
  const subscriptionDone = onboardingDone && hasSelectedSubscription(apiState);

  const currentStepKey = mode || step || "onboarding";
  const activeStep = !onboardingDone ? "onboarding" : currentStepKey;

  const steps = [
    { key: "onboarding", number: "1", label: "Onboarding", helper: "FSSAI & GST", done: onboardingDone },
    { key: "subscription", number: "2", label: "Subscription", helper: "Choose plan", done: subscriptionDone },
    { key: "dashboard", number: "3", label: "Dashboard", helper: "Overview", done: false },
  ];

  const goToStep = (key, done) => {
    if (key === "subscription" && !onboardingDone) return;
    if ((done || key === activeStep) && typeof onStepChange === "function") {
      onStepChange(key);
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-gradient-to-b from-[#FBF3EF] to-[#FAF7F5] px-4 py-6 md:px-6 md:py-8">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1180px] items-center justify-between rounded-2xl border border-[#F0E2DB] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(141,6,6,0.05)] md:px-7">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="size-10 object-cover md:size-12"
            />
          </div>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#C98A73] md:text-[10.5px]">
              Kitchen Setup
            </p>
            <h1 className="text-base font-bold capitalize tracking-tight text-[#2B1210] md:text-lg">
              {apiState?.kitchen?.kitchenName || apiState?.kitchen?.email || "Complete your registration"}
            </h1>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-full border border-[#F1DFDA] bg-white px-4 py-2 text-xs font-semibold text-[#8D0606] shadow-sm transition-all hover:border-[#F6D0CA] hover:bg-[#FBEEEC] active:scale-[0.97]"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Horizontal wizard */}
      <div className="mx-auto mt-5 max-w-[1180px]">
        <WizardRail steps={steps} activeStep={activeStep} onNavigate={goToStep} />
      </div>

      <div className="mx-auto mt-5 max-w-[1180px]">
        {activeStep === "onboarding" ? (
          <OnboardingPage onComplete={onOnboardingCompleted} />
        ) : (
          <SubscriptionPlansPage plans={apiState?.plans || []} onPlanSelected={onPlanSelected} onCheckExistingSubscription={onCheckExistingSubscription} />
        )}
      </div>
    </main>
  );
}

function WizardRail({ steps, activeStep, onNavigate }) {
  const activeIndex = steps.findIndex((s) => s.key === activeStep);
  const progressPct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  return (
    <Card className="overflow-x-auto p-0">
      <div className="relative flex min-w-max items-start px-6 pb-5 pt-6 md:px-10">
        {/* base track */}
        <div
          className="absolute left-6 right-6 top-[35px] h-[3px] rounded-full bg-[#EFEAE8] md:left-10 md:right-10"
          aria-hidden="true"
        />
        {/* progress fill */}
        <div
          className="absolute left-6 top-[35px] h-[3px] rounded-full bg-gradient-to-r from-[#28A75B] to-[#8D0606] transition-all duration-500 md:left-10"
          style={{ width: `calc(${progressPct}% - ${progressPct > 0 ? "0px" : "0px"})`, maxWidth: "calc(100% - 3rem)" }}
          aria-hidden="true"
        />

        {steps.map((s, index) => {
          const isActive = s.key === activeStep;
          console.log('s',s)
          const isClickable = s.done || isActive;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onNavigate(s.key, s.done)}
              disabled={!isClickable}
              className={`group relative z-10 flex shrink-0 flex-1 flex-col items-center gap-2.5 px-3 transition-transform ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed"
              } ${isActive ? "" : "hover:scale-[1.03]"}`}
              style={{ minWidth: "150px" }}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 transition-all ${
                  s.done
                    ? "bg-[#28A75B] text-white ring-[#EAFBF1]"
                    : isActive
                    ? "bg-[#8D0606] text-white ring-[#FBEEEC] shadow-md shadow-[#8D0606]/20"
                    : "bg-white text-[#B9ABA6] ring-[#F1EDEB]"
                }`}
              >
                {s.done ? <Check size={16} strokeWidth={2.75} /> : s.number}
              </span>
              <span className="hidden text-center sm:block">
                <span
                  className={`block text-[13px] font-bold leading-tight ${
                    isActive ? "text-[#8D0606]" : s.done ? "text-[#2B1010]" : "text-[#B9ABA6]"
                  }`}
                >
                  {s.label}
                </span>
                <span className={`mt-0.5 block text-[10.5px] leading-tight ${isActive ? "text-[#B8938A]" : "text-[#B9ABA6]"}`}>
                  {s.helper}
                </span>
              </span>
              {isActive ? (
                <span className="absolute -bottom-2 h-1 w-6 rounded-full bg-[#8D0606]" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------
 * Onboarding
 * ------------------------------------------------------------------- */

function OnboardingPage({ onComplete }) {
  const [form, setForm] = useState({ fssaiNumber: "", fssaiFile: null, gstNumber: "", gstFile: null });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const updateText = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const updateFile = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.files?.[0] || null }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.fssaiNumber || !form.fssaiFile || !form.gstNumber || !form.gstFile) {
      setMessage("FSSAI number, FSSAI file, GST number and GST file are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.onboarding(form);
      await onComplete?.();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Onboarding failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start gap-3.5 border-b border-[#F1EDEB] bg-gradient-to-br from-[#FBEEEC] via-white to-white px-6 py-6 md:px-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#2B1010] md:text-2xl">Verify your kitchen</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#8A7A76]">
            FSSAI and GST details are required before setup can continue. Documents are reviewed securely by our team.
          </p>
        </div>
      </div>

      <form className="grid gap-5 px-6 py-6 md:px-8" onSubmit={submit}>
        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[#F1EDEB] bg-[#FCFBFA] p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8D0606]">
              <span className="grid size-4 place-items-center rounded-full bg-[#8D0606] text-[9px] text-white">1</span>
              FSSAI
            </p>
            <div className="grid gap-3">
              <Field label="FSSAI Number *" placeholder="Enter 14-digit FSSAI number (e.g. 12345678901234)" value={form.fssaiNumber} onChange={updateText("fssaiNumber")} />
              <FileField label="FSSAI Certificate *" file={form.fssaiFile} onChange={updateFile("fssaiFile")} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#F1EDEB] bg-[#FCFBFA] p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8D0606]">
              <span className="grid size-4 place-items-center rounded-full bg-[#8D0606] text-[9px] text-white">2</span>
              GST
            </p>
            <div className="grid gap-3">
              <Field label="GST Number *" placeholder="Enter 15-digit GSTIN (e.g. 22AAAAA0000A1Z5)" value={form.gstNumber} onChange={updateText("gstNumber")} />
              <FileField label="GST Certificate *" file={form.gstFile} onChange={updateFile("gstFile")} />
            </div>
          </div>
        </div>

        {message ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#F6D0CA] bg-[#FBEEEC] px-4 py-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#8D0606]" />
            <p className="whitespace-pre-line text-sm font-medium text-[#8D0606]">{message}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-[#F1EDEB] pt-5 sm:flex-row">
          <p className="flex items-center gap-2 text-xs text-[#9C8D89]">
            <Lock size={13} />
            Your documents are encrypted and stored securely
          </p>
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8D0606] px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#7A0505] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 sm:w-auto"
            disabled={saving}
            type="submit"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileCheck2 size={17} />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------------------------------------------------------------
 * Subscription + Payment
 * ------------------------------------------------------------------- */

function SubscriptionPlansPage({ plans, onPlanSelected, onCheckExistingSubscription }) {
  const [planList, setPlanList] = useState(Array.isArray(plans) ? plans : []);
  const [selectedPlanId, setSelectedPlanId] = useState(planList[0]?.id ? String(planList[0].id) : "");
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentForm, setPaymentForm] = useState({ name: "", cardNumber: "", expiry: "", cvc: "", postalCode: "" });

  const cardDigits = paymentForm.cardNumber.replace(/\D/g, "");
  const cardBrand = detectCardBrand(cardDigits);

  const updatePayment = (key) => (event) => {
    const rawValue = event.target.value;
    setPaymentForm((current) => {
      let nextValue = rawValue;
      if (key === "cardNumber") nextValue = formatCardNumber(rawValue);
      else if (key === "expiry") nextValue = formatExpiry(rawValue, current.expiry);
      else if (key === "cvc") nextValue = formatCvc(rawValue);
      else if (key === "postalCode") nextValue = formatPostalCode(rawValue);
      else if (key === "name") nextValue = formatCardholderName(rawValue);
      return { ...current, [key]: nextValue };
    });
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  };

  const showMessage = (text, tone = "info") => {
    setMessage(text);
    setMessageTone(tone);
  };

  useEffect(() => {
    let active = true;
    async function loadPlans() {
      setLoading(true);
      showMessage("");
      try {
        const response = await api.plans();
        const apiPlans = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;
        setPlanList(apiPlans);
        setSelectedPlanId((current) => current || (apiPlans[0]?.id ? String(apiPlans[0].id) : ""));
      } catch (error) {
        if (active) showMessage(getApiErrorMessage(error, "Unable to load subscription plans"), "error");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(plans) && plans.length) {
      setPlanList(plans);
      setSelectedPlanId((current) => current || String(plans[0].id || ""));
    }
  }, [plans]);

  const dedupedPlanList = React.useMemo(() => {
    const seen = new Map();
    // Sort so plans with most features come first (e.g. ID 1, 2, 3 with 5 features each)
    const sorted = [...planList].sort((a, b) => (b.features?.length || 0) - (a.features?.length || 0));
    for (const plan of sorted) {
      const key = (plan.name || plan.title || "").toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, plan);
      }
    }
    // Sort tiers by monthly price ascending (Starter -> Intermediate -> Pro)
    return Array.from(seen.values()).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [planList]);

  const openPayment = async (plan) => {
    setSelectedPlanId(String(plan.id));
    setPaymentPlan(null);
    setFieldErrors({});
    setPaymentForm({ name: "", cardNumber: "", expiry: "", cvc: "", postalCode: "" });
    setSaving(true);
    showMessage("Checking active subscription...", "info");
    try {
      const existingSubscription = await onCheckExistingSubscription?.();
      if (existingSubscription?.exists) {
        showMessage("You already have an active subscription. Taking you to ingredient setup.", "success");
        return;
      }
      setPaymentPlan(plan);
      showMessage("");
    } catch (error) {
      showMessage(getApiErrorMessage(error, "Unable to check active subscription"), "error");
    } finally {
      setSaving(false);
    }
  };

  const activatePlan = async (event) => {
    event.preventDefault();
    if (!paymentPlan?.id) {
      showMessage("Select a plan first.", "error");
      return;
    }
    const validationMessage = validateDemoPayment(paymentForm);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return;
    }
    setSaving(true);
    showMessage("Checking active subscription...", "info");
    try {
      const existingSubscription = await onCheckExistingSubscription?.();
      if (existingSubscription?.exists) {
        showMessage("You already have an active subscription. Taking you to ingredient setup.", "success");
        return;
      }

      showMessage("Payment authorized. Activating your subscription...", "info");
      await api.selectPlan({
        subscriptionId: Number(paymentPlan.id),
        billingCycle: paymentPlan.billingCycle || billingCycle,
        duration: Number(paymentPlan.duration || paymentPlan.durationInMonths || 1),
      });
      await onPlanSelected?.({ ...paymentPlan, billingCycle: paymentPlan.billingCycle || billingCycle, confirmedActive: true, demoPayment: true });
    } catch (error) {
      const messageText = getApiErrorMessage(error, "Unable to activate subscription plan");
      if (messageText.toLowerCase().includes("active subscription already exists")) {
        showMessage("You already have an active subscription. Taking you to ingredient setup.", "success");
        await onPlanSelected?.({ ...paymentPlan, billingCycle: paymentPlan.billingCycle || billingCycle, alreadyActive: true, demoPayment: true });
        return;
      }
      showMessage(messageText, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[#F1EDEB] bg-gradient-to-br from-[#FBEEEC] via-white to-white px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#2B1010] md:text-2xl">Choose your plan</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-[#8A7A76]">
              Pick a plan and complete payment to unlock ingredient setup.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 rounded-xl border border-[#EFEAE8] bg-white p-1 text-xs font-semibold shadow-sm">
          {["MONTHLY", "YEARLY"].map((cycle) => (
            <button
              key={cycle}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-colors ${
                billingCycle === cycle ? "bg-[#8D0606] text-white shadow-sm" : "text-[#8A7A76] hover:text-[#2B1010]"
              }`}
              onClick={() => setBillingCycle(cycle)}
              type="button"
            >
              {cycle === "YEARLY" ? <CalendarDays size={13} /> : <Repeat size={13} />}
              {cycle === "MONTHLY" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_360px] md:px-8">
        <div>
          {loading ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E3DAD6] bg-[#FAF8F6] p-9 text-center text-sm text-[#9C8D89]">
              <Loader2 size={20} className="animate-spin text-[#8D0606]" />
              Loading subscription plans...
            </div>
          ) : dedupedPlanList.length ? (
            <div className="flex flex-col gap-3">
              {dedupedPlanList.map((plan) => {
                const isChosenForPayment = paymentPlan && String(paymentPlan.id) === String(plan.id);
                return (
                  <article
                    key={plan.id || getPlanTitle(plan)}
                    className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 ${
                      isChosenForPayment
                        ? "border-[#8D0606] shadow-sm ring-2 ring-[#8D0606]/15"
                        : "border-[#EFEAE8]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold capitalize text-[#2B1010]">{getPlanTitle(plan)}</h3>
                          <span className="rounded-full bg-[#F2FBF6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#28A75B]">
                            {plan.status || "Available"}
                          </span>
                          {billingCycle === "YEARLY" && plan.discountPct ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                              Save {plan.discountPct}%
                            </span>
                          ) : null}
                          {isChosenForPayment ? (
                            <span className="flex items-center gap-1 rounded-full bg-[#8D0606] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                              <BadgeCheck size={10} />
                              In checkout
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[#8A7A76]">
                          {plan.maxBranches ? `Up to ${plan.maxBranches} ${plan.maxBranches > 1 ? "outlets" : "outlet"}` : "1 outlet"}
                          {plan.maxUsers ? ` • ${plan.maxUsers} staff users` : ""}
                          {plan.freeTrialDays ? ` • ${plan.freeTrialDays} days free trial` : ""}
                        </p>
                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-slate-600">
                            {plan.features
                              .filter((f) => f.type === "INCLUDE")
                              .slice(0, 3)
                              .map((f, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <Check size={12} className="text-emerald-600 shrink-0" />
                                  <span>{f.feature}</span>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <p className="text-lg font-bold text-[#8D0606] whitespace-nowrap">{getPlanPrice(plan, billingCycle)}</p>
                      <button
                        className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#8D0606] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#7A0505] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 whitespace-nowrap"
                        disabled={saving}
                        onClick={() => openPayment(plan)}
                        type="button"
                      >
                        <CreditCard size={14} />
                        {isChosenForPayment ? "Selected" : "Select & Pay"}
                        {!isChosenForPayment && <ChevronRight size={13} />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E3DAD6] bg-[#FAF8F6] p-9 text-center text-sm text-[#9C8D89]">
              No subscription plans available right now.
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-[#EFEAE8] bg-white shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center gap-2.5 rounded-t-2xl border-b border-[#F1EDEB] bg-[#FCFBFA] px-5 py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
              <Wallet size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#2B1010]">Payment details</h3>
              <p className="truncate text-xs text-[#8A7A76]">
                {paymentPlan ? getPlanTitle(paymentPlan) : "Select a plan to continue"}
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            {/* Mini card preview */}
            <div
              className={`mb-4 rounded-2xl bg-gradient-to-br from-[#2B1010] via-[#4A1414] to-[#8D0606] px-4 py-4 text-white shadow-sm transition-opacity ${
                paymentPlan ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="flex items-center justify-between">
                <Wallet size={18} className="opacity-70" />
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
                  {cardBrand || "Card"}
                </span>
              </div>
              <p className="mt-4 font-mono text-base tracking-widest">
                {paymentForm.cardNumber || "•••• •••• •••• ••••"}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wide opacity-80">
                <span className="truncate max-w-[60%]">{paymentForm.name || "Card holder"}</span>
                <span>{paymentForm.expiry || "MM/YY"}</span>
              </div>
            </div>

            <form className="grid gap-3.5" onSubmit={activatePlan}>
              <Field
                label="Name on Card *"
                placeholder="Enter cardholder name (e.g. John Doe)"
                value={paymentForm.name}
                onChange={updatePayment("name")}
                disabled={!paymentPlan}
              />
              <Field
                label="Card Number *"
                placeholder="Enter 16-digit card number (e.g. 4242 4242 4242 4242)"
                value={paymentForm.cardNumber}
                onChange={updatePayment("cardNumber")}
                disabled={!paymentPlan}
                inputMode="numeric"
                maxLength={23}
              />
              <div className="grid grid-cols-2 gap-3.5">
                <Field
                  label="Expiry *"
                  placeholder="MM/YY"
                  value={paymentForm.expiry}
                  onChange={updatePayment("expiry")}
                  disabled={!paymentPlan}
                  inputMode="numeric"
                  maxLength={5}
                />
                <Field
                  label="CVC *"
                  placeholder="3-digit CVC (e.g. 123)"
                  value={paymentForm.cvc}
                  onChange={updatePayment("cvc")}
                  disabled={!paymentPlan}
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
              <Field
                label="Postal Code *"
                placeholder="Enter 6-digit postal code (e.g. 110001)"
                value={paymentForm.postalCode}
                onChange={updatePayment("postalCode")}
                disabled={!paymentPlan}
                maxLength={10}
              />
              <button
                className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8D0606] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#7A0505] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                disabled={saving || !paymentPlan}
                type="submit"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>{paymentPlan ? `Pay ${getPlanPrice(paymentPlan, billingCycle)} & Activate` : "Pay & Activate"}</span>
                  </>
                )}
              </button>
            </form>

            {message ? (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                  messageTone === "error"
                    ? "border-[#F6D0CA] bg-[#FBEEEC] text-[#8D0606]"
                    : messageTone === "success"
                    ? "border-[#CFEBD9] bg-[#F2FBF6] text-[#1E8449]"
                    : "border-[#EFEAE8] bg-[#FAF8F6] text-[#6B5D59]"
                }`}
              >
                {messageTone === "error" ? (
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                ) : messageTone === "success" ? (
                  <BadgeCheck size={17} className="mt-0.5 shrink-0" />
                ) : (
                  <Loader2 size={17} className="mt-0.5 shrink-0 animate-spin" />
                )}
                <p className="whitespace-pre-line text-xs font-medium">{message}</p>
              </div>
            ) : null}

            <p className="mt-3.5 flex items-start gap-2 text-[11px] leading-5 text-[#9C8D89]">
              <Lock size={12} className="mt-0.5 shrink-0" />
              Demo card details are never sent to the backend. Activation uses the subscription select API so the record is saved securely.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}