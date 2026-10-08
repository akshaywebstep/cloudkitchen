import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  Repeat,
  CalendarDays,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  LogOut,
  Building2,
  Users,
  ShieldAlert,
} from "lucide-react";
import { api, getApiErrorMessage, getStoredToken } from "../../api";
import {
  STANDARD_PLANS,
  getPlanTitle,
  loadRazorpayScript,
} from "../../utils/helpers";
import { Loader } from "../../components/ui/Loader";

function isSamePlanTier(planA, planB) {
  if (!planA || !planB) return false;
  const idA = planA.subscriptionId || planA.id;
  const idB = planB.subscriptionId || planB.id;
  if (idA && idB && String(idA) === String(idB)) return true;

  const getCleanSlug = (p) => {
    const raw = String(p?.planName || p?.title || p?.name || p?.subscriptionName || "").toLowerCase();
    if (raw.includes("start")) return "starter";
    if (raw.includes("inter") || raw.includes("growth")) return "inter";
    if (raw.includes("pro") || raw.includes("scale") || raw.includes("unlimited")) return "pro";
    return raw.replace(/[^a-z0-9]/g, "");
  };

  const slugA = getCleanSlug(planA);
  const slugB = getCleanSlug(planB);
  return slugA && slugB && slugA === slugB;
}

export function SubscriptionLockModal({
  apiState,
  onLogout,
  onSubscriptionActivated,
  onToast,
}) {
  // Lock body scroll while modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const kitchen = apiState?.kitchen || {};
  const kitchenName = kitchen.kitchenName || kitchen.name || "Cloud Kitchen";
  const ownerEmail = kitchen.email || kitchen.contactEmail || "";
  const ownerPhone = kitchen.phone || kitchen.contactPhone || "";
  const currentSub = kitchen.subscription || apiState?.selectedPlan || null;

  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentPrice = Number(currentSub?.pricePaid || currentSub?.price || 0);

  // 1. Fetch available plans from backend
  useEffect(() => {
    let active = true;
    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const token = apiState?.token || getStoredToken();
        const res = await api.plans(token);
        const apiPlans = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!active) return;

        const seen = new Map();
        const sorted = [...apiPlans].sort((a, b) => (b.features?.length || 0) - (a.features?.length || 0));
        for (const plan of sorted) {
          const key = (plan.name || plan.title || "").toLowerCase().trim();
          if (!seen.has(key)) {
            seen.set(key, plan);
          }
        }
        const uniquePlans = Array.from(seen.values()).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        const finalPlans = uniquePlans.length > 0 ? uniquePlans : STANDARD_PLANS;
        setPlans(finalPlans);

        if (finalPlans.length > 0) {
          // Pre-select growth/pro plan or first plan
          const defaultTier =
            finalPlans.find(
              (p) =>
                (p.name || p.title || "").toLowerCase().includes("pro") ||
                (p.name || p.title || "").toLowerCase().includes("growth")
            ) || finalPlans[0];
          setSelectedPlan(defaultTier);
        }
      } catch (err) {
        console.error("Failed to load plans in lock modal:", err);
        setPlans(STANDARD_PLANS);
        setSelectedPlan(STANDARD_PLANS[0]);
      } finally {
        if (active) setLoadingPlans(false);
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, [apiState?.token]);

  // 2. Fetch preview when selectedPlan or billingCycle changes
  useEffect(() => {
    if (!selectedPlan?.id) {
      setPreviewData(null);
      return;
    }

    let active = true;
    async function fetchPreview() {
      setPreviewLoading(true);
      setPreviewError("");
      setActionError("");
      try {
        const res = await api.subscriptionPreview({
          subscriptionId: selectedPlan.id,
          billingCycle: billingCycle,
          duration: 1,
        });
        if (!active) return;
        const data = res?.data || res;
        setPreviewData(data);
      } catch (err) {
        if (active) {
          const msg = getApiErrorMessage(err, "Could not calculate preview");
          setPreviewError(msg);
        }
      } finally {
        if (active) setPreviewLoading(false);
      }
    }

    fetchPreview();
    return () => {
      active = false;
    };
  }, [selectedPlan, billingCycle]);

  // Target price calculations
  const targetPlanPrice = previewData?.targetPlanPrice !== undefined
    ? Number(previewData.targetPlanPrice)
    : Number(billingCycle === "YEARLY" ? (selectedPlan?.annualPrice || selectedPlan?.price * 10 || 0) : (selectedPlan?.price || 0));

  const rawAmountPayable = previewData?.amountPayable ?? previewData?.proratedAmountPayable ?? previewData?.amountToPay;
  const amountPayable = rawAmountPayable !== undefined ? Number(rawAmountPayable) : targetPlanPrice;
  const remainingDays = previewData?.remainingDays ?? 0;
  const affectedResources = previewData?.affectedResources || {};

  // 3. Confirm Renewal / Payment Handler via Razorpay
  const handleUpgradeOrRenew = async () => {
    if (!selectedPlan?.id) return;

    setSubmitting(true);
    setActionError("");

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const payload = {
        subscriptionId: Number(selectedPlan.id),
        billingCycle: billingCycle,
        duration: 1,
      };

      let orderRes = null;
      try {
        orderRes = await api.selectPlan(payload);
      } catch (err) {
        try {
          orderRes = await api.upgradePlan(payload);
        } catch (upgradeErr) {
          throw err || upgradeErr;
        }
      }

      const resData = orderRes?.data || orderRes;

      if (resData?.requiresPayment === false || (resData?.amount === 0 && !resData?.orderId)) {
        onToast?.({
          message: `🎉 Plan updated successfully to ${getPlanTitle(selectedPlan)}!`,
          type: "success",
        });
        onSubscriptionActivated?.(resData);
        return;
      }

      const orderId = resData?.orderId || resData?.order_id || resData?.id;
      const amountInPaise = resData?.amountInPaise || (resData?.amount ? Number(resData.amount) * 100 : amountPayable * 100);
      const keyId = resData?.keyId || resData?.key || "rzp_test_TUgXmuuOZhtNm4";
      const currency = resData?.currency || "INR";

      if (!orderId) {
        throw new Error(orderRes?.message || "Could not create payment order from server.");
      }

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency,
        name: kitchenName,
        description: `Renew Subscription - ${getPlanTitle(selectedPlan)} (${billingCycle.toLowerCase()})`,
        order_id: orderId,
        prefill: {
          name: kitchenName,
          email: ownerEmail || "kitchen@example.com",
          contact: ownerPhone || "9876543210",
        },
        theme: {
          color: "#8D0606",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes?.status || verifyRes?.data) {
              if (verifyRes.data?.token) {
                localStorage.setItem("token", verifyRes.data.token);
              }
              if (verifyRes.data?.kitchen) {
                localStorage.setItem("kitchen", JSON.stringify(verifyRes.data.kitchen));
              }

              onToast?.({
                message: "🎉 Payment Verified! Your kitchen dashboard is now UNLOCKED.",
                type: "success",
              });
              onSubscriptionActivated?.(verifyRes);
            } else {
              const msg = verifyRes?.message || "Payment verification failed.";
              setActionError(msg);
              onToast?.({ message: msg, type: "error" });
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            const msg = getApiErrorMessage(verifyErr, "Error verifying payment with server.");
            setActionError(msg);
            onToast?.({ message: msg, type: "error" });
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse) {
        console.error("Payment failed:", failResponse);
        const errDescription = failResponse?.error?.description || "Transaction was declined.";
        setActionError(`Payment Failed: ${errDescription}`);
        onToast?.({ message: `Payment Failed: ${errDescription}`, type: "error" });
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Renew error:", err);
      const msg = getApiErrorMessage(err, "Failed to initiate payment");
      setActionError(msg);
      onToast?.({ message: msg, type: "error" });
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-rose-50 border border-rose-100 text-[#8D0606] shadow-2xs">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Manage Subscription Plan
                </h3>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#8D0606] border border-rose-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  Subscription Expired
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current active:{" "}
                <span className="font-semibold text-slate-800">
                  {currentSub?.planName || currentSub?.name || "Unlimited Scale for Large Franchise Chains"}
                </span>{" "}
                ({currentSub?.billingCycle || "MONTHLY"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
              title="Sign out of kitchen account"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Modal Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Billing Cycle Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <p className="text-xs font-bold text-slate-800">Billing Frequency</p>
              <p className="text-[11px] text-slate-500">Save up to 27% with annual commitment</p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                  billingCycle === "MONTHLY"
                    ? "bg-[#8D0606] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Repeat size={13} />
                <span>Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("YEARLY")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                  billingCycle === "YEARLY"
                    ? "bg-[#8D0606] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={13} />
                <span>Yearly (Save ~20-27%)</span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Available Subscription Tiers
            </h4>

            {loadingPlans ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-[#8D0606]" />
                <span className="text-xs font-medium">Fetching subscription plans...</span>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isThisTierCurrent = isSamePlanTier(plan, currentSub);
                  const pPrice = Number(
                    billingCycle === "YEARLY"
                      ? plan.annualPrice || plan.price * 10
                      : plan.price
                  );
                  const isTierUpgrade = pPrice > currentPrice;
                  const discountPercentage = Number(plan.discountPct || (billingCycle === "YEARLY" ? 17 : 0));

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative flex flex-col justify-between h-full min-h-[320px] rounded-2xl border p-5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#8D0606] bg-rose-50/20 shadow-md ring-2 ring-[#8D0606]/15"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span className="text-xs font-bold text-slate-900">
                            {getPlanTitle(plan)}
                          </span>
                          <div className="flex items-center gap-1">
                            {discountPercentage > 0 && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200">
                                {discountPercentage}% OFF
                              </span>
                            )}
                            {isThisTierCurrent ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                Current
                              </span>
                            ) : isTierUpgrade ? (
                              <span className="flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-[#8D0606] border border-rose-100">
                                <ArrowUpRight size={10} />
                                Upgrade
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-100">
                                <ArrowDownRight size={10} />
                                Downgrade
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xl font-extrabold text-[#8D0606]">
                              ₹{pPrice.toLocaleString("en-IN")}
                            </p>
                            <span className="text-[11px] font-medium text-slate-400">
                              / {billingCycle === "YEARLY" ? "year" : "mo"}
                            </span>
                            {discountPercentage > 0 && billingCycle === "YEARLY" && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Save {discountPercentage}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {plan.maxBranches ? `Max ${plan.maxBranches} Outlet${plan.maxBranches > 1 ? "s" : ""}` : "1 Outlet"} • {plan.maxUsers ? `${plan.maxUsers} Users` : "Staff Access"}
                          </p>
                        </div>

                        {/* Feature bullets */}
                        <ul className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                          {(plan.features?.length > 0 ? plan.features.slice(0, 4) : [
                            { feature: "Live POS & Kitchen Order Dashboard" },
                            { feature: "Digital Recipe & Menu Catalog" },
                            { feature: "Centralized Inventory & Stock Alerts" },
                            { feature: "Staff Role & Access Controls" },
                          ]).map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{typeof f === "string" ? f : f.feature || f.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#8D0606] text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select Plan"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prorated Calculation & Breakdown Box */}
          {selectedPlan && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606] shadow-2xs">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Prorated Plan Calculation & Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Transparent math formula & resource capacity comparison
                    </p>
                  </div>
                </div>

                {previewLoading && (
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8D0606] border border-rose-200 animate-pulse">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Recalculating...</span>
                  </span>
                )}
              </div>

              {previewError ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-semibold">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Metric Cards */}
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Account Status
                      </span>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {currentSub?.planName || currentSub?.name || "Subscription Expired"}
                      </p>
                      <p className="text-[11px] text-rose-600 font-bold">
                        ⚠️ Reactivation Required
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Target Plan Tier
                      </span>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {getPlanTitle(selectedPlan)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ₹{targetPlanPrice.toLocaleString("en-IN")} / {billingCycle.toLowerCase()}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-[#2B1010] to-[#8D0606] p-3.5 text-white shadow-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/80 block">
                        Net Payable Today
                      </span>
                      <p className="font-black text-xl text-white">
                        ₹{amountPayable.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10.5px] text-rose-100 font-medium">
                        Instant Kitchen Activation
                      </p>
                    </div>
                  </div>

                  {/* Resource Limits Strip */}
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Building2 size={15} className="text-blue-600" />
                          <span>Branch Outlets Allowed</span>
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-blue-900">
                          {selectedPlan.maxBranches || 1} Outlets
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Users size={15} className="text-purple-600" />
                          <span>Staff Accounts Allowed</span>
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 text-purple-900">
                          {selectedPlan.maxUsers || 48} Staff
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Error Banner */}
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-[#8D0606] shadow-2xs">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* ── Modal Footer Actions ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onLogout}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <LogOut size={13} className="text-rose-600" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={handleUpgradeOrRenew}
            disabled={submitting || !selectedPlan}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader variant="button" text="Processing with Razorpay..." />
            ) : (
              <>
                <CreditCard size={14} />
                <span>
                  Pay ₹{amountPayable.toLocaleString("en-IN")} & Unlock Dashboard
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SubscriptionLockModal;
