import React from "react";
import {
  User,
  X,
  Building2,
  Users,
  KeyRound,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProfilePanel({ apiState, onClose, onLogout, onReset }) {
  const navigate = useNavigate();
  const kitchenName = apiState?.kitchen?.kitchenName || "Kitchen Admin";
  const email = apiState?.kitchen?.email || "admin@cloudkitchen.com";
  const initial = (kitchenName?.[0] || "A").toUpperCase();

  const handleNavigate = (path) => {
    onClose?.();
    navigate(path);
  };

  return (
    <div className="absolute right-6 top-16 z-50 w-[330px] overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150">
      {/* Header Profile Info */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white font-black text-base shadow-xs">
            {initial}
          </div>
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
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-500">
                Admin
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

      {/* Main Action Links */}
      <div className="py-2.5 space-y-1">
        <ProfileMenuItem
          icon={Building2}
          label="Kitchen & Branch Setup"
          description="Manage outlets & operating hours"
          onClick={() => handleNavigate("/kitchen")}
        />

        <ProfileMenuItem
          icon={Users}
          label="Staff & Team Roles"
          description="Assign roles & staff members"
          onClick={() => handleNavigate("/staff")}
        />

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
