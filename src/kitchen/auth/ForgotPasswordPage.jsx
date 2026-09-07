import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { api, getApiErrorMessage } from "../../api";
import { Loader } from "../../components/ui/Loader";

export function ForgotPasswordPage({ onToast }) {
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const usernameRef = useRef(null);

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = "Email or Phone number is required";
    }
    setErrors(newErrors);

    if (newErrors.username && usernameRef.current) {
      usernameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      usernameRef.current.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setErrors({});

    try {
      const response = await api.forgotPassword(username.trim());
      // Notice: We do NOT take the token directly from the response!
      // The token must come strictly from the reset link sent to the user's email.
      const email = response?.data?.email || username.trim();
      setSentEmail(email);
      setIsSubmitted(true);

      onToast?.({
        message: response?.message || `Password reset link sent to ${email}.`,
        type: "success",
      });
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to send password reset link.");
      setErrors({ username: msg, api: msg });
      onToast?.({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle={
        isSubmitted
          ? "Check your email for the password reset link"
          : "Enter your email or phone to receive a password reset link"
      }
      icon={KeyRound}
    >
      {isSubmitted ? (
        <div className="space-y-5 text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Link Sent!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
              We have sent a password reset link to <strong className="text-slate-900 dark:text-white">{sentEmail}</strong>.
              Please check your inbox (and spam folder) and click the link to reset your password.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Next Steps:</span>
            <p className="text-[11.5px] leading-relaxed">
              1. Open your email inbox and click on the password reset link.
              <br />
              2. The link will take you to <code>/reset-password?token=...</code> to set a new password.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Link
              to="/kitchen/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#8D0606] text-white text-xs font-bold hover:bg-[#720505] transition"
            >
              Back to Login
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setUsername("");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Send to another email
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email or Phone Number *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                ref={usernameRef}
                type="text"
                className={`h-12 w-full rounded-xl border bg-white dark:bg-slate-900 pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.username
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter your registered email or mobile number"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((err) => ({ ...err, username: "" }));
                }}
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
            className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60 cursor-pointer"
          >
            {busy ? (
              <Loader variant="button" text="Sending Reset Link..." />
            ) : (
              <>
                <span>SEND RESET LINK</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="flex justify-between items-center gap-2 pt-2 text-center">
            <Link
              to="/kitchen/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
            <Link
              to="/reset-password"
              className="text-xs font-semibold text-[#8D0606] hover:underline"
            >
              Have a token? Reset here &rarr;
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
