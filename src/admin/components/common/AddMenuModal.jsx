import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  X,
  Plus,
  Image as ImageIcon,
  DollarSign,
  Utensils,
  UploadCloud,
  Trash2,
  AlertCircle,
  Building2,
  GitBranch,
  FolderTree,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getKitchensApi,
  getBranchesApi,
  getMenuCategoriesApi,
  getIngredientsApi,
  createMenuItemApi
} from '../../services/api';
import { extractFieldErrors, getErrorMessage } from '../../utils/errorHelper';
import {
  getConversionHint,
  getSanityWarning,
  formatRecipeQty,
  calculateStockCapacity
} from '../../utils/recipeHelper';

export const AddMenuModal = () => {
  const { isAddMenuOpen, setIsAddMenuOpen } = useApp();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { theme } = useTheme();

  // Dynamic dropdown lists
  const [kitchens, setKitchens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);

  // Form Fields matching backend API specifications
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    kitchenId: '',
    branchId: '',
    categoryId: '',
    subCategoryId: '',
    imageUrl: '',
  });

  // Selected ingredients dynamic list [{ id, name, unit, quantity }]
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [tempIngredientId, setTempIngredientId] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');
  const [tempUnit, setTempUnit] = useState('gm');

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAddMenuOpen) {
      loadDropdownsData();
    }
  }, [isAddMenuOpen]);

  const loadDropdownsData = async () => {
    try {
      const [kRes, bRes, cRes, iRes] = await Promise.all([
        getKitchensApi(),
        getBranchesApi({ limit: 200 }),
        getMenuCategoriesApi({ limit: 200 }),
        getIngredientsApi({ limit: 200 }),
      ]);

      let firstKitchenId = '';
      let allBranches = [];

      if (kRes && kRes.status && Array.isArray(kRes.data)) {
        setKitchens(kRes.data);
        if (kRes.data.length > 0) {
          firstKitchenId = kRes.data[0].id;
        }
      }

      if (bRes && bRes.status && Array.isArray(bRes.data)) {
        allBranches = bRes.data;
        setBranches(allBranches);
      }

      // Automatically select default kitchen and its matching branch
      if (firstKitchenId) {
        const matchingBranches = allBranches.filter((b) => {
          const kId = String(firstKitchenId);
          return (
            String(b.userId) === kId ||
            String(b.kitchenId) === kId ||
            String(b.user?.id) === kId ||
            String(b.kitchen?.id) === kId
          );
        });

        const firstBranchId = matchingBranches.length > 0 ? matchingBranches[0].id : (allBranches[0]?.id || '');

        setFormData((prev) => ({
          ...prev,
          kitchenId: firstKitchenId,
          branchId: firstBranchId,
        }));
      }

      const rawCategories = Array.isArray(cRes?.allCategories)
        ? cRes.allCategories
        : Array.isArray(cRes?.categories)
        ? cRes.categories
        : Array.isArray(cRes?.data)
        ? cRes.data
        : [];

      if (rawCategories.length > 0) {
        setCategories(rawCategories);
        setFormData((prev) => ({ ...prev, categoryId: rawCategories[0].id }));
      }

      if (iRes && iRes.status && Array.isArray(iRes.data)) {
        setIngredientsList(iRes.data);
      }
    } catch (err) {
      console.error('Failed loading menu dependencies:', err);
    }
  };

  if (!isAddMenuOpen) return null;

  const scrollToFirstError = (errObj) => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`add-dish-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const handleAddIngredient = () => {
    if (!tempIngredientId) {
      toast.error('Please select an ingredient.');
      return;
    }
    const parsedQty = parseFloat(tempQuantity);
    if (!tempQuantity || isNaN(parsedQty) || parsedQty <= 0) {
      toast.error('Please specify a valid quantity greater than 0.');
      return;
    }

    const ingObj = ingredientsList.find((i) => i.id === Number(tempIngredientId));
    if (!ingObj) return;

    if (selectedIngredients.some((item) => item.id === ingObj.id)) {
      toast.error('Ingredient already added to recipe.');
      return;
    }

    setSelectedIngredients((prev) => [
      ...prev,
      {
        id: ingObj.id,
        name: ingObj.name,
        unit: tempUnit || ingObj.unit || 'gm',
        quantity: parsedQty,
      },
    ]);

    setTempIngredientId('');
    setTempQuantity('');
    setTempUnit('gm');
  };

  const handleUpdateIngredient = (id, field, value) => {
    setSelectedIngredients((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveIngredient = (id) => {
    setSelectedIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result, imageFile: file }));
        toast.success('Food photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '', imageFile: null }));
  };

  const handleClose = () => {
    setIsAddMenuOpen(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      kitchenId: '',
      branchId: '',
      categoryId: '',
      subCategoryId: '',
      imageUrl: '',
      imageFile: null,
    });
    setSelectedIngredients([]);
    setTempIngredientId('');
    setTempQuantity('');
    setTempUnit('gm');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Dish name is required.';
    }

    const numPrice = parseFloat(formData.price);
    if (!formData.price || formData.price === '') {
      newErrors.price = 'Price is required.';
    } else if (isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0.';
    }

    if (!formData.kitchenId) {
      newErrors.kitchenId = 'Please select a kitchen.';
    }

    if (!formData.branchId) {
      newErrors.branchId = 'Please select a branch outlet.';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a primary category.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix highlighted errors before adding the dish.');
      setTimeout(() => scrollToFirstError(newErrors), 100);
      return;
    }

    setErrors({});
    showLoading('Creating new menu item...');

    let payload;
    if (formData.imageFile) {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('description', formData.description.trim());
      fd.append('price', numPrice);
      fd.append('kitchenId', Number(formData.kitchenId));
      fd.append('branchId', Number(formData.branchId));
      fd.append('categoryId', Number(formData.categoryId));
      if (formData.subCategoryId) {
        fd.append('subCategoryId', Number(formData.subCategoryId));
      }
      fd.append('image', formData.imageFile);
      if (selectedIngredients.length > 0) {
        fd.append(
          'ingredients',
          JSON.stringify(
            selectedIngredients.map((item) => ({
              id: Number(item.id),
              quantity: Number(item.quantity),
            }))
          )
        );
      }
      payload = fd;
    } else {
      payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: numPrice,
        kitchenId: Number(formData.kitchenId),
        branchId: Number(formData.branchId),
        categoryId: Number(formData.categoryId),
        ...(formData.subCategoryId
          ? { subCategoryId: Number(formData.subCategoryId) }
          : {}),
        ...(formData.imageUrl && !formData.imageUrl.startsWith('data:')
          ? { image: formData.imageUrl }
          : {}),
        ingredients: selectedIngredients.map((item) => ({
          id: Number(item.id),
          quantity: Number(item.quantity),
        })),
      };
    }

    try {
      const res = await createMenuItemApi(payload);
      hideLoading();

      if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
        toast.success(res.message || `"${formData.name}" added to menu catalog!`);
        window.dispatchEvent(new CustomEvent('menuItemAdded'));
        handleClose();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors), 100);
        }
        toast.error(getErrorMessage(res, 'Failed to create menu item on server.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to connect to menu server.');
    }
  };

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

  const kitchenOptions = kitchens.map((k) => ({ value: k.id, label: k.name || k.kitchenName || 'Kitchen' }));

  // Filter branches strictly belonging to the currently selected kitchen
  const filteredBranches = branches.filter((b) => {
    if (!formData.kitchenId) return false;
    const kId = String(formData.kitchenId);
    return (
      String(b.userId) === kId ||
      String(b.kitchenId) === kId ||
      String(b.user?.id) === kId ||
      String(b.kitchen?.id) === kId
    );
  });

  const branchOptions = filteredBranches.map((b) => ({
    value: b.id,
    label: b.name || 'Branch',
  }));

  const categoryOpts = categories.map((c) => ({ value: c.id, label: c.name || 'Category' }));
  const ingredientOpts = ingredientsList.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit || 'Qty'})`,
  }));

  const unitOptions = [
    { value: 'gm', label: 'gm (Gram)' },
    { value: 'kg', label: 'kg (Kilogram)' },
    { value: 'ml', label: 'ml (Milliliter)' },
    { value: 'ltr', label: 'ltr (Liter)' },
    { value: 'pcs', label: 'pcs (Pieces)' },
    { value: 'tbsp', label: 'tbsp (Tablespoon)' },
    { value: 'tsp', label: 'tsp (Teaspoon)' },
    { value: 'cup', label: 'cup (Cup)' },
    { value: 'pinch', label: 'pinch (Pinch)' },
    { value: 'slice', label: 'slice (Slice)' },
    { value: 'packet', label: 'packet (Packet)' },
    { value: 'can', label: 'can (Can)' },
    { value: 'bottle', label: 'bottle (Bottle)' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-3xl w-full overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Utensils className="w-5 h-5 text-rose-200" />
              Add New Dish to Menu
            </h3>
            <p className="text-xs text-rose-100 mt-1 font-medium">
              Create menu item with ingredients & branch allocation
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 text-xs font-semibold overflow-y-auto">
          {(errors.general || errors.form) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs font-bold leading-relaxed">{errors.general || errors.form}</div>
            </div>
          )}

          {/* Kitchen & Branch Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                Select Kitchen *
              </label>
              <Select
                id="add-dish-kitchenId"
                options={kitchenOptions}
                value={kitchenOptions.find((opt) => String(opt.value) === String(formData.kitchenId)) || null}
                onChange={(opt) => {
                  const selectedKId = opt ? opt.value : '';
                  // Find branches for this selected kitchen
                  const matchingBranches = branches.filter((b) => {
                    if (!selectedKId) return false;
                    const kId = String(selectedKId);
                    return (
                      String(b.userId) === kId ||
                      String(b.kitchenId) === kId ||
                      String(b.user?.id) === kId ||
                      String(b.kitchen?.id) === kId
                    );
                  });

                  const newBranchId = matchingBranches.length > 0 ? matchingBranches[0].id : '';

                  setFormData((prev) => ({
                    ...prev,
                    kitchenId: selectedKId,
                    branchId: newBranchId,
                  }));

                  if (errors.kitchenId) setErrors((prev) => ({ ...prev, kitchenId: null }));
                  if (errors.branchId && newBranchId) setErrors((prev) => ({ ...prev, branchId: null }));
                }}
                styles={customSelectStyles}
                isSearchable={true}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
              {errors.kitchenId && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.kitchenId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                Select Branch Outlet *
              </label>
              <Select
                id="add-dish-branchId"
                options={branchOptions}
                value={branchOptions.find((opt) => String(opt.value) === String(formData.branchId)) || null}
                onChange={(opt) => {
                  setFormData({ ...formData, branchId: opt ? opt.value : '' });
                  if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: null }));
                }}
                placeholder={
                  !formData.kitchenId
                    ? 'Select a kitchen first...'
                    : branchOptions.length === 0
                    ? 'No branches for this kitchen'
                    : 'Select Branch Outlet...'
                }
                noOptionsMessage={() =>
                  !formData.kitchenId
                    ? 'Please select a kitchen first'
                    : 'No branches found for this kitchen'
                }
                styles={customSelectStyles}
                isSearchable={true}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
              {errors.branchId && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.branchId}
                </p>
              )}
            </div>
          </div>

          {/* Dish Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                Dish Name *
              </label>
              <input
                id="add-dish-name"
                type="text"
                placeholder="Enter dish name (e.g. Butter Chicken)..."
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
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                Price (₹) *
              </label>
              <div className="relative">
                <input
                  id="add-dish-price"
                  type="number"
                  step="0.01"
                  placeholder="Enter price (e.g. 299.00)..."
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value });
                    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                  }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                    errors.price
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                  }`}
                />
                <DollarSign className={`w-4 h-4 absolute left-3 top-3 pointer-events-none ${errors.price ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              {errors.price && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* Category & SubCategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                Category *
              </label>
              <Select
                id="add-dish-categoryId"
                options={categoryOpts}
                value={categoryOpts.find((opt) => String(opt.value) === String(formData.categoryId))}
                onChange={(opt) => {
                  setFormData({ ...formData, categoryId: opt ? opt.value : '', subCategoryId: '' });
                  if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
                }}
                placeholder="Select category..."
                styles={customSelectStyles}
                isSearchable={true}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
              {errors.categoryId && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
                SubCategory
              </label>
              <Select
                options={(() => {
                  const selectedCatObj = categories.find((c) => String(c.id) === String(formData.categoryId));
                  const subs = selectedCatObj?.subCategories || [];
                  return subs.map((s) => ({ value: s.id, label: s.name || `SubCategory #${s.id}` }));
                })()}
                value={(() => {
                  const selectedCatObj = categories.find((c) => String(c.id) === String(formData.categoryId));
                  const subs = selectedCatObj?.subCategories || [];
                  const subOpts = subs.map((s) => ({ value: s.id, label: s.name || `SubCategory #${s.id}` }));
                  return subOpts.find((opt) => String(opt.value) === String(formData.subCategoryId)) || null;
                })()}
                onChange={(opt) => setFormData({ ...formData, subCategoryId: opt ? opt.value : '' })}
                styles={customSelectStyles}
                isSearchable={true}
                isClearable={true}
                placeholder="Select subcategory..."
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </div>
          </div>

          {/* Dish Photo */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
              Dish Photo (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Dish Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs">
                      <UploadCloud className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                      <span>Upload Food Image</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {formData.imageUrl && (
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
                    Select local food photo (binary file upload, max 5MB)
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Or paste direct food image URL (e.g. https://...)"
                value={typeof formData.imageUrl === 'string' && !formData.imageUrl.startsWith('data:image/') ? formData.imageUrl : ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value, imageFile: null }));
                  if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none ${
                  errors.image
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                }`}
              />
              {errors.image && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.image}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Enter dish description, culinary notes, or key ingredients..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none ${
                errors.description
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
              }`}
            />
            {errors.description && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Ingredients Recipe Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-800 dark:text-rose-400" />
              Dish Ingredients & Recipe Quantities
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full min-w-0">
                <Select
                  options={ingredientOpts}
                  value={ingredientOpts.find((opt) => String(opt.value) === String(tempIngredientId)) || null}
                  onChange={(opt) => {
                    const selectedId = opt ? opt.value : '';
                    setTempIngredientId(selectedId);
                    if (selectedId) {
                      const ing = ingredientsList.find((i) => String(i.id) === String(selectedId));
                      if (ing?.unit) {
                        setTempUnit(ing.unit);
                      }
                    }
                  }}
                  placeholder="Select recipe ingredient..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
              </div>

              <div className="w-full sm:w-28">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter qty (e.g. 250)..."
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-[#8C0D0D]"
                />
              </div>

              <div className="w-full sm:w-28">
                <Select
                  options={unitOptions}
                  value={unitOptions.find((opt) => String(opt.value).toLowerCase() === String(tempUnit).toLowerCase()) || { value: tempUnit, label: tempUnit }}
                  onChange={(opt) => setTempUnit(opt ? opt.value : 'gm')}
                  placeholder="Select unit..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
              </div>

              <button
                type="button"
                onClick={handleAddIngredient}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Solution 1: Live Conversion Hint & Solution 2: Sanity Warning for Add Bar */}
            {(() => {
              const tempHint = getConversionHint(tempQuantity, tempUnit);
              const tempWarning = getSanityWarning(tempQuantity, tempUnit);
              return (
                <div className="space-y-1.5">
                  {tempWarning && (
                    <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/70 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700/80 flex items-center justify-between gap-2 animate-fade-in shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{tempWarning.message}</span>
                      </div>
                      {tempWarning.fixPayload && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempQuantity(tempWarning.fixPayload.quantity);
                            setTempUnit(tempWarning.fixPayload.unit);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[10px] cursor-pointer shrink-0 transition-all active:scale-95 shadow-xs"
                        >
                          {tempWarning.fixLabel}
                        </button>
                      )}
                    </div>
                  )}

                  {tempHint && !tempWarning && (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{tempHint.text}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Selected ingredients list with Auto Conversion Preview */}
            {selectedIngredients.length > 0 ? (
              <div className="space-y-2 pt-2 max-h-56 overflow-y-auto pr-1">
                {selectedIngredients.map((item) => {
                  const rowHint = getConversionHint(item.quantity, item.unit);
                  const rowWarning = getSanityWarning(item.quantity, item.unit);
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {item.name}
                          </span>
                          {rowHint?.badge && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/50 hidden sm:inline-block">
                              {rowHint.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateIngredient(item.id, 'quantity', e.target.value)
                              }
                              className="w-16 px-1.5 py-1 text-center text-xs font-black bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#8C0D0D]"
                              title="Edit quantity"
                            />
                            <input
                              type="text"
                              placeholder="Unit"
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateIngredient(item.id, 'unit', e.target.value)
                              }
                              className="w-14 px-1.5 py-1 text-center text-[11px] font-extrabold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#8C0D0D] uppercase"
                              title="Edit unit (e.g. GM, ML, PCS)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remove ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row Sanity Warning If user edits to high value */}
                      {rowWarning && (
                        <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-1">
                          <span>{rowWarning.message}</span>
                          {rowWarning.fixPayload && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateIngredient(item.id, 'quantity', rowWarning.fixPayload.quantity);
                                handleUpdateIngredient(item.id, 'unit', rowWarning.fixPayload.unit);
                              }}
                              className="px-2 py-0.5 bg-amber-600 text-white rounded font-black text-[9px] hover:bg-amber-700 cursor-pointer"
                            >
                              Auto-fix
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium italic">
                No ingredients added to this dish recipe yet. Select an ingredient above to assign quantity.
              </p>
            )}

            {/* Solution 3: Stock Yield & Capacity Breakdown */}
            {(() => {
              const stockCap = calculateStockCapacity(selectedIngredients, ingredientsList);
              if (!stockCap || !stockCap.yields?.length) return null;
              return (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 text-white space-y-2 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Current Stock Capacity
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-extrabold">
                      Max ~{stockCap.maxDishes} Orders
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] font-medium text-slate-300">
                    {stockCap.yields.slice(0, 3).map((y) => (
                      <div key={y.ingredientId} className="flex items-center justify-between">
                        <span>
                          {y.availableStock} {y.stockUnit} {y.name}
                        </span>
                        <span className="font-extrabold text-slate-200">
                          = {y.dishesPossible} dishes
                        </span>
                      </div>
                    ))}
                  </div>

                  {stockCap.bottleneck && (
                    <div className="pt-1 border-t border-slate-800 flex items-center gap-1 text-[10px] text-rose-300 font-bold">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>
                        <strong>{stockCap.bottleneck.name}</strong> sabse pehle khatam hoga (Bottleneck: ~{stockCap.bottleneck.dishesPossible} servings).
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs shadow-brand hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item to Menu
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
