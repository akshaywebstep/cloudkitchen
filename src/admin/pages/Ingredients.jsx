import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
  Boxes,
  Search,
  Plus,
  Pencil,
  X,
  AlertCircle,
  Eye,
  UploadCloud,
  LayoutGrid,
  List,
  Calendar,
  Layers,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getIngredientsApi,
  getIngredientByIdApi,
  createIngredientApi,
  updateIngredientApi,
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

export const Ingredients = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (cards) or 'list' (table)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [viewingIngredient, setViewingIngredient] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    category: 'Vegetable',
    image: '',
    imageFile: null,
    status: 'ACTIVE',
  });

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result, imageFile: file }));
        toast.success('Ingredient image selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: '', imageFile: null }));
  };

  const [categoryOptions, setCategoryOptions] = useState([
    { value: 'Vegetable', label: 'Vegetable' },
    { value: 'Meat', label: 'Meat & Poultry' },
    { value: 'Dairy', label: 'Dairy & Cheese' },
    { value: 'Spices', label: 'Spices & Flavors' },
    { value: 'Oils', label: 'Oils & Condiments' },
    { value: 'Grains', label: 'Grains & Pasta' },
  ]);

  const handleCreateCategory = (inputValue) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const newOption = { value: trimmed, label: trimmed };
    setCategoryOptions((prev) => {
      if (prev.some((o) => o.value.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, newOption];
    });
    setForm((prev) => ({ ...prev, category: trimmed }));
    if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
    toast.success(`Category "${trimmed}" added to dropdown!`);
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'INACTIVE', label: 'INACTIVE' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
    }),
    input: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '600',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? (theme === 'dark' ? '#334155' : '#f8fafc')
        : 'transparent',
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

  // ── API Calls ──────────────────────────────────────────────

  const fetchIngredients = async () => {
    showLoading('Fetching raw ingredients list...');
    try {
      const res = await getIngredientsApi({ limit: 200 });
      if (res?.status === true && Array.isArray(res.data)) {
        const formatted = res.data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          image: item.image || null,
          status: item.status || 'ACTIVE',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        setIngredients(formatted);

        // Include any unique existing categories into categoryOptions
        setCategoryOptions((prev) => {
          const existing = new Set(prev.map((o) => o.value.toLowerCase()));
          const extra = [];
          res.data.forEach((item) => {
            if (item.category && !existing.has(item.category.toLowerCase())) {
              existing.add(item.category.toLowerCase());
              extra.push({ value: item.category, label: item.category });
            }
          });
          return extra.length ? [...prev, ...extra] : prev;
        });
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // ── Filter & Pagination ────────────────────────────────────

  const filtered = ingredients.filter((ing) => {
    const matchSearch =
      ing.name?.toLowerCase().includes(search.toLowerCase()) ||
      ing.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || ing.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── View / Edit / Delete ────────────────────────────────────

  const openView = async (id) => {
    showLoading('Fetching ingredient details...');
    const res = await getIngredientByIdApi(id);
    hideLoading();
    if (res?.status === true && res.data) setViewingIngredient(res.data);
    else toast.error(res?.message || 'Failed to fetch ingredient.');
  };

  const openEdit = async (ing) => {
    showLoading('Loading ingredient...');
    const res = await getIngredientByIdApi(ing.id);
    hideLoading();
    const target = (res?.status === true && res.data) ? res.data : ing;
    setEditingIngredient(target);
    const cat = target.category || 'Vegetable';
    setCategoryOptions((prev) => {
      if (cat && !prev.some((o) => o.value.toLowerCase() === cat.toLowerCase())) {
        return [...prev, { value: cat, label: cat }];
      }
      return prev;
    });
    setForm({
      name: target.name || '',
      category: cat,
      image: target.image || '',
      imageFile: null,
      status: target.status || 'ACTIVE',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // ── Create / Update ─────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Ingredient name is required.';
    if (!form.category?.trim()) newErrors.category = 'Category is required.';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error('Please fix errors in the form.');
      return;
    }
    setErrors({});
    showLoading(editingIngredient ? 'Updating ingredient...' : 'Creating ingredient...');
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      status: form.status,
      ...(form.imageFile ? { imageFile: form.imageFile } : {}),
      ...(form.image ? { image: form.image } : {}),
    };
    const res = editingIngredient
      ? await updateIngredientApi(editingIngredient.id, payload)
      : await createIngredientApi(payload);
    hideLoading();
    if (res?.status === true) {
      toast.success(res.message || `"${form.name}" saved!`);
      setIsModalOpen(false);
      setEditingIngredient(null);
      fetchIngredients();
    } else {
      const fieldErrors = extractFieldErrors(res);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      toast.error(getErrorMessage(res, 'Failed to save ingredient.'));
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 pb-10 animate-fade-in mx-auto">

      {/* ─── HERO BANNER ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                Raw Ingredients Catalog
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {ingredients.length} Ingredients Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Raw Ingredients
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Create, view, and manage kitchen ingredients in cards form, upload photos, and update availability status.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingIngredient(null);
              setForm({ name: '', category: 'Vegetable', image: '', imageFile: null, status: 'ACTIVE' });
              setErrors({});
              setIsModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer self-start lg:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Ingredient
          </button>
        </div>
      </div>

      {/* ─── SEARCH & FILTER & VIEW SWITCHER BAR ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search ingredient by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Tabs */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {['All', 'ACTIVE', 'PENDING', 'INACTIVE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-brand-800 text-white shadow'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-brand-800 dark:text-rose-400 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-brand-800 dark:text-rose-400 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="List/Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INGREDIENTS CARDS GRID OR TABLE ─── */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            /* ═══ CARDS GRID VIEW ═══ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {paginated.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Photo Container */}
                    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {ing.image ? (
                        <img
                          src={ing.image}
                          alt={ing.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300 dark:text-slate-600">
                          <Boxes className="w-12 h-12" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">No Photo</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                          ing.status === 'ACTIVE'
                            ? 'bg-emerald-500/90 text-white border-emerald-400'
                            : ing.status === 'PENDING'
                            ? 'bg-amber-500/90 text-white border-amber-400'
                            : 'bg-rose-500/90 text-white border-rose-400'
                        }`}
                      >
                        {ing.status}
                      </span>

                      {/* Category Badge on Top-Left */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-brand-800 dark:text-rose-400 text-[11px] font-black border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
                        {ing.category}
                      </span>

                      {/* ID Badge on Bottom-Left */}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-black shadow">
                        #{(currentPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight truncate">
                        {ing.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          {ing.category}
                        </span>
                        {ing.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(ing.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openView(ing.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => openEdit(ing)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ═══ TABLE VIEW (FALLBACK) ═══ */
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 pl-6 w-16">#</th>
                      <th className="p-4">Ingredient</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {paginated.map((ing, idx) => (
                      <tr key={ing.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 pl-6 font-black text-brand-800 dark:text-rose-400 text-xs">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                              {ing.image
                                ? <img src={ing.image} alt={ing.name} className="w-full h-full object-cover" />
                                : <Boxes className="w-5 h-5 text-slate-400" />}
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{ing.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">
                            {ing.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ing.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : ing.status === 'PENDING'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {ing.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openView(ing.id)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(ing)}
                              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-sm"
                              title="Edit Ingredient"
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
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={(newLimit) => {
              setItemsPerPage(newLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <EmptyState
          title="No ingredients found"
          description="No ingredients match your search or status filter."
          onReset={() => { setSearch(''); setStatusFilter('All'); }}
        />
      )}

      {/* ─── VIEW MODAL ─── */}
      {viewingIngredient &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-amber-300" />
                    Ingredient: {viewingIngredient.name}
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">View Raw Ingredient Details</p>
                </div>
                <button onClick={() => setViewingIngredient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {viewingIngredient.image
                      ? <img src={viewingIngredient.image} alt={viewingIngredient.name} className="w-full h-full object-cover" />
                      : <Boxes className="w-8 h-8 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{viewingIngredient.name}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{viewingIngredient.category}</p>
                    <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      viewingIngredient.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {viewingIngredient.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setViewingIngredient(null)} className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── CREATE / EDIT MODAL ─── */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <Boxes className="w-5 h-5 text-amber-300" />
                    {editingIngredient ? `Edit Ingredient: ${editingIngredient.name}` : 'Create New Ingredient'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingIngredient ? 'Update ingredient details' : 'Create new raw ingredient'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
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
                {/* Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Ingredient Name *
                  </label>
                  <input
                    id="ing-name"
                    type="text"
                    placeholder="Enter ingredient name (e.g. Red Tomato, Basmati Rice)..."
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((p) => ({ ...p, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      errors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40'
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

                {/* Category + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Category</label>
                    <CreatableSelect
                      options={categoryOptions}
                      value={
                        categoryOptions.find((o) => o.value.toLowerCase() === (form.category || '').toLowerCase()) ||
                        (form.category ? { value: form.category, label: form.category } : null)
                      }
                      onChange={(o) => {
                        setForm({ ...form, category: o?.value || '' });
                        if (errors.category) setErrors((p) => ({ ...p, category: null }));
                      }}
                      onCreateOption={handleCreateCategory}
                      formatCreateLabel={(inputValue) => `+ Add "${inputValue}" to dropdown`}
                      placeholder="Select or type to create..."
                      styles={customSelectStyles}
                      isSearchable={true}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                    {errors.category && (
                      <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.category}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">Status</label>
                    <Select
                      options={statusOptions}
                      value={statusOptions.find((o) => o.value === form.status)}
                      onChange={(o) => setForm({ ...form, status: o?.value || 'ACTIVE' })}
                      styles={customSelectStyles}
                      isSearchable={false}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  </div>
                </div>

                {/* Ingredient Image */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Ingredient Photo
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                        {form.image ? (
                          <img src={form.image} alt="Ingredient Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Boxes className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs">
                            <UploadCloud className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                            <span>Upload Image File</span>
                            <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                          </label>
                          {form.image && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Select local file or enter image URL below (max 5MB)
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL (e.g. https://example.com/tomato.png)"
                      value={typeof form.image === 'string' && !form.image.startsWith('data:image/') ? form.image : ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value, imageFile: null }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-brand-800"
                    />
                  </div>
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
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow cursor-pointer"
                  >
                    {editingIngredient ? 'Save Changes' : 'Create Ingredient'}
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
