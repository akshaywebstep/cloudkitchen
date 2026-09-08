import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Receipt,
  ArrowRight,
  ExternalLink,
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
  getKitchenByIdApi,
  saveKitchenInventoryApi,
  getKitchenInventoryApi,
  getAdminInventoryApi,
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';
import { STANDARD_MEASURE_UNITS } from '../../constants/measureUnits';

const INVENTORY_UNITS = STANDARD_MEASURE_UNITS;

export const Ingredients = () => {
  const navigate = useNavigate();
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
    category: '',
    image: '',
    imageFile: null,
    status: 'ACTIVE',
  });

  // Dynamic Category Options
  const [categoryOptions, setCategoryOptions] = useState([]);

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

  // Stock Movement Logs Modal State
  const [stockLogsModalOpen, setStockLogsModalOpen] = useState(false);
  const [selectedLogIngredient, setSelectedLogIngredient] = useState(null);
  const [loadingIngredientLogs, setLoadingIngredientLogs] = useState(false);
  const [ingredientInventories, setIngredientInventories] = useState([]);
  const [logKitchenFilter, setLogKitchenFilter] = useState('ALL');
  const [logBranchFilter, setLogBranchFilter] = useState('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Branch Inventory View tab state
  const [selectedInvKitchen, setSelectedInvKitchen] = useState('');
  const [invBranches, setInvBranches] = useState([]);
  const [selectedInvBranch, setSelectedInvBranch] = useState('');
  const [branchInventory, setBranchInventory] = useState([]);
  const [loadingBranchInv, setLoadingBranchInv] = useState(false);
  const [branchInvSearch, setBranchInvSearch] = useState('');

  const currentKitchen = useMemo(() => {
    return kitchens.find((k) => String(k.id) === String(selectedInvKitchen));
  }, [kitchens, selectedInvKitchen]);
  const currentKitchenName = currentKitchen?.kitchenName || currentKitchen?.email || (selectedInvKitchen ? `Kitchen #${selectedInvKitchen}` : '');

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

  // 1. Fetch Dynamic Categories strictly from GET /admin/menu (Menu Categories List)
  const fetchDynamicCategories = async () => {
    try {
      const res = await getMenuCategoriesApi({ limit: 200 });
      const rawCats = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (rawCats.length > 0) {
        const uniqueCats = new Map();
        rawCats
          .filter((c) => c && (c.status === undefined || c.status === 'ACTIVE') && c.name)
          .forEach((c) => {
            const name = c.name.trim();
            if (name && !uniqueCats.has(name.toLowerCase())) {
              uniqueCats.set(name.toLowerCase(), { value: name, label: name, id: c.id });
            }
          });
        const list = Array.from(uniqueCats.values());
        setCategoryOptions(list);
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

  // Handler when kitchen changes in tab
  const handleTabKitchenChange = (kitchenId) => {
    setSelectedInvKitchen(kitchenId);
    setSelectedInvBranch('');
    setInvBranches([]);
    setBranchInventory([]);
  };

  // Handler when kitchen changes in modal
  const handleModalKitchenChange = (kitchenId) => {
    setInvForm((p) => ({ ...p, kitchenId, branchId: '' }));
    setBranches([]);
  };

  // Load branches when Modal kitchen changes
  useEffect(() => {
    let isCancelled = false;
    async function loadModalBranches() {
      if (!invForm.kitchenId) {
        setBranches([]);
        setInvForm((p) => ({ ...p, branchId: '' }));
        return;
      }
      setLoadingBranches(true);
      try {
        const res = await getKitchenByIdApi(invForm.kitchenId);
        if (isCancelled) return;
        const list = Array.isArray(res?.data?.branches)
          ? res.data.branches
          : Array.isArray(res?.branches)
            ? res.branches
            : [];
        setBranches(list);
        if (list.length > 0) {
          setInvForm((p) => {
            const hasCurrent = list.some((b) => String(b.id) === String(p.branchId));
            return { ...p, branchId: hasCurrent ? p.branchId : String(list[0].id) };
          });
        } else {
          setInvForm((p) => ({ ...p, branchId: '' }));
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load branches:', err);
        setBranches([]);
        setInvForm((p) => ({ ...p, branchId: '' }));
      } finally {
        if (!isCancelled) setLoadingBranches(false);
      }
    }
    loadModalBranches();
    return () => {
      isCancelled = true;
    };
  }, [invForm.kitchenId]);

  // Load branches when Branch Inventory Tab kitchen changes
  useEffect(() => {
    let isCancelled = false;
    async function loadTabBranches() {
      if (!selectedInvKitchen) {
        setInvBranches([]);
        setSelectedInvBranch('');
        setBranchInventory([]);
        return;
      }
      setLoadingBranchInv(true);
      try {
        const res = await getKitchenByIdApi(selectedInvKitchen);
        if (isCancelled) return;
        const list = Array.isArray(res?.data?.branches)
          ? res.data.branches
          : Array.isArray(res?.branches)
            ? res.branches
            : [];
        setInvBranches(list);
        if (list.length > 0) {
          // Always pick the first branch of the new kitchen
          setSelectedInvBranch(String(list[0].id));
        } else {
          setSelectedInvBranch('');
          setBranchInventory([]);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load tab branches:', err);
        setInvBranches([]);
        setSelectedInvBranch('');
        setBranchInventory([]);
      } finally {
        if (!isCancelled) setLoadingBranchInv(false);
      }
    }
    loadTabBranches();
    return () => {
      isCancelled = true;
    };
  }, [selectedInvKitchen]);

  // Fetch branch inventory when Tab Kitchen & Branch are selected
  const fetchBranchInventory = async (kId = selectedInvKitchen, bId = selectedInvBranch) => {
    if (!kId || !bId) {
      setBranchInventory([]);
      return;
    }
    setLoadingBranchInv(true);
    try {
      const res = await getKitchenInventoryApi(kId, bId);
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
    if (activeTab === 'branch-inventory' && selectedInvKitchen && selectedInvBranch) {
      // Strictly verify that selectedInvBranch actually belongs to the loaded invBranches
      const branchBelongsToKitchen = invBranches.some(
        (b) => String(b.id) === String(selectedInvBranch)
      );
      if (branchBelongsToKitchen) {
        fetchBranchInventory(selectedInvKitchen, selectedInvBranch);
      }
    }
  }, [activeTab, selectedInvKitchen, selectedInvBranch, invBranches]);

  // ── Open Inventory Addition Modal ───────────────────────────
  const openInventoryModal = (ing = null) => {
    const targetIngId = ing ? String(ing.id) : ingredients[0]?.id ? String(ingredients[0].id) : '';
    const initialKitchenId = selectedInvKitchen || (kitchens[0]?.id ? String(kitchens[0].id) : '');
    const initialBranchId = selectedInvBranch || '';

    setInvForm({
      kitchenId: initialKitchenId,
      branchId: initialBranchId,
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
    if (!invForm.branchId) {
      newErrors.branchId = branches.length === 0
        ? 'Please add a branch for this kitchen first!'
        : 'Please select an outlet branch.';
    }
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

  // ── Stock Movement Logs Logic ──────────────────────────────
  const getLogCategory = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('INWARD') || t.includes('ADD') || t.includes('RESTOCK') || t.includes('PURCHASE')) return 'INWARD';
    if (t.includes('CONSUMED') || t.includes('OUTWARD') || t.includes('ORDER') || t.includes('RECIPE') || t.includes('USAGE')) return 'CONSUMED';
    if (t.includes('WASTE') || t.includes('DAMAGE') || t.includes('EXPIRE') || t.includes('SPOIL')) return 'WASTE';
    if (t.includes('ADJUST')) return 'ADJUSTMENT';
    return 'OTHER';
  };

  const extractLogBatch = (log) => {
    if (!log) return null;
    if (log.batchNumber) return log.batchNumber;
    if (log.stock?.batchNumber) return log.stock.batchNumber;
    if (typeof log.notes === 'string') {
      const match = log.notes.match(/batch\s*[:#-]?\s*([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const formatLogTimestamp = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return String(dateString);
      const datePart = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch (_) {
      return String(dateString);
    }
  };

  const openStockLogs = async (ing, specificBranchId = null, specificKitchenId = null) => {
    if (!ing) return;
    setSelectedLogIngredient(ing);
    setStockLogsModalOpen(true);
    setLoadingIngredientLogs(true);
    const initialBranch = specificBranchId ? String(specificBranchId) : 'ALL';
    const initialKitchen = specificKitchenId ? String(specificKitchenId) : 'ALL';
    setLogBranchFilter(initialBranch);
    setLogKitchenFilter(initialKitchen);
    setLogTypeFilter('ALL');
    setLogSearch('');
    setIngredientInventories([]);
    try {
      const res = await getAdminInventoryApi({ ingredientId: ing.id, limit: 100 });
      if (res?.status === true && Array.isArray(res.data)) {
        setIngredientInventories(res.data);
      } else {
        setIngredientInventories([]);
      }
    } catch (err) {
      console.error('Failed to load ingredient stock logs:', err);
      toast.error('Failed to load stock movement history.');
      setIngredientInventories([]);
    } finally {
      setLoadingIngredientLogs(false);
    }
  };

  const closeStockLogsModal = () => {
    setStockLogsModalOpen(false);
    setSelectedLogIngredient(null);
    setIngredientInventories([]);
    setLogSearch('');
    setLogTypeFilter('ALL');
    setLogBranchFilter('ALL');
    setLogKitchenFilter('ALL');
  };

  // Aggregated logs across filtered kitchen/branch for selected ingredient
  const allIngredientLogs = useMemo(() => {
    const list = [];
    ingredientInventories.forEach((inv) => {
      if (logKitchenFilter !== 'ALL' && String(inv.kitchenId) !== String(logKitchenFilter)) {
        return;
      }
      if (logBranchFilter !== 'ALL' && String(inv.branchId) !== String(logBranchFilter)) {
        return;
      }
      const logs = Array.isArray(inv.stockLogs) ? inv.stockLogs : [];
      logs.forEach((log) => {
        list.push({
          ...log,
          kitchenId: inv.kitchenId,
          kitchenName: inv.kitchen?.kitchenName || (inv.kitchenId ? `Kitchen #${inv.kitchenId}` : 'Kitchen Hub'),
          branchId: inv.branchId,
          branchName: inv.branch?.name || (inv.branchId ? `Branch #${inv.branchId}` : 'Branch Outlet'),
          branchAddress: inv.branch?.addressLine1 || '',
          ingredientUnit: inv.unit || selectedLogIngredient?.unit || 'KG',
          inventoryTotalStock: inv.totalStock,
          currentStock: log.currentStock !== undefined && log.currentStock !== null ? log.currentStock : inv.totalStock,
          inventoryItem: inv,
        });
      });
    });
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [ingredientInventories, logKitchenFilter, logBranchFilter, selectedLogIngredient]);

  // Distinct kitchens for the kitchen filter dropdown
  const availableKitchensForIngredient = useMemo(() => {
    const map = new Map();
    ingredientInventories.forEach((inv) => {
      const kId = String(inv.kitchenId || inv.kitchen?.id || '');
      if (kId && !map.has(kId)) {
        map.set(kId, {
          id: kId,
          name: inv.kitchen?.kitchenName || `Kitchen #${kId}`,
          totalStock: 0,
        });
      }
      if (kId && map.has(kId)) {
        map.get(kId).totalStock += Number(inv.totalStock || 0);
      }
    });
    return Array.from(map.values());
  }, [ingredientInventories]);

  // Distinct branch options for branch filter dropdown (scoped to selected kitchen)
  const availableBranchesForIngredient = useMemo(() => {
    const map = new Map();
    ingredientInventories.forEach((inv) => {
      const kId = String(inv.kitchenId || inv.kitchen?.id || '');
      if (logKitchenFilter !== 'ALL' && kId !== String(logKitchenFilter)) {
        return;
      }
      const bId = String(inv.branchId || inv.branch?.id || '');
      if (bId && !map.has(bId)) {
        map.set(bId, {
          id: bId,
          kitchenId: kId,
          name: inv.branch?.name || `Branch #${bId}`,
          kitchenName: inv.kitchen?.kitchenName || `Kitchen #${kId}`,
          totalStock: inv.totalStock ?? 0,
          unit: inv.unit || 'KG',
          logsCount: (inv.stockLogs || []).length,
        });
      }
    });
    return Array.from(map.values());
  }, [ingredientInventories, logKitchenFilter]);

  // Selected branch inventory object if specific branch is filtered
  const selectedBranchInv = useMemo(() => {
    if (logBranchFilter !== 'ALL') {
      return ingredientInventories.find((inv) => String(inv.branchId) === String(logBranchFilter)) || null;
    }
    return null;
  }, [ingredientInventories, logBranchFilter]);

  // Selected kitchen inventory items if specific kitchen is filtered
  const selectedKitchenInvItems = useMemo(() => {
    if (logKitchenFilter !== 'ALL') {
      return ingredientInventories.filter((inv) => String(inv.kitchenId) === String(logKitchenFilter));
    }
    return [];
  }, [ingredientInventories, logKitchenFilter]);

  // Total stock for current scope (branch, kitchen, or all)
  const totalStockForScope = useMemo(() => {
    if (selectedBranchInv) {
      return Number(selectedBranchInv.totalStock || 0);
    }
    if (logKitchenFilter !== 'ALL') {
      return selectedKitchenInvItems.reduce((sum, inv) => sum + Number(inv.totalStock || 0), 0);
    }
    return ingredientInventories.reduce((sum, inv) => sum + Number(inv.totalStock || 0), 0);
  }, [selectedBranchInv, logKitchenFilter, selectedKitchenInvItems, ingredientInventories]);

  // Overall total stock across all branches for this ingredient
  const totalStockAcrossBranches = useMemo(() => {
    return ingredientInventories.reduce((sum, inv) => sum + Number(inv.totalStock || 0), 0);
  }, [ingredientInventories]);

  // Filtered modal logs
  const filteredStockLogs = useMemo(() => {
    return allIngredientLogs.filter((log) => {
      if (logTypeFilter !== 'ALL') {
        const cat = getLogCategory(log.type);
        if (logTypeFilter !== cat) return false;
      }

      if (logSearch.trim()) {
        const q = logSearch.toLowerCase().trim();
        const notesStr = String(log.notes || '').toLowerCase();
        const batchStr = String(extractLogBatch(log) || log.batchNumber || '').toLowerCase();
        const orderStr = String(log.orderId || log.order?.id || log.order?.orderNumber || '').toLowerCase();
        const branchStr = String(log.branchName || '').toLowerCase();
        const kitchenStr = String(log.kitchenName || '').toLowerCase();
        const typeStr = String(log.type || '').toLowerCase();

        return (
          notesStr.includes(q) ||
          batchStr.includes(q) ||
          orderStr.includes(q) ||
          branchStr.includes(q) ||
          kitchenStr.includes(q) ||
          typeStr.includes(q)
        );
      }

      return true;
    });
  }, [allIngredientLogs, logTypeFilter, logSearch]);

  // Modal KPI summary
  const stockLogsSummary = useMemo(() => {
    let inwardTotal = 0;
    let consumedTotal = 0;
    let wasteTotal = 0;
    let inwardCount = 0;
    let consumedCount = 0;
    let wasteCount = 0;
    let adjCount = 0;

    allIngredientLogs.forEach((l) => {
      const cat = getLogCategory(l.type);
      const qty = Math.abs(Number(l.quantity) || 0);
      if (cat === 'INWARD') {
        inwardTotal += qty;
        inwardCount++;
      } else if (cat === 'CONSUMED') {
        consumedTotal += qty;
        consumedCount++;
      } else if (cat === 'WASTE') {
        wasteTotal += qty;
        wasteCount++;
      } else if (cat === 'ADJUSTMENT') {
        adjCount++;
      }
    });

    return {
      inwardTotal,
      consumedTotal,
      wasteTotal,
      inwardCount,
      consumedCount,
      wasteCount,
      adjCount,
      totalCount: allIngredientLogs.length,
    };
  }, [allIngredientLogs]);

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
    const cat = target.category || (categoryOptions[0]?.value || '');
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
                setForm({ name: '', category: categoryOptions[0]?.value || '', image: '', imageFile: null, status: 'ACTIVE' });
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
              handleTabKitchenChange(String(kitchens[0].id));
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
                          className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          title="View Ingredient Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openStockLogs(ing, selectedInvBranch || null, selectedInvKitchen || null)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all border border-blue-200 dark:border-blue-800 shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          title="View Stock Movement Logs"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Logs</span>
                        </button>
                        <button
                          onClick={() => openEdit(ing)}
                          className="py-1.5 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          title="Edit Ingredient"
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
                                  onClick={() => openStockLogs(ing, selectedInvBranch || null, selectedInvKitchen || null)}
                                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer shadow-sm active:scale-95"
                                  title="View Stock Logs"
                                >
                                  <History className="w-4 h-4" />
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
                  onChange={(e) => handleTabKitchenChange(e.target.value)}
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
                  disabled={!selectedInvKitchen || loadingBranchInv || invBranches.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-[#8C0D0D] disabled:opacity-50"
                >
                  <option value="">
                    {loadingBranchInv
                      ? 'Loading branches...'
                      : !selectedInvKitchen
                      ? '-- Choose Kitchen First --'
                      : invBranches.length === 0
                      ? 'No branch found for this kitchen'
                      : '-- Choose Branch --'}
                  </option>
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

            {/* Warning banner when selected kitchen has no branches */}
            {selectedInvKitchen && !loadingBranchInv && invBranches.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-xs">
                      {currentKitchenName ? `"${currentKitchenName}"` : 'This Kitchen Hub'} has no branches yet!
                    </h4>
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                      You must add a branch for this kitchen first before you can allocate or manage ingredients for its outlets.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/branches')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-all active:scale-95 cursor-pointer"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>+ Add Branch First</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-500">
                {selectedInvKitchen && !loadingBranchInv && invBranches.length === 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Please add a branch first before allocating ingredients
                  </span>
                ) : selectedInvBranch ? (
                  <span>
                    Showing live inventory for branch <strong className="text-slate-800 dark:text-slate-200">#{selectedInvBranch}</strong>
                  </span>
                ) : (
                  <span>Select a Kitchen Hub and Branch to view live inventory</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchBranchInventory(selectedInvKitchen, selectedInvBranch)}
                  disabled={!selectedInvBranch || loadingBranchInv}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBranchInv ? 'animate-spin' : ''}`} />
                  <span>Refresh Inventory</span>
                </button>
                <button
                  onClick={() => {
                    if (invBranches.length === 0) {
                      toast.error('Please add a branch for this kitchen first!');
                      return;
                    }
                    openInventoryModal();
                  }}
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
                      <th className="p-4">Batches Logged</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
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
                          <td className="p-4">
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
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => {
                                openStockLogs(
                                  {
                                    id: item.ingredientId || ing.id,
                                    name: ing.name || `Inventory #${item.id}`,
                                    category: ing.category || 'General',
                                    image: ing.image || '',
                                    unit: item.unit || 'KG',
                                  },
                                  item.branchId || selectedInvBranch || null,
                                  item.kitchenId || selectedInvKitchen || null
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer ml-auto active:scale-95 shadow-2xs"
                              title="View Stock Movement Logs"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Logs</span>
                            </button>
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
              title={
                selectedInvKitchen && !loadingBranchInv && invBranches.length === 0
                  ? 'No Branches in this Kitchen Hub'
                  : selectedInvBranch
                  ? 'No inventory items in this branch'
                  : 'Choose Kitchen & Branch'
              }
              description={
                selectedInvKitchen && !loadingBranchInv && invBranches.length === 0
                  ? `${currentKitchenName ? `"${currentKitchenName}"` : 'This kitchen hub'} does not have any branches yet. You must add a branch first before you can allocate ingredients to it.`
                  : selectedInvBranch
                  ? 'No raw ingredients have been assigned to this outlet yet. Click "+ Add to Inventory" to allocate ingredients.'
                  : 'Please pick a Kitchen Hub and Branch outlet from the selectors above.'
              }
              resetLabel={
                selectedInvKitchen && !loadingBranchInv && invBranches.length === 0
                  ? '+ Add Branch First'
                  : '+ Add to Inventory'
              }
              onReset={() => {
                if (selectedInvKitchen && !loadingBranchInv && invBranches.length === 0) {
                  navigate('/admin/branches');
                } else {
                  openInventoryModal();
                }
              }}
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
                    onChange={(e) => handleModalKitchenChange(e.target.value)}
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
                    disabled={!invForm.kitchenId || loadingBranches || branches.length === 0}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 ${
                      invErrors.branchId
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <option value="">
                      {loadingBranches
                        ? 'Loading branches...'
                        : !invForm.kitchenId
                        ? '-- Select Kitchen Hub First --'
                        : branches.length === 0
                        ? 'No branches found for this kitchen'
                        : '-- Select Branch --'}
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || `Branch #${b.id}`}
                      </option>
                    ))}
                  </select>

                  {/* Warning message when kitchen has no branches */}
                  {invForm.kitchenId && !loadingBranches && branches.length === 0 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-2 text-amber-900 dark:text-amber-200 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-extrabold leading-snug">
                          You must add a branch for this kitchen first before you can allocate ingredients to it.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInventoryModalOpen(false);
                          navigate('/admin/branches');
                        }}
                        className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Go to Branches to Add Branch</span>
                      </button>
                    </div>
                  )}

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
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = viewingIngredient;
                        setViewingIngredient(null);
                        openStockLogs(target, selectedInvBranch || null, selectedInvKitchen || null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                    >
                      <History className="w-4 h-4" />
                      <span>Stock Logs</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewingIngredient(null);
                        openInventoryModal(viewingIngredient);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-[#8C0D0D] font-extrabold text-xs hover:bg-[#8C0D0D] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>+ Add to Inventory</span>
                    </button>
                  </div>
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
                      Category
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

      {/* ─── STOCK MOVEMENT AUDIT LOGS MODAL (ADMIN) ─── */}
      {stockLogsModalOpen && selectedLogIngredient &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-modal-pop">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#8C0D0D] via-[#6a0808] to-[#420404] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="grid size-11 place-items-center rounded-2xl bg-white/10 text-white border border-white/20 shadow-sm shrink-0">
                    <History size={22} className="text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                        Stock Movement Audit Logs
                      </h3>
                      <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-white border border-white/20">
                        {selectedLogIngredient.category || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-200 mt-0.5 font-medium truncate flex items-center gap-2 flex-wrap">
                      <span>Ingredient: <strong className="text-white font-bold">{selectedLogIngredient.name}</strong></span>
                      <span>•</span>
                      <span>ID #{selectedLogIngredient.id}</span>
                      {selectedBranchInv ? (
                        <>
                          <span>•</span>
                          <span className="text-amber-200">
                            Scope: <strong className="text-white font-bold">{selectedBranchInv.branch?.name || `Branch #${selectedBranchInv.branchId}`} ({selectedBranchInv.kitchen?.kitchenName || `Kitchen #${selectedBranchInv.kitchenId}`})</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-200">
                            Live Stock: <strong className="text-white font-black">{totalStockForScope} {selectedBranchInv.unit || selectedLogIngredient.unit || 'KG'}</strong>
                          </span>
                        </>
                      ) : logKitchenFilter !== 'ALL' ? (
                        <>
                          <span>•</span>
                          <span className="text-amber-200">
                            Hub: <strong className="text-white font-bold">{availableKitchensForIngredient.find((k) => k.id === logKitchenFilter)?.name || `Kitchen #${logKitchenFilter}`}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-200">
                            Live Stock: <strong className="text-white font-black">{totalStockForScope} {selectedLogIngredient.unit || 'KG'}</strong>
                          </span>
                        </>
                      ) : ingredientInventories.length > 0 ? (
                        <>
                          <span>•</span>
                          <span className="text-amber-200">
                            Live Stock: <strong className="text-white font-black">{totalStockAcrossBranches} {selectedLogIngredient.unit || 'KG'}</strong> across {availableBranchesForIngredient.length} outlet{availableBranchesForIngredient.length === 1 ? '' : 's'}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeStockLogsModal}
                  className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/25 transition shrink-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Kitchen & Outlet Filter Bar */}
              {ingredientInventories.length > 0 && (
                <div className="px-5 sm:px-6 pt-3 pb-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Kitchen Hub Selector */}
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="font-extrabold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">Kitchen Hub:</span>
                      <select
                        value={logKitchenFilter}
                        onChange={(e) => {
                          const newK = e.target.value;
                          setLogKitchenFilter(newK);
                          setLogBranchFilter('ALL');
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:border-[#8C0D0D]"
                      >
                        <option value="ALL">All Kitchen Hubs ({availableKitchensForIngredient.length})</option>
                        {availableKitchensForIngredient.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name} ({k.totalStock} {selectedLogIngredient.unit || 'KG'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Outlet Branch Selector */}
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={13} className="text-slate-400 shrink-0" />
                      <span className="font-extrabold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">Outlet Branch:</span>
                      <select
                        value={logBranchFilter}
                        onChange={(e) => setLogBranchFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:border-[#8C0D0D]"
                      >
                        <option value="ALL">All Branch Outlets ({availableBranchesForIngredient.length})</option>
                        {availableBranchesForIngredient.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {logKitchenFilter === 'ALL' ? `(${b.kitchenName})` : ''} — {b.totalStock} {b.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Showing <strong className="text-slate-900 dark:text-white">{filteredStockLogs.length}</strong> movements for selected scope
                  </div>
                </div>
              )}

              {/* KPI Summary Cards */}
              <div className="px-5 sm:px-6 pt-4 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <span>Total Movements</span>
                      <History size={13} />
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                      {stockLogsSummary.totalCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <span>Total Inward</span>
                      <ArrowDownLeft size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 mt-1">
                      +{stockLogsSummary.inwardTotal} <span className="text-xs font-semibold">{selectedLogIngredient.unit || 'KG'}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3">
                    <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                      <span>Consumed / Orders</span>
                      <ArrowUpRight size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-base sm:text-lg font-black text-blue-800 dark:text-blue-300 mt-1">
                      -{stockLogsSummary.consumedTotal} <span className="text-xs font-semibold">{selectedLogIngredient.unit || 'KG'}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                      <span>Recorded Waste</span>
                      <Trash2 size={13} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <p className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-300 mt-1">
                      -{stockLogsSummary.wasteTotal} <span className="text-xs font-semibold">{selectedLogIngredient.unit || 'KG'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search by notes, batch #, order ID, outlet..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-[#8C0D0D]"
                    />
                    {logSearch && (
                      <button
                        type="button"
                        onClick={() => setLogSearch('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {[
                      { id: 'ALL', label: `All (${stockLogsSummary.totalCount})` },
                      { id: 'INWARD', label: `Inward (${stockLogsSummary.inwardCount})` },
                      { id: 'CONSUMED', label: `Consumed (${stockLogsSummary.consumedCount})` },
                      { id: 'WASTE', label: `Waste (${stockLogsSummary.wasteCount})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLogTypeFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                          logTypeFilter === f.id
                            ? 'bg-[#8C0D0D] text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logs Content Table (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                {loadingIngredientLogs ? (
                  <div className="py-16 text-center">
                    <RefreshCw size={24} className="text-[#8C0D0D] animate-spin mx-auto mb-3" />
                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Loading stock movement logs...
                    </p>
                  </div>
                ) : ingredientInventories.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800">
                      <Boxes size={22} />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">
                      Not Assigned to Branch Inventory Yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      "{selectedLogIngredient.name}" is currently a master catalog ingredient and has not been allocated to any kitchen branch outlet yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedLogIngredient;
                        closeStockLogsModal();
                        openInventoryModal(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#8C0D0D] text-white text-xs font-black shadow hover:bg-rose-900 transition flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <PackagePlus size={14} />
                      <span>+ Allocate to Branch Inventory</span>
                    </button>
                  </div>
                ) : filteredStockLogs.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200 dark:border-blue-800">
                      <History size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      No Movement Logs Found
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {logSearch || logTypeFilter !== 'ALL' || logBranchFilter !== 'ALL'
                        ? 'No stock movements match your search or filters. Try clearing filters.'
                        : 'No stock movements have been recorded yet for this ingredient.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Kitchen / Branch Outlet</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Quantity</th>
                          <th className="py-3 px-4">Stock Impact</th>
                          <th className="py-3 px-4">Batch #</th>
                          <th className="py-3 px-4">Purpose / Usage Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredStockLogs.map((log) => {
                          const typeStr = String(log.type || '').toUpperCase();
                          const cat = getLogCategory(log.type);
                          const isInward = cat === 'INWARD';
                          const isConsumed = cat === 'CONSUMED';
                          const isWaste = cat === 'WASTE';
                          const unit = log.ingredientUnit || selectedLogIngredient.unit || 'KG';
                          const qtyNum = Math.abs(Number(log.quantity) || 0);
                          const displayBatch = extractLogBatch(log);

                          return (
                            <tr key={log.id || `${log.createdAt}-${Math.random()}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                              {/* Date & Time */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                  <Clock size={12} className="text-slate-400 shrink-0" />
                                  <span>{formatLogTimestamp(log.createdAt)}</span>
                                </div>
                              </td>

                              {/* Kitchen / Branch Outlet */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block">
                                    {log.branchName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {log.kitchenName}
                                  </span>
                                </div>
                              </td>

                              {/* Movement Type */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold border ${
                                    isInward
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : isConsumed
                                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : isWaste
                                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  }`}
                                >
                                  {isInward ? (
                                    <ArrowDownLeft size={11} className="text-emerald-600 dark:text-emerald-400" />
                                  ) : isConsumed ? (
                                    <ArrowUpRight size={11} className="text-blue-600 dark:text-blue-400" />
                                  ) : isWaste ? (
                                    <Trash2 size={11} className="text-rose-600 dark:text-rose-400" />
                                  ) : (
                                    <RefreshCw size={11} className="text-purple-600 dark:text-purple-400" />
                                  )}
                                  <span>{typeStr}</span>
                                </span>
                              </td>

                              {/* Quantity */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`text-xs font-black ${
                                    isInward
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : isConsumed
                                      ? 'text-blue-700 dark:text-blue-400'
                                      : isWaste
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {isInward ? '+' : '-'}{qtyNum} {unit}
                                </span>
                              </td>

                              {/* Stock Impact (Previous -> Current) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  <span className="text-slate-400 font-medium">{log.previousStock ?? 0}</span>
                                  <ArrowRight size={10} className="text-slate-400" />
                                  <span className="text-slate-900 dark:text-white">{log.currentStock ?? 0}</span>
                                  <span className="text-[9.5px] text-slate-400 uppercase">{unit}</span>
                                </div>
                              </td>

                              {/* Batch # */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {displayBatch ? (
                                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                    Batch #{displayBatch}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                                )}
                              </td>

                              {/* Details / Purpose */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1 max-w-xs sm:max-w-md">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {log.orderId || log.order ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 text-[10.5px] font-bold">
                                        <Receipt size={11} className="text-blue-600 dark:text-blue-400" />
                                        <span>Order #{log.orderId || log.order?.id}</span>
                                      </span>
                                    ) : null}

                                    {log.wasteLogId || log.wasteLog ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 text-[10.5px] font-bold">
                                        <Trash2 size={11} className="text-rose-600 dark:text-rose-400" />
                                        <span>Waste #{log.wasteLogId || log.wasteLog?.id}</span>
                                      </span>
                                    ) : null}

                                    {log.createdBy && (
                                      <span className="text-[10px] font-medium text-slate-400">
                                        By: {log.createdBy}
                                      </span>
                                    )}
                                  </div>

                                  {log.notes ? (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium break-words leading-relaxed">
                                      {log.notes}
                                    </p>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 text-xs italic">Standard inventory movement</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-3 shrink-0">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Live audit trail tracked across all cloud kitchen hubs & outlets.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedLogIngredient;
                      closeStockLogsModal();
                      openInventoryModal(target);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-extrabold text-xs hover:bg-[#8C0D0D] hover:text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <PackagePlus size={14} />
                    <span>+ Add to Branch Inventory</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeStockLogsModal}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
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
