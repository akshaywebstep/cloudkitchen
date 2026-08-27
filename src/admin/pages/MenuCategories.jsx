import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  FolderTree,
  Search,
  Plus,
  Pencil,
  X,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  FolderPlus,
  ArrowRight,
  ChevronRight,
  List,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  XCircle,
  CornerDownRight,
  HelpCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getMenuCategoriesApi,
  getMenuCategoryByIdApi,
  createMenuCategoryApi,
  updateMenuCategoryApi,
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';
import { AlertTriangle } from 'lucide-react';

export const resolveCategoryImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/uploads')) return `https://dev2.screeningstar.co.in${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `https://dev2.screeningstar.co.in/${trimmed}`;
  if (trimmed.includes('uploads/')) {
    const relativePath = trimmed.substring(trimmed.indexOf('uploads/'));
    return `https://dev2.screeningstar.co.in/${relativePath.replace(/\\/g, '/')}`;
  }
  return trimmed;
};

export const MenuCategories = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  // Data state
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'ROOT' | 'SUB'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [viewingSubCategoriesCat, setViewingSubCategoriesCat] = useState(null);
  const [subCatSearch, setSubCatSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Subcategory Edit Modal states
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryEditForm, setSubCategoryEditForm] = useState({
    name: '',
    image: '',
    imageFile: null,
    status: 'ACTIVE',
  });
  const [subCategoryEditErrors, setSubCategoryEditErrors] = useState({});

  // Subcategory Batch Modal states
  const [subCategoryParent, setSubCategoryParent] = useState(null);
  const [subCategoriesList, setSubCategoriesList] = useState([
    { name: '', image: '', status: 'ACTIVE' }
  ]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    parentId: '',
    status: 'ACTIVE',
  });

  // Fetch Menu Categories List from API
  const fetchCategories = async (showLoader = true) => {
    if (showLoader) showLoading('Fetching menu categories...');
    try {
      const res = await getMenuCategoriesApi({ limit: 200 });
      const rawCats = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];

      if (rawCats.length > 0) {
        setCategories(rawCats);
      }
    } catch (err) {
      console.error('Failed to fetch menu categories:', err);
      toast.error('Failed to load menu categories.');
    } finally {
      if (showLoader) hideLoading();
    }
  };

  console.log('Fetched Categories:', categories);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Category lookup maps
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(String(cat.id), cat);
    });
    return map;
  }, [categories]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = categories.length;
    let root = 0;
    let sub = 0;
    let active = 0;
    let pending = 0;
    let inactive = 0;

    categories.forEach((c) => {
      const hasParent = c.parentId && c.parentId !== 0 && String(c.parentId) !== '0';
      if (hasParent) {
        sub++;
      } else {
        root++;
      }
      const st = String(c.status || '').toUpperCase();
      if (st === 'ACTIVE') active++;
      else if (st === 'PENDING') pending++;
      else inactive++;
    });

    return { total, root, sub, active, pending, inactive };
  }, [categories]);

  // Options for Parent Category Select (Clean labels without IDs)
  const parentOptions = useMemo(() => {
    const opts = [{ value: '', label: 'None (Root Category)' }];
    categories
      .filter((cat) => {
        // Exclude current category being edited from being its own parent
        if (editingCategory && String(cat.id) === String(editingCategory.id)) {
          return false;
        }
        return true;
      })
      .forEach((cat) => {
        opts.push({
          value: String(cat.id),
          label: cat.name,
        });
      });
    return opts;
  }, [categories, editingCategory]);

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'INACTIVE', label: 'INACTIVE' },
  ];

  // Filter logic
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(search.toLowerCase());
      const parentName = c.parentId ? categoryMap.get(String(c.parentId))?.name : '';
      const parentMatch = parentName?.toLowerCase().includes(search.toLowerCase());
      const matchesSearch = !search || nameMatch || parentMatch;

      const currentStatus = String(c.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter.toUpperCase();

      const isSub = Boolean(c.parentId && c.parentId !== 0 && String(c.parentId) !== '0');
      let matchesType = true;
      if (typeFilter === 'ROOT') matchesType = !isSub;
      if (typeFilter === 'SUB') matchesType = isSub;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [categories, search, statusFilter, typeFilter, categoryMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({
      name: '',
      parentId: '',
      image: '',
      imageFile: null,
      status: 'ACTIVE',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = async (cat) => {
    showLoading('Loading category details...');
    try {
      let target = cat;
      const res = await getMenuCategoryByIdApi(cat.id);
      if (res && res.status === true && res.data) {
        target = res.data;
      }
      setEditingCategory(target);
      setForm({
        name: target.name || '',
        parentId: target.parentId ? String(target.parentId) : '',
        image: target.image || '',
        imageFile: null,
        status: target.status || 'ACTIVE',
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load category for editing.');
    } finally {
      hideLoading();
    }
  };

  const handleMainImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result, imageFile: file }));
      toast.success('Category image selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleMainRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: '', imageFile: null }));
  };

  // Open View Modal
  const openViewModal = async (cat) => {
    showLoading('Fetching category details...');
    try {
      const res = await getMenuCategoryByIdApi(cat.id);
      if (res && res.status === true && res.data) {
        setViewingCategory(res.data);
      } else {
        setViewingCategory(cat);
      }
    } catch (err) {
      setViewingCategory(cat);
    } finally {
      hideLoading();
    }
  };

  // Open View Subcategories Modal
  const openViewSubCategoriesModal = async (cat) => {
    showLoading(`Loading subcategories for "${cat.name}"...`);
    setSubCatSearch('');
    try {
      const res = await getMenuCategoryByIdApi(cat.id);
      if (res && res.status === true && res.data) {
        setViewingSubCategoriesCat(res.data);
      } else {
        setViewingSubCategoriesCat(cat);
      }
    } catch (err) {
      setViewingSubCategoriesCat(cat);
    } finally {
      hideLoading();
    }
  };

  // Open Edit Subcategory Modal
  const openEditSubCategoryModal = (sub, parentCat) => {
    setEditingSubCategory({
      id: sub.id,
      name: sub.name,
      image: sub.image || '',
      status: sub.status || 'ACTIVE',
      parentId: parentCat?.id || null,
      parentName: parentCat?.name || '',
    });
    setSubCategoryEditForm({
      name: sub.name || '',
      image: sub.image || '',
      imageFile: null,
      status: sub.status || 'ACTIVE',
    });
    setSubCategoryEditErrors({});
  };

  const handleSubCategoryEditImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSubCategoryEditForm((prev) => ({ ...prev, image: reader.result, imageFile: file }));
      toast.success('Subcategory image selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubCategoryEditRemoveImage = () => {
    setSubCategoryEditForm((prev) => ({ ...prev, image: '', imageFile: null }));
  };

  const handleUpdateSubCategorySubmit = async (e) => {
    e.preventDefault();
    if (!subCategoryEditForm.name || !subCategoryEditForm.name.trim()) {
      setSubCategoryEditErrors({ name: 'Subcategory name is required.' });
      toast.error('Please enter subcategory name.');
      return;
    }

    setSubCategoryEditErrors({});
    showLoading(`Updating subcategory "${subCategoryEditForm.name}"...`);

    let payload;
    if (subCategoryEditForm.imageFile instanceof File) {
      const formData = new FormData();
      formData.append('name', subCategoryEditForm.name.trim());
      if (editingSubCategory.parentId) {
        formData.append('parentId', String(editingSubCategory.parentId));
      }
      formData.append('status', subCategoryEditForm.status || 'ACTIVE');
      formData.append('image', subCategoryEditForm.imageFile);
      payload = formData;
    } else {
      payload = {
        name: subCategoryEditForm.name.trim(),
        parentId: editingSubCategory.parentId ? Number(editingSubCategory.parentId) : null,
        status: subCategoryEditForm.status || 'ACTIVE',
        ...(subCategoryEditForm.image && !subCategoryEditForm.image.startsWith('data:')
          ? { image: subCategoryEditForm.image.trim() }
          : {}),
      };
    }

    try {
      const res = await updateMenuCategoryApi(editingSubCategory.id, payload);
      hideLoading();
      if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
        toast.success(res.message || `Subcategory "${subCategoryEditForm.name}" updated successfully!`);
        const targetParentId = editingSubCategory.parentId;
        setEditingSubCategory(null);
        await fetchCategories(false);

        if (targetParentId) {
          try {
            const updatedParentRes = await getMenuCategoryByIdApi(targetParentId);
            if (updatedParentRes && updatedParentRes.status === true && updatedParentRes.data) {
              setViewingSubCategoriesCat(updatedParentRes.data);
            }
          } catch (e) {
            // ignore
          }
        }
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setSubCategoryEditErrors(fieldErrors);
        }
        toast.error(getErrorMessage(res, 'Failed to update subcategory.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to communicate with menu server.');
    }
  };

  // Toggle Category Status (Active/Inactive)
  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    showLoading(`Setting status to ${newStatus}...`);
    try {
      const payload = {
        name: cat.name,
        ...(cat.parentId ? { parentId: Number(cat.parentId) } : { parentId: null }),
        status: newStatus,
      };
      const res = await updateMenuCategoryApi(cat.id, payload);
      if (res && (res.status === true || res.id)) {
        toast.success(`Category "${cat.name}" status updated to ${newStatus}!`);
        await fetchCategories(false);
      } else {
        toast.error(getErrorMessage(res, 'Failed to update category status.'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Error communicating with menu server.');
    } finally {
      hideLoading();
    }
  };

  // Form Submit Handler (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Category name is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please enter a valid category name.');
      return;
    }

    setErrors({});
    showLoading(editingCategory ? 'Updating menu category...' : 'Creating menu category...');

    let payload;
    if (form.imageFile instanceof File) {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      if (form.parentId) formData.append('parentId', String(form.parentId));
      formData.append('status', form.status || 'ACTIVE');
      formData.append('image', form.imageFile);
      payload = formData;
    } else {
      payload = {
        name: form.name.trim(),
        parentId: form.parentId ? Number(form.parentId) : null,
        status: form.status || 'ACTIVE',
        ...(form.image && !form.image.startsWith('data:') ? { image: form.image } : {}),
      };
    }

    try {
      let res;
      if (editingCategory) {
        res = await updateMenuCategoryApi(editingCategory.id, payload);
      } else {
        res = await createMenuCategoryApi(payload);
      }

      if (res && (res.status === true || res.id)) {
        toast.success(
          res.message ||
          `Menu category "${form.name}" ${editingCategory ? 'updated' : 'created'} successfully!`
        );
        setIsModalOpen(false);
        setEditingCategory(null);
        setForm({ name: '', parentId: '', image: '', imageFile: null, status: 'ACTIVE' });
        await fetchCategories(false);
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
        toast.error(getErrorMessage(res, 'Failed to save menu category.'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with server.');
    } finally {
      hideLoading();
    }
  };

  // ── Open Subcategory Batch Modal ──────────────────────────────
  const openSubCategoryModal = (parentCat) => {
    setSubCategoryParent(parentCat);
    setSubCategoriesList([
      { name: '', image: '', status: 'ACTIVE' }
    ]);
  };

  const handleAddSubCategoryRow = () => {
    setSubCategoriesList((prev) => [
      ...prev,
      { name: '', image: '', imageFile: null, status: 'ACTIVE' }
    ]);
  };

  const handleRemoveSubCategoryRow = (index) => {
    if (subCategoriesList.length <= 1) return;
    setSubCategoriesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubCategoryChange = (index, field, value) => {
    setSubCategoriesList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Subcategory image file picker handler (binary upload)
  const handleSubCategoryImageFileChange = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSubCategoriesList((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, image: reader.result, imageFile: file }
            : item
        )
      );
      toast.success('Subcategory image selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubCategoryRemoveImage = (index) => {
    setSubCategoriesList((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, image: '', imageFile: null } : item
      )
    );
  };

  // Subcategory Batch Submit Handler (Supports both JSON and binary FormData)
  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    if (!subCategoryParent) return;

    const validItems = subCategoriesList.filter((s) => s.name && s.name.trim());
    if (validItems.length === 0) {
      toast.error('Please enter at least one subcategory name.');
      return;
    }

    const hasBinaryFiles = validItems.some((s) => s.imageFile instanceof File);
    let payload;

    if (hasBinaryFiles) {
      // Send as binary multipart FormData
      const formData = new FormData();
      formData.append('parentId', String(subCategoryParent.id));

      const subCatsMeta = validItems.map((s, idx) => {
        const itemObj = {
          name: s.name.trim(),
          status: s.status || 'ACTIVE',
        };

        if (s.imageFile instanceof File) {
          itemObj.image = `image_${idx}`;
        } else if (typeof s.image === 'string' && s.image.trim() && !s.image.startsWith('data:')) {
          itemObj.image = s.image.trim();
        }

        return itemObj;
      });

      formData.append('subCategories', JSON.stringify(subCatsMeta));

      // Append binary file for each subcategory with exact key (e.g. image_0, image_1)
      validItems.forEach((s, idx) => {
        if (s.imageFile instanceof File) {
          formData.append(`image_${idx}`, s.imageFile);
        }
      });

      payload = formData;
    } else {
      // Standard JSON payload
      payload = {
        parentId: Number(subCategoryParent.id),
        subCategories: validItems.map((s) => ({
          name: s.name.trim(),
          ...(s.image && s.image.trim() && !s.image.startsWith('data:') ? { image: s.image.trim() } : {}),
          status: s.status || 'ACTIVE',
        })),
      };
    }

    showLoading(`Adding ${validItems.length} subcategor${validItems.length === 1 ? 'y' : 'ies'} to "${subCategoryParent.name}"...`);
    try {
      const res = await createMenuCategoryApi(payload);
      if (res && (res.status === true || res.success || res.id)) {
        toast.success(res.message || 'Subcategories added successfully!');
        setSubCategoryParent(null);
        await fetchCategories(false);
      } else {
        toast.error(res?.message || 'Failed to add subcategories.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error communicating with menu server.');
    } finally {
      hideLoading();
    }
  };

  // Custom react-select styling
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.25)' : 'none',
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
    <div className="space-y-7 pb-10 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                Menu Catalog Architecture
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {stats.active} Active Categories
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {stats.pending} Pending
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {stats.root} Root / {stats.sub} Sub-categories
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Menu Categories</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Create, organize, and manage culinary menu categories, sub-categories, hierarchy, and visibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCategories(true)}
              title="Refresh list"
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openCreateModal}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer shadow-brand-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ SEARCH & FILTER TOOLBAR ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search category name or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Filter Badges & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Hierarchy Filter */}
          <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
            {[
              { id: 'All', label: 'All Hierarchy' },
              { id: 'ROOT', label: 'Root Only' },
              { id: 'SUB', label: 'Sub Only' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${typeFilter === t.id
                    ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
            {['All', 'ACTIVE', 'PENDING', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${statusFilter === st
                    ? 'bg-[#8C0D0D] text-white shadow-md shadow-brand-900/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-brand-800 dark:text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand-800 dark:text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT (TABLE OR GRID) ═══════════ */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-6">
          {viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-4 px-5">#</th>
                      <th className="py-4 px-5">Category Name</th>
                      <th className="py-4 px-5">Hierarchy / Parent</th>
                      <th className="py-4 px-5">Sub-Categories</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Created Date</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {paginatedCategories.map((c, idx) => {
                      const isSub = Boolean(c.parentId && c.parentId !== 0 && String(c.parentId) !== '0');
                      const parentObj = isSub ? categoryMap.get(String(c.parentId)) : null;
                      const parentName = parentObj?.name || (isSub ? 'Sub-Category' : 'Root Category');
                      const subCategories = Array.isArray(c.subCategories) ? c.subCategories : [];
                      const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Indexing */}
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs">
                              {itemIndex}
                            </span>
                          </td>

                          {/* Category Name */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-xs">
                                {resolveCategoryImageUrl(c.image) ? (
                                  <img
                                    src={resolveCategoryImageUrl(c.image)}
                                    alt={c.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center ${
                                      isSub
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                        : 'bg-rose-50 dark:bg-rose-950/40 text-[#8C0D0D] dark:text-rose-400'
                                    }`}
                                  >
                                    {isSub ? <CornerDownRight className="w-4 h-4" /> : <FolderTree className="w-4 h-4" />}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                  {c.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {isSub ? 'Sub-Category' : 'Root Line Category'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Hierarchy / Parent */}
                          <td className="py-4 px-5">
                            {isSub ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-bold">
                                <CornerDownRight className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{parentName}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                                <Layers className="w-3 h-3 text-slate-400" />
                                Root Category
                              </span>
                            )}
                          </td>

                          {/* Sub-Categories */}
                          <td className="py-4 px-5">
                            {subCategories.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => openViewSubCategoriesModal(c)}
                                  title="Click to view all subcategories"
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-black border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>{subCategories.length} Subs</span>
                                </button>
                                {subCategories.slice(0, 2).map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold truncate max-w-[100px]"
                                  >
                                    {sub.name}
                                  </span>
                                ))}
                                {subCategories.length > 2 && (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    +{subCategories.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openSubCategoryModal(c)}
                                title="Add subcategories"
                                className="text-slate-400 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Sub</span>
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5">
                            <button
                              onClick={() => handleToggleStatus(c)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 border ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                  : c.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  c.status === 'ACTIVE'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : c.status === 'PENDING'
                                    ? 'bg-amber-500 animate-pulse'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {c.status || 'ACTIVE'}
                            </button>
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-5 text-slate-500 dark:text-slate-400 text-[11px]">
                            {c.createdAt ? (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">N/A</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Subcategories */}
                              <button
                                onClick={() => openViewSubCategoriesModal(c)}
                                title="View Subcategories"
                                className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-colors border border-purple-200 dark:border-purple-800/80 shadow-sm cursor-pointer active:scale-95"
                              >
                                <Layers className="w-4 h-4" />
                              </button>

                              {/* Add Subcategories */}
                              <button
                                onClick={() => openSubCategoryModal(c)}
                                title="Add Subcategories"
                                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors border border-emerald-200 dark:border-emerald-800/80 shadow-sm cursor-pointer active:scale-95"
                              >
                                <FolderPlus className="w-4 h-4" />
                              </button>

                              {/* View */}
                              <button
                                onClick={() => openViewModal(c)}
                                title="View Details"
                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors border border-slate-200/70 dark:border-slate-700/60 shadow-sm cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Upgraded Edit Button */}
                              <button
                                onClick={() => openEditModal(c)}
                                title="Edit Category"
                                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white transition-colors border border-amber-200 dark:border-amber-800/80 shadow-sm cursor-pointer active:scale-95"
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
          ) : (
            /* GRID / CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {paginatedCategories.map((c, idx) => {
                const isSub = Boolean(c.parentId && c.parentId !== 0 && String(c.parentId) !== '0');
                const parentObj = isSub ? categoryMap.get(String(c.parentId)) : null;
                const parentName = parentObj?.name || (isSub ? 'Sub-Category' : 'Root Category');
                const subCategories = Array.isArray(c.subCategories) ? c.subCategories : [];
                const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-xs">
                            {resolveCategoryImageUrl(c.image) ? (
                              <img
                                src={resolveCategoryImageUrl(c.image)}
                                alt={c.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center ${
                                  isSub
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-400'
                                }`}
                              >
                                {isSub ? <CornerDownRight className="w-5 h-5" /> : <FolderTree className="w-5 h-5" />}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                              #{itemIndex} • {isSub ? 'Sub Category' : 'Root Category'}
                            </span>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight truncate">
                              {c.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title="Click to toggle status"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all hover:scale-105 ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : c.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {c.status || 'ACTIVE'}
                        </button>
                      </div>

                      {/* Hierarchy info */}
                      <div className="space-y-2 mb-4">
                        {isSub ? (
                          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 text-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                              Parent Category
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              {parentName}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Catalog Level
                            </span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              Root Primary Level
                            </span>
                          </div>
                        )}

                        {/* Sub-categories if any */}
                        {subCategories.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Direct Subcategories ({subCategories.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => openViewSubCategoriesModal(c)}
                                className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>View all</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {subCategories.map((sub) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => openViewSubCategoriesModal(c)}
                                  className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-100 dark:border-purple-900/40 cursor-pointer transition-colors"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Active'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openViewSubCategoriesModal(c)}
                          title="View Subcategories"
                          className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-colors border border-purple-200 dark:border-purple-800 cursor-pointer active:scale-95"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openSubCategoryModal(c)}
                          title="Add Subcategories"
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer active:scale-95"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openViewModal(c)}
                          title="View Details"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Category"
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCategories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onLimitChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
            limitOptions={[10, 20, 50, 100]}
          />
        </div>
      ) : (
        /* EMPTY STATE */
        <EmptyState
          icon={FolderTree}
          title="No Menu Categories Found"
          description={
            search || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No categories match the active filter or search criteria. Try clearing your filters.'
              : 'There are currently no menu categories configured. Create your first category to get started!'
          }
          actionLabel="Create Menu Category"
          onAction={openCreateModal}
        />
      )}

      {/* ═══════════ CREATE / EDIT MODAL ═══════════ */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop flex flex-col">
              {/* Modal Header */}
              <div className="bg-[#8C0D0D] text-white p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-rose-200" />
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Menu Category'}
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    {editingCategory
                      ? 'Update name, parent category, or status'
                      : 'Add a new main or sub category line'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold">
                {(errors.general || errors.form) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">{errors.general || errors.form}</div>
                  </div>
                )}
                {/* Category Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category name (e.g. Biryani, Starters, Desserts)..."
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${errors.name
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

                {/* Category Image (Binary upload or URL) */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold items-center justify-between">
                    <span>Category Image</span>
                    {form.imageFile && (
                      <span className="text-[10px] text-emerald-600 font-extrabold normal-case">Binary file selected</span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    {form.image ? (
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={form.image}
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleMainRemoveImage}
                          className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Paste direct image URL or browse image file..."
                      value={form.imageFile ? form.imageFile.name : (form.image || '')}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      disabled={Boolean(form.imageFile)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-[#8C0D0D] disabled:opacity-80"
                    />

                    <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                      <Upload className="w-4 h-4" />
                      <span>Browse</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                    Category Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === form.status)}
                    onChange={(opt) => setForm({ ...form, status: opt ? opt.value : 'ACTIVE' })}
                    styles={customSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer shadow-brand-900/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════ VIEW DETAILS MODAL ═══════════ */}
      {viewingCategory &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop flex flex-col">
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-rose-400">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black leading-tight">{viewingCategory.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {viewingCategory.parentId ? 'Sub-Category Line' : 'Root Line Category'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingCategory(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-xs font-semibold">
                {/* Category Image Preview */}
                {resolveCategoryImageUrl(viewingCategory.image) && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                    <img
                      src={resolveCategoryImageUrl(viewingCategory.image)}
                      alt={viewingCategory.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                        viewingCategory.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : viewingCategory.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {viewingCategory.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Hierarchy Level
                    </span>
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">
                      {viewingCategory.parentId ? 'Sub-Category' : 'Root Category'}
                    </span>
                  </div>
                </div>

                {viewingCategory.parentId && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                      Parent Category
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {categoryMap.get(String(viewingCategory.parentId))?.name || 'Assigned Parent'}
                    </span>
                  </div>
                )}

                {Array.isArray(viewingCategory.subCategories) &&
                  viewingCategory.subCategories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Direct Subcategories ({viewingCategory.subCategories.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {viewingCategory.subCategories.map((sub, sIdx) => (
                          <div
                            key={sub.id || sIdx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] flex items-center justify-center">
                                {sIdx + 1}
                              </span>
                              {sub.name}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {viewingCategory.createdAt && (
                  <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                    <p>
                      Created on: {new Date(viewingCategory.createdAt).toLocaleString()}
                    </p>
                    {viewingCategory.updatedAt && (
                      <p>
                        Last updated: {new Date(viewingCategory.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      const target = viewingCategory;
                      setViewingCategory(null);
                      openViewSubCategoriesModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    View Subcategories
                  </button>
                  <button
                    onClick={() => {
                      const target = viewingCategory;
                      setViewingCategory(null);
                      openSubCategoryModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Add Subcategories
                  </button>
                  <button
                    onClick={() => {
                      const target = viewingCategory;
                      setViewingCategory(null);
                      openEditModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Category
                  </button>
                  <button
                    onClick={() => setViewingCategory(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════ ADD MULTIPLE SUBCATEGORIES MODAL ═══════════ */}
      {subCategoryParent &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-3xl w-full overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-[#8C0D0D] text-white p-5 sm:p-6 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <FolderPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      Add Subcategories
                    </h3>
                    <p className="text-xs text-rose-100 mt-0.5 font-medium flex items-center gap-1.5">
                      <span>Adding items under</span>
                      <span className="font-extrabold px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                        {subCategoryParent.name}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubCategoryParent(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubCategorySubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Subcategory Items ({subCategoriesList.length})
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Fill in names and optionally upload images or choose status
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSubCategoryRow}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all text-xs font-extrabold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/80 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Subcategory
                    </button>
                  </div>

                  <div className="space-y-4">
                    {subCategoriesList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              Subcategory #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Status selector */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Status:
                              </label>
                              <select
                                value={item.status || 'ACTIVE'}
                                onChange={(e) => handleSubCategoryChange(idx, 'status', e.target.value)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border transition-colors ${item.status === 'INACTIVE'
                                    ? 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                              </select>
                            </div>

                            {/* Remove row button */}
                            {subCategoriesList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubCategoryRow(idx)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Remove this subcategory"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* Name Input */}
                          <div className="md:col-span-5 space-y-1.5">
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Subcategory Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter subcategory name (e.g. Burgers, Pizzas, Rolls)..."
                              value={item.name}
                              onChange={(e) => handleSubCategoryChange(idx, 'name', e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-[#8C0D0D] focus:ring-1 focus:ring-[#8C0D0D]/20 placeholder:text-slate-400"
                            />
                          </div>

                          {/* Image Upload / URL Input */}
                          <div className="md:col-span-7 space-y-1.5">
                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                              <span>Image (Upload File or URL)</span>
                              {item.imageFile ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold normal-case flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Binary file ready
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-normal normal-case">Optional</span>
                              )}
                            </label>

                            <div className="flex items-center gap-2">
                              {/* Preview Box */}
                              {item.image ? (
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-inner group/thumb">
                                  <img
                                    src={item.image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSubCategoryRemoveImage(idx)}
                                    className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                                    title="Remove Image"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center text-slate-400 shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}

                              {/* URL / File name Input */}
                              <input
                                type="text"
                                placeholder="Paste direct image URL or browse image file..."
                                value={item.imageFile ? item.imageFile.name : (item.image || '')}
                                onChange={(e) => handleSubCategoryChange(idx, 'image', e.target.value)}
                                disabled={Boolean(item.imageFile)}
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-[#8C0D0D] focus:ring-1 focus:ring-[#8C0D0D]/20 placeholder:text-slate-400 disabled:opacity-80"
                              />

                              {/* Upload Button */}
                              <label className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95">
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span>Browse</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSubCategoryImageFileChange(idx, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddSubCategoryRow}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    Add Another Subcategory
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSubCategoryParent(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs shadow-md shadow-brand-900/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Save {subCategoriesList.length} Subcategor{subCategoriesList.length === 1 ? 'y' : 'ies'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════ VIEW SUBCATEGORIES MODAL ═══════════ */}
      {viewingSubCategoriesCat &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full overflow-hidden animate-modal-pop flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-[#8C0D0D] text-white p-5 sm:p-6 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      Subcategories
                    </h3>
                    <p className="text-xs text-rose-100 mt-0.5 font-medium flex items-center gap-1.5">
                      <span>Listing subcategories under</span>
                      <span className="font-extrabold px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                        {viewingSubCategoriesCat.name}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingSubCategoriesCat(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subcategories List & Content */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
                {/* Search / Filter Bar & Count inside Modal */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search subcategory name..."
                      value={subCatSearch}
                      onChange={(e) => setSubCatSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-[#8C0D0D]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingSubCategoriesCat;
                      setViewingSubCategoriesCat(null);
                      openSubCategoryModal(target);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all text-xs font-extrabold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/80 cursor-pointer shadow-sm active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add More</span>
                  </button>
                </div>

                {/* Subcategories Manifest */}
                {Array.isArray(viewingSubCategoriesCat.subCategories) &&
                  viewingSubCategoriesCat.subCategories.length > 0 ? (
                  (() => {
                    const filteredSubs = viewingSubCategoriesCat.subCategories.filter((s) =>
                      s.name?.toLowerCase().includes(subCatSearch.toLowerCase().trim())
                    );

                    if (filteredSubs.length === 0) {
                      return (
                        <div className="py-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            No subcategories match "{subCatSearch}"
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Try searching with a different keyword.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {filteredSubs.map((sub, sIdx) => (
                          <div
                            key={sub.id || sIdx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Serial Number */}
                              <span className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                                {sIdx + 1}
                              </span>

                              {/* Image or Icon */}
                              {resolveCategoryImageUrl(sub.image) ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs">
                                  <img
                                    src={resolveCategoryImageUrl(sub.image)}
                                    alt={sub.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                  <FolderTree className="w-4 h-4 text-purple-600" />
                                </div>
                              )}

                              {/* Subcategory Details */}
                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                  {sub.name}
                                </h5>
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  Subcategory Item
                                </span>
                              </div>
                            </div>

                            {/* Status Badge & Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  sub.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : sub.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}
                              >
                                {sub.status || 'ACTIVE'}
                              </span>

                              {/* Edit Subcategory Action */}
                              <button
                                type="button"
                                onClick={() => openEditSubCategoryModal(sub, viewingSubCategoriesCat)}
                                title="Edit this subcategory"
                                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-all border border-amber-200 dark:border-amber-800/80 cursor-pointer shadow-xs active:scale-95"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-10 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                        No Subcategories Found
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        "{viewingSubCategoriesCat.name}" does not have any subcategories yet.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingSubCategoriesCat;
                        setViewingSubCategoriesCat(null);
                        openSubCategoryModal(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Subcategories Now</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingSubCategoriesCat;
                    setViewingSubCategoriesCat(null);
                    openSubCategoryModal(target);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Add Subcategories
                </button>

                <button
                  type="button"
                  onClick={() => setViewingSubCategoriesCat(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════ EDIT SUBCATEGORY MODAL ═══════════ */}
      {editingSubCategory &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-amber-600 text-white p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Edit Subcategory
                    </h3>
                    <p className="text-xs text-amber-100 font-medium">
                      Under parent: {editingSubCategory.parentName || 'Parent Category'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSubCategory(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateSubCategorySubmit} noValidate className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                {(subCategoryEditErrors.general || subCategoryEditErrors.form) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-xs font-bold leading-relaxed">{subCategoryEditErrors.general || subCategoryEditErrors.form}</div>
                  </div>
                )}
                {/* Subcategory Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold text-xs">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter subcategory name (e.g. Boneless Mutton)..."
                    value={subCategoryEditForm.name}
                    onChange={(e) => {
                      setSubCategoryEditForm((prev) => ({ ...prev, name: e.target.value }));
                      if (subCategoryEditErrors.name) setSubCategoryEditErrors((prev) => ({ ...prev, name: null }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                      subCategoryEditErrors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-amber-600'
                    }`}
                  />
                  {subCategoryEditErrors.name && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {subCategoryEditErrors.name}
                    </p>
                  )}
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold text-xs">
                    Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === subCategoryEditForm.status)}
                    onChange={(opt) => setSubCategoryEditForm((prev) => ({ ...prev, status: opt ? opt.value : 'ACTIVE' }))}
                    styles={customSelectStyles}
                    isSearchable={false}
                    placeholder="Select status..."
                  />
                </div>

                {/* Subcategory Image Upload / URL */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold text-xs">
                    Subcategory Image (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                        {resolveCategoryImageUrl(subCategoryEditForm.image) ? (
                          <img
                            src={resolveCategoryImageUrl(subCategoryEditForm.image)}
                            alt="Subcategory Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs">
                            <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSubCategoryEditImageFileChange}
                              className="hidden"
                            />
                          </label>
                          {subCategoryEditForm.image && (
                            <button
                              type="button"
                              onClick={handleSubCategoryEditRemoveImage}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Upload file (Max 5MB) or enter URL below
                        </p>
                      </div>
                    </div>

                    <input
                      type="url"
                      placeholder="Or enter direct image URL (https://...)..."
                      value={typeof subCategoryEditForm.image === 'string' && !subCategoryEditForm.image.startsWith('data:image/') ? subCategoryEditForm.image : ''}
                      onChange={(e) => setSubCategoryEditForm((prev) => ({ ...prev, image: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingSubCategory(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-900/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Save Subcategory
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
