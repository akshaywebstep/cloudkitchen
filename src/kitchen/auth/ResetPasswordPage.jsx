import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { api, getApiErrorMessage } from "../../api";
import { Loader } from "../../components/ui/Loader";

export function ResetPasswordPage({ onToast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read ?token= strictly from the URL query parameter
  const tokenFromUrl = searchParams.get("token") || "";

  const [form, setForm] = useState({
    token: tokenFromUrl,
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get("token");
    if (qToken) {
      setForm((prev) => ({ ...prev, token: qToken }));
    }
  }, [searchParams]);

  const refs = {
    token: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const updateForm = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.token || !form.token.trim()) {
      newErrors.token = "Reset token is missing. Please click the valid link from your email.";
    }
    if (!form.password) {
      newErrors.password = "New password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const first = errorKeys[0];
      if (refs[first]?.current) {
        refs[first].current.scrollIntoView({ behavior: "smooth", block: "center" });
        refs[first].current.focus();
      }
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setErrors({});

    try {
      const response = await api.resetPassword({
        token: form.token.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setIsSuccess(true);
      onToast?.({
        message: response?.message || "Password reset successful! You can now log in.",
        type: "success",
      });

      setTimeout(() => {
        navigate("/kitchen/login");
      }, 2000);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Password reset failed. Token may be invalid or expired.");
      setErrors((prev) => ({ ...prev, api: msg }));
      onToast?.({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter a new secure password for your account"
      icon={ShieldCheck}
    >
      {isSuccess ? (
        <div className="space-y-5 text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Password Changed Successfully!</h3>
            <p className="text-xs text-slate-500 font-medium">
              Your password has been updated. Redirecting to login page...
            </p>
          </div>
          <Link
            to="/kitchen/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#8D0606] text-white text-xs font-bold hover:bg-[#720505] transition"
          >
            Go to Login Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {/* Token notice or manual entry if missing from URL */}
          {form.token ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Reset Token Detected from URL</span>
              </div>
              <p className="text-emerald-700 font-medium text-[11px] truncate" title={form.token}>
                Token: <span className="font-mono text-[10.5px]">{form.token.slice(0, 16)}...{form.token.slice(-8)}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>No Token Found in URL</span>
              </div>
              <p className="text-amber-700 text-[11px]">
                Please open the reset link received in your email (e.g. <code>/reset-password?token=...</code>) or paste your token below:
              </p>
              <div className="relative mt-2">
                <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={17} />
                <input
                  ref={refs.token}
                  type="text"
                  placeholder="Paste your reset token here..."
                  value={form.token}
                  onChange={updateForm("token")}
                  className={`w-full h-10 rounded-lg border bg-white pl-10 pr-3 text-xs font-mono outline-none ${
                    errors.token ? "border-rose-500 bg-rose-50" : "border-slate-300 focus:border-[#8D0606]"
                  }`}
                />
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                ref={refs.password}
                type={showPassword ? "text" : "password"}
                className={`h-12 w-full rounded-xl border bg-white dark:bg-slate-900 pl-12 pr-11 text-sm font-medium outline-none transition duration-200 ${
                  errors.password
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter new password (min 6 characters)"
                value={form.password}
                onChange={updateForm("password")}
              />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                ref={refs.confirmPassword}
                type={showConfirmPassword ? "text" : "password"}
                className={`h-12 w-full rounded-xl border bg-white dark:bg-slate-900 pl-12 pr-11 text-sm font-medium outline-none transition duration-200 ${
                  errors.confirmPassword
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Re-enter new password to confirm"
                value={form.confirmPassword}
                onChange={updateForm("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {errors.api && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {errors.api}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !form.token}
            className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60 cursor-pointer"
          >
            {busy ? (
              <Loader variant="button" text="Resetting Password..." />
            ) : (
              <>
                <span>RESET PASSWORD</span>
                <CheckCircle2 size={18} />
              </>
            )}
          </button>

          <div className="flex justify-between items-center gap-2 pt-2 text-center">
            <Link
              to="/kitchen/forgot-password"
              className="text-xs font-semibold text-[#8D0606] hover:underline"
            >
              Request a new link
            </Link>
            <Link
              to="/kitchen/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={15} /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
