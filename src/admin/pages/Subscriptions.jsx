import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Sparkles,
  Search,
  Plus,
  Pencil,
  Check,
  X,
  Building2,
  Users,
  DollarSign,
  Gift,
  Percent,
  Clock,
  ShieldCheck,
  AlertCircle,
  Tag,
  Layers,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { useTheme } from '../context/ThemeContext';
import {
  getSubscriptionsApi,
  getSubscriptionByIdApi,
  createSubscriptionApi,
  updateSubscriptionApi
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

export const Subscriptions = () => {
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { theme } = useTheme();

  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    price: '',
    annualPrice: '',
    discountPct: 0,
    freeTrialDays: 7,
    maxBranches: 1,
    maxUsers: 3,
    features: [
      { type: 'INCLUDE', feature: 'Basic Dashboard' },
      { type: 'INCLUDE', feature: 'Order Management' },
      { type: 'EXCLUDE', feature: 'Advanced Analytics' },
    ],
  });

  // Feature input temp state
  const [tempFeatureText, setTempFeatureText] = useState('');
  const [tempFeatureType, setTempFeatureType] = useState('INCLUDE');

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, itemsPerPage, search]);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    showLoading('Fetching subscription plans...');
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search?.trim()) params.search = search.trim();

      const res = await getSubscriptionsApi(params);
      if (res && res.status && Array.isArray(res.data)) {
        setSubscriptions(res.data);
        if (res.meta) {
          const total = res.meta.total ?? res.meta.count ?? res.data.length;
          const pages = res.meta.totalPages ?? Math.max(1, Math.ceil(total / itemsPerPage));
          setTotalItems(total);
          setTotalPages(pages);
        } else {
          setTotalItems(res.data.length);
          setTotalPages(Math.max(1, Math.ceil(res.data.length / itemsPerPage)));
        }
      } else {
        setSubscriptions([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setSubscriptions([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      title: '',
      price: '',
      annualPrice: '',
      discountPct: 20,
      freeTrialDays: 7,
      maxBranches: 1,
      maxUsers: 3,
      features: [
        { type: 'INCLUDE', feature: 'Basic Dashboard' },
        { type: 'INCLUDE', feature: 'Order Management' },
        { type: 'EXCLUDE', feature: 'Advanced Analytics' },
      ],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (plan) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name || '',
      title: plan.title || '',
      price: plan.price || '',
      annualPrice: plan.annualPrice || '',
      discountPct: plan.discountPct || 0,
      freeTrialDays: plan.freeTrialDays || 0,
      maxBranches: plan.maxBranches || 1,
      maxUsers: plan.maxUsers || 1,
      features: Array.isArray(plan.features) ? plan.features : [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!tempFeatureText.trim()) {
      toast.error('Enter feature description text.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { type: tempFeatureType, feature: tempFeatureText.trim() },
      ],
    }));
    setTempFeatureText('');
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Plan short key (name) is required.';
    }
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Display title is required.';
    }
    const numPrice = parseFloat(formData.price);
    if (!formData.price || isNaN(numPrice) || numPrice < 0) {
      newErrors.price = 'Valid monthly price is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors in the subscription form.');
      return;
    }

    setErrors({});
    showLoading(editingId ? 'Updating subscription plan...' : 'Creating new subscription plan...');

    const payload = {
      name: formData.name.trim(),
      title: formData.title.trim(),
      price: numPrice,
      annualPrice: parseFloat(formData.annualPrice) || numPrice * 10,
      discountPct: Number(formData.discountPct) || 0,
      freeTrialDays: Number(formData.freeTrialDays) || 0,
      maxBranches: Number(formData.maxBranches) || 1,
      maxUsers: Number(formData.maxUsers) || 1,
      features: formData.features,
    };

    try {
      if (editingId) {
        const res = await updateSubscriptionApi(editingId, payload);
        hideLoading();
        if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
          toast.success(res.message || `Plan "${formData.title}" updated successfully!`);
          fetchSubscriptions();
          setIsModalOpen(false);
        } else {
          const fieldErrors = extractFieldErrors(res);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
          toast.error(getErrorMessage(res, 'Failed to update subscription plan.'));
        }
      } else {
        const res = await createSubscriptionApi(payload);
        hideLoading();
        if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
          toast.success(res.message || `Plan "${formData.title}" created successfully!`);
          fetchSubscriptions();
          setIsModalOpen(false);
        } else {
          const fieldErrors = extractFieldErrors(res);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
          toast.error(getErrorMessage(res, 'Failed to create subscription plan.'));
        }
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to save subscription plan.');
    }
  };

  const featureTypeOptions = [
    { value: 'INCLUDE', label: 'INCLUDE (Included Feature)' },
    { value: 'EXCLUDE', label: 'EXCLUDE (Not Available)' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.2)' : 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark' ? '#334155' : '#f8fafc'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
    }),
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                SaaS Subscription Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {totalItems} Plans Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Subscription & Tier Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Configure cloud kitchen subscription tiers, pricing models, feature allocations, and free trial periods.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Monthly / Annual Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#8C0D0D] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-[#8C0D0D] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black">
                  -20%
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  title: '',
                  price: '',
                  annualPrice: '',
                  discountPct: 20,
                  freeTrialDays: 7,
                  maxBranches: 1,
                  maxUsers: 3,
                  features: [
                    { type: 'INCLUDE', feature: 'Basic Dashboard' },
                    { type: 'INCLUDE', feature: 'Order Management' },
                  ],
                });
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] hover:bg-rose-900 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#8C0D0D] dark:text-rose-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Active Subscription Tiers</h2>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search plan title or features..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Subscription Cards Grid */}
      {subscriptions.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {subscriptions.map((plan) => {
              const displayPrice =
                billingCycle === 'annual'
                  ? plan.annualPrice
                    ? Math.round(plan.annualPrice / 12)
                    : Math.round((plan.price * 12 * (100 - (plan.discountPct || 0))) / 100 / 12)
                  : plan.price;

              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-300 text-[11px] font-extrabold tracking-wider uppercase border border-rose-200 dark:border-rose-800/60 inline-block mb-1.5">
                          {plan.name}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {plan.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-sm"
                          title="Edit Plan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/80 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                          ₹{displayPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ month</span>
                      </div>

                      {billingCycle === 'annual' && plan.annualPrice && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" /> Billed annually at ₹{plan.annualPrice}/yr (Save {plan.discountPct || 20}%)
                        </p>
                      )}

                      {plan.freeTrialDays > 0 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1 pt-1">
                          <Clock className="w-3.5 h-3.5" /> {plan.freeTrialDays} Days Free Trial Included
                        </p>
                      )}
                    </div>

                    {/* Quotas & Capacity */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Outlets</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{plan.maxBranches} Branch{plan.maxBranches > 1 ? 'es' : ''}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">User Seats</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{plan.maxUsers} Admin User{plan.maxUsers > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                        Included Features
                      </span>
                      <ul className="space-y-2 text-xs">
                        {Array.isArray(plan.features) &&
                          plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              {feat.type === 'INCLUDE' ? (
                                <span className="p-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span
                                className={`font-semibold ${
                                  feat.type === 'INCLUDE'
                                    ? 'text-slate-700 dark:text-slate-200'
                                    : 'text-slate-400 dark:text-slate-500 line-through'
                                }`}
                              >
                                {feat.feature}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  {/* Plan Footer Button */}
                  <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-[#8C0D0D] dark:hover:bg-rose-600 text-slate-800 dark:text-slate-100 hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Configure Plan Specs</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onLimitChange={(newLimit) => {
              setItemsPerPage(newLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <EmptyState
          title="No subscription plans found"
          description="No subscription tiers created yet matching your search filter."
          onReset={() => {
            setSearch('');
            setCurrentPage(1);
          }}
        />
      )}

      {/* CREATE / EDIT SUBSCRIPTION MODAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xl w-full overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-200" />
                    {editingId ? 'Edit Subscription Tier' : 'Create New Subscription Tier'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-1 font-medium">
                    Configure pricing, quotas, features, and free trial days
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 text-xs font-semibold overflow-y-auto">
                {(errors.general || errors.form) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">{errors.general || errors.form}</div>
                  </div>
                )}
                {/* Short Key + Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Short Plan Key (name) *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter short key (e.g. starter_monthly)..."
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                        errors.name
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Display Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter display title (e.g. Starter Pro Plan)..."
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                        errors.title
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Monthly & Annual Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Monthly Price (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="Enter monthly price (e.g. 499)..."
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                        errors.price
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Annual Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter annual price (e.g. 4790)..."
                      value={formData.annualPrice}
                      onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-[#8C0D0D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter discount % (e.g. 20)..."
                      value={formData.discountPct}
                      onChange={(e) => setFormData({ ...formData, discountPct: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-[#8C0D0D]"
                    />
                  </div>
                </div>

                {/* Quotas & Trial */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      placeholder="Trial days (e.g. 7)..."
                      value={formData.freeTrialDays}
                      onChange={(e) => setFormData({ ...formData, freeTrialDays: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-[#8C0D0D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Max Branches
                    </label>
                    <input
                      type="number"
                      placeholder="Max branches (e.g. 1)..."
                      value={formData.maxBranches}
                      onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-[#8C0D0D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                      Max Admin Users
                    </label>
                    <input
                      type="number"
                      placeholder="Max users (e.g. 3)..."
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-[#8C0D0D]"
                    />
                  </div>
                </div>

                {/* Features List Manager */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold">
                    Plan Feature Allocations
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="w-full sm:w-48">
                      <Select
                        options={featureTypeOptions}
                        value={featureTypeOptions.find((opt) => opt.value === tempFeatureType)}
                        onChange={(opt) => setTempFeatureType(opt ? opt.value : 'INCLUDE')}
                        styles={customSelectStyles}
                        isSearchable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Enter feature description (e.g. Realtime Kitchen Analytics)..."
                      value={tempFeatureText}
                      onChange={(e) => setTempFeatureText(e.target.value)}
                      className="flex-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />

                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Feature
                    </button>
                  </div>

                  {/* List of features */}
                  <div className="space-y-1.5 pt-2">
                    {formData.features.map((feat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              feat.type === 'INCLUDE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {feat.type}
                          </span>
                          <span className={feat.type === 'EXCLUDE' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                            {feat.feature}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs shadow-brand hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {editingId ? 'Save Changes' : 'Create Subscription Plan'}
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
