import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, LogIn, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { getApiErrorMessage } from "../../api";
import { Loader } from "../../components/ui/Loader";

const REMEMBER_KEY_USER = "cloud_kitchen_remember_username";
const REMEMBER_KEY_PASS = "cloud_kitchen_remember_password";
const REMEMBER_KEY_FLAG = "cloud_kitchen_remember_me";

export function LoginPage({ onLogin, onToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const justSubscribed = location.state?.justSubscribed;

  const isRemembered = localStorage.getItem(REMEMBER_KEY_FLAG) === "true";
  const savedUser = isRemembered ? (localStorage.getItem(REMEMBER_KEY_USER) || "") : "";
  const savedPass = isRemembered ? (localStorage.getItem(REMEMBER_KEY_PASS) || "") : "";

  useEffect(() => {
    try {
      const containers = document.querySelectorAll(".razorpay-container, iframe[name*='razorpay'], div[class*='razorpay']");
      containers.forEach((el) => el.remove());
      document.body.style.overflow = "";
      document.body.classList.remove("razorpay-open");
    } catch (e) {
      console.warn("Razorpay cleanup on login:", e);
    }
  }, []);

  const [form, setForm] = useState({
    username: location.state?.email || savedUser || "",
    password: savedPass || "",
  });
  const [rememberMe, setRememberMe] = useState(isRemembered || Boolean(savedUser));
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
    if (!validate()) {
      return;
    }

    // Save remember me state immediately
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY_USER, form.username.trim());
      localStorage.setItem(REMEMBER_KEY_PASS, form.password);
      localStorage.setItem(REMEMBER_KEY_FLAG, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY_USER);
      localStorage.removeItem(REMEMBER_KEY_PASS);
      localStorage.removeItem(REMEMBER_KEY_FLAG);
    }

    setBusy(true);
    try {
      await onLogin(form);
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
    console.log("[LoginPage] Forgot Password clicked -> Navigating to /kitchen/forgot-password");
    navigate("/kitchen/forgot-password");
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to manage orders, inventory & branches"
      icon={LogIn}
    >
      {justSubscribed && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>Subscription Activated (14-Day Free Trial)</span>
          </div>
          <p className="mt-1 text-emerald-700 font-medium text-[11.5px] leading-relaxed">
            Your plan has been activated! Log in now with your credentials to complete your Kitchen Onboarding.
          </p>
        </div>
      )}

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
              placeholder="Enter your registered email or phone number"
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
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#444]">
            Password *
          </label>
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

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => {
                const val = e.target.checked;
                setRememberMe(val);
                if (!val) {
                  localStorage.removeItem(REMEMBER_KEY_USER);
                  localStorage.removeItem(REMEMBER_KEY_PASS);
                  localStorage.removeItem(REMEMBER_KEY_FLAG);
                }
              }}
              className="size-4 rounded border-slate-300 text-[#8D0606] accent-[#8D0606] focus:ring-[#8D0606]/20 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={handleForgotClick}
            className="text-xs font-semibold text-[#8D0606] hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* API error alert banner if present */}
        {errors.api && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errors.api}</span>
            </div>
            {errors.api.toLowerCase().includes("subscription") && (
              <div className="pt-1">
                <Link
                  to="/kitchen/subscription"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#8D0606] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#7A0505] transition"
                >
                  <span>Choose a Subscription Plan</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={busy}
          className="flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
        >
          {busy ? (
            <Loader variant="button" text="Checking Subscription & Logging in..." />
          ) : (
            <>
              <span>LOG IN TO KITCHEN</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Switch to Subscription / Add Kitchen */}
        <div className="pt-2">
          <div className="rounded-2xl border border-rose-100 bg-[#FAF8F6] p-4 text-center space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles size={14} className="text-[#8D0606]" />
              <span>Don't have a kitchen registered yet?</span>
            </div>
            <p className="text-[11px] text-[#7A6A66]">
              Choose a subscription tier, register your brand, and launch your kitchen dashboard.
            </p>
            <Link
              to="/kitchen/subscription"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#8D0606] text-xs font-bold text-white shadow-xs hover:bg-[#7A0505] active:scale-95 transition"
            >
              <Plus size={15} />
              <span>Add / Register New Kitchen</span>
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
