import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChefHat, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { resetPasswordApi } from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('12345678');
  const [confirmPassword, setConfirmPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!token || !token.trim()) {
      newErrors.token = 'Reset token is required.';
    }

    if (!password) {
      newErrors.password = 'New password is required.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors.');
      return;
    }

    setErrors({});
    showLoading('Updating your admin password...');

    try {
      const res = await resetPasswordApi(token, password, confirmPassword);
      hideLoading();

      if (res && res.status === true) {
        setIsSuccess(true);
        toast.success(res.message || 'Password reset successful! You can now log in.');
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setErrors({ token: res?.message || 'Invalid or expired token.' });
        }
        toast.error(getErrorMessage(res, 'Password reset failed. Token may be invalid or expired.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to communicate with authentication server.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-brand-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl bg-white shadow-2xl rounded-3xl border border-slate-100 overflow-hidden p-8 sm:p-10 space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8C0D0D] via-[#a81010] to-[#590707] shadow-xl shadow-brand-900/20 border border-brand-800/20 flex items-center justify-center">
            <ChefHat className="w-9 h-9 text-amber-300 drop-shadow-md" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-[11px] font-black text-brand-800 uppercase tracking-widest">
              <KeyRound className="w-3.5 h-3.5 text-brand-800" /> Security Management
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Reset Your Password</h1>
            <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
              Enter your reset token and set a new password for your account
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-emerald-900">Password Reset Successful!</h3>
            <p className="text-xs text-emerald-700 font-medium">
              Your password has been updated. Redirecting you to the login screen...
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="mt-2 px-6 py-2.5 bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:bg-emerald-800 transition-all"
            >
              Back to Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} noValidate className="space-y-5 text-xs font-semibold">
            {/* Token Field */}
            <div>
              <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-extrabold text-[11px]">
                Reset Token *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: null }));
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border text-slate-900 text-xs focus:outline-none font-mono font-medium transition-all ${
                    errors.token
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                      : 'border-slate-200 bg-slate-50 focus:border-brand-800 focus:bg-white'
                  }`}
                />
              </div>
              {errors.token && (
                <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  {errors.token}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-extrabold text-[11px]">
                New Password *
              </label>
              <div className="relative">
                <input
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
                      : 'border-slate-200 bg-slate-50 focus:border-brand-800 focus:bg-white'
                  }`}
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-slate-700 uppercase tracking-wider mb-1.5 font-extrabold text-[11px]">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-slate-900 text-xs focus:outline-none font-medium transition-all ${
                    errors.confirmPassword
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                      : 'border-slate-200 bg-slate-50 focus:border-brand-800 focus:bg-white'
                  }`}
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-[#8C0D0D] hover:bg-[#720909] text-white font-black text-sm shadow-xl shadow-[#8C0D0D]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 border border-[#720909] cursor-pointer"
            >
              <span>Submit Password Reset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <button onClick={() => navigate('/admin/login')} className="text-brand-800 font-extrabold hover:underline">
            ← Back to Sign In
          </button>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};
