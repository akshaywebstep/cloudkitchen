import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ChefHat,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  X,
  Zap,
  Briefcase,
  UserCheck,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { forgotPasswordApi } from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';
import logoImg from '../assets/logo.jpg';

const ADMIN_REMEMBER_KEY_EMAIL = 'admin_remember_email';
const ADMIN_REMEMBER_KEY_PASS = 'admin_remember_pass';
const ADMIN_REMEMBER_KEY_FLAG = 'admin_remember_me';

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useApp();
  const { showLoading, hideLoading } = useLoading();

  const isRemembered = localStorage.getItem(ADMIN_REMEMBER_KEY_FLAG) === 'true';
  const savedEmail = isRemembered ? (localStorage.getItem(ADMIN_REMEMBER_KEY_EMAIL) || '') : '';
  const savedPass = isRemembered ? (localStorage.getItem(ADMIN_REMEMBER_KEY_PASS) || '') : '';

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState(savedPass);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(isRemembered || Boolean(savedEmail));
  const [selectedRole, setSelectedRole] = useState('admin');

  // Form validation errors state
  const [errors, setErrors] = useState({});

  // Forgot password modal state & errors
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [forgotErrors, setForgotErrors] = useState({});

  const demoRoles = [
    { id: 'admin', label: 'Super Admin', email: 'akshaywebstep@gmail.com', pass: '12345678', icon: Zap },
    { id: 'chef', label: 'Kitchen Manager', email: 'chef.robert@cloudkitchens.io', pass: '12345678', icon: UserCheck },
    { id: 'finance', label: 'Finance Lead', email: 'finance@cloudkitchens.io', pass: '12345678', icon: Briefcase },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setPassword(role.pass);
    setErrors({});
    toast.info(`Loaded credentials for ${role.label}`);
  };

  const scrollToFirstError = (errObj) => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`login-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors in the login form.');
      setTimeout(() => scrollToFirstError(newErrors), 100);
      return;
    }

    // Save or clear Remember Me
    if (rememberMe) {
      localStorage.setItem(ADMIN_REMEMBER_KEY_EMAIL, email.trim());
      localStorage.setItem(ADMIN_REMEMBER_KEY_PASS, password);
      localStorage.setItem(ADMIN_REMEMBER_KEY_FLAG, 'true');
    } else {
      localStorage.removeItem(ADMIN_REMEMBER_KEY_EMAIL);
      localStorage.removeItem(ADMIN_REMEMBER_KEY_PASS);
      localStorage.removeItem(ADMIN_REMEMBER_KEY_FLAG);
    }

    setErrors({});
    showLoading('Authenticating session with server...');

    try {
      const result = await login(email, password);
      hideLoading();

      if (result.success) {
        toast.success(result.message || 'Login successful! Welcome to Dashboard.');
        navigate('/admin');
      } else {
        const fieldErrors = extractFieldErrors(result);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors), 100);
        } else {
          setErrors({ email: result.message || 'Invalid credentials' });
        }
        toast.error(getErrorMessage(result, 'Login failed. Please check your credentials.'));
      }
    } catch (error) {
      hideLoading();
      toast.error('Failed to communicate with authentication server.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const newForgotErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!resetEmail || !resetEmail.trim()) {
      newForgotErrors.resetEmail = 'Account email address is required.';
    } else if (!emailRegex.test(resetEmail)) {
      newForgotErrors.resetEmail = 'Please enter a valid email address.';
    }

    if (Object.keys(newForgotErrors).length > 0) {
      setForgotErrors(newForgotErrors);
      toast.error('Please enter a valid email address for password reset.');
      return;
    }

    setForgotErrors({});
    showLoading('Sending password reset instructions...');

    try {
      const res = await forgotPasswordApi(resetEmail);
      hideLoading();

      if (res && res.status === true) {
        toast.success(res.message || `Password reset link sent to ${resetEmail}!`);
        const tokenMatch = res.data?.resetLink?.match(/token=([a-f0-9]+)/i);
        const token = tokenMatch ? tokenMatch[1] : res.data?.resetToken || res.data?.token || '';
        setIsForgotModalOpen(false);
        setResetEmail('');
        if (token) {
          navigate(`/admin/reset-password?token=${token}`);
        } else {
          navigate('/admin/reset-password');
        }
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setForgotErrors(fieldErrors);
        } else {
          setForgotErrors({ resetEmail: res?.message || 'Invalid user account.' });
        }
        toast.error(getErrorMessage(res, 'Failed to send reset request.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to communicate with authentication server.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      {/* Subtle Background Pattern & Glow Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none filter blur-xs scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80')`,
        }}
      />

      {/* Floating Soft Background Orbs */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-brand-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Plush White Light Theme Login Card */}
      <div className="relative z-10 w-full max-w-xl bg-white shadow-2xl rounded-3xl border border-slate-100 overflow-hidden p-8 sm:p-10 space-y-8 animate-fade-in">
        
        {/* Brand Crest & Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-3xl overflow-hidden shadow-xl ring-4 ring-[#8C0D0D]/20 transform hover:scale-105 transition-transform">
            <img src={logoImg} alt="Cloud Kitchen Logo" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-[11px] font-black text-brand-800 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-brand-800" /> Executive Portal 2026
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Cloud Kitchen Admin</h1>
            <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
              Multi-Hub Culinary Operations, SLA Analytics & Inventory Control
            </p>
          </div>
        </div>

      

        {/* Login Form with Field Validations */}
        <form onSubmit={handleLoginSubmit} noValidate className="space-y-5 text-xs font-semibold">
          {/* Email Field */}
          <div>
            <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-extrabold text-[11px]">
              Email / Username *
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                placeholder="akshaywebstep@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-slate-900 text-xs focus:outline-none font-medium transition-all ${
                  errors.email
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                    : 'border-slate-200 bg-slate-50 focus:border-brand-800 focus:bg-white focus:ring-2 focus:ring-brand-800/20'
                }`}
              />
              <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${errors.email ? 'text-rose-500' : 'text-slate-400'}`} />
            </div>
            {errors.email && (
              <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 uppercase tracking-wider font-extrabold text-[11px]">
                Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotErrors({});
                  setResetEmail(email || 'akshaywebstep@gmail.com');
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] font-extrabold text-brand-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-slate-900 text-xs focus:outline-none font-medium transition-all ${
                  errors.password
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                    : 'border-slate-200 bg-slate-50 focus:border-brand-800 focus:bg-white focus:ring-2 focus:ring-brand-800/20'
                }`}
              />
              <Lock className={`w-4 h-4 absolute left-3.5 top-3.5 ${errors.password ? 'text-rose-500' : 'text-slate-400'}`} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-bold">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const val = e.target.checked;
                  setRememberMe(val);
                  if (!val) {
                    localStorage.removeItem(ADMIN_REMEMBER_KEY_EMAIL);
                    localStorage.removeItem(ADMIN_REMEMBER_KEY_PASS);
                    localStorage.removeItem(ADMIN_REMEMBER_KEY_FLAG);
                  }
                }}
                className="w-4 h-4 rounded text-brand-800 focus:ring-brand-800 border-slate-300 bg-slate-50"
              />
              Remember this device for 30 days
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#8C0D0D] hover:bg-[#720909] text-white font-black text-sm shadow-xl shadow-[#8C0D0D]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 border border-[#720909] cursor-pointer"
          >
            <span>Sign In to Executive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted Session
          </span>
          <span>Cloud Kitchen Enterprise 2026</span>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-300" />
                    Reset Admin Password
                  </h3>
                  <p className="text-xs text-brand-200 mt-0.5">We will send a password reset link to your email</p>
                </div>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleForgotSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1 font-extrabold">
                    Account Email Address *
                  </label>
                  <input
                    id="login-resetEmail"
                    type="email"
                    placeholder="akshaywebstep@gmail.com"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (forgotErrors.resetEmail) setForgotErrors({});
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm font-medium transition-all ${
                      forgotErrors.resetEmail
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {forgotErrors.resetEmail && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      {forgotErrors.resetEmail}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
