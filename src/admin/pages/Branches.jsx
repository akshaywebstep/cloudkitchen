import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  GitBranch,
  Search,
  Plus,
  Pencil,
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Eye,
  Calendar,
  AlertCircle,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Info,
  Filter,
  Layers
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getBranchesApi,
  getBranchByIdApi,
  createBranchApi,
  updateBranchApi,
  getKitchensApi,
  getCuisinesApi
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

// Helper to determine if a kitchen hub has limit to create branches
export const canKitchenCreateBranch = (kitchen) => {
  if (!kitchen) return false;
  if (!kitchen.branchLimit) return true;
  if (typeof kitchen.branchLimit.canCreateBranch === 'boolean') {
    return kitchen.branchLimit.canCreateBranch;
  }
  if (kitchen.branchLimit.isLimitReached || kitchen.branchLimit.isMaxLimitExceeded) {
    return false;
  }
  if (typeof kitchen.branchLimit.remainingBranches === 'number') {
    return kitchen.branchLimit.remainingBranches > 0;
  }
  return true;
};

// Custom Option Component for React-Select with Clean Inline Limit Notice for Disabled Items
const KitchenOption = (props) => {
  const { data, innerRef, innerProps, isSelected, isFocused, isDisabled } = props;
  const kitchen = data.kitchen;
  const limit = kitchen?.branchLimit;
  const message =
    limit?.message ||
    (limit?.isLimitReached
      ? 'This kitchen has reached its maximum branch creation limit.'
      : 'No branch creation limit available for this kitchen.');
  const upgradeMessage = limit?.upgradeMessage;

  return (
    <div
      ref={innerRef}
      {...innerProps}
      title={isDisabled ? `${message} ${upgradeMessage ? ' - ' + upgradeMessage : ''}` : ''}
      className={`relative px-3.5 py-3 transition-all rounded-xl mb-1.5 last:mb-0 border ${
        isDisabled
          ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed'
          : isSelected
          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 cursor-pointer shadow-sm'
          : isFocused
          ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-pointer'
          : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-extrabold text-xs truncate ${
                isDisabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'
              }`}
            >
              {kitchen.kitchenName || kitchen.name}
            </span>
            {isDisabled ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold text-[9px] border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0">
                <Lock className="w-2.5 h-2.5" />
                Limit Reached (0 Left)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {limit?.remainingBranches !== undefined ? `${limit.remainingBranches} Remaining` : 'Available'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {kitchen.email || kitchen.phone || `ID: #${kitchen.id}`}
          </p>
        </div>

        {limit && (
          <div className="text-right shrink-0">
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 block">
              {limit.totalBranches ?? 0} / {limit.maxBranches ?? 0}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Branches</span>
          </div>
        )}
      </div>

      {/* When disabled: Clean inline alert card with the exact backend message */}
      {isDisabled && (
        <div className="mt-2 p-2 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-[10.5px] leading-relaxed text-rose-800 dark:text-rose-300 space-y-0.5">
          <div className="flex items-start gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
          {upgradeMessage && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5 font-medium">
              {upgradeMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Custom SingleValue component for Kitchen react-select
const KitchenSingleValue = (props) => {
  const { data } = props;
  const kitchen = data.kitchen;
  const limit = kitchen?.branchLimit;
  return (
    <div className="flex items-center justify-between w-full pr-1">
      <div className="flex items-center gap-2 truncate">
        <Building2 className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400 shrink-0" />
        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
          {kitchen.kitchenName || kitchen.name}
        </span>
        {kitchen.email && (
          <span className="text-[11px] text-slate-400 truncate hidden sm:inline font-normal">
            ({kitchen.email})
          </span>
        )}
      </div>
      {limit && (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ml-2 ${
            data.isEligible
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {limit.remainingBranches ?? 0} left
        </span>
      )}
    </div>
  );
};

export const Branches = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [branches, setBranches] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [cuisines, setCuisines] = useState([]);

  const [search, setSearch] = useState('');
  const [kitchenFilter, setKitchenFilter] = useState('All');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewingBranch, setViewingBranch] = useState(null);
  const [errors, setErrors] = useState({});

  const initialForm = {
    userId: '',
    name: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    area: '',
    pincode: '177001',
    countryId: 101,
    stateId: 4020,
    cityId: 132063,
    contactTitle: 'MR',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    selectedCuisineIds: [],
  };

  const [form, setForm] = useState(initialForm);

  const titleOptions = [
    { value: 'MR', label: 'Mr.' },
    { value: 'MS', label: 'Ms.' },
    { value: 'MRS', label: 'Mrs.' },
    { value: 'DR', label: 'Dr.' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 999999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      zIndex: 999999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#8C0D0D' : state.isFocused ? (theme === 'dark' ? '#334155' : '#f8fafc') : 'transparent',
      color: state.isSelected ? '#ffffff' : theme === 'dark' ? '#f8fafc' : '#0f172a',
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

  const kitchenSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: errors.userId
        ? '#f43f5e'
        : state.isFocused
        ? '#8C0D0D'
        : theme === 'dark'
        ? '#334155'
        : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      minHeight: '44px',
      boxShadow: state.isFocused
        ? errors.userId
          ? '0 0 0 2px rgba(244, 63, 94, 0.2)'
          : '0 0 0 2px rgba(140, 13, 13, 0.3)'
        : 'none',
      '&:hover': {
        borderColor: errors.userId
          ? '#f43f5e'
          : theme === 'dark'
          ? '#475569'
          : '#cbd5e1',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'visible',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      zIndex: 60,
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '260px',
      overflowY: 'auto',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: 'transparent',
      padding: 0,
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      pointerEvents: 'auto',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.875rem',
      fontWeight: '600',
      width: '100%',
    }),
  };

  // Fetch Kitchens and Cuisines metadata for dropdowns
  const fetchDropdowns = async () => {
    try {
      const [kitRes, cuisineRes] = await Promise.all([
        getKitchensApi(),
        getCuisinesApi({ limit: 200 }),
      ]);

      if (kitRes?.status === true && Array.isArray(kitRes.data)) {
        setKitchens(kitRes.data);
      }
      if (cuisineRes?.status === true && Array.isArray(cuisineRes.data)) {
        setCuisines(cuisineRes.data);
      }
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch Branches with Server-Side Pagination and Filtering
  const fetchBranches = async () => {
    showLoading('Fetching branch outlets list...');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search?.trim()) params.search = search.trim();
      if (kitchenFilter && kitchenFilter !== 'All') params.userId = kitchenFilter;

      const branchRes = await getBranchesApi(params);

      if (branchRes?.status === true && Array.isArray(branchRes.data)) {
        setBranches(branchRes.data);
        if (branchRes.meta) {
          const total = branchRes.meta.total ?? branchRes.meta.filtered ?? branchRes.meta.count ?? branchRes.data.length;
          const pages = branchRes.meta.totalPages ?? Math.max(1, Math.ceil(total / itemsPerPage));
          setTotalItems(total);
          setTotalPages(pages);
        } else {
          setTotalItems(branchRes.data.length);
          setTotalPages(Math.max(1, Math.ceil(branchRes.data.length / itemsPerPage)));
        }
      } else {
        setBranches([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error loading branch data:', err);
      setBranches([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [currentPage, itemsPerPage, search, kitchenFilter]);

  // View Branch by ID (GET /api/v1/admin/branch/:id)
  const openView = async (id) => {
    showLoading('Fetching branch details...');
    const res = await getBranchByIdApi(id);
    hideLoading();
    if (res?.status === true && res.data) {
      setViewingBranch(res.data);
    } else {
      toast.error(res?.message || 'Failed to fetch branch details.');
    }
  };

  // Open Edit Modal
  const openEdit = async (b) => {
    showLoading('Loading branch data for editing...');
    const res = await getBranchByIdApi(b.id);
    hideLoading();

    const target = (res?.status === true && res.data) ? res.data : b;
    setEditingBranch(target);
    setFilterEligibleOnly(false);

    // Extract cuisine IDs from relations: [{ cuisineId: 22 }, ...] or [{ id: 22 }, ...]
    const assignedCuisineIds = (target.cuisines || []).map(c => c.cuisineId || c.id || c.cuisine?.id).filter(Boolean);

    setForm({
      userId: target.userId || '',
      name: target.name || '',
      addressLine1: target.addressLine1 || '',
      addressLine2: target.addressLine2 || '',
      landmark: target.landmark || '',
      area: target.area || '',
      pincode: target.pincode || '177001',
      countryId: target.countryId || 101,
      stateId: target.stateId || 4020,
      cityId: target.cityId || 132063,
      contactTitle: target.contactTitle || 'MR',
      contactFirstName: target.contactFirstName || '',
      contactLastName: target.contactLastName || '',
      contactEmail: target.contactEmail || '',
      contactPhone: target.contactPhone || '',
      selectedCuisineIds: assignedCuisineIds,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Form Submit (POST / PUT) matching user's exact JSON format
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.userId) newErrors.userId = 'Please select a kitchen hub.';
    if (!form.name?.trim()) newErrors.name = 'Branch name is required.';
    if (!form.addressLine1?.trim()) newErrors.addressLine1 = 'Address line 1 is required.';
    if (!form.contactFirstName?.trim()) newErrors.contactFirstName = 'Contact first name is required.';
    if (!form.contactLastName?.trim()) newErrors.contactLastName = 'Contact last name is required.';
    if (!form.contactPhone?.trim()) newErrors.contactPhone = 'Contact phone is required.';

    const selectedKitchen = kitchens.find((k) => String(k.id) === String(form.userId));
    if (!editingBranch && selectedKitchen && !canKitchenCreateBranch(selectedKitchen)) {
      const limitMsg =
        selectedKitchen.branchLimit?.message ||
        'This kitchen has reached its maximum branch limit. Please choose another kitchen or upgrade subscription.';
      newErrors.userId = limitMsg;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors in the form.');
      return;
    }

    setErrors({});
    showLoading(editingBranch ? `Updating branch #${editingBranch.id}...` : 'Creating new branch...');

    // Exact Payload structure requested by user
    const payload = {
      userId: Number(form.userId),
      name: form.name,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || '',
      landmark: form.landmark || '',
      area: form.area || '',
      pincode: form.pincode || '177001',
      countryId: Number(form.countryId) || 101,
      stateId: Number(form.stateId) || 4020,
      cityId: Number(form.cityId) || 132063,
      contactTitle: form.contactTitle || 'MR',
      contactFirstName: form.contactFirstName,
      contactLastName: form.contactLastName,
      contactEmail: form.contactEmail || 'akshay.contact@gmail.com',
      contactPhone: form.contactPhone,
      cuisines: form.selectedCuisineIds.map((id) => ({ id: Number(id) })),
    };

    const res = editingBranch
      ? await updateBranchApi(editingBranch.id, payload)
      : await createBranchApi(payload);

    hideLoading();

    if (res?.status === true) {
      toast.success(res.message || `Branch "${form.name}" saved successfully!`);
      setIsModalOpen(false);
      setEditingBranch(null);
      setForm(initialForm);
      fetchBranches();
      fetchDropdowns();
    } else {
      const fieldErrors = extractFieldErrors(res);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(res, 'Failed to save branch.'));
    }
  };

  const toggleCuisineSelection = (id) => {
    setForm((prev) => {
      const exists = prev.selectedCuisineIds.includes(id);
      return {
        ...prev,
        selectedCuisineIds: exists
          ? prev.selectedCuisineIds.filter((item) => item !== id)
          : [...prev.selectedCuisineIds, id],
      };
    });
  };

  return (
    <div className="space-y-7 pb-10 animate-fade-in mx-auto">

      {/* ─── TOP HERO BANNER ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Kitchen Branch Network
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {totalItems} Active Branch Outlets
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Kitchen Branches</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Create and manage branch outlets, address locations, contact managers, and linked cuisine stations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingBranch(null);
                const firstEligible = kitchens.find((k) => canKitchenCreateBranch(k));
                setForm({
                  ...initialForm,
                  userId: firstEligible ? firstEligible.id : '',
                });
                setFilterEligibleOnly(false);
                setErrors({});
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by branch name, area, address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

          {/* Filter by Kitchen */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase">Filter Kitchen:</span>
            <select
              value={kitchenFilter}
              onChange={(e) => {
                setKitchenFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-brand-800 cursor-pointer"
            >
              <option value="All">All Kitchen Hubs ({kitchens.length})</option>
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kitchenName || k.name} {k.branchLimit ? `(${k.branchLimit.totalBranches}/${k.branchLimit.maxBranches} branches)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Branches Table List */}
        {branches.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 pl-6 w-16">#</th>
                      <th className="p-4">Branch Outlet</th>
                      <th className="p-4">Kitchen Hub</th>
                      <th className="p-4">Location &amp; Address</th>
                      <th className="p-4">Contact Manager</th>
                      <th className="p-4">Cuisines</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {branches.map((br, idx) => {
                      const parentKitchen = kitchens.find((k) => String(k.id) === String(br.userId));
                      return (
                        <tr key={br.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 pl-6 font-black text-brand-800 dark:text-rose-400 text-[11px]">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                                <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{br.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Pincode: {br.pincode}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                            {parentKitchen ? (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                                {parentKitchen.kitchenName}
                              </span>
                            ) : (
                              'Kitchen Hub'
                            )}
                          </td>

                        <td className="p-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {br.addressLine1}
                          </p>
                          {(br.area || br.city?.name) && (
                            <p className="text-[10px] text-slate-400 font-medium pl-4">
                              {br.area}{br.city?.name ? `, ${br.city.name}` : ''}{br.state?.name ? `, ${br.state.name}` : ''}
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                              {br.contactTitle} {br.contactFirstName} {br.contactLastName}
                            </span>
                            {br.contactPhone && (
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                {br.contactPhone}
                              </span>
                            )}
                            {br.contactEmail && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {br.contactEmail}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-[10px] border border-amber-200 dark:border-amber-800">
                            {br.cuisines?.length || 0} Linked
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openView(br.id)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(br)}
                              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-sm"
                              title="Edit Branch"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          title="No branches found"
          description="We couldn't find any branches matching your search or kitchen filter."
          onReset={() => { setSearch(''); setKitchenFilter('All'); setCurrentPage(1); }}
        />
      )}

      {/* VIEW BRANCH DETAILS MODAL */}
      {viewingBranch &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-amber-300" />
                    Branch Outlet: {viewingBranch.name}
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">View Branch Outlet Details</p>
                </div>
                <button onClick={() => setViewingBranch(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">{viewingBranch.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    Kitchen Hub: {kitchens.find((k) => String(k.id) === String(viewingBranch.userId))?.kitchenName || 'Linked Kitchen'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Address 1</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingBranch.addressLine1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Address 2</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingBranch.addressLine2 || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Landmark / Area</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingBranch.landmark} ({viewingBranch.area})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pincode</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingBranch.pincode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Manager</span>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {viewingBranch.contactTitle} {viewingBranch.contactFirstName} {viewingBranch.contactLastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone &amp; Email</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingBranch.contactPhone}</span>
                    <span className="font-medium text-slate-500 block">{viewingBranch.contactEmail}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button onClick={() => setViewingBranch(null)} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CREATE / EDIT BRANCH MODAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <GitBranch className="w-5 h-5 text-amber-300" />
                    {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Create New Branch Outlet'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingBranch ? 'Update branch location and operational contact' : 'Add physical branch operating under a registered kitchen'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                {(errors.general || errors.form) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">{errors.general || errors.form}</div>
                  </div>
                )}

                {!editingBranch && kitchens.length > 0 && !kitchens.some((k) => canKitchenCreateBranch(k)) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">
                      All registered kitchens have currently reached their maximum branch creation limit. Please upgrade their subscription plan to add new branches.
                    </div>
                  </div>
                )}

                {/* Target Kitchen Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold text-[11px]">
                      Kitchen Hub *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                          filterEligibleOnly
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title="Toggle between showing only kitchens with limit vs all kitchens"
                      >
                        <Filter className="w-3 h-3" />
                        <span>{filterEligibleOnly ? 'Showing Limit Available Only' : 'Show Limit Available Only'}</span>
                      </button>
                    </div>
                  </div>

                  <Select
                    options={kitchens
                      .filter((k) => {
                        if (!filterEligibleOnly) return true;
                        const isCurrentAssigned = editingBranch && String(editingBranch.userId) === String(k.id);
                        return isCurrentAssigned || canKitchenCreateBranch(k);
                      })
                      .map((k) => {
                        const isCurrentAssigned = editingBranch && String(editingBranch.userId) === String(k.id);
                        const isEligible = canKitchenCreateBranch(k);
                        return {
                          value: k.id,
                          label: k.kitchenName || k.name || `Kitchen #${k.id}`,
                          kitchen: k,
                          isEligible: isEligible,
                          isDisabled: !isCurrentAssigned && !isEligible,
                        };
                      })}
                    value={
                      (() => {
                        const found = kitchens.find((k) => String(k.id) === String(form.userId));
                        if (!found) return null;
                        const isCurrentAssigned = editingBranch && String(editingBranch.userId) === String(found.id);
                        const isEligible = canKitchenCreateBranch(found);
                        return {
                          value: found.id,
                          label: found.kitchenName || found.name || `Kitchen #${found.id}`,
                          kitchen: found,
                          isEligible: isEligible,
                          isDisabled: !isCurrentAssigned && !isEligible,
                        };
                      })()
                    }
                    onChange={(opt) => {
                      setForm({ ...form, userId: opt ? opt.value : '' });
                      if (errors.userId) setErrors((p) => ({ ...p, userId: null }));
                    }}
                    components={{
                      Option: KitchenOption,
                      SingleValue: KitchenSingleValue,
                    }}
                    styles={kitchenSelectStyles}
                    isSearchable={true}
                    placeholder="— Select Target Kitchen Hub —"
                    isOptionDisabled={(option) => option.isDisabled}
                  />

                  {errors.userId && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.userId}
                    </p>
                  )}

                  {/* Selected Kitchen Hub Limit Status Card */}
                  {form.userId && (() => {
                    const selKitchen = kitchens.find((k) => String(k.id) === String(form.userId));
                    if (!selKitchen) return null;
                    const isEligible = canKitchenCreateBranch(selKitchen);
                    const isAssigned = editingBranch && String(editingBranch.userId) === String(selKitchen.id);
                    const limit = selKitchen.branchLimit;

                    return (
                      <div
                        className={`mt-2.5 p-3 rounded-2xl border transition-all text-xs ${
                          isEligible || isAssigned
                            ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-800 dark:text-rose-400 shrink-0" />
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {selKitchen.kitchenName || selKitchen.name}
                            </span>
                          </div>

                          {limit && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  isEligible
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {limit.totalBranches ?? 0} / {limit.maxBranches ?? 0} Used
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                                ({limit.remainingBranches ?? 0} Remaining)
                              </span>
                            </div>
                          )}
                        </div>

                        {limit?.message && (
                          <div className="mt-1.5 text-[11px] leading-relaxed flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{limit.message}</span>
                          </div>
                        )}

                        {!isEligible && !isAssigned && limit?.upgradeMessage && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span>{limit.upgradeMessage}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Branch Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter branch outlet name (e.g. Royal Spice - Sector 18)..."
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((p) => ({ ...p, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      errors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Address Line 1 & Line 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter street address, shop / plot no..."
                      value={form.addressLine1}
                      onChange={(e) => {
                        setForm({ ...form, addressLine1: e.target.value });
                        if (errors.addressLine1) setErrors((p) => ({ ...p, addressLine1: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        errors.addressLine1
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                    {errors.addressLine1 && (
                      <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.addressLine1}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      placeholder="Enter floor, suite, or block (optional)..."
                      value={form.addressLine2}
                      onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Area, Landmark, Pincode */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Area
                    </label>
                    <input
                      type="text"
                      placeholder="Locality / Area..."
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="Nearby landmark..."
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="6-digit pincode..."
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Contact Person Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Title</label>
                    <Select
                      options={titleOptions}
                      value={titleOptions.find((opt) => opt.value === form.contactTitle)}
                      onChange={(opt) => setForm({ ...form, contactTitle: opt ? opt.value : 'MR' })}
                      styles={customSelectStyles}
                      isSearchable={false}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">First Name *</label>
                    <input
                      type="text"
                      placeholder="First name (e.g. Rahul)..."
                      value={form.contactFirstName}
                      onChange={(e) => {
                        setForm({ ...form, contactFirstName: e.target.value });
                        if (errors.contactFirstName) setErrors((p) => ({ ...p, contactFirstName: null }));
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        errors.contactFirstName
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Last Name *</label>
                    <input
                      type="text"
                      placeholder="Last name (e.g. Sharma)..."
                      value={form.contactLastName}
                      onChange={(e) => {
                        setForm({ ...form, contactLastName: e.target.value });
                        if (errors.contactLastName) setErrors((p) => ({ ...p, contactLastName: null }));
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        errors.contactLastName
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                {/* Contact Email & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Contact Email</label>
                    <input
                      type="email"
                      placeholder="Enter contact email..."
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Contact Phone *</label>
                    <input
                      type="text"
                      placeholder="Enter contact phone (e.g. 9876543210)..."
                      value={form.contactPhone}
                      onChange={(e) => {
                        setForm({ ...form, contactPhone: e.target.value });
                        if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        errors.contactPhone
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                {/* Cuisines Selection (Multi-select) */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-extrabold">
                    Link Available Cuisines to Branch
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {cuisines.map((c) => {
                      const isSelected = form.selectedCuisineIds.includes(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleCuisineSelection(c.id)}
                          className={`p-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-900" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Selected: {form.selectedCuisineIds.length} cuisine(s)
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand cursor-pointer"
                  >
                    {editingBranch ? 'Save Branch Changes' : 'Create Branch'}
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
