import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, LogIn } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { getApiErrorMessage } from "../../../api";
import { Loader } from "../../ui/Loader";

export function LoginPage({ onLogin, onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = "Email or Phone number is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);

    if (newErrors.username && usernameRef.current) {
      usernameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      usernameRef.current.focus();
      return false;
    }
    if (newErrors.password && passwordRef.current) {
      passwordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      passwordRef.current.focus();
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("[LoginPage] Submitting login with:", form.username);
    if (!validate()) {
      console.warn("[LoginPage] Validation failed:", errors);
      return;
    }

    setBusy(true);
    try {
      await onLogin(form);
      console.log("[LoginPage] Login success");
      onToast?.({ message: "Login successful! Welcome back.", type: "success" });
    } catch (error) {
      console.error("[LoginPage] Login error:", error);
      const msg = getApiErrorMessage(error, "Invalid login credentials. Please check and try again.");
      setErrors((prev) => ({ ...prev, api: msg }));
      onToast?.({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleForgotClick = (e) => {
    e.preventDefault();
    console.log("[LoginPage] Forgot Password clicked -> Navigating to /forgot-password");
    navigate("/forgot-password");
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to manage orders, inventory & branches"
      icon={LogIn}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Username / Email field */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#444]">
            Email or Phone Number *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-[#999]" size={19} />
            <input
              ref={usernameRef}
              type="text"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                errors.username
                  ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              }`}
              placeholder="demo@gmail.com or 9876543210"
              value={form.username}
              onChange={(e) => {
                setForm((f) => ({ ...f, username: e.target.value }));
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

        {/* Password field */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#444]">
              Password *
            </label>
            <button
              type="button"
              onClick={handleForgotClick}
              className="text-xs font-semibold text-[#8D0606] hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-[#999]" size={19} />
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-12 text-sm font-medium outline-none transition duration-200 ${
                errors.password
                  ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              }`}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => {
                setForm((f) => ({ ...f, password: e.target.value }));
                if (errors.password) setErrors((err) => ({ ...err, password: "" }));
              }}
            />
            <button
              type="button"
              className="absolute right-4 top-3.5 text-[#999] hover:text-[#333]"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
              <AlertCircle size={13} className="shrink-0" /> {errors.password}
            </p>
          )}
        </div>

        {/* API error alert banner if present */}
        {errors.api && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            {errors.api}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={busy}
          className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
        >
          {busy ? (
            <Loader variant="button" text="Logging in..." />
          ) : (
            <>
              <span>LOG IN</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Switch to Register link */}
        <div className="pt-4 text-center text-xs font-medium text-[#777]">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-[#8D0606] hover:underline">
            Create an Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
