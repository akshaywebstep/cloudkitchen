import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Building2,
  Search,
  Plus,
  FileText,
  GitBranch,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  Pencil,
  Eye,
  Download,
  ShieldCheck,
  MapPin,
  ToggleLeft,
  ToggleRight,
  ChefHat,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getKitchensApi,
  getKitchenByIdApi,
  createKitchenApi,
  updateKitchenApi,
  getBranchesApi,
  createBranchApi,
  updateBranchApi,
  getCuisinesApi,
  getSubscriptionsApi
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

const resolveImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  const lower = img.toLowerCase();
  if (lower.endsWith('.txt') || lower.endsWith('.pdf') || lower.endsWith('.doc')) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads')) return `http://dev2.screeningstar.co.in${img}`;
  if (img.startsWith('uploads/')) return `http://dev2.screeningstar.co.in/${img}`;
  if (img.includes('uploads/')) {
    const relativePath = img.substring(img.indexOf('uploads/'));
    return `http://dev2.screeningstar.co.in/${relativePath.replace(/\\/g, '/')}`;
  }
  return null;
};

const FALLBACK_PLANS = [
  { id: 1, name: 'Starter Tier Plan', title: 'Starter Tier Plan', price: 999, maxBranches: 1 },
  { id: 2, name: 'Growth Pro Plan', title: 'Growth Pro Plan', price: 2499, maxBranches: 3 },
  { id: 3, name: 'Enterprise Elite Plan', title: 'Enterprise Elite Plan', price: 4999, maxBranches: 10 },
];

export const Kitchens = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  // Kitchens dataset
  const [kitchens, setKitchens] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [editingKitchen, setEditingKitchen] = useState(null);
  const [viewingKitchen, setViewingKitchen] = useState(null);

  const [activeDocumentsModal, setActiveDocumentsModal] = useState(null);
  const [activeBranchesModal, setActiveBranchesModal] = useState(null);

  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Subscription Plans
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [isPlansLoading, setIsPlansLoading] = useState(false);

  // Initial Kitchen Form State
  const initialKitchenForm = {
    kitchenName: '',
    phone: '',
    email: '',
    password: '',
    planId: '1',
    subscriptionId: '1',
    billingCycle: 'MONTHLY',
    fssaiNumber: '',
    fssaiFile: null,
    fssaiFileName: '',
    gstNumber: '',
    gstFile: null,
    gstFileName: '',
    contactTitle: 'MR',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    profilePicture: null,
    profilePicturePreview: null,
  };

  // Form states & Errors
  const [kitchenForm, setKitchenForm] = useState(initialKitchenForm);
  const [kitchenErrors, setKitchenErrors] = useState({});

  const [branchForm, setBranchForm] = useState({
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
  });
  const [branchErrors, setBranchErrors] = useState({});

  // Dropdown options
  const [cuisines, setCuisines] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const titleOptions = [
    { value: 'MR', label: 'Mr.' },
    { value: 'MS', label: 'Ms.' },
    { value: 'MRS', label: 'Mrs.' },
    { value: 'DR', label: 'Dr.' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active Status' },
    { value: 'Inactive', label: 'Inactive Status' },
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
    menuPortal: (base) => ({
      ...base,
      zIndex: 999999,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 999999,
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

  // Fetch Kitchens and Branches from Backend API
  const fetchKitchens = async () => {
    showLoading('Fetching kitchens & branches list...');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search?.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter.toUpperCase();
      }

      const [kitRes, branchRes] = await Promise.all([
        getKitchensApi(params),
        getBranchesApi({ limit: 500 })
      ]);

      const branchesList = (branchRes && branchRes.status === true && Array.isArray(branchRes.data)) ? branchRes.data : [];

      if (kitRes && kitRes.status === true && Array.isArray(kitRes.data)) {
        const formatted = kitRes.data.map((k) => {
          const kBranches = branchesList.filter((b) => String(b.userId) === String(k.id));
          const fssaiDoc = (k.documents || []).find((d) => String(d.type).toUpperCase() === 'FSSAI');
          const gstDoc = (k.documents || []).find((d) => String(d.type).toUpperCase() === 'GST');

          return {
            ...k,
            id: k.id,
            code: `#KITCHEN-${k.id}`,
            name: k.kitchenName,
            kitchenName: k.kitchenName,
            founderName: `${k.contactTitle || ''} ${k.contactFirstName || ''} ${k.contactLastName || ''}`.trim() || 'Kitchen Owner',
            email: k.email,
            phone: k.phone,
            contactTitle: k.contactTitle,
            contactFirstName: k.contactFirstName,
            contactLastName: k.contactLastName,
            contactEmail: k.contactEmail,
            contactPhone: k.contactPhone,
            fssaiNumber: fssaiDoc?.documentNumber || k.fssaiNumber || '',
            fssaiFile: fssaiDoc?.documentFile || k.fssaiFile || '',
            gstNumber: gstDoc?.documentNumber || k.gstNumber || '',
            gstFile: gstDoc?.documentFile || k.gstFile || '',
            subscription: k.subscription,
            latestPayment: k.latestPayment,
            createdAt: k.createdAt ? new Date(k.createdAt).toISOString().split('T')[0] : '2026-08-18',
            status: (k.status || '').toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive',
            profilePicture: resolveImageUrl(k.profilePicture) || k.profilePicture,
            documents: k.documents || [],
            branches: kBranches,
          };
        });
        setKitchens(formatted);

        if (kitRes.meta) {
          const total = kitRes.meta.total ?? kitRes.meta.filtered ?? kitRes.meta.count ?? formatted.length;
          const pages = kitRes.meta.totalPages ?? Math.max(1, Math.ceil(total / itemsPerPage));
          setTotalItems(total);
          setTotalPages(pages);
        } else {
          setTotalItems(formatted.length);
          setTotalPages(Math.max(1, Math.ceil(formatted.length / itemsPerPage)));
        }

        // Keep modal updated if open
        if (activeBranchesModal) {
          const updatedKit = formatted.find((item) => item.id === activeBranchesModal.id);
          if (updatedKit) setActiveBranchesModal(updatedKit);
        }
      } else {
        setKitchens([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching kitchens and branches:', err);
      setKitchens([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      hideLoading();
    }
  };

  const fetchPlans = async () => {
    setIsPlansLoading(true);
    try {
      const res = await getSubscriptionsApi({ limit: 100 });
      let loaded = [];
      if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
        loaded = res.data;
      } else if (Array.isArray(res) && res.length > 0) {
        loaded = res;
      }
      setPlans(loaded.length > 0 ? loaded : FALLBACK_PLANS);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
      setPlans(FALLBACK_PLANS);
    } finally {
      setIsPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchKitchens();
  }, [currentPage, itemsPerPage, search, statusFilter]);

  const scrollToFirstError = (errObj, prefix = 'kitchen') => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`${prefix}-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  // Toggle Kitchen Status
  const toggleKitchenStatus = (kitchenId) => {
    setKitchens((prev) =>
      prev.map((k) => {
        if (k.id === kitchenId) {
          const nextStatus = k.status === 'Active' ? 'Inactive' : 'Active';
          toast.info(`Kitchen ${k.name} set to ${nextStatus}`);
          return { ...k, status: nextStatus };
        }
        return k;
      })
    );
  };

  // Handle Profile Picture File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKitchenForm((prev) => ({
        ...prev,
        profilePicture: file,
        profilePicturePreview: URL.createObjectURL(file),
      }));
      if (kitchenErrors.profilePicture) {
        setKitchenErrors((prev) => ({ ...prev, profilePicture: null }));
      }
    }
  };

  // View Kitchen details by ID (GET //admin/kitchen/:id)
  const openViewKitchen = async (kitchenId) => {
    showLoading('Loading kitchen details by ID...');
    try {
      const res = await getKitchenByIdApi(kitchenId);
      hideLoading();
      const kData = (res && res.status === true && res.data) ? res.data : kitchens.find((k) => k.id === kitchenId);
      if (kData) {
        const fssaiDoc = (kData.documents || []).find((d) => String(d.type).toUpperCase() === 'FSSAI');
        const gstDoc = (kData.documents || []).find((d) => String(d.type).toUpperCase() === 'GST');

        setViewingKitchen({
          ...kData,
          fssaiNumber: fssaiDoc?.documentNumber || kData.fssaiNumber || '',
          fssaiFile: fssaiDoc?.documentFile || kData.fssaiFile || '',
          gstNumber: gstDoc?.documentNumber || kData.gstNumber || '',
          gstFile: gstDoc?.documentFile || kData.gstFile || '',
          subscriptionName:
            kData.subscription?.subscription?.name ||
            kData.subscription?.subscription?.title ||
            kData.subscription?.name ||
            kData.subscription?.title ||
            'Custom Plan',
          billingCycle:
            kData.subscription?.billingCycle ||
            kData.latestPayment?.billingCycle ||
            kData.billingCycle ||
            'MONTHLY',
        });
      } else {
        toast.error(res?.message || 'Failed to fetch kitchen details.');
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to communicate with server.');
    }
  };

  // Open Kitchen Edit Modal by fetching latest data from API (GET //admin/kitchen/:id)
  const openEditKitchen = async (kitchenId) => {
    showLoading('Fetching kitchen data for editing...');
    try {
      const res = await getKitchenByIdApi(kitchenId);
      hideLoading();

      const kData = (res && res.status === true && res.data) ? res.data : kitchens.find((k) => k.id === kitchenId);

      if (kData) {
        setEditingKitchen(kData);

        // 1. Extract documents from documents array if present
        const fssaiDoc = (kData.documents || []).find((d) => String(d.type).toUpperCase() === 'FSSAI');
        const gstDoc = (kData.documents || []).find((d) => String(d.type).toUpperCase() === 'GST');

        // 2. Extract subscription ID & plan ID
        const subPlanId =
          kData.subscription?.subscriptionId ||
          kData.subscription?.subscription?.id ||
          kData.subscription?.id ||
          kData.subscriptionId ||
          kData.planId ||
          (plans.length > 0 ? String(plans[0].id) : '1');

        // 3. Extract billing cycle
        const billingCycleVal =
          kData.subscription?.billingCycle ||
          kData.latestPayment?.billingCycle ||
          kData.billingCycle ||
          'MONTHLY';

        // 4. Extract FSSAI & GST details
        const fssaiNumberVal = fssaiDoc?.documentNumber || kData.fssaiNumber || '';
        const fssaiFileUrl = fssaiDoc?.documentFile || kData.fssaiFile || kData.fssaiCertificate || '';
        const fssaiFileNameVal = fssaiFileUrl ? (fssaiFileUrl.split('/').pop() || 'Current FSSAI Certificate') : '';

        const gstNumberVal = gstDoc?.documentNumber || kData.gstNumber || '';
        const gstFileUrl = gstDoc?.documentFile || kData.gstFile || kData.gstCertificate || '';
        const gstFileNameVal = gstFileUrl ? (gstFileUrl.split('/').pop() || 'Current GST Certificate') : '';

        // 5. Extract profile picture preview
        const profilePreview =
          resolveImageUrl(kData.profilePicture) ||
          (typeof kData.profilePicture === 'string' && kData.profilePicture.startsWith('http') ? kData.profilePicture : null) ||
          null;

        setKitchenForm({
          kitchenName: kData.kitchenName || kData.name || '',
          phone: kData.phone || '',
          email: kData.email || '',
          password: '',
          planId: String(subPlanId),
          subscriptionId: String(subPlanId),
          billingCycle: billingCycleVal,
          fssaiNumber: fssaiNumberVal,
          fssaiFile: null,
          fssaiFileName: fssaiFileNameVal,
          gstNumber: gstNumberVal,
          gstFile: null,
          gstFileName: gstFileNameVal,
          contactTitle: kData.contactTitle || 'MR',
          contactFirstName: kData.contactFirstName || '',
          contactLastName: kData.contactLastName || '',
          contactEmail: kData.contactEmail || kData.email || '',
          contactPhone: kData.contactPhone || kData.phone || '',
          profilePicture: null,
          profilePicturePreview: profilePreview,
        });
        setKitchenErrors({});
        setIsKitchenModalOpen(true);
      }
    } catch (err) {
      hideLoading();
      toast.error('Error fetching kitchen details.');
    }
  };

  // Kitchen Form Submit (Create vs Update API)
  const handleKitchenSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!kitchenForm.kitchenName || !kitchenForm.kitchenName.trim()) {
      newErrors.kitchenName = 'Kitchen name is required.';
    }
    if (!kitchenForm.phone || !kitchenForm.phone.trim()) {
      newErrors.phone = 'Valid phone number is required.';
    }
    if (!kitchenForm.email || !kitchenForm.email.trim()) {
      newErrors.email = 'Valid email is required.';
    }
    if (!editingKitchen && (!kitchenForm.password || kitchenForm.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!kitchenForm.planId && !kitchenForm.subscriptionId) {
      newErrors.planId = 'Please select a subscription plan.';
    }
    if (!kitchenForm.contactFirstName || !kitchenForm.contactFirstName.trim()) {
      newErrors.contactFirstName = 'Contact first name is required.';
    }
    if (!kitchenForm.contactLastName || !kitchenForm.contactLastName.trim()) {
      newErrors.contactLastName = 'Contact last name is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setKitchenErrors(newErrors);
      toast.error('Please fix highlighted errors in kitchen form.');
      setTimeout(() => scrollToFirstError(newErrors, 'kitchen'), 100);
      return;
    }

    setKitchenErrors({});
    const actionMessage = editingKitchen
      ? `Updating kitchen #${editingKitchen.id} on server...`
      : 'Registering new kitchen on server...';
    showLoading(actionMessage);

    try {
      const formData = new FormData();
      if (kitchenForm.profilePicture) {
        formData.append('profilePicture', kitchenForm.profilePicture);
      }
      formData.append('kitchenName', kitchenForm.kitchenName.trim());
      formData.append('phone', kitchenForm.phone.trim());
      formData.append('email', kitchenForm.email.trim());
      if (kitchenForm.password) {
        formData.append('password', kitchenForm.password);
      }
      const selectedPlan = kitchenForm.planId || kitchenForm.subscriptionId;
      if (selectedPlan) {
        formData.append('planId', String(selectedPlan));
        formData.append('subscriptionId', String(selectedPlan));
      }
      formData.append('billingCycle', (kitchenForm.billingCycle || 'MONTHLY').trim().toUpperCase());
      if (kitchenForm.fssaiNumber) {
        formData.append('fssaiNumber', kitchenForm.fssaiNumber.trim());
      }
      if (kitchenForm.fssaiFile) {
        formData.append('fssaiFile', kitchenForm.fssaiFile);
      }
      if (kitchenForm.gstNumber) {
        formData.append('gstNumber', kitchenForm.gstNumber.trim().toUpperCase());
      }
      if (kitchenForm.gstFile) {
        formData.append('gstFile', kitchenForm.gstFile);
      }
      formData.append('contactTitle', kitchenForm.contactTitle || 'MR');
      formData.append('contactFirstName', kitchenForm.contactFirstName.trim());
      formData.append('contactLastName', kitchenForm.contactLastName.trim());
      formData.append('contactEmail', (kitchenForm.contactEmail || kitchenForm.email).trim());
      formData.append('contactPhone', (kitchenForm.contactPhone || kitchenForm.phone).trim());

      let res;
      if (editingKitchen) {
        // PUT //admin/kitchen/:id
        res = await updateKitchenApi(editingKitchen.id, formData);
      } else {
        // POST //admin/kitchen/
        res = await createKitchenApi(formData);
      }

      hideLoading();

      if (res && res.status === true) {
        toast.success(res.message || `Kitchen "${kitchenForm.kitchenName}" saved successfully!`);
        setIsKitchenModalOpen(false);
        setEditingKitchen(null);
        setKitchenForm(initialKitchenForm);
        fetchKitchens();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setKitchenErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors, 'kitchen'), 100);
        }
        toast.error(getErrorMessage(res, 'Failed to save kitchen.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to communicate with kitchen API server.');
    }
  };

  // Branch Submit Handler (POST //admin/branch or PUT //admin/branch/:id)
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!branchForm.name || !branchForm.name.trim()) {
      newErrors.name = 'Branch name is required.';
    }
    if (!branchForm.addressLine1 || !branchForm.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required.';
    }
    if (!branchForm.contactFirstName || !branchForm.contactFirstName.trim()) {
      newErrors.contactFirstName = 'Contact first name is required.';
    }
    if (!branchForm.contactLastName || !branchForm.contactLastName.trim()) {
      newErrors.contactLastName = 'Contact last name is required.';
    }
    if (!branchForm.contactPhone || !branchForm.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setBranchErrors(newErrors);
      toast.error('Please fix highlighted branch form errors.');
      setTimeout(() => scrollToFirstError(newErrors, 'branch'), 100);
      return;
    }

    setBranchErrors({});
    const targetKitchen = activeBranchesModal;

    const payload = {
      userId: targetKitchen.id,
      name: branchForm.name,
      addressLine1: branchForm.addressLine1,
      addressLine2: branchForm.addressLine2 || '',
      landmark: branchForm.landmark || '',
      area: branchForm.area || '',
      pincode: branchForm.pincode || '177001',
      countryId: Number(branchForm.countryId) || 101,
      stateId: Number(branchForm.stateId) || 4020,
      cityId: Number(branchForm.cityId) || 132063,
      contactTitle: branchForm.contactTitle || 'MR',
      contactFirstName: branchForm.contactFirstName,
      contactLastName: branchForm.contactLastName,
      contactEmail: branchForm.contactEmail || targetKitchen.email || 'akshay.contact@gmail.com',
      contactPhone: branchForm.contactPhone || targetKitchen.phone || '7404113228',
      cuisines: (branchForm.selectedCuisineIds || []).map((id) => ({ id: Number(id) })),
    };

    showLoading(editingBranch ? `Updating branch #${editingBranch.id}...` : 'Creating new branch location...');

    try {
      let res;
      if (editingBranch) {
        // PUT //admin/branch/:id
        res = await updateBranchApi(editingBranch.id, payload);
      } else {
        // POST //admin/branch
        res = await createBranchApi(payload);
      }

      hideLoading();

      if (res && res.status === true) {
        toast.success(res.message || `Branch "${branchForm.name}" saved successfully!`);
        setIsBranchFormOpen(false);
        setEditingBranch(null);
        fetchKitchens();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setBranchErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors, 'branch'), 100);
        }
        toast.error(getErrorMessage(res, 'Failed to save branch.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Error communicating with branch API server.');
    }
  };

  return (
    <div className="space-y-7 pb-10 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Kitchen Operations Hub
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {totalItems} Kitchen Hubs Live
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Cloud Kitchens & Branch Operations</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Manage cloud kitchen brands, verified legal documents, branch networks, and contact details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingKitchen(null);
                setKitchenForm(initialKitchenForm);
                setKitchenErrors({});
                setIsKitchenModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Kitchen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search kitchen, founder, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
          {['All', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                statusFilter === st
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              {st} Status
            </button>
          ))}
        </div>
      </div>

      {/* Kitchen Listing Table OR Empty State */}
      {kitchens.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 pl-6 w-16">#</th>
                    <th className="p-4">Kitchen Name</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4">Founder Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {kitchens.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 pl-6 font-black text-brand-800 dark:text-rose-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-slate-800 text-[#8C0D0D] dark:text-rose-400 shrink-0 flex items-center justify-center overflow-hidden border border-brand-100">
                            {k.profilePicture ? (
                              <img src={k.profilePicture} alt={k.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{k.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{k.branches?.length || 0} Branches Live</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{k.email}</span>
                          <span className="text-[10px] text-slate-400 block">{k.phone}</span>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">{k.createdAt}</td>

                      <td className="p-4">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block text-xs">{k.founderName}</span>
                          <span className="text-[10px] text-slate-400 block">{k.contactEmail || k.email}</span>
                          <span className="text-[10px] text-slate-400 block">{k.contactPhone || k.phone}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            k.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewKitchen(k.id)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                            title="View Kitchen Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleKitchenStatus(k.id)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              k.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                            title={`Toggle Status (Currently ${k.status})`}
                          >
                            {k.status === 'Active' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openEditKitchen(k.id)}
                            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-sm"
                            title="Edit Kitchen"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          title="No data in current status"
          description="We couldn't find any kitchens matching your search query or selected status filter."
          onReset={() => {
            setSearch('');
            setStatusFilter('All');
            setCurrentPage(1);
          }}
        />
      )}

      {/* VIEW KITCHEN BY ID MODAL */}
      {viewingKitchen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-300" />
                    Kitchen Details: {viewingKitchen.kitchenName || viewingKitchen.name}
                  </h3>
                  <p className="text-xs text-brand-200 mt-0.5">Kitchen Profile & Contact Information</p>
                </div>
                <button
                  onClick={() => setViewingKitchen(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 overflow-hidden flex items-center justify-center">
                    {viewingKitchen.profilePicture ? (
                      <img src={viewingKitchen.profilePicture} alt={viewingKitchen.kitchenName} className="w-full h-full object-cover" />
                    ) : (
                      <ChefHat className="w-8 h-8 text-brand-800" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{viewingKitchen.kitchenName}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{viewingKitchen.founderName}</p>
                    <p className="text-xs text-slate-400 font-medium">Joined: {viewingKitchen.createdAt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner / Contact</span>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {viewingKitchen.contactTitle} {viewingKitchen.contactFirstName} {viewingKitchen.contactLastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{viewingKitchen.contactPhone || viewingKitchen.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Email</span>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{viewingKitchen.contactEmail || viewingKitchen.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{viewingKitchen.status}</span>
                  </div>
                  {viewingKitchen.fssaiNumber && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">FSSAI Number</span>
                      <span className="font-bold text-slate-900 dark:text-white block">{viewingKitchen.fssaiNumber}</span>
                    </div>
                  )}
                  {viewingKitchen.gstNumber && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">GST Number</span>
                      <span className="font-bold text-slate-900 dark:text-white block">{viewingKitchen.gstNumber}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setViewingKitchen(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CREATE / EDIT KITCHEN MODAL */}
      {isKitchenModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <Building2 className="w-5 h-5 text-amber-300" />
                    {editingKitchen ? `Edit Kitchen: ${editingKitchen.name || editingKitchen.kitchenName}` : 'Create New Cloud Kitchen'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingKitchen ? 'Update kitchen profile & contact info' : 'Register brand profile & contact info'}
                  </p>
                </div>
                <button
                  onClick={() => setIsKitchenModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleKitchenSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                {(kitchenErrors.general || kitchenErrors.form) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">{kitchenErrors.general || kitchenErrors.form}</div>
                  </div>
                )}
                
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Kitchen Profile Picture {editingKitchen ? '(Optional)' : '*'}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {kitchenForm.profilePicturePreview ? (
                        <img src={kitchenForm.profilePicturePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-rose-400 font-extrabold text-xs cursor-pointer hover:bg-brand-100 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{kitchenForm.profilePicture ? 'Change Image' : 'Choose Image File'}</span>
                        <input
                          id="kitchen-profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or WEBP up to 5MB</p>
                    </div>
                  </div>
                  {kitchenErrors.profilePicture && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {kitchenErrors.profilePicture}
                    </p>
                  )}
                </div>

                {/* Kitchen Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Kitchen Name *
                  </label>
                  <input
                    id="kitchen-kitchenName"
                    type="text"
                    placeholder="Enter cloud kitchen name (e.g. Royal Spice Kitchen)..."
                    value={kitchenForm.kitchenName}
                    onChange={(e) => {
                      setKitchenForm({ ...kitchenForm, kitchenName: e.target.value });
                      if (kitchenErrors.kitchenName) setKitchenErrors((prev) => ({ ...prev, kitchenName: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      kitchenErrors.kitchenName
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  />
                  {kitchenErrors.kitchenName && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {kitchenErrors.kitchenName}
                    </p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Kitchen Email *
                    </label>
                    <input
                      id="kitchen-email"
                      type="email"
                      placeholder="Enter kitchen email (e.g. kitchen@domain.com)..."
                      value={kitchenForm.email}
                      onChange={(e) => {
                        setKitchenForm({ ...kitchenForm, email: e.target.value });
                        if (kitchenErrors.email) setKitchenErrors((prev) => ({ ...prev, email: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        kitchenErrors.email
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                    {kitchenErrors.email && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {kitchenErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Phone Number *
                    </label>
                    <input
                      id="kitchen-phone"
                      type="text"
                      placeholder="Enter phone (e.g. 9876543210)..."
                      value={kitchenForm.phone}
                      onChange={(e) => {
                        setKitchenForm({ ...kitchenForm, phone: e.target.value });
                        if (kitchenErrors.phone) setKitchenErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        kitchenErrors.phone
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                    {kitchenErrors.phone && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {kitchenErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                {!editingKitchen && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Account Password *
                    </label>
                    <input
                      id="kitchen-password"
                      type="password"
                      placeholder="Enter secure account password..."
                      value={kitchenForm.password}
                      onChange={(e) => {
                        setKitchenForm({ ...kitchenForm, password: e.target.value });
                        if (kitchenErrors.password) setKitchenErrors((prev) => ({ ...prev, password: null }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        kitchenErrors.password
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                    {kitchenErrors.password && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {kitchenErrors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Subscription Plan Selection */}
                {/* Subscription Plan & Billing Cycle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Subscription Plan (subscriptionId) *
                    </label>
                    <Select
                      id="kitchen-planId"
                      options={plans.map((p) => ({
                        value: p.id,
                        label: `${p.title || p.name} - ₹${p.price}/mo (${p.maxBranches || 1} Branch${(p.maxBranches || 1) > 1 ? 'es' : ''})`,
                      }))}
                      value={
                        plans
                          .map((p) => ({
                            value: p.id,
                            label: `${p.title || p.name} - ₹${p.price}/mo (${p.maxBranches || 1} Branch${(p.maxBranches || 1) > 1 ? 'es' : ''})`,
                          }))
                          .find((opt) => String(opt.value) === String(kitchenForm.planId || kitchenForm.subscriptionId)) || null
                      }
                      onChange={(opt) => {
                        setKitchenForm({
                          ...kitchenForm,
                          planId: opt ? opt.value : '',
                          subscriptionId: opt ? opt.value : '',
                        });
                        if (kitchenErrors.planId || kitchenErrors.subscriptionId) {
                          setKitchenErrors((prev) => ({ ...prev, planId: null, subscriptionId: null }));
                        }
                      }}
                      placeholder="Select subscription plan tier..."
                      styles={customSelectStyles}
                      isSearchable={true}
                      isClearable={true}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isLoading={isPlansLoading}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Select subscription tier for this kitchen</p>
                    {kitchenErrors.planId && (
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {kitchenErrors.planId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Billing Cycle *
                    </label>
                    <select
                      value={kitchenForm.billingCycle || 'MONTHLY'}
                      onChange={(e) => setKitchenForm({ ...kitchenForm, billingCycle: e.target.value })}
                      className="w-full h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/10 cursor-pointer"
                    >
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="YEARLY">YEARLY</option>
                      <option value="QUARTERLY">QUARTERLY</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Billing frequency</p>
                  </div>
                </div>

                {/* Legal & Compliance Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-800 dark:text-rose-400 block">
                    Legal & Compliance Verification
                  </span>

                  {/* Row 1: FSSAI License Number & Certificate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-[11px]">
                        14-Digit FSSAI License Number (fssaiNumber) *
                      </label>
                      <input
                        id="kitchen-fssaiNumber"
                        type="text"
                        maxLength={14}
                        placeholder="10019011000123"
                        value={kitchenForm.fssaiNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setKitchenForm({ ...kitchenForm, fssaiNumber: val });
                          if (kitchenErrors.fssaiNumber) setKitchenErrors((prev) => ({ ...prev, fssaiNumber: null }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          kitchenErrors.fssaiNumber
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Exactly 14 numeric digits (digits only)</p>
                      {kitchenErrors.fssaiNumber && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {kitchenErrors.fssaiNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-[11px]">
                        FSSAI License Certificate (fssaiFile) *
                      </label>
                      <label className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        kitchenErrors.fssaiFile
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-800'
                      }`}>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate mr-2">
                          {kitchenForm.fssaiFile ? kitchenForm.fssaiFile.name : (kitchenForm.fssaiFileName || 'Upload FSSAI Certificate (PDF / Image)')}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-xs shrink-0 border border-rose-100 dark:border-rose-900/40">
                          Browse
                        </span>
                        <input
                          id="kitchen-fssaiFile"
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setKitchenForm((prev) => ({ ...prev, fssaiFile: file, fssaiFileName: file.name }));
                              if (kitchenErrors.fssaiFile) {
                                setKitchenErrors((prev) => ({ ...prev, fssaiFile: null }));
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                      {kitchenErrors.fssaiFile && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {kitchenErrors.fssaiFile}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: GST Registration Number & Certificate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-[11px]">
                        15-Digit GST Registration Number (gstNumber) *
                      </label>
                      <input
                        id="kitchen-gstNumber"
                        type="text"
                        maxLength={15}
                        placeholder="22AAAAA0000A1Z5"
                        value={kitchenForm.gstNumber}
                        onChange={(e) => {
                          setKitchenForm({ ...kitchenForm, gstNumber: e.target.value.toUpperCase() });
                          if (kitchenErrors.gstNumber) setKitchenErrors((prev) => ({ ...prev, gstNumber: null }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium uppercase transition-all ${
                          kitchenErrors.gstNumber
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">15-character GSTIN (e.g. 22AAAAA0000A1Z5)</p>
                      {kitchenErrors.gstNumber && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {kitchenErrors.gstNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold text-[11px]">
                        GST Registration Certificate (gstFile) *
                      </label>
                      <label className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        kitchenErrors.gstFile
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-800'
                      }`}>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate mr-2">
                          {kitchenForm.gstFile ? kitchenForm.gstFile.name : (kitchenForm.gstFileName || 'Upload GST Certificate (PDF / Image)')}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-xs shrink-0 border border-rose-100 dark:border-rose-900/40">
                          Browse
                        </span>
                        <input
                          id="kitchen-gstFile"
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setKitchenForm((prev) => ({ ...prev, gstFile: file, gstFileName: file.name }));
                              if (kitchenErrors.gstFile) {
                                setKitchenErrors((prev) => ({ ...prev, gstFile: null }));
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                      {kitchenErrors.gstFile && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {kitchenErrors.gstFile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Person Details Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-800 dark:text-rose-400 block">
                    Contact Person Info
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase mb-1">Title</label>
                      <Select
                        options={titleOptions}
                        value={titleOptions.find((opt) => opt.value === kitchenForm.contactTitle)}
                        onChange={(opt) => setKitchenForm({ ...kitchenForm, contactTitle: opt ? opt.value : 'MR' })}
                        styles={customSelectStyles}
                        isSearchable={false}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase mb-1">First Name *</label>
                      <input
                        id="kitchen-contactFirstName"
                        type="text"
                        placeholder="First name (e.g. Rahul)..."
                        value={kitchenForm.contactFirstName}
                        onChange={(e) => {
                          setKitchenForm({ ...kitchenForm, contactFirstName: e.target.value });
                          if (kitchenErrors.contactFirstName) setKitchenErrors((prev) => ({ ...prev, contactFirstName: null }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          kitchenErrors.contactFirstName
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase mb-1">Last Name *</label>
                      <input
                        id="kitchen-contactLastName"
                        type="text"
                        placeholder="Last name (e.g. Sharma)..."
                        value={kitchenForm.contactLastName}
                        onChange={(e) => {
                          setKitchenForm({ ...kitchenForm, contactLastName: e.target.value });
                          if (kitchenErrors.contactLastName) setKitchenErrors((prev) => ({ ...prev, contactLastName: null }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          kitchenErrors.contactLastName
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase mb-1">Contact Email</label>
                      <input
                        type="email"
                        placeholder="Enter contact email..."
                        value={kitchenForm.contactEmail}
                        onChange={(e) => setKitchenForm({ ...kitchenForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 uppercase mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="Enter contact phone..."
                        value={kitchenForm.contactPhone}
                        onChange={(e) => setKitchenForm({ ...kitchenForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsKitchenModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand cursor-pointer"
                  >
                    {editingKitchen ? 'Save Kitchen Changes' : 'Create Kitchen'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* DOCUMENTS LISTING MODAL */}
      {activeDocumentsModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    {activeDocumentsModal.name} - Documents
                  </h3>
                  <p className="text-xs text-brand-200 mt-0.5">Verified health certificates & trade licenses</p>
                </div>
                <button
                  onClick={() => setActiveDocumentsModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {activeDocumentsModal.documents?.length > 0 ? (
                  <div className="space-y-3">
                    {activeDocumentsModal.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white">{doc.name}</h4>
                            <p className="text-[10px] text-slate-400">
                              Issued: {doc.issueDate} • Expires: {doc.expiryDate}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toast.success(`Downloading "${doc.name}"...`)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-800 transition-colors"
                          title="Download Document PDF"
                        >
                          <Download className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-bold">
                    No verified documents uploaded for this kitchen yet.
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => toast.info('Document uploader launched!')}
                    className="px-4 py-2 rounded-xl bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-rose-400 font-extrabold text-xs"
                  >
                    + Upload New Cert
                  </button>
                  <button
                    onClick={() => setActiveDocumentsModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs"
                  >
                    Close
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
