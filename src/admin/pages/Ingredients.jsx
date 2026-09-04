import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Building2,
  GitBranch,
  PackagePlus,
  Scale,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  Sparkles,
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
  getMenuCategoriesApi,
  getKitchensApi,
  getBranchesApi,
  saveKitchenInventoryApi,
  getKitchenInventoryApi,
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';

const INVENTORY_UNITS = [
  { value: 'KG', label: 'KG (Kilograms)' },
  { value: 'GM', label: 'GM (Grams)' },
  { value: 'LITER', label: 'LITER (Liters)' },
  { value: 'ML', label: 'ML (Milliliters)' },
  { value: 'ITEM', label: 'ITEM (Pieces / Units)' },
  { value: 'PIECE', label: 'PIECE' },
  { value: 'DOZEN', label: 'DOZEN' },
  { value: 'PACKET', label: 'PACKET' },
  { value: 'BOX', label: 'BOX' },
  { value: 'BOTTLE', label: 'BOTTLE' },
  { value: 'CAN', label: 'CAN' },
  { value: 'PORTION', label: 'PORTION' },
];

export const Ingredients = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  // Tab state: 'catalog' | 'branch-inventory'
  const [activeTab, setActiveTab] = useState('catalog');

  // Master ingredients
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Pagination for Master
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states for Master ingredient
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

  // Dynamic Category Options
  const [categoryOptions, setCategoryOptions] = useState([
    { value: 'Vegetable', label: 'Vegetable' },
    { value: 'Meat', label: 'Meat & Poultry' },
    { value: 'Dairy', label: 'Dairy & Cheese' },
    { value: 'Spices', label: 'Spices & Flavors' },
    { value: 'Oils', label: 'Oils & Condiments' },
    { value: 'Grains', label: 'Grains & Pasta' },
  ]);

  // Kitchens and Branches for Inventory Addition
  const [kitchens, setKitchens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Inventory Addition Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [invForm, setInvForm] = useState({
    kitchenId: '',
    branchId: '',
    ingredientId: '',
    unit: 'KG',
    alertQuantity: 5,
    stock: 0,
    batchNumber: '',
    expireAt: '',
  });
  const [invErrors, setInvErrors] = useState({});
  const [submittingInventory, setSubmittingInventory] = useState(false);

  // Branch Inventory View tab state
  const [selectedInvKitchen, setSelectedInvKitchen] = useState('');
  const [invBranches, setInvBranches] = useState([]);
  const [selectedInvBranch, setSelectedInvBranch] = useState('');
  const [branchInventory, setBranchInventory] = useState([]);
  const [loadingBranchInv, setLoadingBranchInv] = useState(false);
  const [branchInvSearch, setBranchInvSearch] = useState('');

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
        ? theme === 'dark'
          ? '#334155'
          : '#f8fafc'
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

  // 1. Fetch Dynamic Categories from GET /admin/menu
  const fetchDynamicCategories = async () => {
    try {
      const res = await getMenuCategoriesApi({ limit: 200 });
      const rawCats = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (rawCats.length > 0) {
        const catMap = new Map();
        rawCats.forEach((c) => {
          if (c.name) catMap.set(c.name.toLowerCase(), c.name);
          if (Array.isArray(c.subCategories)) {
            c.subCategories.forEach((sc) => {
              if (sc.name) catMap.set(sc.name.toLowerCase(), sc.name);
            });
          }
        });
        setCategoryOptions((prev) => {
          const combined = new Map();
          prev.forEach((o) => combined.set(o.value.toLowerCase(), o.label));
          catMap.forEach((name, key) => combined.set(key, name));
          return Array.from(combined.values()).map((name) => ({ value: name, label: name }));
        });
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic categories in ingredients:', err);
    }
  };

  // 2. Fetch Master Ingredients
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

        // Merge any ingredient categories
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

  // 3. Fetch Kitchens List for Inventory allocation
  const fetchKitchens = async () => {
    try {
      const res = await getKitchensApi({ limit: 100 });
      if (res?.status === true && Array.isArray(res.data)) {
        setKitchens(res.data);
      }
    } catch (err) {
      console.warn('Failed to load kitchens:', err);
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchDynamicCategories();
    fetchKitchens();
  }, []);

  // Load branches when Modal kitchen changes
  useEffect(() => {
    async function loadModalBranches() {
      if (!invForm.kitchenId) {
        setBranches([]);
        return;
      }
      setLoadingBranches(true);
      try {
        const res = await getBranchesApi({ kitchenId: invForm.kitchenId, limit: 100 });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setBranches(list);
        if (list.length > 0 && !invForm.branchId) {
          setInvForm((p) => ({ ...p, branchId: String(list[0].id) }));
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    }
    loadModalBranches();
  }, [invForm.kitchenId]);

  // Load branches when Branch Inventory Tab kitchen changes
  useEffect(() => {
    async function loadTabBranches() {
      if (!selectedInvKitchen) {
        setInvBranches([]);
        setSelectedInvBranch('');
        setBranchInventory([]);
        return;
      }
      try {
        const res = await getBranchesApi({ kitchenId: selectedInvKitchen, limit: 100 });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setInvBranches(list);
        if (list.length > 0) {
          setSelectedInvBranch(String(list[0].id));
        } else {
          setSelectedInvBranch('');
          setBranchInventory([]);
        }
      } catch (err) {
        console.error('Failed to load tab branches:', err);
      }
    }
    loadTabBranches();
  }, [selectedInvKitchen]);

  // Fetch branch inventory when Tab Kitchen & Branch are selected
  const fetchBranchInventory = async () => {
    if (!selectedInvKitchen || !selectedInvBranch) {
      setBranchInventory([]);
      return;
    }
    setLoadingBranchInv(true);
    try {
      const res = await getKitchenInventoryApi(selectedInvKitchen, selectedInvBranch);
      if (res?.status === true && Array.isArray(res.data)) {
        setBranchInventory(res.data);
      } else {
        setBranchInventory([]);
      }
    } catch (err) {
      console.error('Error fetching branch inventory:', err);
      setBranchInventory([]);
    } finally {
      setLoadingBranchInv(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'branch-inventory') {
      fetchBranchInventory();
    }
  }, [activeTab, selectedInvKitchen, selectedInvBranch]);

  // ── Open Inventory Addition Modal ───────────────────────────
  const openInventoryModal = (ing = null) => {
    const targetIngId = ing ? String(ing.id) : ingredients[0]?.id ? String(ingredients[0].id) : '';
    const initialKitchenId = kitchens[0]?.id ? String(kitchens[0].id) : '';

    setInvForm({
      kitchenId: initialKitchenId,
      branchId: '',
      ingredientId: targetIngId,
      unit: 'KG',
      alertQuantity: 5,
      stock: 0,
      batchNumber: '',
      expireAt: '',
    });
    setInvErrors({});
    setIsInventoryModalOpen(true);
  };

  // Submit Inventory Addition
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!invForm.kitchenId) newErrors.kitchenId = 'Please select a kitchen hub.';
    if (!invForm.branchId) newErrors.branchId = 'Please select an outlet branch.';
    if (!invForm.ingredientId) newErrors.ingredientId = 'Please select an ingredient.';
    if (!invForm.unit) newErrors.unit = 'Unit is required.';

    if (Object.keys(newErrors).length > 0) {
      setInvErrors(newErrors);
      toast.error('Please fill all required inventory fields.');
      return;
    }

    setInvErrors({});
    setSubmittingInventory(true);
    showLoading('Assigning ingredient to kitchen branch inventory...');

    try {
      const payloadIngredients = [
        {
          id: Number(invForm.ingredientId),
          unit: invForm.unit,
          alertQuantity: Number(invForm.alertQuantity || 0),
          ...(Number(invForm.stock || 0) > 0 ? { stock: Number(invForm.stock) } : {}),
          ...(invForm.batchNumber?.trim() ? { batchNumber: invForm.batchNumber.trim() } : {}),
          ...(invForm.expireAt ? { expireAt: invForm.expireAt } : {}),
        },
      ];

      const res = await saveKitchenInventoryApi(
        invForm.kitchenId,
        invForm.branchId,
        payloadIngredients
      );

      if (res?.status === true) {
        toast.success(res.message || 'Ingredient inventory added successfully!');
        setIsInventoryModalOpen(false);
        if (activeTab === 'branch-inventory') {
          fetchBranchInventory();
        }
      } else {
        toast.error(res?.message || 'Failed to save inventory.');
      }
    } catch (err) {
      console.error('Error saving inventory:', err);
      toast.error('Failed to communicate with server.');
    } finally {
      setSubmittingInventory(false);
      hideLoading();
    }
  };

  // ── Filter & Pagination for Master ──────────────────────────
  const filtered = ingredients.filter((ing) => {
    const matchSearch =
      ing.name?.toLowerCase().includes(search.toLowerCase()) ||
      ing.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || ing.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filter for Branch Inventory
  const filteredBranchInv = branchInventory.filter((item) => {
    if (!branchInvSearch.trim()) return true;
    const name = item.ingredient?.name || '';
    const cat = item.ingredient?.category || '';
    const q = branchInvSearch.toLowerCase();
    return name.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
  });

  // ── View / Edit / Create Ingredient ────────────────────────
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
    const target = res?.status === true && res.data ? res.data : ing;
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
    <div className="space-y-7 pb-12 animate-fade-in mx-auto">
      {/* ─── HERO BANNER ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                Raw Ingredients & Inventory Hub
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {ingredients.length} Ingredients Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Ingredients & Inventory Addition
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Create raw culinary ingredients, assign inventory to kitchen branch outlets, configure alert thresholds, and monitor live stock batches.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
            {/* Add to Inventory Button */}
            <button
              onClick={() => openInventoryModal()}
              className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add to Inventory</span>
            </button>

            {/* Create Ingredient Button */}
            <button
              onClick={() => {
                setEditingIngredient(null);
                setForm({ name: '', category: 'Vegetable', image: '', imageFile: null, status: 'ACTIVE' });
                setErrors({});
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ingredient</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── PRIMARY TAB SWITCHER ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#8C0D0D] text-white shadow-md shadow-rose-900/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Raw Ingredients Catalog ({ingredients.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('branch-inventory');
            if (kitchens.length > 0 && !selectedInvKitchen) {
              setSelectedInvKitchen(String(kitchens[0].id));
            }
          }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'branch-inventory'
              ? 'bg-[#8C0D0D] text-white shadow-md shadow-rose-900/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kitchen & Branch Inventory</span>
        </button>
      </div>

      {/* ══════════════════ TAB 1: RAW INGREDIENTS CATALOG ══════════════════ */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search ingredient by name or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-medium"
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
                          ? 'bg-[#8C0D0D] text-white shadow'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-[#8C0D0D] dark:text-rose-400 shadow-sm font-bold'
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
                        ? 'bg-white dark:bg-slate-900 text-[#8C0D0D] dark:text-rose-400 shadow-sm font-bold'
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

          {/* INGREDIENTS CARDS GRID OR TABLE */}
          {filtered.length > 0 ? (
            <div className="space-y-6">
              {viewMode === 'grid' ? (
                /* CARDS GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {paginated.map((ing, idx) => (
                    <div
                      key={ing.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Photo Container */}
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
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#8C0D0D] dark:text-rose-400 text-[11px] font-black border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
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
                      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-1.5 flex-wrap">
                        {/* Quick Add to Inventory Button */}
                        <button
                          onClick={() => openInventoryModal(ing)}
                          className="w-full py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-300 hover:bg-[#8C0D0D] hover:text-white text-xs font-black transition-all border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          title="Allocate to Branch Inventory"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>+ Add to Branch Inventory</span>
                        </button>

                        <button
                          onClick={() => openView(ing.id)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEdit(ing)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* TABLE VIEW */
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
                            <td className="p-4 pl-6 font-black text-[#8C0D0D] dark:text-rose-400 text-xs">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                  {ing.image ? (
                                    <img src={ing.image} alt={ing.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Boxes className="w-5 h-5 text-slate-400" />
                                  )}
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
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  ing.status === 'ACTIVE'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : ing.status === 'PENDING'
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {ing.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openInventoryModal(ing)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-300 hover:bg-[#8C0D0D] hover:text-white transition-all text-xs font-extrabold flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900/50"
                                  title="Add to branch inventory"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>+ Inventory</span>
                                </button>
                                <button
                                  onClick={() => openView(ing.id)}
                                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
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
              onReset={() => {
                setSearch('');
                setStatusFilter('All');
              }}
            />
          )}
        </div>
      )}

      {/* ══════════════════ TAB 2: KITCHEN & BRANCH INVENTORY ══════════════════ */}
      {activeTab === 'branch-inventory' && (
        <div className="space-y-6">
          {/* Outlet Branch Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Kitchen Select */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Select Kitchen Hub
                </label>
                <select
                  value={selectedInvKitchen}
                  onChange={(e) => setSelectedInvKitchen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-[#8C0D0D]"
                >
                  <option value="">-- Choose Kitchen --</option>
                  {kitchens.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kitchenName || k.email || `Kitchen #${k.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Select */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Select Outlet Branch
                </label>
                <select
                  value={selectedInvBranch}
                  onChange={(e) => setSelectedInvBranch(e.target.value)}
                  disabled={!selectedInvKitchen || invBranches.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-[#8C0D0D] disabled:opacity-50"
                >
                  <option value="">-- Choose Branch --</option>
                  {invBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || `Branch #${b.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Filter in Branch Inventory */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Filter Branch Inventory
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search allocated items..."
                    value={branchInvSearch}
                    onChange={(e) => setBranchInvSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-[#8C0D0D]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-500">
                {selectedInvBranch ? (
                  <span>
                    Showing live inventory for branch <strong className="text-slate-800 dark:text-slate-200">#{selectedInvBranch}</strong>
                  </span>
                ) : (
                  <span>Select a Kitchen Hub and Branch to view live inventory</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchBranchInventory}
                  disabled={!selectedInvBranch || loadingBranchInv}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBranchInv ? 'animate-spin' : ''}`} />
                  <span>Refresh Inventory</span>
                </button>
                <button
                  onClick={() => openInventoryModal()}
                  disabled={!selectedInvBranch}
                  className="px-4 py-2 rounded-xl bg-[#8C0D0D] text-white hover:bg-rose-900 text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Add Item to this Branch</span>
                </button>
              </div>
            </div>
          </div>

          {/* Branch Inventory Table */}
          {filteredBranchInv.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 pl-6 w-16">#</th>
                      <th className="p-4">Ingredient</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Assigned Unit</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Alert Threshold</th>
                      <th className="p-4">Stock Status</th>
                      <th className="p-4 pr-6">Batches Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {filteredBranchInv.map((item, idx) => {
                      const ing = item.ingredient || {};
                      const isLow = item.isLowStock || (Number(item.totalStock || 0) <= Number(item.alertQuantity || 0));
                      const batches = Array.isArray(item.stocks) ? item.stocks : [];

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 pl-6 font-black text-[#8C0D0D] dark:text-rose-400 text-xs">
                            {idx + 1}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {ing.image ? (
                                  <img src={ing.image} alt={ing.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Boxes className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                  {ing.name || `Inventory #${item.id}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ID #{item.ingredientId || ing.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs">
                              {ing.category || 'General'}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                            {item.unit || 'KG'}
                          </td>
                          <td className="p-4">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {item.totalStock !== undefined ? item.totalStock : 0} {item.unit}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-500 font-bold">
                              {item.alertQuantity !== undefined ? item.alertQuantity : '—'} {item.unit}
                            </span>
                          </td>
                          <td className="p-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-900/50">
                                <AlertTriangle className="w-3 h-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6">
                            {batches.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {batches.slice(0, 2).map((b) => (
                                  <span
                                    key={b.id}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                                  >
                                    {b.batchNumber || `Batch #${b.id}`}: {b.quantity} {item.unit}
                                  </span>
                                ))}
                                {batches.length > 2 && (
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    +{batches.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No stock batch</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title={selectedInvBranch ? 'No inventory items in this branch' : 'Choose Kitchen & Branch'}
              description={
                selectedInvBranch
                  ? 'No raw ingredients have been assigned to this outlet yet. Click "+ Add to Inventory" to allocate ingredients.'
                  : 'Please pick a Kitchen Hub and Branch outlet from the selectors above.'
              }
              onReset={() => openInventoryModal()}
            />
          )}
        </div>
      )}

      {/* ─── INVENTORY ADDITION MODAL ─── */}
      {isInventoryModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <PackagePlus className="w-5 h-5 text-amber-300" />
                    Add Ingredient to Branch Inventory
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    Assign raw ingredient to kitchen outlet with stock and threshold rules
                  </p>
                </div>
                <button
                  onClick={() => setIsInventoryModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInventorySubmit} noValidate className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                {/* Kitchen Hub */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Kitchen Hub *
                  </label>
                  <select
                    value={invForm.kitchenId}
                    onChange={(e) => setInvForm({ ...invForm, kitchenId: e.target.value, branchId: '' })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      invErrors.kitchenId
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <option value="">-- Select Kitchen Hub --</option>
                    {kitchens.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.kitchenName || k.email || `Kitchen #${k.id}`}
                      </option>
                    ))}
                  </select>
                  {invErrors.kitchenId && (
                    <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {invErrors.kitchenId}
                    </p>
                  )}
                </div>

                {/* Outlet Branch */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Outlet Branch *
                  </label>
                  <select
                    value={invForm.branchId}
                    onChange={(e) => setInvForm({ ...invForm, branchId: e.target.value })}
                    disabled={!invForm.kitchenId || branches.length === 0}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 ${
                      invErrors.branchId
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <option value="">
                      {loadingBranches ? 'Loading branches...' : branches.length === 0 ? 'No branches found' : '-- Select Branch --'}
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || `Branch #${b.id}`}
                      </option>
                    ))}
                  </select>
                  {invErrors.branchId && (
                    <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {invErrors.branchId}
                    </p>
                  )}
                </div>

                {/* Raw Ingredient */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Raw Ingredient *
                  </label>
                  <select
                    value={invForm.ingredientId}
                    onChange={(e) => setInvForm({ ...invForm, ingredientId: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      invErrors.ingredientId
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <option value="">-- Choose Raw Ingredient --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.category})
                      </option>
                    ))}
                  </select>
                  {invErrors.ingredientId && (
                    <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {invErrors.ingredientId}
                    </p>
                  )}
                </div>

                {/* Unit & Alert Threshold Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Unit of Measure *
                    </label>
                    <select
                      value={invForm.unit}
                      onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                    >
                      {INVENTORY_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 5"
                      value={invForm.alertQuantity}
                      onChange={(e) => setInvForm({ ...invForm, alertQuantity: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Optional Stock & Batch Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Initial Stock Batch (Optional)
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 text-[10px] font-extrabold mb-1">
                        Quantity ({invForm.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={invForm.stock}
                        onChange={(e) => setInvForm({ ...invForm, stock: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 text-[10px] font-extrabold mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        placeholder="BATCH-01"
                        value={invForm.batchNumber}
                        onChange={(e) => setInvForm({ ...invForm, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 text-[10px] font-extrabold mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={invForm.expireAt}
                        onChange={(e) => setInvForm({ ...invForm, expireAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInventoryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInventory}
                    className="px-5 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-rose-900 text-white font-extrabold shadow cursor-pointer disabled:opacity-60"
                  >
                    {submittingInventory ? 'Saving Inventory...' : 'Save to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MASTER INGREDIENT DETAIL MODAL ─── */}
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
                  <p className="text-xs text-rose-200 mt-0.5">Raw Ingredient Details</p>
                </div>
                <button
                  onClick={() => setViewingIngredient(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {viewingIngredient.image ? (
                      <img src={viewingIngredient.image} alt={viewingIngredient.name} className="w-full h-full object-cover" />
                    ) : (
                      <Boxes className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{viewingIngredient.name}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">Category: {viewingIngredient.category}</p>
                    <span
                      className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        viewingIngredient.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {viewingIngredient.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setViewingIngredient(null);
                      openInventoryModal(viewingIngredient);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-[#8C0D0D] font-extrabold text-xs hover:bg-[#8C0D0D] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>+ Add to Inventory</span>
                  </button>
                  <button
                    onClick={() => setViewingIngredient(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── CREATE / EDIT MASTER INGREDIENT MODAL ─── */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <Boxes className="w-5 h-5 text-amber-300" />
                    {editingIngredient ? `Edit Ingredient: ${editingIngredient.name}` : 'Create New Raw Ingredient'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingIngredient ? 'Update ingredient details' : 'Add ingredient into global master catalog'}
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
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Category (Dynamic)
                    </label>
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
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                      Status
                    </label>
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
                            <UploadCloud className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400" />
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-[#8C0D0D]"
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
                    className="px-5 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-rose-900 text-white font-extrabold shadow cursor-pointer"
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
