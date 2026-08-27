import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Building2,
  Mail,
  Phone,
  Camera,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Trash2,
  Zap,
  Calendar,
  CreditCard,
  Layers,
  Users,
  Check,
  Pencil,
  Edit3,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Loader2,
  CalendarDays,
  Repeat,
  BadgeCheck,
  Wallet,
  Lock,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { api, getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../api";
import { getPlanPrice, getPlanTitle, loadRazorpayScript } from "../../utils/helpers";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppSelect } from "../../components/ui/AppSelect";
import { Field } from "../../components/ui/Field";

export function normalizeContactTitle(title) {
  if (!title) return "MR";
  const clean = String(title).toUpperCase().replace(/[^A-Z]/g, "").trim();
  if (["MR", "MRS", "MS", "DR"].includes(clean)) return clean;
  if (clean.startsWith("MR")) return "MR";
  if (clean.startsWith("MS")) return "MS";
  if (clean.startsWith("DR")) return "DR";
  return "MR";
}

export function ProfilePage({ apiState, refreshKitchenData, onToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const [subscription, setSubscription] = useState(() => {
    return (
      apiState?.kitchen?.subscription ||
      apiState?.kitchen?.activeSubscription ||
      apiState?.kitchen?.parent?.subscription ||
      apiState?.selectedPlan ||
      null
    );
  });

  const formatSubscriptionDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (validUntil) => {
    if (!validUntil) return null;
    try {
      const now = new Date();
      const expiry = new Date(validUntil);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return null;
    }
  };

  const [form, setForm] = useState({
    kitchenName: "",
    email: "",
    phone: "",
    contactTitle: "MR",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const response = await fetch(`${getApiBaseUrl()}/kitchen/auth/profile`, requestOptions);
      const resultText = await response.text();
      console.log("Profile GET response:", resultText);

      let parsed = null;
      try {
        parsed = resultText ? JSON.parse(resultText) : null;
      } catch (e) {
        console.error("Failed to parse profile JSON:", e);
      }

      const p = parsed?.data || parsed?.kitchen || parsed?.profile || parsed || {};

      setForm({
        kitchenName: p.kitchenName || p.name || "",
        email: p.email || "",
        phone: p.phone || "",
        contactTitle: normalizeContactTitle(p.contactTitle),
        contactFirstName: p.contactFirstName || "",
        contactLastName: p.contactLastName || "",
        contactEmail: p.contactEmail || "",
        contactPhone: p.contactPhone || "",
      });

      if (p.profilePicture || p.logo || p.avatar) {
        setPreviewUrl(p.profilePicture || p.logo || p.avatar);
      }

      const sub =
        p.subscription ||
        p.activeSubscription ||
        p.parent?.subscription ||
        apiState?.kitchen?.subscription ||
        apiState?.selectedPlan ||
        null;
      setSubscription(sub);
    } catch (error) {
      console.error(error);
      const msg = getApiErrorMessage(error, "Failed to load kitchen profile");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [apiState?.token]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePictureFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.kitchenName?.trim()) {
      onToast?.({ message: "Please enter your kitchen name.", type: "error" });
      return;
    }

    setSaving(true);
    setApiError("");

    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const formdata = new FormData();
      if (profilePictureFile) {
        formdata.append("profilePicture", profilePictureFile);
      }
      formdata.append("kitchenName", form.kitchenName || "");
      formdata.append("phone", form.phone || "");
      formdata.append("email", form.email || "");
      formdata.append("contactTitle", normalizeContactTitle(form.contactTitle));
      formdata.append("contactFirstName", form.contactFirstName || "");
      formdata.append("contactLastName", form.contactLastName || "");
      formdata.append("contactEmail", form.contactEmail || "");
      formdata.append("contactPhone", form.contactPhone || "");

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      const response = await fetch(`${getApiBaseUrl()}/kitchen/auth/profile`, requestOptions);
      const resultText = await response.text();
      console.log("Profile PUT response:", resultText);

      let parsed = null;
      try {
        parsed = resultText ? JSON.parse(resultText) : null;
      } catch (_) {}

      if (!response.ok || (parsed && parsed.status === false)) {
        let errorMsg = parsed?.message || `Failed to update profile (${response.status})`;
        if (parsed?.errors && typeof parsed.errors === "object") {
          const errorDetails = Object.entries(parsed.errors)
            .map(([k, v]) => (Array.isArray(v) ? v.join(", ") : v))
            .filter(Boolean)
            .join("; ");
          if (errorDetails) {
            errorMsg = errorDetails;
          }
        }
        throw new Error(errorMsg);
      }

      onToast?.({ message: "Kitchen profile updated successfully!", type: "success" });
      refreshKitchenData?.();
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Profile update error:", error);
      const msg = getApiErrorMessage(error, "Failed to update profile");
      setApiError(msg);
      onToast?.({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const initialLetter = (form.kitchenName || "K").charAt(0).toUpperCase();
  const validDate = subscription?.validUntil || subscription?.planEndDate || subscription?.trialEndDate;
  const daysLeft = getDaysRemaining(validDate);
  const titleLabels = { MR: "Mr.", MRS: "Mrs.", MS: "Ms.", DR: "Dr." };
  const displayTitle = titleLabels[normalizeContactTitle(form.contactTitle)] || "Mr.";
  const contactFullName = `${displayTitle} ${form.contactFirstName || ""} ${form.contactLastName || ""}`.trim() || "—";

  const handleCopy = (text, label) => {
    if (!text || text === "—") return;
    navigator.clipboard?.writeText(text);
    onToast?.({ message: `${label} copied to clipboard!`, type: "success" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Top Header */}
      <PageHeader
        badge="Account & Settings"
        activeBadge="Kitchen Identity"
        title="Kitchen Profile"
        subtitle="Manage your cloud kitchen brand identity, official contact details, and primary owner information."
      />

      {loading ? (
        <div className="py-24">
          <Loader variant="page" text="Loading kitchen profile..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* 1. KITCHEN IDENTITY BRAND CARD                                            */}
          {/* ========================================================================= */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left">
                {/* Brand Logo / Avatar */}
                <div className="relative shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={form.kitchenName || "Kitchen Avatar"}
                      className="size-20 sm:size-22 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs bg-slate-50"
                      onError={() => setPreviewUrl("")}
                    />
                  ) : (
                    <div className="grid size-20 sm:size-22 place-items-center rounded-2xl bg-rose-50 border-2 border-rose-200 text-2xl sm:text-3xl font-bold text-[#8D0606] shadow-2xs">
                      {initialLetter}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-lg bg-[#8D0606] text-white shadow-md hover:bg-[#780404] transition active:scale-90"
                      title="Upload Logo"
                    >
                      <Camera size={13} />
                    </button>
                  )}
                </div>

                {/* Identity Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {form.kitchenName || "My Cloud Kitchen"}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active Kitchen</span>
                    </span>
                  </div>

                  {/* Summary Chips */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">
                      <User size={13} className="text-purple-600" />
                      <span>{contactFullName}</span>
                    </span>
                    {form.email && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">
                        <Mail size={13} className="text-sky-600" />
                        <span>{form.email}</span>
                      </span>
                    )}
                    {form.phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-700">
                        <Phone size={13} className="text-emerald-600" />
                        <span>{form.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={fetchProfile}
                  disabled={loading || saving}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                  title="Reload profile data"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin text-[#8D0606]" : ""} />
                  <span className="hidden sm:inline">Reload</span>
                </button>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#8D0606] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#780404] transition shadow-xs active:scale-95"
                  >
                    <Pencil size={13} />
                    <span>Update Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isEditing ? (
            /* ========================================================================= */
            /* 2. READ-ONLY DASHBOARD VIEW (BENTO 2-COLUMN GRID)                         */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* LEFT COLUMN (2 Cols): Brand & Primary Contact Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Kitchen Brand Credentials Card */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606] shadow-2xs">
                        <Building2 size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Kitchen Brand Details</h3>
                        <p className="text-[11px] text-slate-400">Official business credentials & contact channels</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-3">
                    {/* Brand Name Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-[#8D0606]/30 hover:shadow-xs flex items-center gap-3.5 group">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606]">
                        <ChefHat size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Brand Name
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {form.kitchenName || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Official Email Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-sky-300 hover:shadow-xs flex items-center justify-between gap-2.5 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Official Email
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={form.email}>
                            {form.email || "—"}
                          </p>
                        </div>
                      </div>
                      {form.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.email, "Official Email")}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy Email"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>

                    {/* Official Phone Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-emerald-300 hover:shadow-xs flex items-center justify-between gap-2.5 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Official Phone
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={form.phone}>
                            {form.phone || "—"}
                          </p>
                        </div>
                      </div>
                      {form.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.phone, "Official Phone")}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy Phone"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Contact Person Card */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-xl bg-purple-50 border border-purple-100 text-purple-700 shadow-2xs">
                        <User size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Primary Contact Person</h3>
                        <p className="text-[11px] text-slate-400">Account owner & management representative</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-3">
                    {/* Contact Name Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-purple-300 hover:shadow-xs flex items-center gap-3.5 group">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                        <User size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Contact Name
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {contactFullName}
                        </p>
                      </div>
                    </div>

                    {/* Contact Email Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-sky-300 hover:shadow-xs flex items-center justify-between gap-2.5 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Contact Email
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={form.contactEmail}>
                            {form.contactEmail || "—"}
                          </p>
                        </div>
                      </div>
                      {form.contactEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.contactEmail, "Contact Email")}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy Email"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>

                    {/* Contact Mobile Tile */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:bg-white hover:border-emerald-300 hover:shadow-xs flex items-center justify-between gap-2.5 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Contact Mobile
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={form.contactPhone}>
                            {form.contactPhone || "—"}
                          </p>
                        </div>
                      </div>
                      {form.contactPhone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.contactPhone, "Contact Mobile")}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy Phone"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (1 Col): Active Subscription & Quota Card */}
              <div className="space-y-6">
                {subscription ? (
                  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-9 place-items-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shadow-2xs">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Subscription Plan</h3>
                          <span className="text-[11px] font-bold text-emerald-600">
                            {subscription.isTrial ? "Free Trial" : subscription.status || "Active Plan"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Plan Price & Details */}
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md relative overflow-hidden">
                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                        <h4 className="text-base font-extrabold text-white">
                          {subscription.planName || subscription.name || "Starter Plan"}
                        </h4>
                        <div className="flex items-baseline gap-1.5 pt-2">
                          <span className="text-2xl font-black text-rose-300">
                            {subscription.pricePaid !== undefined && subscription.pricePaid !== null
                              ? `₹${subscription.pricePaid}`
                              : "Paid"}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            / {subscription.billingCycle?.toLowerCase() || "monthly"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Strip */}
                    {validDate && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar size={13} className="text-[#8D0606]" />
                          <span>Valid: <span className="font-bold">{formatSubscriptionDate(validDate)}</span></span>
                        </div>
                        {daysLeft !== null && (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-[#8D0606]">
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                    )}

                    {/* Feature Quotas List */}
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Quotas & Limits
                      </span>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Building2 size={14} className="text-sky-600" />
                          <span>Branch Outlets</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {subscription.maxBranches || 1} Outlets
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Users size={14} className="text-purple-600" />
                          <span>Staff Accounts</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          Up to {subscription.maxUsers || 3} Users
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Zap size={14} className="text-amber-600" />
                          <span>Recipe Capacity</span>
                        </div>
                        <span className="font-bold text-emerald-600">
                          Unlimited
                        </span>
                      </div>
                    </div>

                    {/* Change Plan Button */}
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#780404] transition active:scale-98"
                    >
                      <Zap size={14} />
                      <span>Upgrade / Change Plan</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. EDITABLE FORM MODE                                                     */
            /* ========================================================================= */
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Inline API Error Alert Banner */}
              {apiError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5 shadow-2xs animate-in fade-in">
                  <AlertCircle size={17} className="shrink-0 text-rose-600" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Profile Picture Card */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 mb-5">
                  <div className="grid size-8 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606]">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Brand Logo & Photo</h3>
                    <p className="text-[11px] text-slate-400">Update your kitchen brand logo or display avatar</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={form.kitchenName || "Kitchen Avatar"}
                        className="size-24 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs"
                        onError={() => setPreviewUrl("")}
                      />
                    ) : (
                      <div className="grid size-24 place-items-center rounded-2xl bg-rose-50 border border-rose-200 text-3xl font-bold text-[#8D0606] shadow-2xs">
                        {initialLetter}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition shadow-2xs"
                      >
                        <Upload size={14} />
                        <span>Upload Logo</span>
                      </button>

                      {previewUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-[#8D0606] hover:bg-rose-100 transition"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11.5px] text-slate-400 font-normal">
                      Recommended: Square PNG, JPG or WEBP image at least 500x500px (Max 5MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Kitchen Identity Details */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
                  <div className="grid size-8 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606]">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Kitchen Brand Details</h3>
                    <p className="text-[11px] text-slate-400">Official business information</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Kitchen / Brand Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <ChefHat className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                      <input
                        type="text"
                        required
                        placeholder="Enter kitchen or brand name (e.g. Royal Spice Cloud Kitchen)"
                        value={form.kitchenName}
                        onChange={(e) => setForm((f) => ({ ...f, kitchenName: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Kitchen Official Email <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                      <input
                        type="email"
                        required
                        placeholder="Enter kitchen official email (e.g. contact@royalspice.com)"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Kitchen Official Phone <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                      <input
                        type="tel"
                        required
                        placeholder="Enter 10-digit official phone (e.g. 9876543210)"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Contact Person Details */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
                  <div className="grid size-8 place-items-center rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                    <User size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Primary Contact Person</h3>
                    <p className="text-[11px] text-slate-400">Account holder contact information</p>
                  </div>
                </div>

                {/* Contact Names Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Title
                    </label>
                    <AppSelect
                      value={normalizeContactTitle(form.contactTitle)}
                      onChange={(val) => setForm((f) => ({ ...f, contactTitle: normalizeContactTitle(val) }))}
                      options={[
                        { value: "MR", label: "Mr." },
                        { value: "MRS", label: "Mrs." },
                        { value: "MS", label: "Ms." },
                        { value: "DR", label: "Dr." },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      First Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter contact first name (e.g. Rahul)"
                      value={form.contactFirstName}
                      onChange={(e) => setForm((f) => ({ ...f, contactFirstName: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Last Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter contact last name (e.g. Soni)"
                      value={form.contactLastName}
                      onChange={(e) => setForm((f) => ({ ...f, contactLastName: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    />
                  </div>
                </div>

                {/* Contact Email & Phone Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Contact Email <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                      <input
                        type="email"
                        required
                        placeholder="Enter contact email address (e.g. rahul@test.com)"
                        value={form.contactEmail}
                        onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Contact Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                      <input
                        type="tel"
                        required
                        placeholder="Enter 10-digit mobile number (e.g. 9123456780)"
                        value={form.contactPhone}
                        onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                  disabled={saving || loading}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-7 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-[#7a0505] hover:to-[#990707] active:scale-98 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader variant="button" text="Saving Changes..." />
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Plan Upgrade / Downgrade Modal */}
      {isPlanModalOpen && (
        <PlanUpgradeModal
          currentSubscription={subscription}
          apiState={apiState}
          kitchenForm={form}
          onClose={() => setIsPlanModalOpen(false)}
          onSuccess={() => {
            fetchProfile();
            refreshKitchenData?.();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function isSamePlanTier(planA, planB) {
  if (!planA || !planB) return false;
  const idA = planA.subscriptionId || planA.id;
  const idB = planB.subscriptionId || planB.id;
  if (idA && idB && String(idA) === String(idB)) return true;

  const getCleanSlug = (p) => {
    const raw = String(p?.planName || p?.title || p?.name || p?.subscriptionName || "").toLowerCase();
    if (raw.includes("start")) return "starter";
    if (raw.includes("inter")) return "inter";
    if (raw.includes("pro")) return "pro";
    return raw.replace(/[^a-z0-9]/g, "");
  };

  const slugA = getCleanSlug(planA);
  const slugB = getCleanSlug(planB);
  return slugA && slugB && slugA === slugB;
}

// ---------------------------------------------------------------------------
// Plan Upgrade / Downgrade Modal (Portal-mounted with Live Razorpay & Backend APIs)
// ---------------------------------------------------------------------------
function PlanUpgradeModal({ currentSubscription, apiState, kitchenForm, onClose, onSuccess, onToast }) {
  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const [billingCycle, setBillingCycle] = useState(
    currentSubscription?.billingCycle?.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY"
  );
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentPrice = Number(currentSubscription?.pricePaid || currentSubscription?.price || 0);

  // 1. Fetch available plans from API
  useEffect(() => {
    let active = true;
    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const token = apiState?.token || getStoredToken();
        const res = await api.plans(token);
        const apiPlans = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!active) return;

        // Deduplicate plans into unique tiers with full features
        const seen = new Map();
        const sorted = [...apiPlans].sort((a, b) => (b.features?.length || 0) - (a.features?.length || 0));
        for (const plan of sorted) {
          const key = (plan.name || plan.title || "").toLowerCase().trim();
          if (!seen.has(key)) {
            seen.set(key, plan);
          }
        }
        const uniquePlans = Array.from(seen.values()).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        setPlans(uniquePlans);

        // Pre-select next tier (upgrade) or first non-active plan
        if (uniquePlans.length > 0) {
          const nextUpgradeTier =
            uniquePlans.find((p) => !isSamePlanTier(p, currentSubscription) && Number(p.price || 0) > Number(currentPrice || 0)) ||
            uniquePlans.find((p) => !isSamePlanTier(p, currentSubscription)) ||
            uniquePlans[0];
          setSelectedPlan(nextUpgradeTier);
        }
      } catch (err) {
        console.error("Failed to load subscription plans:", err);
      } finally {
        if (active) setLoadingPlans(false);
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, [currentSubscription, currentPrice, apiState?.token]);

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

  const isCurrentPlanTier = isSamePlanTier(selectedPlan, currentSubscription);
  const isCurrentCycle =
    billingCycle.toUpperCase() === (currentSubscription?.billingCycle || "MONTHLY").toUpperCase();
  const isExactCurrentPlan = isCurrentPlanTier && isCurrentCycle;

  // Determine change type from backend preview data or price comparison
  const changeType =
    previewData?.changeType?.toUpperCase() ||
    (Number(selectedPlan?.price || 0) < currentPrice ? "DOWNGRADE" : "UPGRADE");

  const isDowngrade = changeType === "DOWNGRADE" && !isExactCurrentPlan;
  const isUpgrade = changeType === "UPGRADE" && !isExactCurrentPlan;

  // Prorated breakdown details
  const targetPlanPrice = previewData?.targetPlanPrice !== undefined
    ? Number(previewData.targetPlanPrice)
    : Number(billingCycle === "YEARLY" ? (selectedPlan?.annualPrice || selectedPlan?.price * 10 || 0) : (selectedPlan?.price || 0));

  const remainingDays = previewData?.remainingDays ?? 0;
  const remainingCredit = previewData?.remainingCredit ?? 0;

  const rawAmountPayable = previewData?.amountPayable ?? previewData?.proratedAmountPayable ?? previewData?.amountToPay;
  const amountPayable = rawAmountPayable !== undefined ? Number(rawAmountPayable) : targetPlanPrice;

  const affectedResources = previewData?.affectedResources || {};
  const excessBranchesToDisable = Number(affectedResources?.excessBranchesToDisable || 0);
  const excessStaffToDisable = Number(affectedResources?.excessStaffToDisable || 0);

  // 3. Confirm Downgrade Handler (POST /kitchen/subscription/downgrade)
  const handleDowngrade = async () => {
    if (!selectedPlan?.id || isExactCurrentPlan) return;

    setSubmitting(true);
    setActionError("");

    try {
      const payload = {
        subscriptionId: Number(selectedPlan.id),
        billingCycle: billingCycle,
        duration: 1,
      };

      const res = await api.downgradePlan(payload);

      const successMsg =
        res?.message ||
        `Plan downgraded successfully to ${getPlanTitle(selectedPlan)}!`;

      onToast?.({
        message: successMsg,
        type: "success",
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Downgrade error:", err);
      const msg = getApiErrorMessage(err, "Failed to downgrade subscription plan");
      setActionError(msg);
      onToast?.({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Confirm Upgrade / Renewal Handler (POST /kitchen/subscription/upgrade or select + Razorpay)
  const handleUpgradeOrRenew = async () => {
    if (!selectedPlan?.id || isExactCurrentPlan) return;

    setSubmitting(true);
    setActionError("");

    try {
      const token = apiState?.token || getStoredToken();

      // Ensure Razorpay SDK script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const payload = {
        subscriptionId: Number(selectedPlan.id),
        billingCycle: billingCycle,
        duration: 1,
      };

      // If renewal/same tier or upgrade
      let orderRes = null;
      if (isCurrentPlanTier) {
        orderRes = await api.selectPlan(payload);
      } else {
        try {
          orderRes = await api.upgradePlan(payload);
        } catch (upgradeErr) {
          const errorMsg = getApiErrorMessage(upgradeErr, "");
          if (errorMsg.toLowerCase().includes("select") || errorMsg.toLowerCase().includes("not found")) {
            orderRes = await api.selectPlan(payload);
          } else {
            throw upgradeErr;
          }
        }
      }

      const resData = orderRes?.data || orderRes;

      // If backend says payment is not required or 0 amount
      if (resData?.requiresPayment === false || (resData?.amount === 0 && !resData?.orderId)) {
        onToast?.({
          message: `🎉 Plan updated successfully to ${getPlanTitle(selectedPlan)}!`,
          type: "success",
        });
        onSuccess?.();
        onClose();
        return;
      }

      const orderId = resData?.orderId || resData?.order_id || resData?.id;
      const amountInPaise = resData?.amountInPaise || (resData?.amount ? Number(resData.amount) * 100 : amountPayable * 100);
      const keyId = resData?.keyId || resData?.key || "rzp_test_TUgXmuuOZhtNm4";
      const currency = resData?.currency || "INR";

      if (!orderId) {
        throw new Error(orderRes?.message || "Could not create payment order from server.");
      }

      // Configure and open Razorpay inline modal
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency,
        name: kitchenForm?.kitchenName || apiState?.kitchen?.kitchenName || "Cloud Kitchen",
        description: `Plan ${isUpgrade ? "Upgrade" : "Payment"} - ${getPlanTitle(selectedPlan)} (${billingCycle.toLowerCase()})`,
        order_id: orderId,
        prefill: {
          name: `${kitchenForm?.contactFirstName || ""} ${kitchenForm?.contactLastName || ""}`.trim() || kitchenForm?.kitchenName || "Kitchen Owner",
          email: kitchenForm?.contactEmail || kitchenForm?.email || "kitchen@example.com",
          contact: kitchenForm?.contactPhone || kitchenForm?.phone || "9876543210",
        },
        theme: {
          color: "#8D0606",
        },
        handler: async function (response) {
          try {
            console.log("Razorpay payment completed:", response);
            // Verify payment on backend
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
                message: "🎉 Payment Verified! Your new plan is now active.",
                type: "success",
              });
              onSuccess?.();
              onClose();
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
            console.log("Razorpay modal dismissed by user");
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
      console.error("Upgrade/Renew error:", err);
      const msg = getApiErrorMessage(err, "Failed to initiate plan upgrade order.");
      setActionError(msg);
      onToast?.({ message: msg, type: "error" });
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-rose-50/70 via-white to-white px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-2xl bg-rose-50 border border-rose-200 text-[#8D0606] shadow-2xs">
              <Zap size={20} className="text-[#8D0606]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Manage Subscription Plan</h3>
                <span className="rounded-full bg-rose-100/70 px-2 py-0.5 text-[10px] font-bold text-[#8D0606]">
                  Live Prorated Billing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current active: <span className="font-semibold text-slate-800">{currentSubscription?.planName || currentSubscription?.name || "Starter Plan"}</span> ({currentSubscription?.billingCycle || "Monthly"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
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
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
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
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
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
                  const isThisTierCurrent = isSamePlanTier(plan, currentSubscription);
                  const isThisCurrentActive = isThisTierCurrent && billingCycle.toUpperCase() === (currentSubscription?.billingCycle || "MONTHLY").toUpperCase();
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
                            {isThisCurrentActive ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                Current
                              </span>
                            ) : isThisTierCurrent ? (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100">
                                Switch cycle
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
                              {getPlanPrice(plan, billingCycle)}
                            </p>
                            {discountPercentage > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                Save {discountPercentage}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {plan.maxBranches ? `Max ${plan.maxBranches} ${plan.maxBranches > 1 ? "Outlets" : "Outlet"}` : "1 Outlet"} • {plan.maxUsers ? `${plan.maxUsers} Users` : "3 Users"}
                          </p>
                        </div>

                        {/* Features */}
                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-600 mb-4">
                            {plan.features
                              .filter((f) => f.type === "INCLUDE")
                              .slice(0, 4)
                              .map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <Check size={12} className="text-emerald-600 shrink-0" />
                                  <span className="truncate">{f.feature}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Select Indicator */}
                      <div className="mt-4 pt-2">
                        <div
                          className={`w-full rounded-xl py-2 text-center text-xs font-bold transition ${
                            isSelected
                              ? "bg-[#8D0606] text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select Plan"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Preview & Prorated Calculation Box */}
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
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Three Top Metric Cards */}
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    {/* Current Plan Summary */}
                    <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Current Active Plan
                      </span>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {previewData?.currentPlan?.subscription?.name || currentSubscription?.planName || currentSubscription?.name || "Current Plan"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Paid ₹{Number(previewData?.currentPlan?.pricePaid || currentPrice || 0).toLocaleString("en-IN")} • {remainingDays > 0 ? `${remainingDays}d remaining` : "Active"}
                      </p>
                    </div>

                    {/* Target Plan Summary */}
                    <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Target Plan Tier
                        </span>
                        {Number(previewData?.targetPlan?.discountPct || selectedPlan?.discountPct || 0) > 0 && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200">
                            {previewData?.targetPlan?.discountPct || selectedPlan?.discountPct}% Discount
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {getPlanTitle(selectedPlan)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ₹{targetPlanPrice.toLocaleString("en-IN")} / {billingCycle.toLowerCase()} cycle
                      </p>
                    </div>

                    {/* Net Payable Strip */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#2B1010] to-[#8D0606] p-3.5 text-white shadow-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/80 block">
                        {isDowngrade ? "Adjustment Total" : "Net Payable Today"}
                      </span>
                      <p className="font-black text-xl text-white">
                        ₹{amountPayable.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10.5px] text-rose-100 font-medium">
                        {isExactCurrentPlan
                          ? "Currently Active"
                          : isDowngrade
                          ? "Prorated Downgrade"
                          : "Immediate Activation"}
                      </p>
                    </div>
                  </div>

                  {/* 2. Transparent Calculation Receipt / Formula Box */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <span>🧮</span>
                        <span>Transparent Prorated Math Breakdown</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {Number(previewData?.targetPlan?.discountPct || selectedPlan?.discountPct || 0) > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            {previewData?.targetPlan?.discountPct || selectedPlan?.discountPct}% Discount Included
                          </span>
                        )}
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          {remainingDays > 0 ? `${remainingDays} Unused Days Credited` : "Cycle Prorated"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs border-y border-slate-200/80 py-2.5">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold">{getPlanTitle(selectedPlan)} Base Price ({billingCycle.toLowerCase()})</span>
                          {Number(previewData?.targetPlan?.discountPct || selectedPlan?.discountPct || 0) > 0 && (
                            <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800">
                              {previewData?.targetPlan?.discountPct || selectedPlan?.discountPct}% OFF
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-slate-900">+ ₹{targetPlanPrice.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          <span>Unused Credit from current plan ({remainingDays} days remaining)</span>
                        </span>
                        <span className="font-bold text-emerald-600">- ₹{remainingCredit.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">Total Prorated Amount to Pay</span>
                        <span className="text-[10.5px] text-slate-400">
                          {isDowngrade
                            ? "Plan quotas will be adjusted on confirmation."
                            : "You only pay the difference for your remaining billing cycle."}
                        </span>
                      </div>
                      <span className="text-base font-black text-[#8D0606]">
                        ₹{amountPayable.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* 3. Resource Quota Expansion & Capacity Preview */}
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    {/* Outlets Expansion Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Building2 size={15} className="text-sky-600" />
                          <span>Branch Outlets Capacity</span>
                        </div>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                          {affectedResources?.activeBranchesCount || 1} Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-slate-500">
                          Quota limit:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-slate-400 font-medium">
                            {previewData?.currentPlan?.maxBranches || currentSubscription?.maxBranches || 1}
                          </span>
                          <span className="text-slate-400 font-bold">➔</span>
                          <span className="font-extrabold text-slate-900 text-sm bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 text-sky-900">
                            {selectedPlan.maxBranches || 10} Outlets
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Staff Accounts Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Users size={15} className="text-purple-600" />
                          <span>Staff Logins Capacity</span>
                        </div>
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                          {affectedResources?.activeStaffCount || 0} Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-slate-500">
                          Staff limit:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-slate-400 font-medium">
                            {previewData?.currentPlan?.maxUsers || currentSubscription?.maxUsers || 5}
                          </span>
                          <span className="text-slate-400 font-bold">➔</span>
                          <span className="font-extrabold text-slate-900 text-sm bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 text-purple-900">
                            {selectedPlan.maxUsers || 48} Staff
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Target Plan Included Features List */}
                  {Array.isArray(previewData?.targetPlan?.features) && previewData.targetPlan.features.length > 0 && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included in {getPlanTitle(selectedPlan)}:
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        {previewData.targetPlan.features.map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center gap-2 text-slate-700">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{item.feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Downgrade Impact Warning Banner */}
                  {isDowngrade && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                        <span>Important notice regarding Plan Downgrade:</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-amber-800">
                        {excessBranchesToDisable > 0 || excessStaffToDisable > 0 ? (
                          <>
                            Downgrading will reduce your quotas to <strong>{selectedPlan.maxBranches || 1} Outlets</strong> and <strong>{selectedPlan.maxUsers || 3} Staff</strong>.
                            The system will automatically deactivate <strong>{excessBranchesToDisable} extra branch outlet(s)</strong> and <strong>{excessStaffToDisable} extra staff member(s)</strong>.
                          </>
                        ) : (
                          <>
                            Your active resources ({affectedResources?.activeBranchesCount || 0} branches, {affectedResources?.activeStaffCount || 0} staff) fit within the new limit ({selectedPlan.maxBranches || 1} Outlets, {selectedPlan.maxUsers || 3} Staff). No active outlets will be disabled.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Error Banner */}
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-[#8D0606] shadow-2xs">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
          >
            Cancel
          </button>

          {isDowngrade ? (
            <button
              type="button"
              onClick={handleDowngrade}
              disabled={submitting || !selectedPlan}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-7 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <Loader variant="button" text="Applying Downgrade..." />
              ) : (
                <>
                  <AlertTriangle size={14} />
                  <span>Confirm Downgrade to {getPlanTitle(selectedPlan)}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeOrRenew}
              disabled={submitting || !selectedPlan || isExactCurrentPlan}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <Loader variant="button" text="Processing with Razorpay..." />
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>
                    {isExactCurrentPlan
                      ? "Currently Active Plan"
                      : isUpgrade
                      ? `Pay ₹${amountPayable.toLocaleString("en-IN")} & Upgrade via Razorpay`
                      : `Pay ₹${amountPayable.toLocaleString("en-IN")} & Switch Plan`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
