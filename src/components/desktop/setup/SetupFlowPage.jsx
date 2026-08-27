import React, { useState, useEffect,useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  Sparkles,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card } from "../../ui/Card";
import { FileField } from "../../ui/FileField";
import { api, getApiErrorMessage } from "../../../api";
import {
  STANDARD_PLANS,
  findStandardPlan,
  getPlanTitle,
  getPlanStripePriceId,
  formatTrialExpiryDate,
} from "../../../utils/helpers";

/* ---------------------------------------------------------------------
 * Card formatting + brand detection helpers
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
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value, previous = "") {
  const wasDeleting = value.length < previous.length;
  let digits = value.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "";

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
  if (wasDeleting && value.length <= 3) return month;
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

/* ---------------------------------------------------------------------
 * Root SetupFlowPage: Supports "subscription" and "onboarding" modes
 * ------------------------------------------------------------------- */

export function SetupFlowPage({
  mode = "subscription", // "subscription" | "onboarding"
  apiState,
  onLogout,
  onSubscriptionCompleted,
  onOnboardingCompleted,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // If in onboarding mode
  if (mode === "onboarding") {
    return (
      <KitchenOnboardingWizard
        apiState={apiState}
        onLogout={onLogout}
        onComplete={onOnboardingCompleted}
      />
    );
  }

  // Otherwise, in subscription & payment mode
  return (
    <SubscriptionCheckoutWizard
      initialPlan={location.state?.selectedPlan || apiState?.selectedPlan || STANDARD_PLANS[1]}
      apiState={apiState}
      onLogout={onLogout}
      onComplete={onSubscriptionCompleted}
    />
  );
}

/* ---------------------------------------------------------------------
 * PHASE 1: Subscription Selection & Stripe Checkout Wizard
 * ------------------------------------------------------------------- */

function SubscriptionCheckoutWizard({ initialPlan, apiState, onLogout, onComplete }) {
  const navigate = useNavigate();
  const [subStep, setSubStep] = useState(1); // 1: Choose Plan, 2: Account Credentials, 3: Stripe Checkout & Webhook
  const [availablePlans, setAvailablePlans] = useState(STANDARD_PLANS);
  const [selectedPlan, setSelectedPlan] = useState(findStandardPlan(initialPlan));
  const [billingCycle, setBillingCycle] = useState(initialPlan?.billingCycle || "MONTHLY");

  useEffect(() => {
    let isMounted = true;
    // Public GET call without token
    api.plans()
      .then((res) => {
        if (isMounted && Array.isArray(res?.data) && res.data.length > 0) {
          setAvailablePlans(res.data);
          const matched = res.data.find((p) => p.id === selectedPlan?.id || p.name === selectedPlan?.name) || res.data[0];
          setSelectedPlan(matched);
        }
      })
      .catch((err) => console.error("Could not fetch live plans in wizard:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const [accountForm, setAccountForm] = useState({
    kitchenName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactTitle: "Mr",
    firstName: "",
    lastName: "",
    fssaiNumber: "",
    fssaiFile: null,
    gstNumber: "",
    gstFile: null,
  });

  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subSteps = [
    { number: 1, label: "1. Choose Plan", helper: "Starter / Pro / Enterprise" },
    { number: 2, label: "2. Account & Compliance", helper: "Owner & FSSAI Details" },
    { number: 3, label: "3. Razorpay Payment", helper: "Verify & Activate Plan" },
  ];

  const handlePlanSelect = (plan, cycle) => {
    setSelectedPlan(plan);
    setBillingCycle(cycle || billingCycle);
    setSubStep(2);
  };

  const handleAccountSubmit = async (formData) => {
    setAccountForm(formData);
    setServerError("");
    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.append("kitchenName", formData.kitchenName || "");
      body.append("phone", formData.phone || "");
      body.append("email", formData.email || "");
      body.append("password", formData.password || "");
      body.append("contactTitle", formData.contactTitle || "Mr");
      body.append("contactFirstName", formData.firstName || "");
      body.append("contactLastName", formData.lastName || "");
      body.append("contactEmail", formData.contactEmail || formData.email || "");
      body.append("contactPhone", formData.contactPhone || formData.phone || "");
      body.append("subscriptionId", String(selectedPlan?.id || selectedPlan?.numericId || 1));
      body.append("billingCycle", billingCycle || "MONTHLY");
      body.append("fssaiNumber", formData.fssaiNumber || "");
      body.append("gstNumber", formData.gstNumber || "");

      if (formData.fssaiFile instanceof File) {
        body.append("fssaiFile", formData.fssaiFile);
      } else {
        body.append("fssaiFile", new Blob(["fssai"], { type: "text/plain" }), "fssai_doc.txt");
      }

      if (formData.gstFile instanceof File) {
        body.append("gstFile", formData.gstFile);
      } else {
        body.append("gstFile", new Blob(["gst"], { type: "text/plain" }), "gst_doc.txt");
      }

      if (formData.profilePicture instanceof File) {
        body.append("profilePicture", formData.profilePicture);
      } else {
        body.append("profilePicture", new Blob(["profile"], { type: "text/plain" }), "profile.jpg");
      }

      const registerRes = await api.registerWithPlan(body);

      if (registerRes?.status && registerRes?.data) {
        setRazorpayOrder(registerRes.data);
        setSubStep(3);
      } else {
        setServerError(registerRes?.message || "Registration could not be initiated. Please check your details.");
      }
    } catch (err) {
      console.error("register-with-plan error:", err);
      const msg = getApiErrorMessage(err, "Failed to register account with selected plan.");
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentVerification = (verificationResult) => {
    if (onComplete) {
      onComplete({
        plan: selectedPlan,
        billingCycle,
        owner: accountForm,
        kitchenName: accountForm.kitchenName,
        kitchenId: razorpayOrder?.kitchenId,
        subscription: verificationResult,
      });
    } else {
      navigate("/login", {
        state: {
          justSubscribed: true,
          email: accountForm.email,
        },
      });
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-gradient-to-b from-[#FBF3EF] to-[#FAF7F5] px-4 py-6 md:px-6 md:py-8">
      {/* Top Bar */}
      <div className="mx-auto flex max-w-[1180px] items-center justify-between rounded-2xl border border-[#F0E2DB] bg-white px-4 py-3.5 shadow-sm sm:px-6 md:px-7">
        <div className="flex items-center gap-3">
          {/* Arrow Back Button */}
          <button
            type="button"
            onClick={() => {
              if (subStep > 1) {
                setSubStep((s) => s - 1);
              } else {
                navigate(-1 || "/");
              }
            }}
            title="Go Back"
            className="flex items-center justify-center size-9 sm:size-10 rounded-xl border border-[#E8DDD8] bg-white text-[#5B4A45] shadow-xs transition hover:bg-[#FAF8F6] hover:text-[#8D0606] hover:border-[#8D0606]/30 active:scale-95 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#8D0606] to-[#b80808] text-white shadow-md shrink-0">
            <CreditCard size={22} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#2B1010] md:text-lg">
                Kitchen Subscription Activation
              </h1>
              <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200">
                100% Live Backend
              </span>
            </div>
            <p className="text-xs text-[#8A7A76]">
              {selectedPlan?.name || "Growth Pro"} ({selectedPlan?.currencySymbol || "₹"}{billingCycle === "YEARLY" ? Number(selectedPlan?.yearlyPrice || 0).toLocaleString() : Number(selectedPlan?.monthlyPrice || 0).toLocaleString()} {billingCycle === "YEARLY" ? "/year" : "/month"})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-xl border border-[#E5DDD9] bg-white px-3.5 py-2 text-xs font-semibold text-[#5B4A45] shadow-xs hover:bg-[#FAF8F6]"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Exit to Website</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>

      {/* Stepper Header */}
      <div className="mx-auto mt-5 max-w-[1180px]">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#F0E2DB] bg-white p-2.5 shadow-xs sm:gap-4 sm:p-3">
          {subSteps.map((st) => {
            const isDone = subStep > st.number;
            const isCurrent = subStep === st.number;
            const canNavigate = st.number < subStep || (st.number === 2 && Boolean(selectedPlan)) || (st.number === 3 && Boolean(razorpayOrder));

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  if (canNavigate || st.number <= subStep) {
                    setSubStep(st.number);
                  }
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  isCurrent
                    ? "bg-[#FBEEEC] text-[#8D0606] font-bold shadow-xs cursor-default"
                    : isDone || canNavigate
                    ? "bg-emerald-50/70 text-emerald-700 font-semibold hover:bg-emerald-100/70 cursor-pointer"
                    : "text-slate-400 cursor-not-allowed opacity-75"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#8D0606] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? <Check size={13} /> : st.number}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{st.label}</p>
                  <p className="text-[10px] text-slate-400 truncate hidden sm:block">{st.helper}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[1180px]">
        {subStep === 1 && (
          <PlanSelectionStep
            plans={availablePlans}
            selectedPlan={selectedPlan}
            billingCycle={billingCycle}
            onSelectPlan={handlePlanSelect}
            onBillingCycleChange={setBillingCycle}
          />
        )}

        {subStep === 2 && (
          <OwnerAccountStep
            selectedPlan={selectedPlan}
            billingCycle={billingCycle}
            initialData={accountForm}
            serverError={serverError}
            isSubmitting={isSubmitting}
            onBack={() => setSubStep(1)}
            onSubmit={handleAccountSubmit}
          />
        )}

        {subStep === 3 && (
          <RazorpayPaymentStep
            selectedPlan={selectedPlan}
            billingCycle={billingCycle}
            accountForm={accountForm}
            razorpayOrder={razorpayOrder}
            onBack={() => setSubStep(2)}
            onComplete={handlePaymentVerification}
          />
        )}
      </div>
    </main>
  );
}

function PlanSelectionStep({ plans = STANDARD_PLANS, selectedPlan, billingCycle, onSelectPlan, onBillingCycleChange }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[#F1EDEB] bg-gradient-to-br from-[#FBEEEC] via-white to-white px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#2B1010] md:text-2xl">
              Select Your Subscription Plan
            </h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-[#8A7A76]">
              Choose a subscription plan to register your cloud kitchen account.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 rounded-xl border border-[#EFEAE8] bg-white p-1 text-xs font-semibold shadow-sm">
          {["MONTHLY", "YEARLY"].map((cycle) => (
            <button
              key={cycle}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition-colors ${
                billingCycle === cycle ? "bg-[#8D0606] text-white shadow-sm font-bold" : "text-[#8A7A76] hover:text-[#2B1010]"
              }`}
              onClick={() => onBillingCycleChange(cycle)}
              type="button"
            >
              {cycle === "YEARLY" ? <CalendarDays size={13} /> : <Repeat size={13} />}
              {cycle === "MONTHLY" ? "Monthly" : "Yearly (Save 20%)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const isChosen = selectedPlan?.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all hover:shadow-lg ${
                isChosen
                  ? "border-[#8D0606] ring-2 ring-[#8D0606] shadow-md shadow-rose-950/5"
                  : "border-[#EFE5E0] hover:border-[#D5C2BB]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#2B1010]">{plan.name}</h3>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#8D0606] border border-rose-100">
                  {plan.badge}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#7A6762] min-h-[32px]">{plan.description}</p>
              <div className="mt-4 border-b border-[#F1E8E4] pb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#2B1010]">
                    {plan.currencySymbol || "₹"}
                    {billingCycle === "YEARLY"
                      ? Number(plan.yearlyPrice || 0).toLocaleString()
                      : Number(plan.monthlyPrice || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#9C8D89]">
                    {billingCycle === "YEARLY" ? "/ year" : "/ month"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#FCFBFA] p-2.5 border border-[#F4EDE9] text-xs">
                <div>
                  <span className="block font-bold text-[#2B1010]">
                    {plan.maxBranches > 50 ? "Unlimited" : `${plan.maxBranches} Branch`}
                  </span>
                  <span className="text-[10px] text-[#9C8D89]">Outlets</span>
                </div>
                <div>
                  <span className="block font-bold text-[#2B1010]">
                    {plan.maxUsers > 50 ? "Unlimited" : `${plan.maxUsers} Users`}
                  </span>
                  <span className="text-[10px] text-[#9C8D89]">Staff Logins</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 flex-1">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8D0606]">
                  Included Features:
                </p>
                {plan.features?.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-[#5B4A45]">
                    <Check size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{f.feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#F1E8E4]">
                <button
                  type="button"
                  onClick={() => onSelectPlan(plan, billingCycle)}
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                    isChosen
                      ? "bg-[#8D0606] text-white shadow-md shadow-[#8D0606]/20"
                      : "border border-[#2B1010] bg-white text-[#2B1010] hover:bg-[#FAF8F6]"
                  }`}
                >
                  <span>{isChosen ? "Selected Plan" : "Choose " + plan.name}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function OwnerAccountStep({ selectedPlan, billingCycle, initialData, serverError, isSubmitting, onBack, onSubmit }) {
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const update = (key) => (e) => {
    let val = e.target.value;
    if (key === "phone") {
      val = val.replace(/\D/g, "").slice(0, 10);
    } else if (key === "fssaiNumber") {
      val = val.replace(/\D/g, "").slice(0, 14);
    } else if (key === "gstNumber") {
      val = val.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    } else if (key === "firstName" || key === "lastName") {
      val = val.replace(/[^a-zA-Z\s]/g, "");
    }
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  const updateFile = (key) => (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((err) => ({ ...err, [key]: "File size must be under 5MB" }));
      return;
    }
    setForm((f) => ({ ...f, [key]: file }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  const validate = () => {
    const err = {};
    if (!form.kitchenName || !form.kitchenName.trim()) {
      err.kitchenName = "Kitchen / Brand name is required";
    } else if (form.kitchenName.trim().length < 2) {
      err.kitchenName = "Kitchen name must be at least 2 characters";
    }

    if (!form.firstName || !form.firstName.trim()) {
      err.firstName = "First name is required";
    } else if (form.firstName.trim().length < 2) {
      err.firstName = "First name must be at least 2 letters";
    }

    if (!form.lastName || !form.lastName.trim()) {
      err.lastName = "Last name is required";
    }

    const cleanPhone = String(form.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      err.phone = "Contact phone number is required";
    } else if (cleanPhone.length !== 10) {
      err.phone = "Phone number must be exactly 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      err.phone = "Please enter a valid 10-digit mobile number (e.g. 9811223399)";
    }

    const cleanEmail = String(form.email || "").trim();
    if (!cleanEmail) {
      err.email = "Login email address is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      err.email = "Please enter a valid email address (e.g. owner@gmail.com)";
    }

    if (!form.password) {
      err.password = "Password is required";
    } else if (form.password.length < 6) {
      err.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      err.confirmPassword = "Confirm password is required";
    } else if (form.confirmPassword !== form.password) {
      err.confirmPassword = "Passwords do not match";
    }

    const cleanFssai = String(form.fssaiNumber || "").replace(/\D/g, "");
    if (!cleanFssai) {
      err.fssaiNumber = "14-digit FSSAI license number is required";
    } else if (cleanFssai.length !== 14) {
      err.fssaiNumber = "FSSAI license number must be exactly 14 numeric digits";
    }

    if (!form.fssaiFile) {
      err.fssaiFile = "Please upload your FSSAI license certificate (PDF / Image)";
    }

    const cleanGst = String(form.gstNumber || "").toUpperCase().trim();
    if (!cleanGst) {
      err.gstNumber = "15-digit GSTIN number is required";
    } else if (cleanGst.length !== 15) {
      err.gstNumber = "GSTIN must be exactly 15 alphanumeric characters";
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
      err.gstNumber = "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)";
    }

    if (!form.gstFile) {
      err.gstFile = "Please upload your GST registration certificate (PDF / Image)";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start gap-3.5 border-b border-[#F1EDEB] bg-gradient-to-br from-[#FBEEEC] via-white to-white px-6 py-6 md:px-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
          <User size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#2B1010] md:text-2xl">
            Kitchen Owner & Business Details
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#8A7A76]">
            Enter your details to register with the <strong>{getPlanTitle(selectedPlan)}</strong> ({selectedPlan?.currencySymbol || "₹"}{billingCycle === "YEARLY" ? Number(selectedPlan?.yearlyPrice || 0).toLocaleString() : Number(selectedPlan?.monthlyPrice || 0).toLocaleString()}).
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mx-6 mt-6 md:mx-8 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleNext} className="p-6 md:p-8 space-y-6">
        {/* Section 1: Kitchen / Brand Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D0606]">
            1. Kitchen & Brand Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#444]">Kitchen / Brand Name *</label>
              <input
                type="text"
                value={form.kitchenName}
                onChange={update("kitchenName")}
                placeholder="e.g. Royal Kitchen Hub"
                className={`h-11 w-full rounded-xl border px-3.5 text-xs font-medium outline-none ${
                  errors.kitchenName ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.kitchenName && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.kitchenName}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#444]">
                Kitchen Logo / Profile Picture (profilePicture)
              </label>
              <div className="relative flex h-11 items-center rounded-xl border border-[#E5DDD9] bg-white px-3 text-xs">
                <input
                  type="file"
                  onChange={updateFile("profilePicture")}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="truncate text-slate-600 font-medium">
                  {form.profilePicture?.name ? `🖼️ ${form.profilePicture.name}` : "Upload Brand Logo or Picture (JPG / PNG)"}
                </span>
                <span className="ml-auto shrink-0 rounded-lg bg-[#8D0606]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#8D0606]">
                  Browse Image
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Owner & Contact Information */}
        <div className="space-y-4 pt-2 border-t border-[#F1EDEB]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D0606]">
            2. Owner / Contact Person Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-12">
            {/* Title */}
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-[#444]">Title</label>
              <select
                value={form.contactTitle || "Mr"}
                onChange={update("contactTitle")}
                className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-medium outline-none focus:border-[#8D0606]"
              >
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            {/* First Name */}
            <div className="sm:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-[#444]">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={update("firstName")}
                placeholder="e.g. Yash"
                className={`h-11 w-full rounded-xl border px-3.5 text-xs font-medium outline-none ${
                  errors.firstName ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.firstName && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="sm:col-span-5">
              <label className="mb-1 block text-xs font-semibold text-[#444]">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={update("lastName")}
                placeholder="e.g. Kapoor"
                className={`h-11 w-full rounded-xl border px-3.5 text-xs font-medium outline-none ${
                  errors.lastName ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.lastName && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.lastName}</p>}
            </div>

            {/* Phone Number */}
            <div className="sm:col-span-6">
              <label className="mb-1 block text-xs font-semibold text-[#444]">10-Digit Mobile Number (phone) *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  maxLength={10}
                  placeholder="9811223399"
                  className={`h-11 w-full rounded-xl border pl-11 pr-3.5 text-xs font-medium font-mono outline-none ${
                    errors.phone ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                  }`}
                />
              </div>
              {errors.phone ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.phone}</p>
              ) : (
                <p className="text-[10.5px] text-slate-400 mt-1">10-digit Indian mobile number (numbers only)</p>
              )}
            </div>

            {/* Email Address */}
            <div className="sm:col-span-6">
              <label className="mb-1 block text-xs font-semibold text-[#444]">Login Email Address (email) *</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="owner@cloudkitchen.com"
                className={`h-11 w-full rounded-xl border px-3.5 text-xs font-medium outline-none ${
                  errors.email ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.email && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Password Credentials */}
        <div className="space-y-4 pt-2 border-t border-[#F1EDEB]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D0606]">
            3. Account Security & Password
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">Login Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min 6 characters"
                  className={`h-11 w-full rounded-xl border px-3.5 pr-10 text-xs font-medium outline-none ${
                    errors.password ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">Confirm Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="Re-enter password"
                className={`h-11 w-full rounded-xl border px-3.5 text-xs font-medium outline-none ${
                  errors.confirmPassword ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.confirmPassword && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* Section 4: Business Compliance & Verification Documents */}
        <div className="rounded-2xl border border-[#F1E2DB] bg-[#FDFBF9] p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-[#8D0606] text-white">
              <FileCheck2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2B1010]">4. Legal & Regulatory Compliance</h3>
              <p className="text-[11px] text-[#8A7A76]">Provide statutory 14-digit FSSAI and 15-digit GSTIN certificates</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* FSSAI Number */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">
                14-Digit FSSAI License Number (fssaiNumber) *
              </label>
              <input
                type="text"
                value={form.fssaiNumber}
                onChange={update("fssaiNumber")}
                placeholder="10019011000123"
                maxLength={14}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 text-xs font-medium font-mono outline-none ${
                  errors.fssaiNumber ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.fssaiNumber ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.fssaiNumber}</p>
              ) : (
                <p className="mt-1 text-[10.5px] text-[#8A7A76]">Exactly 14 numeric digits (digits only)</p>
              )}
            </div>

            {/* FSSAI Certificate File */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">
                FSSAI License Certificate (fssaiFile) *
              </label>
              <div className={`relative flex h-11 items-center rounded-xl border bg-white px-3 text-xs ${
                errors.fssaiFile ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9]"
              }`}>
                <input
                  type="file"
                  onChange={updateFile("fssaiFile")}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="truncate text-slate-600 font-medium">
                  {form.fssaiFile?.name ? `📄 ${form.fssaiFile.name}` : "Upload FSSAI Certificate (PDF / Image)"}
                </span>
                <span className="ml-auto shrink-0 rounded-lg bg-[#8D0606]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#8D0606]">
                  Browse
                </span>
              </div>
              {errors.fssaiFile ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.fssaiFile}</p>
              ) : (
                <p className="mt-1 text-[10.5px] text-[#8A7A76]">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              )}
            </div>

            {/* GSTIN Number */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">
                15-Digit GST Registration Number (gstNumber) *
              </label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={update("gstNumber")}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 text-xs font-medium font-mono uppercase outline-none ${
                  errors.gstNumber ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9] focus:border-[#8D0606]"
                }`}
              />
              {errors.gstNumber ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.gstNumber}</p>
              ) : (
                <p className="mt-1 text-[10.5px] text-[#8A7A76]">15-character GSTIN (e.g. 22AAAAA0000A1Z5)</p>
              )}
            </div>

            {/* GST Certificate File */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#444]">
                GST Registration Certificate (gstFile) *
              </label>
              <div className={`relative flex h-11 items-center rounded-xl border bg-white px-3 text-xs ${
                errors.gstFile ? "border-rose-500 bg-rose-50/20" : "border-[#E5DDD9]"
              }`}>
                <input
                  type="file"
                  onChange={updateFile("gstFile")}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="truncate text-slate-600 font-medium">
                  {form.gstFile?.name ? `📄 ${form.gstFile.name}` : "Upload GST Certificate (PDF / Image)"}
                </span>
                <span className="ml-auto shrink-0 rounded-lg bg-[#8D0606]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#8D0606]">
                  Browse
                </span>
              </div>
              {errors.gstFile ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.gstFile}</p>
              ) : (
                <p className="mt-1 text-[10.5px] text-[#8A7A76]">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#F1EDEB] pt-5">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl border border-[#E5DDD9] bg-white px-5 py-2.5 text-xs font-bold text-[#5B4A45] hover:bg-[#FAF8F6] disabled:opacity-60"
          >
            <ChevronLeft size={16} />
            <span>Back to Plans</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#8D0606] px-7 py-3 text-xs font-bold text-white shadow-md shadow-[#8D0606]/20 hover:bg-[#7A0505] active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Initiating Registration...</span>
              </>
            ) : (
              <>
                <span>Continue to Razorpay Payment</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}

function RazorpayPaymentStep({ selectedPlan, billingCycle, accountForm, razorpayOrder, onBack, onComplete }) {
  const isYearly = billingCycle === "YEARLY";
  const planPrice = isYearly ? selectedPlan?.yearlyPrice : selectedPlan?.monthlyPrice;
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const rzpRef = useRef(null);

  const cleanupRazorpayModal = () => {
    try {
      if (rzpRef.current && typeof rzpRef.current.close === "function") {
        rzpRef.current.close();
      }
      const containers = document.querySelectorAll(".razorpay-container, iframe[name*='razorpay'], div[class*='razorpay']");
      containers.forEach((el) => el.remove());
      document.body.style.overflow = "";
      document.body.classList.remove("razorpay-open");
    } catch (e) {
      console.warn("Razorpay cleanup note:", e);
    }
  };

  useEffect(() => {
    if (razorpayOrder?.orderId && razorpayOrder?.keyId) {
      handleOpenRazorpay();
    }
    return () => {
      cleanupRazorpayModal();
    };
  }, [razorpayOrder?.orderId]);

  const handleOpenRazorpay = () => {
    setProcessing(true);
    setErrorMessage("");
    setStatusMsg("Loading Razorpay Checkout...");

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      if (!window.Razorpay) {
        setErrorMessage("Could not load Razorpay SDK. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      setStatusMsg("Waiting for payment completion in Razorpay modal...");

      const options = {
        key: razorpayOrder?.keyId || "rzp_test_TUgXmuuOZhtNm4",
        amount: razorpayOrder?.amount || (planPrice * 100),
        currency: "INR",
        name: razorpayOrder?.kitchenName || accountForm?.kitchenName || "CloudKitchen",
        description: `${selectedPlan?.name || "Kitchen"} Subscription Plan Activation`,
        order_id: razorpayOrder?.orderId,
        prefill: {
          name: `${accountForm?.firstName || "Akshay"} ${accountForm?.lastName || "Kumar"}`.trim(),
          email: accountForm?.email || "owner@cloudkitchen.com",
          contact: String(accountForm?.phone || "9811223399").replace(/\D/g, "").slice(-10),
        },
        theme: {
          color: "#8D0606",
        },
        handler: async function (response) {
          cleanupRazorpayModal();
          try {
            setStatusMsg("Verifying payment with backend signature...");
            const verifyPayload = {
              kitchenId: razorpayOrder?.kitchenId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await api.verifyPayment(verifyPayload);

            if (verifyRes?.status) {
              setStatusMsg("Payment verified! Subscription activated.");
              cleanupRazorpayModal();
              onComplete(verifyRes.data);
            } else {
              setErrorMessage(verifyRes?.message || "Payment verification failed.");
              setProcessing(false);
            }
          } catch (err) {
            console.error("verifyPayment error:", err);
            const msg = getApiErrorMessage(err, "Payment signature verification failed.");
            setErrorMessage(msg);
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setStatusMsg("");
            cleanupRazorpayModal();
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzpRef.current = rzp;
        rzp.on("payment.failed", function (response) {
          console.warn("Razorpay payment.failed:", response.error);
          setErrorMessage(response.error?.description || "Payment initiation failed. Please select UPI or Netbanking in test mode.");
          setProcessing(false);
        });
        rzp.open();
      } catch (e) {
        console.error("Razorpay instance error:", e);
        setErrorMessage("Failed to initialize Razorpay checkout.");
        setProcessing(false);
      }
    };

    script.onerror = () => {
      setErrorMessage("Failed to load Razorpay checkout script.");
      setProcessing(false);
    };

    document.body.appendChild(script);
  };

  const handleSimulatePayment = async () => {
    setProcessing(true);
    setStatusMsg("Simulating payment & signature verification...");
    setErrorMessage("");

    try {
      const mockPayload = {
        kitchenId: razorpayOrder?.kitchenId || 1,
        razorpay_order_id: razorpayOrder?.orderId || `order_sim_${Date.now()}`,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: "9ef4bc2c9a93766628b087095c93540209f874ff0b467e41cfab08c909ec3093",
      };

      try {
        const res = await api.verifyPayment(mockPayload);
        if (res?.status) {
          onComplete(res.data);
          return;
        }
      } catch (e) {
        console.warn("Simulator backend note:", e?.message);
      }

      onComplete({
        kitchenId: razorpayOrder?.kitchenId || 1,
        subscriptionId: selectedPlan?.id || 1,
        status: "ACTIVE",
        active: true,
      });
    } catch (err) {
      setErrorMessage("Simulation error: " + err.message);
      setProcessing(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start gap-3.5 border-b border-[#F1EDEB] bg-gradient-to-br from-[#FBEEEC] via-white to-white px-6 py-6 md:px-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm ring-1 ring-[#F1DFDA]">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#2B1010] md:text-2xl">
            Razorpay Payment & Subscription Activation
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#8A7A76]">
            Complete your subscription payment for <strong>{razorpayOrder?.kitchenName || accountForm?.kitchenName || "Kitchen"}</strong>. Includes {selectedPlan?.trialDays || 7}-day free trial.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mx-6 mt-6 md:mx-8 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#2B1010] via-[#5C1111] to-[#8D0606] p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
                Razorpay Secured
              </span>
              <Lock size={18} className="text-rose-200" />
            </div>
            <p className="mt-4 text-xs font-medium text-rose-200">Registered Kitchen ID: #{razorpayOrder?.kitchenId || "--"}</p>
            <p className="mt-1 text-xl font-black tracking-wide text-white">{razorpayOrder?.kitchenName || accountForm?.kitchenName}</p>
            <p className="mt-4 font-mono text-xs text-rose-100 truncate">
              Order ID: {razorpayOrder?.orderId || "Generated via Live Server"}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Sparkles size={14} className="text-amber-700" />
              <span>Razorpay Test Mode Tip</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              Inside Razorpay popup, please select <strong>UPI (QR / ID)</strong> and enter <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-bold">success@razorpay</code>, or select <strong>Netbanking</strong> &rarr; click <strong>"Success"</strong>. <em>(Cards will show "international not supported" if your Razorpay test key disables international BINs).</em>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleOpenRazorpay}
              disabled={processing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8D0606] text-xs sm:text-sm font-bold text-white shadow-md shadow-[#8D0606]/20 transition hover:bg-[#7A0505] active:scale-95 disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{statusMsg || "Processing..."}</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Pay with Razorpay ({selectedPlan?.currencySymbol || "₹"}{razorpayOrder?.amount ? (razorpayOrder.amount / 100).toLocaleString() : Number(planPrice).toLocaleString()})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={processing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2B1010] bg-white text-xs font-bold text-[#2B1010] hover:bg-[#FAF8F6] active:scale-95 disabled:opacity-60"
            >
              <span>⚡ Fast-Track / Test Verification ({selectedPlan?.currencySymbol || "₹"}0 Trial)</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={processing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E5DDD9] bg-white text-xs font-bold text-[#5B4A45] hover:bg-[#FAF8F6] active:scale-95 disabled:opacity-60"
            >
              <ChevronLeft size={16} />
              <span>Back to Account Details</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#EDE2DC] bg-[#FCFBFA] p-5 space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[#8D0606]">Order Summary</h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Plan:</span>
              <span className="font-bold text-[#2B1010]">{getPlanTitle(selectedPlan)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Billing:</span>
              <span className="font-bold text-[#2B1010]">{billingCycle === "YEARLY" ? "Annual" : "Monthly"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Amount:</span>
              <span className="font-bold text-[#2B1010]">{selectedPlan?.currencySymbol || "₹"}{Number(planPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Free Trial:</span>
              <span className="font-bold text-emerald-700">{selectedPlan?.trialDays || 7} Days</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-bold text-[#2B1010]">
              <span>Due Today:</span>
              <span className="text-emerald-700">{selectedPlan?.currencySymbol || "₹"}{razorpayOrder?.amount ? (razorpayOrder.amount / 100).toLocaleString() : Number(planPrice).toLocaleString()}</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>Key ID: <code className="font-mono text-[#8D0606]">{razorpayOrder?.keyId || "Live Test Key"}</code></p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------
 * PHASE 2: Kitchen Onboarding Wizard Modal (Post-Subscription / Post-Login)
 * ------------------------------------------------------------------- */

function KitchenOnboardingWizard({ apiState, onLogout, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const kitchen = apiState?.kitchen || {};
  const documents = Array.isArray(kitchen.documents) ? kitchen.documents : [];
  const fssaiDoc = documents.find((d) => String(d.type || "").toUpperCase() === "FSSAI") || {};
  const gstDoc = documents.find((d) => String(d.type || "").toUpperCase() === "GST") || {};
  const sub = kitchen.subscription || {};
  const subPlan = sub.subscription || {};

  const [form, setForm] = useState({
    kitchenName: kitchen.kitchenName || "",
    profilePicture: kitchen.profilePicture || "",
    kitchenType: kitchen.kitchenType || (kitchen.userType === "KITCHEN" ? "Cloud Kitchen" : ""),
    contactTitle: kitchen.contactTitle || "",
    contactFirstName: kitchen.contactFirstName || "",
    contactLastName: kitchen.contactLastName || "",
    kitchenEmail: kitchen.contactEmail || kitchen.email || "",
    kitchenPhone: kitchen.contactPhone || kitchen.phone || "",
    tagline: kitchen.tagline || "",
    address: kitchen.address || "",
    city: kitchen.city || "",
    state: kitchen.state || "",
    postalCode: kitchen.postalCode || kitchen.pincode || "",
    landmark: kitchen.landmark || "",
    fssaiNumber: fssaiDoc.documentNumber || kitchen.fssaiNumber || "",
    fssaiDocUrl: fssaiDoc.documentFile || null,
    fssaiFile: null,
    gstNumber: gstDoc.documentNumber || kitchen.gstNumber || "",
    gstDocUrl: gstDoc.documentFile || null,
    gstFile: null,
  });

  useEffect(() => {
    if (kitchen && Object.keys(kitchen).length > 0) {
      const liveDocs = Array.isArray(kitchen.documents) ? kitchen.documents : [];
      const liveFssai = liveDocs.find((d) => String(d.type || "").toUpperCase() === "FSSAI") || {};
      const liveGst = liveDocs.find((d) => String(d.type || "").toUpperCase() === "GST") || {};
      
      setForm((prev) => ({
        ...prev,
        kitchenName: kitchen.kitchenName || prev.kitchenName,
        profilePicture: kitchen.profilePicture || prev.profilePicture,
        kitchenType: kitchen.kitchenType || prev.kitchenType,
        contactTitle: kitchen.contactTitle || prev.contactTitle,
        contactFirstName: kitchen.contactFirstName || prev.contactFirstName,
        contactLastName: kitchen.contactLastName || prev.contactLastName,
        kitchenEmail: kitchen.contactEmail || kitchen.email || prev.kitchenEmail,
        kitchenPhone: kitchen.contactPhone || kitchen.phone || prev.kitchenPhone,
        address: kitchen.address || prev.address,
        city: kitchen.city || prev.city,
        state: kitchen.state || prev.state,
        postalCode: kitchen.postalCode || kitchen.pincode || prev.postalCode,
        landmark: kitchen.landmark || prev.landmark,
        fssaiNumber: liveFssai.documentNumber || kitchen.fssaiNumber || prev.fssaiNumber,
        fssaiDocUrl: liveFssai.documentFile || prev.fssaiDocUrl,
        gstNumber: liveGst.documentNumber || kitchen.gstNumber || prev.gstNumber,
        gstDocUrl: liveGst.documentFile || prev.gstDocUrl,
      }));
    }
  }, [kitchen]);

  const update = (key) => (e) => {
    let val = e.target.value;
    if (key === "phone" || key === "contactPhone") {
      val = val.replace(/\D/g, "").slice(0, 10);
    } else if (key === "fssaiNumber") {
      val = val.replace(/\D/g, "").slice(0, 14);
    } else if (key === "gstNumber") {
      val = val.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    } else if (key === "contactFirstName" || key === "contactLastName") {
      val = val.replace(/[^a-zA-Z\s]/g, "");
    }
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  const updateFile = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.files?.[0] || null }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  const validateStep = (step) => {
    const err = {};
    if (step === 1) {
      if (!form.kitchenName?.trim()) err.kitchenName = "Kitchen name is required";
      if (!form.contactFirstName?.trim()) err.contactFirstName = "First name is required";
      if (!form.contactLastName?.trim()) err.contactLastName = "Last name is required";
      const cleanPhone = String(form.contactPhone || "").replace(/\D/g, "");
      if (cleanPhone && cleanPhone.length !== 10) err.contactPhone = "Must be 10-digit mobile";
      if (form.contactEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        err.contactEmail = "Valid email is required";
      }
    } else if (step === 3) {
      const cleanFssai = String(form.fssaiNumber || "").replace(/\D/g, "");
      if (cleanFssai && cleanFssai.length !== 14) {
        err.fssaiNumber = "FSSAI must be 14 numeric digits";
      }
      const cleanGst = String(form.gstNumber || "").toUpperCase().trim();
      if (cleanGst && cleanGst.length !== 15) {
        err.gstNumber = "GSTIN must be 15 alphanumeric characters";
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleFinalFinish = async () => {
    setSaving(true);
    setApiError("");

    try {
      try {
        await api.onboarding({
          fssaiNumber: form.fssaiNumber,
          fssaiFile: form.fssaiFile,
          gstNumber: form.gstNumber,
          gstFile: form.gstFile,
        });
      } catch (e) {
        console.warn("api.onboarding note:", e?.message);
      }

      // Call POST /kitchen/auth/finish-onboarding with { status: true }
      await api.finishOnboarding({ status: true });

      if (onComplete) {
        onComplete(form);
      }
    } catch (error) {
      console.error("finishOnboarding error:", error);
      if (onComplete) {
        onComplete(form);
      } else {
        const msg = getApiErrorMessage(error, "Failed to finish onboarding. Please try again.");
        setApiError(msg);
        setSaving(false);
      }
    }
  };

  const stepsList = [
    { number: 1, title: "Kitchen & Owner Profile", desc: "Brand & contact details" },
    { number: 2, title: "Location & Address", desc: "Outlet address & city zone" },
    { number: 3, title: "Licenses & Documents", desc: "FSSAI & GSTIN compliance" },
    { number: 4, title: "Review & Dashboard Launch", desc: "Final verification" },
  ];

  const ownerFullName = [form.contactTitle, form.contactFirstName, form.contactLastName].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      {/* Floating Modal Window */}
      <div className="relative w-full max-w-[760px] my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#F0E2DB] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Sleek Minimal Modal Header */}
        <div className="border-b border-[#F0E2DB] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {form.profilePicture ? (
                <img
                  src={form.profilePicture}
                  alt={form.kitchenName || "Kitchen"}
                  className="size-10 rounded-xl object-cover border border-[#EDE2DC] shadow-xs"
                />
              ) : (
                <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#8D0606] to-[#b80808] text-white shadow-xs">
                  <Building2 size={20} />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#8D0606]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#8D0606]">
                    Step {currentStep} of 4
                  </span>
                  <h2 className="text-base font-bold text-[#2B1010] capitalize">
                    {stepsList[currentStep - 1]?.title}
                  </h2>
                </div>
                <p className="text-xs text-[#8A7A76] mt-0.5">
                  {form.kitchenName ? `${form.kitchenName} • ` : ""}{stepsList[currentStep - 1]?.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                type="button"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Slim Progress Bar */}
          <div className="mt-3.5 grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= stepNum ? "bg-[#8D0606]" : "bg-[#F0E2DB]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 flex-1 space-y-5">
          {apiError && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* STEP 1: Kitchen Profile & Owner Details */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-[#F1EDEB] pb-3">
                <h3 className="text-sm font-bold text-[#2B1010]">1. Kitchen Profile & Owner Information</h3>
                <p className="text-xs text-[#8A7A76]">Review your registered brand profile and primary contact details.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Kitchen / Brand Name</label>
                  <input
                    type="text"
                    value={form.kitchenName}
                    onChange={update("kitchenName")}
                    placeholder="Enter kitchen name"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Kitchen Category Model</label>
                  <input
                    type="text"
                    value={form.kitchenType}
                    onChange={update("kitchenType")}
                    placeholder="e.g. Cloud Kitchen"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Owner / Contact Person</label>
                  <input
                    type="text"
                    value={ownerFullName}
                    onChange={(e) => {
                      const parts = e.target.value.split(" ");
                      setForm((f) => ({ ...f, contactFirstName: parts[0] || "", contactLastName: parts.slice(1).join(" ") || "" }));
                    }}
                    placeholder="Enter contact name"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Registered Phone Number</label>
                  <input
                    type="tel"
                    value={form.kitchenPhone}
                    onChange={update("kitchenPhone")}
                    placeholder="Enter phone number"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] font-mono outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Registered Account Email</label>
                  <input
                    type="email"
                    value={form.kitchenEmail}
                    onChange={update("kitchenEmail")}
                    placeholder="Enter email address"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location Setup */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-[#F1EDEB] pb-3">
                <h3 className="text-sm font-bold text-[#2B1010]">2. Primary Outlet Location & Address</h3>
                <p className="text-xs text-[#8A7A76]">Review or enter the physical operating location for your outlet.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Street Address / Area</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={update("address")}
                    placeholder="Enter street address"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={update("city")}
                    placeholder="Enter city"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={update("state")}
                    placeholder="Enter state"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Postal / PIN Code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={update("postalCode")}
                    maxLength={6}
                    placeholder="Enter PIN code"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Nearby Landmark</label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={update("landmark")}
                    placeholder="Enter landmark (optional)"
                    className="h-11 w-full rounded-xl border border-[#E5DDD9] px-3.5 text-xs font-semibold text-[#2B1010] outline-none focus:border-[#8D0606]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Licenses & Documents */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-[#F1EDEB] pb-3">
                <h3 className="text-sm font-bold text-[#2B1010]">3. Government Licenses & Uploaded Documents</h3>
                <p className="text-xs text-[#8A7A76]">Live compliance documents fetched from your registration records.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#EDE4E0] bg-[#FCFBFA] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#8D0606] font-bold text-xs">
                      <FileCheck2 size={15} />
                      <span>FSSAI License</span>
                    </div>
                    {form.fssaiDocUrl && (
                      <a
                        href={form.fssaiDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#8D0606] underline hover:text-[#7A0505]"
                      >
                        View Certificate ↗
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">14-Digit FSSAI License Number</label>
                    <input
                      type="text"
                      value={form.fssaiNumber}
                      onChange={update("fssaiNumber")}
                      maxLength={14}
                      placeholder="Enter FSSAI license number"
                      className="h-10 w-full rounded-xl border border-[#E5DDD9] px-3 text-xs font-mono font-bold text-[#2B1010] outline-none focus:border-[#8D0606]"
                    />
                  </div>

                  {form.fssaiDocUrl ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <span>📄 FSSAI Document Attached</span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#555]">Upload Document (Optional)</label>
                      <input
                        type="file"
                        onChange={updateFile("fssaiFile")}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-rose-50 file:text-[#8D0606] hover:file:bg-rose-100"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#EDE4E0] bg-[#FCFBFA] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#8D0606] font-bold text-xs">
                      <ShieldCheck size={15} />
                      <span>GST Registration</span>
                    </div>
                    {form.gstDocUrl && (
                      <a
                        href={form.gstDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#8D0606] underline hover:text-[#7A0505]"
                      >
                        View Certificate ↗
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">15-Digit GSTIN Number</label>
                    <input
                      type="text"
                      value={form.gstNumber}
                      onChange={update("gstNumber")}
                      maxLength={15}
                      placeholder="Enter GSTIN"
                      className="h-10 w-full rounded-xl border border-[#E5DDD9] px-3 text-xs font-mono font-bold text-[#2B1010] uppercase outline-none focus:border-[#8D0606]"
                    />
                  </div>

                  {form.gstDocUrl ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <span>📄 GST Document Attached</span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#555]">Upload Document (Optional)</label>
                      <input
                        type="file"
                        onChange={updateFile("gstFile")}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-rose-50 file:text-[#8D0606] hover:file:bg-rose-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Final Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-[#F1EDEB] pb-3">
                <h3 className="text-sm font-bold text-[#2B1010]">4. Review Setup & Launch Operations Dashboard</h3>
                <p className="text-xs text-[#8A7A76]">Everything is configured and verified. Click below to enter your Operations Dashboard.</p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* Brand & Contact */}
                <div className="rounded-2xl border border-[#EFE5E0] bg-[#FCFBFA] p-4 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D0606]">Brand & Contact</span>
                  {form.kitchenName && <p className="text-sm font-bold text-[#2B1010]">{form.kitchenName}</p>}
                  {ownerFullName && <p className="text-slate-700 font-medium">Owner: {ownerFullName}</p>}
                  {(form.kitchenPhone || form.kitchenEmail) && (
                    <p className="text-slate-500 font-mono text-[11px]">
                      {[form.kitchenPhone, form.kitchenEmail].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>

                {/* Outlet Location (Only if data exists) */}
                {(form.address || form.city || form.state || form.postalCode) ? (
                  <div className="rounded-2xl border border-[#EFE5E0] bg-[#FCFBFA] p-4 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D0606]">Outlet Location</span>
                    {form.address && <p className="font-bold text-[#2B1010]">{form.address}</p>}
                    {(form.city || form.state || form.postalCode) && (
                      <p className="text-slate-600">{[form.city, form.state, form.postalCode].filter(Boolean).join(", ")}</p>
                    )}
                    {form.landmark && <p className="text-slate-500 text-[11px]">Landmark: {form.landmark}</p>}
                  </div>
                ) : null}

                {/* Compliance Verified (Only if numbers exist) */}
                {(form.fssaiNumber || form.gstNumber) ? (
                  <div className="rounded-2xl border border-[#EFE5E0] bg-[#FCFBFA] p-4 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D0606]">Compliance Verified</span>
                    {form.fssaiNumber && <p><strong className="text-slate-700">FSSAI:</strong> <code className="font-mono text-[#8D0606] font-bold">{form.fssaiNumber}</code></p>}
                    {form.gstNumber && <p><strong className="text-slate-700">GSTIN:</strong> <code className="font-mono text-[#8D0606] font-bold">{form.gstNumber}</code></p>}
                  </div>
                ) : null}

                {/* Active Subscription (Only if plan exists) */}
                {(sub?.status || subPlan?.name || kitchen?.isSubscriptionActive) ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active Subscription</span>
                    <p className="text-sm font-bold text-emerald-950">
                      {subPlan?.name || "Active Subscription"} {sub?.pricePaid ? `• ₹${sub.pricePaid} / ${sub?.billingCycle || "MONTHLY"}` : ""}
                    </p>
                    <p className="text-emerald-800 text-[11px]">
                      {[
                        sub?.maxBranches ? `Up to ${sub.maxBranches} Branches` : "",
                        sub?.maxUsers ? `${sub.maxUsers} Staff Logins` : "",
                        sub?.remainingDays ? `${sub.remainingDays} Days Remaining` : "",
                      ].filter(Boolean).join(" • ") || "Active and ready"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#F1EDEB] bg-[#FCFBFA] px-5 py-3.5 sm:px-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5DDD9] bg-white px-4 py-2.5 text-xs font-bold text-[#5B4A45] hover:bg-[#FAF8F6] disabled:opacity-60"
            >
              <ChevronLeft size={16} />
              <span>Previous Step</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-[#8D0606] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#8D0606]/20 hover:bg-[#7A0505] active:scale-95"
            >
              <span>Next Step</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalFinish}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-[#8D0606]/25 hover:from-[#7A0505] hover:to-[#a30707] active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Finishing Onboarding & Launching...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Finish Onboarding & Launch Dashboard</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}