import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  X,
  Building2,
  Users,
  KeyRound,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { usePermissions } from "../../utils/permissions";

export function ProfilePanel({ apiState, onClose, onLogout, onReset }) {
  const navigate = useNavigate();
  const { canView, roleName, isStaff } = usePermissions(apiState);
  const kitchen = apiState?.kitchen;
  const kitchenName = kitchen?.kitchenName || (isStaff ? (kitchen?.firstName || "Staff Member") : "-");
  const email = kitchen?.contactEmail || kitchen?.email || "-";
  const profilePicture = kitchen?.profilePicture;
  const initial = (kitchenName?.[0] || "K").toUpperCase();

  // Extract subscription data from kitchen profile, parent or selectedPlan
  const subscription =
    kitchen?.subscription ||
    kitchen?.activeSubscription ||
    kitchen?.parent?.subscription ||
    apiState?.selectedPlan ||
    null;

  const handleNavigate = (path) => {
    onClose?.();
    navigate(path);
  };

  const formatSubscriptionDate = (dateStr) => {
    if (!dateStr) return null;
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

  const validDate = subscription?.validUntil || subscription?.planEndDate || subscription?.trialEndDate;
  const daysLeft = getDaysRemaining(validDate);

  return (
    <div className="absolute right-3 sm:right-6 top-16 z-50 w-[calc(100vw-24px)] sm:w-[340px] max-w-[340px] overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150">
      {/* Header Profile Info */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={kitchenName}
              className="size-11 shrink-0 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white font-black text-base shadow-xs">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">
              {kitchenName}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 truncate" title={email}>
              {email}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Logged In</span>
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 truncate max-w-[130px]">
                {roleName}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={15} />
        </button>
      </div>

      {/* Subscription Card Section */}
      {subscription && (
        <div className="relative my-2.5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#8D0606] via-[#750505] to-[#420202] p-3.5 text-white shadow-md shadow-rose-950/25 border border-rose-900/30">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-amber-400/15 blur-xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/20 text-amber-300 backdrop-blur-md border border-white/25 shadow-xs">
                <Sparkles size={15} className="fill-amber-300 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {subscription.planName || subscription.name || "Active Plan"}
                </h4>
                <p className="text-[10.5px] font-normal text-rose-200/90 truncate">
                  {subscription.pricePaid !== undefined && subscription.pricePaid !== null
                    ? `₹${subscription.pricePaid}`
                    : "Paid Plan"}{" "}
                  • {subscription.billingCycle || "Monthly"}
                </p>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 border border-emerald-400/30 backdrop-blur-xs">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>{subscription.isTrial ? "Trial" : subscription.status || "Active"}</span>
            </span>
          </div>

          {/* Expiry and countdown row */}
          {validDate && (
            <div className="relative mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-white/80 font-medium">
                <Calendar size={12} className="text-amber-300 shrink-0" />
                <span className="truncate">Till {formatSubscriptionDate(validDate)}</span>
              </div>
              {daysLeft !== null && (
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-xs">
                  {daysLeft} {daysLeft === 1 ? "day left" : "days left"}
                </span>
              )}
            </div>
          )}

          {/* Quotas indicator */}
          {(subscription.maxBranches || subscription.maxUsers) && (
            <div className="relative mt-2 flex items-center gap-2 text-[9.5px] font-bold text-rose-200/75">
              {subscription.maxBranches && (
                <span className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                  <span>🏢</span> {subscription.maxBranches} {subscription.maxBranches === 1 ? "Outlet" : "Outlets"}
                </span>
              )}
              {subscription.maxUsers && (
                <span className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                  <span>👥</span> Up to {subscription.maxUsers} Users
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Action Links */}
      <div className="py-2.5 space-y-1">
        {canView("profile") && (
          <ProfileMenuItem
            icon={User}
            label="My Kitchen Profile"
            description="Update kitchen name, photo & contact"
            onClick={() => handleNavigate("/profile")}
          />
        )}

        {canView("branch") && (
          <ProfileMenuItem
            icon={Building2}
            label="Kitchen & Branch Setup"
            description="Manage outlets & operating hours"
            onClick={() => handleNavigate("/kitchen")}
          />
        )}

        {canView("staffManagement") && (
          <ProfileMenuItem
            icon={Users}
            label="Staff & Team Roles"
            description="Assign roles & staff members"
            onClick={() => handleNavigate("/staff")}
          />
        )}

        <ProfileMenuItem
          icon={KeyRound}
          label="Reset Password"
          description="Update account security"
          onClick={() => {
            onClose?.();
            onReset?.();
          }}
        />
      </div>

      {/* Footer Logout Action */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-xs font-bold text-[#8D0606] shadow-2xs transition hover:bg-rose-100 hover:border-rose-200 active:scale-98"
        >
          <LogOut size={15} strokeWidth={2.3} />
          <span>Logout Account</span>
        </button>
      </div>
    </div>
  );
}

function ProfileMenuItem({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition hover:bg-slate-50 border border-transparent hover:border-slate-100"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-rose-50 group-hover:text-[#8D0606]">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 group-hover:text-[#8D0606] transition truncate">
            {label}
          </p>
          <p className="text-[10.5px] font-medium text-slate-400 truncate">
            {description}
          </p>
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-slate-300 transition group-hover:text-[#8D0606] group-hover:translate-x-0.5 shrink-0"
      />
    </button>
  );
}
