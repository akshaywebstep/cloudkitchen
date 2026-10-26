import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
  X,
  Plus,
  Image as ImageIcon,
  IndianRupee,
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
  Layers,
  Loader2,
  Info,
  Check,
  Boxes,
  Link2
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
  createMenuItemApi,
  getAiRecipeApi,
  quickProvisionIngredientsApi
} from '../../services/api';
import { extractFieldErrors, getErrorMessage } from '../../utils/errorHelper';
import {
  normalizeUnit,
  getConversionHint,
  getSanityWarning,
  formatRecipeQty,
  calculateStockCapacity
} from '../../utils/recipeHelper';
import { STANDARD_MEASURE_UNITS, findUnitOption } from '../../../constants/measureUnits';

export const INGREDIENT_PRESET_IMAGES = [
  { label: "Spices & Masala", url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80" },
  { label: "Vegetables", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80" },
  { label: "Paneer & Dairy", url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80" },
  { label: "Rice & Grains", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80" },
  { label: "Oils & Ghee", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80" },
  { label: "Meat & Chicken", url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80" },
  { label: "Bakery & Flour", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80" },
  { label: "Sauces & Condiments", url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80" },
  { label: "Herbs & Greens", url: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80" },
  { label: "Onion & Garlic", url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80" },
  { label: "Tomato & Puree", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80" },
  { label: "General Grocery", url: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=400&q=80" },
];

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
  const [tempUnit, setTempUnit] = useState('GM');

  const [errors, setErrors] = useState({});

  // AI Recipe Auto-Fill States
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [unmatchedAiItems, setUnmatchedAiItems] = useState([]);
  const [aiChefTip, setAiChefTip] = useState('');

  // Quick Provision States (AI suggestions -> Catalog + Inventory)
  const [showStockModal, setShowStockModal] = useState(false);
  const [provisionItems, setProvisionItems] = useState([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [activeImageModalIdx, setActiveImageModalIdx] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState('');

  // Dynamic category options combining Menu Categories + Standard Food categories
  const dynamicCategoryOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (categories || []).forEach((cat) => {
      const name = (cat.name || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ value: name, label: name });
      }
    });

    const standardCategories = [
      "Spices & Masala",
      "Vegetables",
      "Dairy",
      "Grains & Pulses",
      "Oils & Ghee",
      "Meat & Seafood",
      "Bakery & Bread",
      "Sauces & Condiments",
      "General",
    ];

    standardCategories.forEach((sc) => {
      if (!seen.has(sc.toLowerCase())) {
        seen.add(sc.toLowerCase());
        list.push({ value: sc, label: sc });
      }
    });

    return list;
  }, [categories]);

  const normalizeInventoryStockUnit = (unitStr) => {
    const u = String(unitStr || "").trim().toUpperCase();
    if (u === "TSP" || u === "TBSP" || u === "CUP" || u === "PINCH") {
      return "GM";
    }
    return u || "GM";
  };

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

  const convertAiQuantityAndUnit = (aiItem, catalogIng) => {
    const catUnit = normalizeUnit(catalogIng?.unit || aiItem.unit || 'GM');
    const weightInGm = typeof aiItem.weightInGm === 'number' && aiItem.weightInGm > 0 ? aiItem.weightInGm : null;
    const rawQty = parseFloat(aiItem.quantity) || 1;

    if (catUnit === 'KG') {
      const qtyInKg = weightInGm ? weightInGm / 1000 : (normalizeUnit(aiItem.unit) === 'GM' ? rawQty / 1000 : rawQty);
      return {
        quantity: parseFloat(qtyInKg.toFixed(4)),
        unit: 'KG',
      };
    }

    if (catUnit === 'LITER') {
      const qtyInLtr = weightInGm ? weightInGm / 1000 : (normalizeUnit(aiItem.unit) === 'ML' ? rawQty / 1000 : rawQty);
      return {
        quantity: parseFloat(qtyInLtr.toFixed(4)),
        unit: 'LITER',
      };
    }

    if (catUnit === 'GM') {
      const qtyInGm = weightInGm || (normalizeUnit(aiItem.unit) === 'KG' ? rawQty * 1000 : rawQty);
      return {
        quantity: parseFloat(qtyInGm.toFixed(2)),
        unit: 'GM',
      };
    }

    if (catUnit === 'ML') {
      const qtyInMl = weightInGm || (normalizeUnit(aiItem.unit) === 'LITER' ? rawQty * 1000 : rawQty);
      return {
        quantity: parseFloat(qtyInMl.toFixed(2)),
        unit: 'ML',
      };
    }

    return {
      quantity: rawQty,
      unit: catUnit || 'PIECE',
    };
  };

  const handleAutoSuggestRecipe = async () => {
    const dishName = formData.name?.trim();
    if (!dishName) {
      toast.error('Please enter a Dish Name first to auto-fill recipe!');
      document.getElementById('add-dish-name')?.focus();
      return;
    }

    setIsAiGenerating(true);
    setUnmatchedAiItems([]);
    setAiChefTip('');

    try {
      const res = await getAiRecipeApi(dishName, {
        kitchenId: formData.kitchenId,
        branchId: formData.branchId,
        servingSize: 1,
      });

      if (!res || res.status === false) {
        toast.error(res?.message || 'Failed to auto-suggest recipe for this dish.');
        setIsAiGenerating(false);
        return;
      }

      // Auto-populate description if currently empty
      if (!formData.description?.trim() && res.description) {
        setFormData((prev) => ({ ...prev, description: res.description }));
      }

      if (res.chefTip) {
        setAiChefTip(res.chefTip);
      }

      const aiIngredients = Array.isArray(res.data) ? res.data : [];
      if (aiIngredients.length === 0) {
        toast.info(`AI generated details, but no ingredients found for "${dishName}".`);
        setIsAiGenerating(false);
        return;
      }

      const matchedList = [];
      const unmatchedList = [];

      aiIngredients.forEach((item) => {
        let catalogIng = null;

        // 1. Match by returned ingredientId
        if (item.ingredientId) {
          catalogIng = ingredientsList.find((i) => Number(i.id) === Number(item.ingredientId));
        }

        // 2. Match by matchedName
        if (!catalogIng && item.matchedName) {
          const matchNorm = item.matchedName.toLowerCase().trim();
          catalogIng = ingredientsList.find((i) => i.name?.toLowerCase().trim() === matchNorm);
        }

        // 3. Match by exact name
        if (!catalogIng && item.name) {
          const itemNorm = item.name.toLowerCase().trim();
          catalogIng = ingredientsList.find((i) => i.name?.toLowerCase().trim() === itemNorm);
        }

        // 4. Fuzzy fallback match
        if (!catalogIng && item.name) {
          const cleanItemName = item.name.toLowerCase().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
          const firstWord = cleanItemName.split(' ')[0];
          catalogIng = ingredientsList.find((i) => {
            const iName = (i.name || '').toLowerCase().trim();
            if (iName === cleanItemName) return true;
            if (iName.includes(cleanItemName) || cleanItemName.includes(iName)) return true;
            if (firstWord && firstWord.length >= 4 && iName.includes(firstWord)) return true;
            return false;
          });
        }

        if (catalogIng) {
          const { quantity, unit } = convertAiQuantityAndUnit(item, catalogIng);
          matchedList.push({
            id: catalogIng.id,
            name: catalogIng.name,
            unit,
            quantity,
            hint: item.hint || (item.weightInGm ? `~${item.weightInGm}g` : ''),
          });
        } else {
          const autoStockUnit = normalizeInventoryStockUnit(item.unit);
          const currentCatObj = categories.find((c) => String(c.id) === String(formData.categoryId));
          const fallbackCategory = currentCatObj?.name || 'General';

          unmatchedList.push({
            name: item.name,
            image: item.image || '',
            hint: item.hint || (item.weightInGm ? `~${item.weightInGm}g` : ''),
            weightInGm: item.weightInGm,
            quantity: item.quantity ? String(item.quantity) : '1',
            unit: item.unit || 'GM',
            recipeQty: item.quantity ? String(item.quantity) : '1',
            recipeUnit: item.unit || 'GM',
            category: fallbackCategory,
            initialStock: '0',
            stockUnit: autoStockUnit,
            selected: true,
          });
        }
      });

      if (matchedList.length > 0) {
        // Deduplicate matched ingredients (aggregate quantities only if units are identical)
        const uniqueMatched = [];
        const mapById = new Map();

        for (const m of matchedList) {
          if (mapById.has(m.id)) {
            const existing = mapById.get(m.id);
            if (existing.unit === m.unit) {
              existing.quantity = parseFloat((existing.quantity + m.quantity).toFixed(4));
            }
            if (m.hint && !existing.hint.includes(m.hint)) {
              existing.hint = `${existing.hint}, ${m.hint}`;
            }
          } else {
            const copy = { ...m };
            mapById.set(m.id, copy);
            uniqueMatched.push(copy);
          }
        }

        setSelectedIngredients(uniqueMatched);
        setUnmatchedAiItems(unmatchedList);

        toast.success(
          `✨ Recipe auto-filled with ${uniqueMatched.length} ingredients for "${dishName}"!`
        );
      } else {
        setUnmatchedAiItems(unmatchedList);
        toast.info(
          `AI suggested ${unmatchedList.length} ingredients, but none matched your current inventory catalog. Please add them in Inventory.`
        );
      }
    } catch (err) {
      console.error('Error generating AI recipe:', err);
      toast.error('An unexpected error occurred while generating AI recipe.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Quick Provision Handlers (AI Suggestions -> Catalog + Recipe)
  const handleToggleSuggestedItem = (idxToToggle) => {
    setUnmatchedAiItems((prev) =>
      prev.map((item, idx) => (idx === idxToToggle ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleRemoveSuggestedItem = (idxToRemove) => {
    setUnmatchedAiItems((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSelectAllSuggested = (selectVal) => {
    setUnmatchedAiItems((prev) => prev.map((item) => ({ ...item, selected: selectVal })));
  };

  const handleOpenProvisionModal = () => {
    const selected = unmatchedAiItems.filter((item) => item.selected !== false);
    if (selected.length === 0) {
      toast.error('Please select at least one ingredient to add!');
      return;
    }
    const currentCatObj = categories.find((c) => String(c.id) === String(formData.categoryId));
    const fallbackCategory = currentCatObj?.name || 'General';

    setProvisionItems(
      selected.map((item) => ({
        name: item.name,
        image: item.image || '',
        category: item.category || fallbackCategory,
        recipeQty: item.recipeQty || item.quantity || '1',
        recipeUnit: item.recipeUnit || item.unit || 'GM',
        initialStock: item.initialStock !== undefined && item.initialStock !== '' ? item.initialStock : '0',
        stockUnit: item.stockUnit || normalizeInventoryStockUnit(item.unit),
        hint: item.hint || '',
      }))
    );
    setShowStockModal(true);
  };

  const handleConfirmProvision = async () => {
    setIsProvisioning(true);
    try {
      const payload = {
        kitchenId: formData.kitchenId ? Number(formData.kitchenId) : undefined,
        branchId: formData.branchId ? Number(formData.branchId) : undefined,
        items: provisionItems.map((item) => ({
          name: item.name,
          category: item.category || 'General',
          image: item.image?.trim() || undefined,
          unit: item.stockUnit || item.recipeUnit || 'GM',
          initialStock: parseFloat(item.initialStock) || 0,
          alertQuantity: 5,
        })),
      };

      const res = await quickProvisionIngredientsApi(payload);
      if (!res || res.status === false) {
        throw new Error(res?.message || 'Failed to add ingredients to catalog');
      }

      // Fresh ingredients list to update local ingredientsList state
      const createdItems = Array.isArray(res?.data) ? res.data : [];

      // Update ingredientsList in modal so dish submission recognizes the new master ingredient IDs
      setIngredientsList((prev) => {
        const existingIds = new Set(prev.map((i) => Number(i.id)));
        const toAdd = createdItems.filter((c) => !existingIds.has(Number(c.id || c.ingredientId)));
        return [...prev, ...toAdd];
      });

      // Map newly provisioned items into selectedIngredients (recipe table)
      const newRecipeRows = provisionItems.map((prov) => {
        const matchingCreated = createdItems.find(
          (c) => c.name?.toLowerCase().trim() === prov.name?.toLowerCase().trim()
        );
        const ingredientId = Number(matchingCreated?.id || matchingCreated?.ingredientId || 0);
        return {
          id: ingredientId,
          name: prov.name,
          quantity: parseFloat(prov.recipeQty) || 1,
          unit: prov.recipeUnit || prov.stockUnit || 'GM',
          hint: prov.hint,
        };
      });

      // Append to selectedIngredients
      setSelectedIngredients((prev) => {
        const existingIds = new Set(prev.map((r) => Number(r.id)));
        const nonDuplicate = newRecipeRows.filter((r) => !existingIds.has(Number(r.id)));
        return [...prev, ...nonDuplicate];
      });

      // Remove added items from unmatchedAiItems
      const addedNames = new Set(provisionItems.map((p) => p.name.toLowerCase().trim()));
      setUnmatchedAiItems((prev) => prev.filter((item) => !addedNames.has(item.name.toLowerCase().trim())));

      setShowStockModal(false);
      toast.success(
        `✨ ${newRecipeRows.length} ingredients added to Catalog & linked to Recipe!`
      );
    } catch (err) {
      console.error('Error provisioning ingredients in admin:', err);
      toast.error(err.message || 'Failed to provision ingredients.');
    } finally {
      setIsProvisioning(false);
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
    setIsAiGenerating(false);
    setUnmatchedAiItems([]);
    setAiChefTip('');
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

  const compactModalSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.2)' : 'none',
      fontSize: 11,
      fontWeight: 600,
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 6px',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: 11,
      fontWeight: 600,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({
      ...base,
      zIndex: 99999,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark' ? '#334155' : '#fff1f1'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : theme === 'dark' ? '#f8fafc' : '#0f172a',
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

  const unitOptions = STANDARD_MEASURE_UNITS;

  return createPortal(
    <>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold">
                  Dish Name *
                </label>
                <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline-block">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">Enter ↵</kbd> to AI Auto-Fill
                </span>
              </div>
              <div className="relative">
                <input
                  id="add-dish-name"
                  type="text"
                  placeholder="Enter dish name (e.g. Butter Chicken)..."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAutoSuggestRecipe();
                    }
                  }}
                  className={`w-full pl-4 pr-28 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                    errors.name
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAutoSuggestRecipe}
                  disabled={isAiGenerating || !formData.name?.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#8C0D0D] hover:bg-[#700a0a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  title="Auto-fill recipe ingredients from AI"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-200" />
                      <span className="text-[11px]">Filling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-[11px]">AI Fill</span>
                    </>
                  )}
                </button>
              </div>
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
                <IndianRupee className={`w-4 h-4 absolute left-3 top-3 pointer-events-none ${errors.price ? 'text-rose-400' : 'text-slate-400'}`} />
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
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-brand-800 dark:text-rose-400" />
                Dish Ingredients & Recipe Quantities
              </label>
              {formData.name?.trim() && (
                <button
                  type="button"
                  onClick={handleAutoSuggestRecipe}
                  disabled={isAiGenerating}
                  className="text-[11px] font-extrabold text-[#8C0D0D] dark:text-rose-400 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Auto-suggest single-serving recipe ingredients using AI"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isAiGenerating ? 'Generating Recipe...' : '✨ AI Auto-Fill Recipe'}</span>
                </button>
              )}
            </div>

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
                  value={findUnitOption(tempUnit)}
                  onChange={(opt) => setTempUnit(opt ? opt.value : 'GM')}
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
                          {item.hint && (
                            <span
                              className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/50 hidden sm:inline-block shrink-0"
                              title="Culinary measurement / recipe hint"
                            >
                              {item.hint}
                            </span>
                          )}
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
                            <select
                              value={findUnitOption(item.unit).value}
                              onChange={(e) =>
                                handleUpdateIngredient(item.id, 'unit', e.target.value)
                              }
                              className="px-1.5 py-1 text-center text-[11px] font-extrabold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#8C0D0D] uppercase cursor-pointer"
                              title="Edit unit"
                            >
                              {unitOptions.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
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

            {/* AI Chef Tip Notification */}
            {aiChefTip && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-200 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-purple-950 dark:text-purple-100 block">
                    👨‍🍳 Chef's Culinary Tip:
                  </span>
                  <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300 font-medium">
                    {aiChefTip}
                  </p>
                </div>
              </div>
            )}

            {/* Unmatched Ingredients Notification with Quick-Add action */}
            {unmatchedAiItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-xs text-amber-900 dark:text-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {unmatchedAiItems.length} recipe ingredient{unmatchedAiItems.length > 1 ? "s" : ""} not found in your catalog
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleSelectAllSuggested(true)}
                      className="text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-amber-300 dark:text-amber-700">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllSuggested(false)}
                      className="text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  AI suggested these ingredients for <strong>"{formData.name}"</strong>, but they are not yet in your Catalog. Select items to quickly set up Category, Units &amp; Stock:
                </p>

                {/* Items selection cards */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {unmatchedAiItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${
                        item.selected !== false
                          ? "bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
                          : "bg-amber-100/60 dark:bg-amber-950/20 border-transparent text-amber-700/60 dark:text-amber-400/50 line-through"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => handleToggleSuggestedItem(idx)}
                        className="rounded border-amber-400 text-[#8C0D0D] focus:ring-[#8C0D0D] cursor-pointer size-3.5"
                      />
                      <span className="cursor-pointer" onClick={() => handleToggleSuggestedItem(idx)}>
                        {item.name}
                      </span>
                      {item.hint && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          ({item.hint})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSuggestedItem(idx)}
                        className="ml-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        title="Remove from suggestion"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-amber-200/70 dark:border-amber-800/50">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                    💡 Instantly adds missing items to Master Catalog &amp; connects them directly to this dish.
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenProvisionModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8C0D0D] hover:bg-[#720a0a] text-white text-xs font-bold shadow-md shadow-rose-950/20 cursor-pointer transition active:scale-98 shrink-0"
                  >
                    <Sparkles size={14} className="text-amber-300" />
                    <span>
                      Setup &amp; Add ({unmatchedAiItems.filter((i) => i.selected !== false).length}) to Recipe
                    </span>
                  </button>
                </div>
              </div>
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
    </div>

    {/* Quick Provision Stock Modal for Admin */}
    {showStockModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-0">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-400 grid place-items-center shadow-2xs">
                <Boxes size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Setup Category, Units &amp; Stock for Ingredients</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Configure culinary category, cooking/inventory units, and initial stock before adding to catalog.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowStockModal(false)}
              className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center cursor-pointer transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 max-h-[62vh] overflow-y-auto space-y-3.5">
            {/* Quick Bulk Category Apply */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Quick Apply Category to All:</span>
              <div className="w-full sm:w-64">
                <CreatableSelect
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={compactModalSelectStyles}
                  options={dynamicCategoryOptions}
                  placeholder="Apply category to all items..."
                  onChange={(opt) => {
                    if (!opt?.value) return;
                    setProvisionItems((prev) =>
                      prev.map((p) => ({ ...p, category: opt.value }))
                    );
                  }}
                  isClearable={false}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[620px] space-y-2.5">
                <div className="grid grid-cols-[1.2fr_1.1fr_140px_140px] gap-2.5 px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  <span>Ingredient</span>
                  <span>Category</span>
                  <span>Recipe Qty &amp; Unit</span>
                  <span>Initial Stock &amp; Unit</span>
                </div>

                {provisionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1.2fr_1.1fr_140px_140px] gap-2.5 items-center p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                  >
                    {/* Ingredient Column with Photo Avatar */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image ? (
                        <div className="relative group shrink-0 size-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProvisionItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, image: "" } : p))
                              );
                            }}
                            className="absolute inset-0 bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                            title="Remove photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageModalIdx(idx);
                            setTempImageUrl(item.image || "");
                          }}
                          className="size-9 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#8C0D0D] bg-white dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex flex-col items-center justify-center text-slate-400 hover:text-[#8C0D0D] dark:hover:text-rose-400 shrink-0 transition cursor-pointer shadow-2xs"
                          title="Add optional photo"
                        >
                          <ImageIcon size={13} />
                          <span className="text-[8px] font-bold leading-none mt-0.5">+Img</span>
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <strong className="text-slate-800 dark:text-slate-100 block text-xs font-bold truncate">{item.name}</strong>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.hint && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{item.hint}</span>}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveImageModalIdx(idx);
                              setTempImageUrl(item.image || "");
                            }}
                            className="text-[10px] font-semibold text-[#8C0D0D] dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            {item.image ? "Change photo" : "+ Photo (opt)"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category CreatableSelect */}
                    <div>
                      <CreatableSelect
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        styles={compactModalSelectStyles}
                        options={dynamicCategoryOptions}
                        value={item.category ? { value: item.category, label: item.category } : null}
                        onChange={(opt) => {
                          const val = opt?.value || opt?.label || "";
                          setProvisionItems((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, category: val } : p))
                          );
                        }}
                        placeholder="Select category..."
                        isClearable={false}
                      />
                    </div>

                    {/* Recipe Qty & Cooking Unit */}
                    <div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.001"
                          step="0.01"
                          value={item.recipeQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProvisionItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, recipeQty: val } : p))
                            );
                          }}
                          className="h-8 w-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8C0D0D] text-center"
                          title="Quantity required in recipe cooking"
                        />
                        <select
                          value={item.recipeUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProvisionItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, recipeUnit: val } : p))
                            );
                          }}
                          className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#8C0D0D] cursor-pointer"
                          title="Recipe cooking unit"
                        >
                          {STANDARD_MEASURE_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Initial Stock & Inventory Stock Unit */}
                    <div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.initialStock}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProvisionItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, initialStock: val } : p))
                            );
                          }}
                          placeholder="0"
                          className="h-8 w-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8C0D0D] text-center"
                          title="Initial physical stock in kitchen inventory"
                        />
                        <select
                          value={item.stockUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProvisionItems((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, stockUnit: val } : p))
                            );
                          }}
                          className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#8C0D0D] cursor-pointer"
                          title="Unit used to track stock in branch inventory"
                        >
                          {STANDARD_MEASURE_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informational Hint */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Inventory stock is tracked in standard units like <strong>GM / KG / PIECE / LITER</strong>. You can change units anytime. Initial stock can remain <strong>0</strong> if physical raw material is not yet inwarded. Photo is strictly <strong>optional</strong>.
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
            <button
              type="button"
              onClick={() => setShowStockModal(false)}
              disabled={isProvisioning}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmProvision}
              disabled={isProvisioning}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding to Catalog &amp; Recipe...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Confirm &amp; Add to Recipe</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Ingredient Photo Picker Modal (Optional) */}
    {activeImageModalIdx !== null && provisionItems[activeImageModalIdx] && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
            <div className="flex items-center gap-2.5">
              <ImageIcon size={18} className="text-[#8C0D0D] dark:text-rose-400" />
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Ingredient Photo (Optional)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {provisionItems[activeImageModalIdx]?.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveImageModalIdx(null)}
              className="size-7 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center cursor-pointer transition"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {tempImageUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <img
                  src={tempImageUrl}
                  alt="Preview"
                  className="size-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=200&q=80";
                  }}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Active Preview
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tempImageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempImageUrl("")}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition border border-rose-200 dark:border-rose-800 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Image Web URL
              </label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#8C0D0D]"
                />
              </div>
              <p className="text-[10.5px] text-slate-400">
                Direct link from web, Unsplash, Cloudinary, or choose from common presets below.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Or 1-Click Pick from Common Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INGREDIENT_PRESET_IMAGES.map((preset) => {
                  const isSelected = tempImageUrl === preset.url;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTempImageUrl(preset.url)}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-[#8C0D0D] bg-rose-50/60 dark:bg-rose-950/30 ring-1 ring-[#8C0D0D]"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="size-8 rounded-lg object-cover shrink-0"
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
            <button
              type="button"
              onClick={() => {
                setProvisionItems((prev) =>
                  prev.map((p, i) => (i === activeImageModalIdx ? { ...p, image: "" } : p))
                );
                setActiveImageModalIdx(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Skip / Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveImageModalIdx(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setProvisionItems((prev) =>
                    prev.map((p, i) =>
                      i === activeImageModalIdx ? { ...p, image: tempImageUrl.trim() } : p
                    )
                  );
                  setActiveImageModalIdx(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#8C0D0D] hover:bg-[#700a0a] rounded-xl transition shadow-xs cursor-pointer"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>,
  document.body
);
};
