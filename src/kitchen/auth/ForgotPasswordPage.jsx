import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { api, getApiErrorMessage } from "../../api";
import { Loader } from "../../components/ui/Loader";

export function ForgotPasswordPage({ onToast }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Request token, Step 2: Reset password
  const [form, setForm] = useState({
    username: "",
    token: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const refs = {
    username: useRef(null),
    token: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const updateForm = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: "" }));
  };

  // Validate Step 1 (Request Token)
  const validateStep1 = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = "Email or Phone number is required";
    }
    setErrors(newErrors);

    if (newErrors.username && refs.username.current) {
      refs.username.current.scrollIntoView({ behavior: "smooth", block: "center" });
      refs.username.current.focus();
      return false;
    }
    return true;
  };

  // Validate Step 2 (Reset Password)
  const validateStep2 = () => {
    const newErrors = {};
    if (!form.token.trim()) {
      newErrors.token = "Reset Token is required";
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
      const firstError = errorKeys[0];
      const targetRef = refs[firstError];
      if (targetRef && targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRef.current.focus();
      }
      return false;
    }

    return true;
  };

  // Request Reset Token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setBusy(true);
    setErrors({});
    try {
      const response = await api.forgotPassword(form.username.trim());
      const resetToken = response?.data?.resetToken || response?.resetToken || "";
      
      if (resetToken) {
        setForm((f) => ({ ...f, token: resetToken }));
        onToast?.({
          message: "Reset token received! Enter your new password below.",
          type: "success",
        });
      } else {
        onToast?.({
          message: "Password reset token requested. Enter your token below.",
          type: "info",
        });
      }
      setStep(2);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Unable to request token from backend. Proceeding to reset form for manual token entry.");
      onToast?.({ message: msg, type: "warning" });
      // Proceed to Step 2 so the user is never stuck
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setBusy(true);
    setErrors({});
    try {
      await api.resetPassword({
        token: form.token.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      onToast?.({
        message: "Password reset successful! You can now log in with your new password.",
        type: "success",
      });
      navigate("/kitchen/login");
    } catch (error) {
      const msg = getApiErrorMessage(error, "Password reset failed. Please check your reset token.");
      setErrors((prev) => ({ ...prev, api: msg }));
      onToast?.({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? "Forgot Password" : "Reset Password"}
      subtitle={
        step === 1
          ? "Enter your email or phone to receive a password reset token"
          : "Enter the reset token and choose a new secure password"
      }
      icon={step === 1 ? KeyRound : ShieldCheck}
    >
      {step === 1 ? (
        <form onSubmit={handleRequestToken} className="space-y-5" noValidate>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Email or Phone Number *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.username}
                type="text"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.username
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter your registered email or mobile number"
                value={form.username}
                onChange={updateForm("username")}
              />
            </div>
            {errors.username && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.username}
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
            disabled={busy}
            className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
          >
            {busy ? (
              <Loader variant="button" text="Requesting Token..." />
            ) : (
              <>
                <span>REQUEST RESET TOKEN</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="flex justify-between gap-2 pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-[#8D0606] hover:underline"
            >
              Already have a reset token? Skip to Reset Form &rarr;
            </button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#777] hover:text-[#191919]"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {/* Token field */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Reset Token *
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.token}
                type="text"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.token
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter reset token from email or server"
                value={form.token}
                onChange={updateForm("token")}
              />
            </div>
            {errors.token && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.token}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.password}
                type={showPassword ? "text" : "password"}
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-11 text-sm font-medium outline-none transition duration-200 ${
                  errors.password
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter new password (min 6 characters)"
                value={form.password}
                onChange={updateForm("password")}
              />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-[#999] hover:text-[#333]"
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.confirmPassword}
                type={showConfirmPassword ? "text" : "password"}
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-11 text-sm font-medium outline-none transition duration-200 ${
                  errors.confirmPassword
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Re-enter new password to confirm"
                value={form.confirmPassword}
                onChange={updateForm("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-[#999] hover:text-[#333]"
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
            disabled={busy}
            className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
          >
            {busy ? (
              <Loader variant="button" text="Resetting Password..." />
            ) : (
              <>
                <span>CONFIRM NEW PASSWORD</span>
                <CheckCircle size={18} />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-[#8D0606] hover:underline"
            >
              ← Back to Step 1 (Request Token)
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
