import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Phone, Lock, Building, ArrowRight, AlertCircle, UserPlus } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { api, getApiErrorMessage } from "../../../api";
import { createProfileFile } from "../../../utils/helpers";
import { Loader } from "../../ui/Loader";

export function RegisterPage({ onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    kitchenName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    contactFirstName: "",
    contactLastName: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Field Refs for auto-scroll on error
  const refs = {
    kitchenName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    contactFirstName: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const updateForm = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) {
      setErrors((err) => ({ ...err, [key]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.kitchenName.trim()) {
      newErrors.kitchenName = "Kitchen name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address (e.g. name@domain.com)";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?\d{8,15}$/.test(form.phone.trim().replace(/[\s-]/g, ""))) {
      newErrors.phone = "Enter a valid phone number (8-15 digits)";
    }

    if (!form.contactFirstName.trim()) {
      newErrors.contactFirstName = "Contact first name is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // Scroll to first error field
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const targetRef = refs[firstErrorKey];
      if (targetRef && targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRef.current.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      await api.register({
        kitchenName: form.kitchenName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        contactTitle: "MR",
        contactFirstName: form.contactFirstName.trim(),
        contactLastName: (form.contactLastName || "").trim() || "Owner",
        contactEmail: form.email.trim(),
        contactPhone: form.phone.trim(),
        profilePicture: createProfileFile("desktop-profile.txt"),
      });

      onToast?.({
        message: "Registration complete! Please log in with your account credentials.",
        type: "success",
      });
      navigate("/login");
    } catch (error) {
      const msg = getApiErrorMessage(error, "Registration failed. Email or phone may already be registered.");
      setErrors((prev) => ({ ...prev, api: msg }));
      onToast?.({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create Kitchen Account"
      subtitle="Fill in your kitchen details to start managing branches & menus"
      icon={UserPlus}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Kitchen Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
            Kitchen Name *
          </label>
          <div className="relative">
            <Building className="absolute left-4 top-3.5 text-[#999]" size={19} />
            <input
              ref={refs.kitchenName}
              type="text"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                errors.kitchenName
                  ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              }`}
              placeholder="Enter kitchen or brand name (e.g. Royal Spice Kitchen)"
              value={form.kitchenName}
              onChange={updateForm("kitchenName")}
            />
          </div>
          {errors.kitchenName && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
              <AlertCircle size={13} className="shrink-0" /> {errors.kitchenName}
            </p>
          )}
        </div>

        {/* Email & Phone grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.email}
                type="email"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.email
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter official email address (e.g. kitchen@example.com)"
                value={form.email}
                onChange={updateForm("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.phone}
                type="tel"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.phone
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                value={form.phone}
                onChange={updateForm("phone")}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Contact Names */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                ref={refs.contactFirstName}
                type="text"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm font-medium outline-none transition duration-200 ${
                  errors.contactFirstName
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e2e2] text-[#191919] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
                placeholder="Enter first name (e.g. John)"
                value={form.contactFirstName}
                onChange={updateForm("contactFirstName")}
              />
            </div>
            {errors.contactFirstName && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> {errors.contactFirstName}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-[#999]" size={19} />
              <input
                type="text"
                className="h-12 w-full rounded-xl border border-[#e2e2e2] bg-white pl-12 pr-4 text-sm font-medium text-[#191919] outline-none transition duration-200 focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                placeholder="Enter last name (e.g. Doe)"
                value={form.contactLastName}
                onChange={updateForm("contactLastName")}
              />
            </div>
          </div>
        </div>

        {/* Passwords grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#444]">
              Password *
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
                placeholder="Create a password (min 6 characters)"
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
              Confirm Password *
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
                placeholder="Re-enter password to confirm"
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
        </div>

        {/* API Error Alert */}
        {errors.api && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            {errors.api}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex py-3 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
        >
          {busy ? (
            <Loader variant="button" text="Registering Kitchen..." />
          ) : (
            <>
              <span>CREATE ACCOUNT</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Switch to Login link */}
        <div className="pt-3 text-center text-xs font-medium text-[#777]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#8D0606] hover:underline">
            LOG IN
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
