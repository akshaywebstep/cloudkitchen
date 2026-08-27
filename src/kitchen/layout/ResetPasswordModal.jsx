import React, { useState } from "react";
import { X, KeyRound, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "../../api";
import { Loader } from "../../components/ui/Loader";

export function ResetPasswordModal({ onClose, onToast }) {
  const [form, setForm] = useState({ token: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.token.trim()) next.token = "Reset token is required.";
    if (!form.password) next.password = "New password is required.";
    if (!form.confirmPassword) next.confirmPassword = "Confirm password is required.";
    else if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setMessage("");
    try {
      await api.resetPassword(form);
      onToast?.({ message: "Password reset successful!", type: "success" });
      onClose();
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Reset failed");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Reset Account Password</h3>
              <p className="text-xs font-normal text-slate-400">Enter reset token and new password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Reset Token <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition ${
                  errors.token ? "border-rose-500 bg-rose-50/20" : "border-slate-200 focus:border-[#8D0606]"
                }`}
                placeholder="Enter reset token from email or server"
                value={form.token}
                onChange={(e) => {
                  setForm((f) => ({ ...f, token: e.target.value }));
                  setErrors((f) => ({ ...f, token: undefined }));
                }}
              />
            </div>
            {errors.token ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <AlertCircle size={13} /> {errors.token}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              New Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="password"
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition ${
                  errors.password ? "border-rose-500 bg-rose-50/20" : "border-slate-200 focus:border-[#8D0606]"
                }`}
                placeholder="Enter new password (min 6 characters)"
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }));
                  setErrors((f) => ({ ...f, password: undefined }));
                }}
              />
            </div>
            {errors.password ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <AlertCircle size={13} /> {errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Confirm Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="password"
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition ${
                  errors.confirmPassword ? "border-rose-500 bg-rose-50/20" : "border-slate-200 focus:border-[#8D0606]"
                }`}
                placeholder="Re-enter new password to confirm"
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }));
                  setErrors((f) => ({ ...f, confirmPassword: undefined }));
                }}
              />
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <AlertCircle size={13} /> {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          {message ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle size={14} /> <span>{message}</span>
            </p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-semibold text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
            >
              {busy ? <Loader variant="button" text="Saving..." /> : <span>Reset Password</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
