import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import { Users, Search, Mail, ShieldCheck, ShoppingBag, DollarSign, UserPlus, X, Check, Calendar, Award, Send, AlertCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { mockCustomers, mockOrders } from '../data/mockData';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const Customer = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const [customers, setCustomers] = useState(mockCustomers);
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Add Customer Form state & errors
  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    vipStatus: 'Regular',
    avatar: '',
  });
  const [custErrors, setCustErrors] = useState({});

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCust((prev) => ({ ...prev, avatar: reader.result }));
        toast.success('Customer avatar selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setNewCust((prev) => ({ ...prev, avatar: '' }));
  };

  const vipTierOptions = [
    { value: 'Regular', label: 'Regular Member' },
    { value: 'Silver VIP', label: 'Silver VIP' },
    { value: 'Gold VIP', label: 'Gold VIP' },
    { value: 'Platinum VIP', label: 'Platinum VIP' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': {
        borderColor: theme === 'dark' ? '#475569' : '#cbd5e1',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 50,
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

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.vipStatus.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const scrollToFirstCustError = (errObj) => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`cust-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newCust.name || !newCust.name.trim()) {
      newErrors.name = 'Full name is required.';
    }
    if (!newCust.email || !newCust.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(newCust.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setCustErrors(newErrors);
      toast.error('Please fix highlighted errors in the form.');
      setTimeout(() => scrollToFirstCustError(newErrors), 100);
      return;
    }

    setCustErrors({});
    const created = {
      id: Date.now(),
      name: newCust.name,
      email: newCust.email,
      ordersCount: 0,
      totalSpent: '$0.00',
      vipStatus: newCust.vipStatus,
      avatar: newCust.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      lastOrder: 'Just now',
      status: 'Active',
    };

    setCustomers([created, ...customers]);
    toast.success(`Customer "${newCust.name}" added to directory successfully!`);
    setIsAddModalOpen(false);
    setNewCust({ name: '', email: '', vipStatus: 'Regular', avatar: '' });
    setCustErrors({});
  };

  const handleVipTierChange = (newTier) => {
    if (!selectedProfile) return;
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedProfile.id ? { ...c, vipStatus: newTier } : c))
    );
    setSelectedProfile({ ...selectedProfile, vipStatus: newTier });
    toast.success(`${selectedProfile.name}'s tier upgraded to ${newTier}!`);
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Diner Relationship Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                1,420 Active Diners
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Customer Insights & Loyalty Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Manage food loyalty members, track lifetime order value, VIP tier upgrades, and customer feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Diner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by customer name, email, VIP tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-brand-800 text-slate-900 dark:text-slate-100 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 hidden sm:inline">
          Showing {filteredCustomers.length} Customer Profiles
        </span>
      </div>

      {/* Customer Cards Grid OR Empty State */}
      {filteredCustomers.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCustomers.map((cust) => (
              <div
                key={cust.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={cust.avatar}
                        alt={cust.name}
                        className="w-14 h-14 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate">{cust.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          {cust.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        cust.vipStatus.includes('Platinum')
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : cust.vipStatus.includes('Gold')
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : cust.vipStatus.includes('Silver')
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cust.vipStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Orders
                      </span>
                      <span className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                        {cust.ordersCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Lifetime Value
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        {cust.totalSpent}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[11px]">Last ordered: {cust.lastOrder}</span>
                  <button
                    onClick={() => setSelectedProfile(cust)}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-800 text-brand-800 dark:text-rose-400 hover:text-white font-extrabold text-xs transition-colors"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        <EmptyState
          title="No data in current status"
          description="We couldn't find any customer profiles matching your search query or selected VIP filter."
          onReset={() => setSearch('')}
        />
      )}

      {/* 1. ADD NEW CUSTOMER MODAL */}
      {isAddModalOpen && !selectedProfile &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <UserPlus className="w-5 h-5 text-amber-300" />
                    Add New Customer Profile
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">Register loyalty foodie member</p>
                </div>
                <button
                  onClick={() => { setIsAddModalOpen(false); setCustErrors({}); }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} noValidate className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-xs">
                    Full Name *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    placeholder="Enter full name (e.g. Alexandra Smith)..."
                    value={newCust.name}
                    onChange={(e) => {
                      setNewCust({ ...newCust, name: e.target.value });
                      if (custErrors.name) setCustErrors((prev) => ({ ...prev, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      custErrors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  />
                  {custErrors.name && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {custErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-xs">
                    Email Address *
                  </label>
                  <input
                    id="cust-email"
                    type="email"
                    placeholder="Enter customer email (e.g. alexandra@example.com)..."
                    value={newCust.email}
                    onChange={(e) => {
                      setNewCust({ ...newCust, email: e.target.value });
                      if (custErrors.email) setCustErrors((prev) => ({ ...prev, email: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      custErrors.email
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  />
                  {custErrors.email && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {custErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-xs">
                    Loyalty Tier
                  </label>
                  <Select
                    options={vipTierOptions}
                    value={vipTierOptions.find((opt) => opt.value === newCust.vipStatus)}
                    onChange={(opt) => setNewCust({ ...newCust, vipStatus: opt ? opt.value : 'Regular' })}
                    styles={customSelectStyles}
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-xs">
                    Customer Avatar (Optional)
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                        {newCust.avatar ? (
                          <img src={newCust.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs">
                            <UploadCloud className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                            <span>Upload Avatar</span>
                            <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                          </label>
                          {newCust.avatar && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Select local image or enter avatar URL below
                        </p>
                      </div>
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste avatar direct URL (e.g. https://...)"
                      value={typeof newCust.avatar === 'string' && !newCust.avatar.startsWith('data:image/') ? newCust.avatar : ''}
                      onChange={(e) => setNewCust({ ...newCust, avatar: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-brand-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setCustErrors({}); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand"
                  >
                    Create Profile
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 2. CUSTOMER PROFILE VIEW MODAL */}
      {selectedProfile &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 relative">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <img
                    src={selectedProfile.avatar}
                    alt={selectedProfile.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/20 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black">{selectedProfile.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white uppercase tracking-wider">
                        {selectedProfile.vipStatus}
                      </span>
                    </div>
                    <p className="text-xs text-brand-200 mt-0.5">{selectedProfile.email}</p>
                    <p className="text-[11px] text-brand-300 mt-1">Status: Active Loyalty Member</p>
                  </div>
                </div>
              </div>

              {/* Profile Body */}
              <div className="p-6 space-y-5">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Completed Orders</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{selectedProfile.ordersCount} Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Lifetime Spent</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{selectedProfile.totalSpent}</span>
                  </div>
                </div>

                {/* VIP Upgrade Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Update Member Loyalty Tier
                  </label>
                  <div className="flex gap-2">
                    {['Regular', 'Silver VIP', 'Gold VIP', 'Platinum VIP'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => handleVipTierChange(tier)}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          selectedProfile.vipStatus === tier
                            ? 'bg-brand-800 text-white border-brand-800 shadow'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Order History List */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Recent Order History
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {mockOrders.slice(0, 3).map((ord) => (
                      <div key={ord.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-brand-800 dark:text-rose-400">{ord.id}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{ord.items}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 dark:text-white block">{ord.total}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{ord.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      toast.success(`Special $10 voucher sent to ${selectedProfile.name}!`);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Discount Voucher
                  </button>
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs hover:bg-slate-800"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
