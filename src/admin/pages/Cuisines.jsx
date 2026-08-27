import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Utensils,
  Search,
  Plus,
  Pencil,
  X,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getCuisinesApi,
  getCuisineByIdApi,
  createCuisineApi,
  updateCuisineApi
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

export const Cuisines = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [cuisines, setCuisines] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state & Errors
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState(null);
  const [viewingCuisine, setViewingCuisine] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
  });

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'INACTIVE', label: 'INACTIVE' },
    { value: 'PENDING', label: 'PENDING' },
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

  // Fetch Cuisines List from Backend API (GET /api/v1/admin/cuisine)
  const fetchCuisines = async () => {
    showLoading('Fetching cuisines list...');
    try {
      const res = await getCuisinesApi({ limit: 200 });
      if (res && res.status === true && Array.isArray(res.data)) {
        setCuisines(res.data);
      }
    } catch (err) {
      console.error('Error fetching cuisines list:', err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchCuisines();
  }, []);

  const scrollToFirstError = (errObj) => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`cuisine-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  // Filter & Pagination logic
  const filteredCuisines = cuisines.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(c.id).includes(search);

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredCuisines.length / itemsPerPage);
  const paginatedCuisines = filteredCuisines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // View Cuisine by ID (GET /api/v1/admin/cuisine/:id)
  const openViewCuisine = async (id) => {
    showLoading('Fetching cuisine details...');
    try {
      const res = await getCuisineByIdApi(id);
      hideLoading();
      if (res && res.status === true && res.data) {
        setViewingCuisine(res.data);
      } else {
        toast.error(res?.message || 'Failed to fetch cuisine details.');
      }
    } catch (err) {
      hideLoading();
      toast.error('Error communicating with API.');
    }
  };

  // Toggle Active/Inactive Status (PUT /api/v1/admin/cuisine/:id)
  const toggleStatus = async (cuisine) => {
    const newStatus = cuisine.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    showLoading(`Updating status for "${cuisine.name}"...`);
    try {
      const res = await updateCuisineApi(cuisine.id, {
        name: cuisine.name,
        image: cuisine.image || '',
        status: newStatus,
      });
      hideLoading();
      if (res && res.status === true) {
        toast.success(res.message || `Cuisine "${cuisine.name}" set to ${newStatus}!`);
        fetchCuisines();
      } else {
        toast.error(res?.message || 'Failed to update cuisine status.');
      }
    } catch (err) {
      hideLoading();
      toast.error('Error communicating with server.');
    }
  };

  // Open Edit Modal
  const openEdit = async (c) => {
    showLoading('Loading cuisine details for edit...');
    try {
      const res = await getCuisineByIdApi(c.id);
      hideLoading();

      const target = (res && res.status === true && res.data) ? res.data : c;
      setEditingCuisine(target);
      setForm({
        name: target.name || '',
        image: target.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        imageFile: null,
        status: target.status || 'ACTIVE',
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (err) {
      hideLoading();
      toast.error('Failed to fetch cuisine details.');
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result, imageFile: file }));
        toast.success('Cuisine photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submit (Create / Edit) with Validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Cuisine name is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors in the form.');
      setTimeout(() => scrollToFirstError(newErrors), 100);
      return;
    }

    setErrors({});
    const defaultImg = form.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

    showLoading(editingCuisine ? `Updating cuisine #${editingCuisine.id}...` : 'Creating new cuisine...');

    try {
      let res;
      if (editingCuisine) {
        // PUT /api/v1/admin/cuisine/:id (binary FormData)
        res = await updateCuisineApi(editingCuisine.id, {
          name: form.name,
          image: defaultImg,
          imageFile: form.imageFile,
          status: form.status,
        });
      } else {
        // POST /api/v1/admin/cuisine (binary FormData)
        res = await createCuisineApi({
          name: form.name,
          image: defaultImg,
          imageFile: form.imageFile,
          status: form.status,
        });
      }

      hideLoading();

      if (res && res.status === true) {
        toast.success(res.message || `Cuisine "${form.name}" saved successfully!`);
        setIsModalOpen(false);
        setEditingCuisine(null);
        setForm({ name: '', image: '', imageFile: null, status: 'ACTIVE' });
        fetchCuisines();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors), 100);
        }
        toast.error(getErrorMessage(res, 'Failed to save cuisine.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Communication error with server.');
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
                Cuisine & Category Management
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {cuisines.length} Cuisines Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Cuisine Categories</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Create, update, and manage global cuisine categories, photos, and status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCuisine(null);
                setForm({
                  name: '',
                  image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
                  status: 'ACTIVE',
                });
                setErrors({});
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cuisine Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search cuisine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
          {['All', 'ACTIVE', 'PENDING', 'INACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${
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

      {/* Cuisines Grid Cards OR Empty State */}
      {filteredCuisines.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {paginatedCuisines.map((c, idx) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden group bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <Utensils className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    )}

                    <span
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/90 text-white border-emerald-400'
                          : c.status === 'PENDING'
                          ? 'bg-amber-500/90 text-white border-amber-400'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>

                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-brand-800 dark:text-rose-400 text-xs font-black shadow">
                      #{(currentPage - 1) * itemsPerPage + idx + 1}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{c.name}</h3>
                    {Array.isArray(c.subCategories) && c.subCategories.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Sub-categories ({c.subCategories.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {c.subCategories.map((sub) => (
                            <span
                              key={sub.id}
                              className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-100 dark:border-rose-900/40"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.createdAt && (
                      <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 pt-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        Created: {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    onClick={() => toggleStatus(c)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle Status (ACTIVE / INACTIVE)"
                  >
                    {c.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openViewCuisine(c.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      title="View Cuisine Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-sm"
                      title="Edit Cuisine"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCuisines.length}
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
          description="We couldn't find any cuisines matching your search query or selected status filter."
          onReset={() => {
            setSearch('');
            setStatusFilter('All');
          }}
        />
      )}

      {/* VIEW CUISINE BY ID MODAL */}
      {viewingCuisine &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-amber-300" />
                    Cuisine: {viewingCuisine.name}
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">View Cuisine Category Details</p>
                </div>
                <button
                  onClick={() => setViewingCuisine(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {viewingCuisine.image ? (
                      <img src={viewingCuisine.image} alt={viewingCuisine.name} className="w-full h-full object-cover" />
                    ) : (
                      <Utensils className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{viewingCuisine.name}</h4>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-1 ${
                        viewingCuisine.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {viewingCuisine.status}
                    </span>
                  </div>
                </div>

                {/* Sub-categories */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Sub-Categories ({viewingCuisine.subCategories?.length || 0})
                  </h4>
                  {Array.isArray(viewingCuisine.subCategories) && viewingCuisine.subCategories.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {viewingCuisine.subCategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{sub.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400">Sub-category</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No sub-categories added yet.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setViewingCuisine(null)}
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

      {/* CREATE / EDIT CUISINE MODAL */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <Utensils className="w-5 h-5 text-amber-300" />
                    {editingCuisine ? `Edit Cuisine: ${editingCuisine.name}` : 'Create New Cuisine'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingCuisine ? 'Update cuisine category details' : 'Add new cuisine category'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
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
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Cuisine Name *
                  </label>
                  <input
                    id="cuisine-name"
                    type="text"
                    placeholder="Enter cuisine name (e.g. North Indian, Italian, Chinese)..."
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      errors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
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
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Cuisine Photo
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                        {form.image ? (
                          <img src={form.image} alt="Cuisine Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Utensils className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs">
                          <UploadCloud className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                          <span>Upload Image File</span>
                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Select local file or enter URL below</p>
                      </div>
                    </div>

                    <input
                      id="cuisine-image"
                      type="text"
                      placeholder="Or enter image URL (https://...)"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === form.status)}
                    onChange={(opt) => setForm({ ...form, status: opt ? opt.value : 'ACTIVE' })}
                    styles={customSelectStyles}
                    isSearchable={false}
                  />
                </div>

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
                    {editingCuisine ? 'Save Changes' : 'Create Cuisine'}
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

