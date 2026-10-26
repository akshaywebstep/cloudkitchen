import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
  Utensils,
  IndianRupee,
  FolderTree,
  Building2,
  GitBranch,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  Boxes,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  FileText,
  Plus,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { useTheme } from '../context/ThemeContext';
import {
  getKitchensApi,
  getBranchesApi,
  getMenuCategoriesApi,
  getIngredientsApi,
  createMenuItemApi,
  updateMenuItemApi,
  getMenuItemByIdApi,
  getAiRecipeApi,
  quickProvisionIngredientsApi,
} from '../services/api';
import {
  getConversionHint,
  getSanityWarning,
  formatRecipeQty,
  calculateStockCapacity,
} from '../utils/recipeHelper';
import { STANDARD_MEASURE_UNITS } from '../../constants/measureUnits';

export const DISH_PRESETS = [
  { name: 'Curry & Rice', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80' },
  { name: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80' },
  { name: 'Creamy Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80' },
  { name: 'Chicken Roast', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80' },
  { name: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80' },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80' },
  { name: 'Dessert Cake', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80' },
  { name: 'Beverage / Juice', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80' },
];

// Detect common kitchen staples (Water, Salt, Ice, etc.) that chefs typically don't track as inventoried stock
export const isCommonStaple = (name = '') => {
  const clean = String(name || '').trim().toLowerCase();
  if (!clean) return false;
  const stripped = clean.replace(/\(.*?\)/g, '').trim();

  const stapleKeywords = [
    'water', 'pani', 'tap water', 'boiled water', 'warm water', 'cold water', 'hot water',
    'salt', 'namak', 'table salt', 'common salt',
    'ice', 'ice cubes', 'crushed ice',
  ];

  return stapleKeywords.some((s) => stripped === s || stripped.startsWith(s + ' ') || stripped.endsWith(' ' + s));
};

// Smart category match: Check if ingredient matches an existing category
export const findSmartCategoryMatch = (ingredientName = '', availableCategories = [], dishCategory = '') => {
  if (!ingredientName) {
    return dishCategory?.trim() || availableCategories[0]?.value || 'General';
  }

  const norm = String(ingredientName).toLowerCase().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();

  const rules = [
    { cat: 'Spices & Masala', keywords: ['masala', 'chilli', 'chili', 'turmeric', 'haldi', 'cumin', 'jeera', 'coriander powder', 'cardamom', 'clove', 'cinnamon', 'pepper', 'garam masala', 'mustard seed', 'rai', 'fenugreek', 'methi', 'hing', 'asafoetida', 'ajwain', 'bay leaf', 'tej patta', 'paprika', 'oregano', 'kasuri methi'] },
    { cat: 'Vegetables', keywords: ['onion', 'pyaz', 'potato', 'aloo', 'tomato', 'tamatar', 'garlic', 'lahsun', 'ginger', 'adrak', 'capsicum', 'shimla mirch', 'carrot', 'gajar', 'peas', 'matar', 'cabbage', 'cauliflower', 'gobi', 'spinach', 'palak', 'mushroom', 'broccoli', 'beans', 'corn', 'cucumber', 'lemon', 'nimbu', 'green chilli'] },
    { cat: 'Dairy', keywords: ['paneer', 'cheese', 'butter', 'milk', 'doodh', 'cream', 'malai', 'curd', 'dahi', 'yogurt', 'ghee', 'khoya', 'mava', 'mozzarella', 'cheddar'] },
    { cat: 'Oils & Ghee', keywords: ['oil', 'tel', 'mustard oil', 'sunflower oil', 'refined oil', 'olive oil', 'ghee', 'cooking oil'] },
    { cat: 'Grains & Pulses', keywords: ['rice', 'chawal', 'basmati', 'dal', 'daal', 'lentil', 'chana', 'rajma', 'wheat', 'atta', 'flour', 'maida', 'besan', 'rava', 'sooji', 'noodles', 'pasta'] },
    { cat: 'Meat & Seafood', keywords: ['chicken', 'mutton', 'lamb', 'fish', 'prawn', 'egg', 'anda', 'meat', 'keema', 'pork', 'beef'] },
    { cat: 'Bakery & Bread', keywords: ['bread', 'pav', 'bun', 'pita', 'tortilla', 'yeast', 'baking powder', 'baking soda'] },
    { cat: 'Sauces & Condiments', keywords: ['sauce', 'ketchup', 'mayo', 'mayonnaise', 'soya sauce', 'vinegar', 'sirka', 'chilli sauce', 'schezwan', 'paste'] },
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (norm.includes(kw)) {
        const found = availableCategories.find(
          (c) => c.value?.toLowerCase() === rule.cat.toLowerCase() || c.label?.toLowerCase() === rule.cat.toLowerCase()
        );
        if (found) return found.value;
        return rule.cat;
      }
    }
  }

  if (dishCategory && dishCategory.trim()) {
    const dishMatch = availableCategories.find(
      (c) => c.value?.toLowerCase() === dishCategory.trim().toLowerCase()
    );
    if (dishMatch) return dishMatch.value;
  }

  return availableCategories[0]?.value || 'General';
};

export const normalizeInventoryStockUnit = (unitStr) => {
  const u = String(unitStr || '').trim().toUpperCase();
  if (['TSP', 'TBSP', 'CUP', 'PINCH'].includes(u)) {
    return 'GM';
  }
  return u || 'GM';
};

export const AddMenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const isEditMode = Boolean(paramId);

  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { theme } = useTheme();

  // Dropdown options
  const [kitchens, setKitchens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form Fields (Simple & original, matching kitchen)
  const [formData, setFormData] = useState({
    id: paramId || '',
    kitchenId: '',
    branchId: '',
    name: '',
    price: '',
    categoryId: '',
    category: '',
    subCategoryId: '',
    subCategory: '',
    description: '',
    imageUrl: '',
    imageFile: null,
  });

  // Selected ingredients dynamic list [{ tempId, ingredientId, name, unit, quantity, currentStock, stockUnit }]
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [tempIngredientId, setTempIngredientId] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');
  const [tempUnit, setTempUnit] = useState('GM');

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // AI Recipe Auto-Fill States
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiChefTip, setAiChefTip] = useState('');

  // Quick Provision States (AI suggestions -> Catalog + Inventory)
  const [showStockModal, setShowStockModal] = useState(false);
  const [provisionItems, setProvisionItems] = useState([]);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Category options combining Menu Categories + Standard culinary categories
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
      'Spices & Masala',
      'Vegetables',
      'Dairy',
      'Grains & Pulses',
      'Oils & Ghee',
      'Meat & Seafood',
      'Bakery & Bread',
      'Sauces & Condiments',
      'General',
    ];

    standardCategories.forEach((sc) => {
      if (!seen.has(sc.toLowerCase())) {
        seen.add(sc.toLowerCase());
        list.push({ value: sc, label: sc });
      }
    });

    return list;
  }, [categories]);

  // Load all dropdown data on page mount
  useEffect(() => {
    const initializePage = async () => {
      setIsInitializing(true);
      try {
        const [kRes, bRes, cRes] = await Promise.all([
          getKitchensApi(),
          getBranchesApi({ limit: 200 }),
          getMenuCategoriesApi({ limit: 300 }),
        ]);

        let loadedKitchens = [];
        let loadedBranches = [];

        if (kRes && kRes.status && Array.isArray(kRes.data)) {
          loadedKitchens = kRes.data;
          setKitchens(loadedKitchens);
        }

        if (bRes && bRes.status && Array.isArray(bRes.data)) {
          loadedBranches = bRes.data;
          setBranches(loadedBranches);
        }

        if (cRes && cRes.status && Array.isArray(cRes.data)) {
          setCategories(cRes.data);
        }

        // If in Edit Mode, populate dish data from router state or API
        if (isEditMode) {
          await loadEditDishData(paramId);
        } else {
          // Add Mode: Default to first kitchen and its first branch
          if (loadedKitchens.length > 0) {
            const firstKId = loadedKitchens[0].id;
            const matchingBranches = loadedBranches.filter((b) => {
              const kId = String(firstKId);
              return (
                String(b.userId) === kId ||
                String(b.kitchenId) === kId ||
                String(b.user?.id) === kId ||
                String(b.kitchen?.id) === kId
              );
            });
            const firstBId = matchingBranches.length > 0 ? matchingBranches[0].id : (loadedBranches[0]?.id || '');
            setFormData((prev) => ({
              ...prev,
              kitchenId: firstKId,
              branchId: firstBId,
            }));
            if (firstKId && firstBId) {
              loadIngredientsForBranch(firstKId, firstBId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize AddMenuPage:', err);
        toast.error('Failed to load initial data. Please refresh.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializePage();
  }, [isEditMode, paramId]);

  // Fetch ingredients for selected kitchen and branch
  const loadIngredientsForBranch = async (kitchenId, branchId) => {
    if (!kitchenId) return;
    try {
      const res = await getIngredientsApi({
        kitchenId: Number(kitchenId),
        branchId: branchId ? Number(branchId) : undefined,
        limit: 300,
      });
      if (res && res.status && Array.isArray(res.data)) {
        setIngredientsList(res.data);
      } else {
        setIngredientsList([]);
      }
    } catch (err) {
      console.warn('Could not fetch ingredients for kitchen:', err);
    }
  };

  // Load existing dish in Edit Mode
  const loadEditDishData = async (dishId) => {
    let editItem = location.state?.editItem;

    if (!editItem) {
      try {
        const res = await getMenuItemByIdApi(dishId);
        if (res && res.status && res.data) {
          editItem = res.data;
        }
      } catch (err) {
        console.warn('Could not fetch single menu item via API:', err);
      }
    }

    if (editItem) {
      const kId = editItem.kitchenId || editItem.branch?.kitchenId || editItem.branch?.userId || '';
      const bId = editItem.branchId || editItem.branch?.id || '';

      const catId = editItem.categoryId || editItem.category?.id || '';
      const catName = editItem.category?.name || (typeof editItem.category === 'string' ? editItem.category : '');
      const subCatId = editItem.subCategoryId || editItem.subCategory?.id || '';
      const subCatName = editItem.subCategory?.name || (typeof editItem.subCategory === 'string' ? editItem.subCategory : '');

      setFormData({
        id: editItem.id,
        kitchenId: kId,
        branchId: bId,
        name: editItem.name || '',
        price: editItem.price !== undefined ? String(editItem.price) : '',
        categoryId: catId ? String(catId) : '',
        category: catName || '',
        subCategoryId: subCatId ? String(subCatId) : '',
        subCategory: subCatName || '',
        description: editItem.description || '',
        imageUrl: editItem.image || editItem.imageUrl || '',
        imageFile: null,
      });

      // Map ingredients
      if (Array.isArray(editItem.ingredients)) {
        const mapped = editItem.ingredients.map((ing, idx) => {
          const rawId =
            ing.ingredient?.id ||
            ing.inventoryItem?.ingredient?.id ||
            ing.ingredientId ||
            ing.inventoryItem?.ingredientId;
          const name =
            ing.ingredient?.name ||
            ing.inventoryItem?.ingredient?.name ||
            ing.name ||
            `Ingredient #${idx + 1}`;
          const currentStock =
            ing.inventoryItem?.quantity ??
            ing.currentStock ??
            ing.stock ??
            0;
          const stockUnit =
            ing.inventoryItem?.unit ||
            ing.ingredient?.unit ||
            ing.stockUnit ||
            ing.unit ||
            'GM';

          return {
            tempId: Date.now() + idx,
            ingredientId: rawId ? Number(rawId) : '',
            name,
            quantity: ing.quantity ? String(ing.quantity) : '1',
            unit: ing.unit || 'GM',
            currentStock: Number(currentStock) || 0,
            stockUnit,
          };
        });
        setSelectedIngredients(mapped);
      }

      if (kId) {
        loadIngredientsForBranch(kId, bId);
      }
    } else {
      toast.error('Dish details could not be found.');
      navigate('/admin/foods');
    }
  };

  // Kitchen selection handler
  const handleKitchenChange = (selectedKId) => {
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

    setFormData((prev) => {
      const curCat = categories.find((c) => String(c.id) === String(prev.categoryId));
      const isCatValid = curCat && (!curCat.kitchenId || String(curCat.kitchenId) === String(selectedKId));

      return {
        ...prev,
        kitchenId: selectedKId,
        branchId: newBranchId,
        categoryId: isCatValid ? prev.categoryId : '',
        category: isCatValid ? prev.category : '',
        subCategoryId: isCatValid ? prev.subCategoryId : '',
        subCategory: isCatValid ? prev.subCategory : '',
      };
    });

    if (errors.kitchenId) setErrors((prev) => ({ ...prev, kitchenId: null }));
    if (selectedKId) {
      loadIngredientsForBranch(selectedKId, newBranchId);
    }
  };

  // Branch selection handler
  const handleBranchChange = (selectedBId) => {
    setFormData((prev) => ({ ...prev, branchId: selectedBId }));
    if (formData.kitchenId) {
      loadIngredientsForBranch(formData.kitchenId, selectedBId);
    }
  };

  // AI RECIPE AUTO-SUGGESTION
  const handleAutoSuggestRecipe = async () => {
    const dishName = formData.name?.trim();
    if (!dishName) {
      setErrors((prev) => ({ ...prev, name: 'Please enter a dish name first to auto-fill recipe!' }));
      toast.warning('Please enter a dish name first!');
      return;
    }

    setIsAiGenerating(true);
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

      // Auto-populate price if currently empty
      if (!formData.price && res.suggestedPrice) {
        setFormData((prev) => ({ ...prev, price: String(res.suggestedPrice) }));
      }

      // Auto-select category if matching category found
      if (res.suggestedCategory && categories.length > 0) {
        const matchedCat = categories.find(
          (c) => c.name?.toLowerCase() === res.suggestedCategory.toLowerCase()
        );
        if (matchedCat && !formData.categoryId && !formData.category) {
          setFormData((prev) => ({
            ...prev,
            categoryId: String(matchedCat.id),
            category: matchedCat.name,
          }));
        } else if (!formData.categoryId && !formData.category && res.suggestedCategory) {
          setFormData((prev) => ({
            ...prev,
            category: res.suggestedCategory,
          }));
        }
      }

      if (res.chefTip) {
        setAiChefTip(res.chefTip);
      }

      const aiIngredients = Array.isArray(res.ingredients) ? res.ingredients : [];
      if (aiIngredients.length === 0) {
        toast.info('AI generated recipe details. No ingredients were provided.');
        setIsAiGenerating(false);
        return;
      }

      // Match suggested ingredients with this kitchen's catalog
      const matched = [];
      const unmatched = [];

      aiIngredients.forEach((aiItem) => {
        const cleanAiName = String(aiItem.name || '').trim().toLowerCase();
        const found = ingredientsList.find((ing) => {
          const catName = String(ing.name || '').trim().toLowerCase();
          return catName === cleanAiName || catName.includes(cleanAiName) || cleanAiName.includes(catName);
        });

        if (found) {
          matched.push({
            tempId: Date.now() + Math.random(),
            ingredientId: found.id,
            name: found.name,
            quantity: String(aiItem.quantity || '1'),
            unit: aiItem.unit || found.unit || 'GM',
            currentStock: Number(found.currentStock ?? found.stock ?? 0),
            stockUnit: found.unit || 'GM',
          });
        } else {
          unmatched.push(aiItem);
        }
      });

      if (matched.length > 0) {
        setSelectedIngredients((prev) => {
          const existingIds = new Set(prev.map((i) => i.ingredientId));
          const newItems = matched.filter((m) => !existingIds.has(m.ingredientId));
          return [...prev, ...newItems];
        });
      }

      if (unmatched.length > 0) {
        const initialProvision = unmatched.map((u, idx) => {
          const autoIgnore = isCommonStaple(u.name);
          const matchedCategory = findSmartCategoryMatch(
            u.name,
            dynamicCategoryOptions,
            formData.categoryId ? categories.find((c) => String(c.id) === String(formData.categoryId))?.name : ''
          );
          const normalizedStockUnit = normalizeInventoryStockUnit(u.unit);

          return {
            id: idx,
            name: u.name,
            recipeQty: u.quantity || 1,
            recipeUnit: u.unit || 'GM',
            initialStock: autoIgnore ? '0' : '5',
            unit: normalizedStockUnit,
            category: matchedCategory,
            selected: !autoIgnore,
          };
        });

        setProvisionItems(initialProvision);
        setShowStockModal(true);
        toast.info(
          `AI suggested ${aiIngredients.length} ingredients: ${matched.length} ready in inventory, ${unmatched.length} new items to review.`,
          { duration: 4000 }
        );
      } else {
        toast.success(`AI Recipe applied! All ${matched.length} ingredients ready in your inventory.`);
      }
    } catch (err) {
      console.error('AI Suggestion Error:', err);
      toast.error('Failed to communicate with AI recipe assistant.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // QUICK PROVISION HANDLER (Unmatched AI Items)
  const handleProvisionSubmit = async () => {
    const selectedToProvision = provisionItems.filter((i) => i.selected);

    if (selectedToProvision.length === 0) {
      setShowStockModal(false);
      return;
    }

    setIsProvisioning(true);
    try {
      const payload = {
        kitchenId: Number(formData.kitchenId),
        branchId: formData.branchId ? Number(formData.branchId) : undefined,
        ingredients: selectedToProvision.map((item) => ({
          name: item.name.trim(),
          category: item.category || 'General',
          unit: item.unit || 'GM',
          initialStock: parseFloat(item.initialStock) || 0,
          minStockAlert: 1,
        })),
      };

      const res = await quickProvisionIngredientsApi(payload);
      if (!res || res.status === false) {
        throw new Error(res?.message || 'Failed to add ingredients to catalog');
      }

      const createdItems = Array.isArray(res?.data) ? res.data : [];

      setIngredientsList((prev) => {
        const existingIds = new Set(prev.map((i) => Number(i.id)));
        const toAdd = createdItems.filter((c) => !existingIds.has(Number(c.id || c.ingredientId)));
        return [...prev, ...toAdd];
      });

      const newlyAddedToRecipe = [];
      createdItems.forEach((created) => {
        const original = selectedToProvision.find(
          (o) => o.name.toLowerCase().trim() === created.name?.toLowerCase().trim()
        );
        newlyAddedToRecipe.push({
          tempId: Date.now() + Math.random(),
          ingredientId: created.id || created.ingredientId,
          name: created.name,
          quantity: String(original ? original.recipeQty : '1'),
          unit: original ? original.recipeUnit : created.unit || 'GM',
          currentStock: Number(created.quantity ?? created.currentStock ?? created.stock ?? (original ? original.initialStock : 0)),
          stockUnit: created.unit || original?.unit || 'GM',
        });
      });

      setSelectedIngredients((prev) => {
        const existingIds = new Set(prev.map((i) => i.ingredientId));
        const filteredNew = newlyAddedToRecipe.filter((item) => !existingIds.has(item.ingredientId));
        return [...prev, ...filteredNew];
      });

      setShowStockModal(false);
      toast.success(`Successfully provisioned ${newlyAddedToRecipe.length} ingredients to your inventory!`);
    } catch (err) {
      console.error('Provisioning failed:', err);
      toast.error(err.message || 'Failed to provision ingredients.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // INGREDIENTS ROW MANAGEMENT
  const handleAddIngredientRow = () => {
    if (!tempIngredientId) {
      toast.warning('Please select an ingredient from catalog first.');
      return;
    }

    const found = ingredientsList.find((i) => String(i.id) === String(tempIngredientId));
    if (!found) return;

    if (selectedIngredients.some((i) => String(i.ingredientId) === String(found.id))) {
      toast.warning('This ingredient is already in the recipe list.');
      return;
    }

    const qty = tempQuantity && parseFloat(tempQuantity) > 0 ? String(tempQuantity) : '1';
    const unit = tempUnit || found.unit || 'GM';

    setSelectedIngredients((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        ingredientId: found.id,
        name: found.name,
        quantity: qty,
        unit,
        currentStock: Number(found.currentStock ?? found.stock ?? 0),
        stockUnit: found.unit || 'GM',
      },
    ]);

    setTempIngredientId('');
    setTempQuantity('');
    setTempUnit('GM');
  };

  const handleRemoveIngredientRow = (tempId) => {
    setSelectedIngredients((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleUpdateIngredientRow = (tempId, field, val) => {
    setSelectedIngredients((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: val } : item))
    );
  };

  // Recipe yield calculation: How many portions can be prepared
  const recipeYield = useMemo(() => {
    return calculateStockCapacity(selectedIngredients, ingredientsList);
  }, [selectedIngredients, ingredientsList]);

  // Image upload handler
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: previewUrl,
      }));
      toast.success('Dish photo attached!');
    }
  };

  // FORM SUBMISSION (CREATE OR UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Dish name is required.';
    }

    const numPrice = parseFloat(formData.price);
    if (!formData.price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Please enter a valid price in INR greater than 0.';
    }

    if (!formData.kitchenId) {
      newErrors.kitchenId = 'Please select a kitchen.';
    }

    // Resolve Category ID and Category Payload
    const matchedCat = categoryOptions.find(
      (c) =>
        (formData.categoryId && String(c.value) === String(formData.categoryId)) ||
        (formData.category && c.name?.toLowerCase().trim() === formData.category.toLowerCase().trim())
    );
    const finalCatId = formData.categoryId || (matchedCat?.id ? String(matchedCat.id) : '');
    const finalCatName = formData.category || matchedCat?.name || '';

    if (!finalCatId && !finalCatName) {
      newErrors.categoryId = 'Please select or enter a category.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the highlighted errors before saving.');
      return;
    }

    setErrors({});
    setIsSaving(true);
    showLoading(isEditMode ? 'Updating menu item...' : 'Creating menu item...');

    try {
      const ingredientsPayload = selectedIngredients.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'GM',
      }));

      const categoryPayload = finalCatId
        ? { id: Number(finalCatId), name: finalCatName }
        : finalCatName
        ? { name: finalCatName.trim() }
        : undefined;

      const matchedSub = (selectedCategoryObj?.subCategories || subCategoryOptions).find(
        (s) =>
          (formData.subCategoryId && String(s.value || s.id) === String(formData.subCategoryId)) ||
          (formData.subCategory && s.name?.toLowerCase().trim() === formData.subCategory.toLowerCase().trim())
      );
      const finalSubId = formData.subCategoryId || (matchedSub?.id ? String(matchedSub.id) : '');
      const finalSubName = formData.subCategory || matchedSub?.name || '';
      const subCategoryPayload = finalSubId
        ? { id: Number(finalSubId), name: finalSubName }
        : finalSubName
        ? { name: finalSubName.trim() }
        : undefined;

      let payload;
      if (formData.imageFile) {
        payload = new FormData();
        payload.append('name', formData.name.trim());
        payload.append('price', String(numPrice));
        payload.append('kitchenId', String(formData.kitchenId));
        if (formData.branchId) payload.append('branchId', String(formData.branchId));
        if (finalCatId) payload.append('categoryId', String(finalCatId));
        if (categoryPayload) payload.append('category', JSON.stringify(categoryPayload));
        if (finalSubId) payload.append('subCategoryId', String(finalSubId));
        if (subCategoryPayload) payload.append('subCategory', JSON.stringify(subCategoryPayload));
        if (formData.description) payload.append('description', formData.description.trim());
        payload.append('image', formData.imageFile);
        payload.append('ingredients', JSON.stringify(ingredientsPayload));
      } else {
        payload = {
          name: formData.name.trim(),
          price: numPrice,
          kitchenId: Number(formData.kitchenId),
          branchId: formData.branchId ? Number(formData.branchId) : undefined,
          ...(finalCatId ? { categoryId: Number(finalCatId) } : {}),
          ...(categoryPayload ? { category: categoryPayload } : {}),
          ...(finalSubId ? { subCategoryId: Number(finalSubId) } : {}),
          ...(subCategoryPayload ? { subCategory: subCategoryPayload } : {}),
          description: formData.description?.trim() || undefined,
          image: formData.imageUrl || undefined,
          ingredients: ingredientsPayload,
        };
      }

      let res;
      if (isEditMode) {
        res = await updateMenuItemApi(formData.id, payload);
      } else {
        res = await createMenuItemApi(payload);
      }

      hideLoading();

      if (res && res.status === true) {
        toast.success(
          isEditMode
            ? `Dish "${formData.name}" updated successfully!`
            : `Dish "${formData.name}" added to menu successfully!`
        );
        navigate('/admin/foods');
      } else {
        const errorMsg = res?.message || (isEditMode ? 'Failed to update dish.' : 'Failed to create dish.');
        setErrors({ general: errorMsg });
        toast.error(errorMsg);
      }
    } catch (err) {
      hideLoading();
      console.error('Menu save error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Server communication error.';
      setErrors({ general: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // React Select Custom Styles matching Admin Theme
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#cbd5e1',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.2)' : 'none',
      '&:hover': {
        borderColor: '#8C0D0D',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      zIndex: 50,
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark'
          ? '#334155'
          : '#f1f5f9'
        : 'transparent',
      color: state.isSelected ? '#ffffff' : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.8125rem',
      fontWeight: '600',
      cursor: 'pointer',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.8125rem',
      fontWeight: '600',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.8125rem',
    }),
  };

  const kitchenOptions = kitchens.map((k) => ({
    value: k.id,
    label: `${k.kitchenName || k.name || 'Kitchen'} (ID: ${k.id})`,
  }));

  const branchOptions = branches
    .filter((b) => {
      if (!formData.kitchenId) return true;
      const kId = String(formData.kitchenId);
      return (
        String(b.userId) === kId ||
        String(b.kitchenId) === kId ||
        String(b.user?.id) === kId ||
        String(b.kitchen?.id) === kId
      );
    })
    .map((b) => ({
      value: b.id,
      label: `${b.branchName || b.name || 'Branch'} ${b.city ? `(${b.city})` : ''}`,
    }));

  // Root categories filtered by kitchen scope (Global + Selected Kitchen's categories)
  const categoryOptions = useMemo(() => {
    return categories
      .filter((c) => {
        if (c.parentId) return false;
        if (formData.kitchenId) {
          return !c.kitchenId || String(c.kitchenId) === String(formData.kitchenId);
        }
        return true;
      })
      .map((c) => ({
        value: String(c.id),
        label: `${c.name}${c.kitchenId ? ' (Kitchen)' : ''}`,
        id: c.id,
        name: c.name,
      }));
  }, [categories, formData.kitchenId]);

  // Selected Category Object
  const selectedCategoryObj = useMemo(() => {
    if (!formData.categoryId && !formData.category) return null;
    return categories.find(
      (c) =>
        (formData.categoryId && String(c.id) === String(formData.categoryId)) ||
        (formData.category && c.name?.toLowerCase().trim() === String(formData.category).toLowerCase().trim()) ||
        c.name?.toLowerCase().trim() === String(formData.categoryId).toLowerCase().trim()
    );
  }, [categories, formData.categoryId, formData.category]);

  // Subcategories of selected category (from selectedCategoryObj.subCategories and flat categories)
  const subCategoryOptions = useMemo(() => {
    if (!selectedCategoryObj) return [];

    const list = [];
    const seen = new Set();

    // 1. From selectedCategoryObj.subCategories (nested Prisma array)
    if (Array.isArray(selectedCategoryObj.subCategories)) {
      selectedCategoryObj.subCategories.forEach((sub) => {
        if (!sub) return;
        if (sub.status && String(sub.status).toUpperCase() !== 'ACTIVE') return;
        if (formData.kitchenId && sub.kitchenId && String(sub.kitchenId) !== String(formData.kitchenId)) {
          return;
        }
        const sId = String(sub.id);
        if (!seen.has(sId)) {
          seen.add(sId);
          list.push({
            value: String(sub.id),
            label: `${sub.name}${sub.kitchenId ? ' (Kitchen)' : ''}`,
            id: sub.id,
            name: sub.name,
          });
        }
      });
    }

    // 2. Also check top-level categories if any have parentId === selectedCategoryObj.id
    categories.forEach((cat) => {
      if (String(cat.parentId) === String(selectedCategoryObj.id)) {
        if (cat.status && String(cat.status).toUpperCase() !== 'ACTIVE') return;
        if (formData.kitchenId && cat.kitchenId && String(cat.kitchenId) !== String(formData.kitchenId)) {
          return;
        }
        const cId = String(cat.id);
        if (!seen.has(cId)) {
          seen.add(cId);
          list.push({
            value: String(cat.id),
            label: `${cat.name}${cat.kitchenId ? ' (Kitchen)' : ''}`,
            id: cat.id,
            name: cat.name,
          });
        }
      }
    });

    return list;
  }, [categories, selectedCategoryObj, formData.kitchenId]);

  const handleCategoryChange = (opt) => {
    if (!opt) {
      setFormData((prev) => ({
        ...prev,
        categoryId: '',
        category: '',
        subCategoryId: '',
        subCategory: '',
      }));
      if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
      return;
    }

    const match = categoryOptions.find(
      (c) => String(c.value) === String(opt.value) || c.name?.toLowerCase() === (opt.label || opt.value).toLowerCase()
    );

    const catId = match?.id || (opt.__isNew__ ? '' : match?.value || '');
    const catName = match?.name || opt.label || opt.value;

    setFormData((prev) => ({
      ...prev,
      categoryId: catId ? String(catId) : '',
      category: catName,
      subCategoryId: '',
      subCategory: '',
    }));

    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
  };

  const handleSubCategoryChange = (opt) => {
    if (!opt) {
      setFormData((prev) => ({
        ...prev,
        subCategoryId: '',
        subCategory: '',
      }));
      return;
    }

    const match = subCategoryOptions.find(
      (s) => String(s.value) === String(opt.value) || s.name?.toLowerCase() === (opt.label || opt.value).toLowerCase()
    );

    const subId = match?.id || (opt.__isNew__ ? '' : match?.value || '');
    const subName = match?.name || opt.label || opt.value;

    setFormData((prev) => ({
      ...prev,
      subCategoryId: subId ? String(subId) : '',
      subCategory: subName,
    }));
  };

  const selectedCategoryValue = useMemo(() => {
    if (formData.categoryId) {
      const found = categoryOptions.find((opt) => String(opt.value) === String(formData.categoryId));
      if (found) return found;
    }
    if (formData.category) {
      return { value: formData.categoryId || formData.category, label: formData.category };
    }
    return null;
  }, [categoryOptions, formData.categoryId, formData.category]);

  const selectedSubCategoryValue = useMemo(() => {
    if (formData.subCategoryId) {
      const found = subCategoryOptions.find((opt) => String(opt.value) === String(formData.subCategoryId));
      if (found) return found;
    }
    if (formData.subCategory) {
      return { value: formData.subCategoryId || formData.subCategory, label: formData.subCategory };
    }
    return null;
  }, [subCategoryOptions, formData.subCategoryId, formData.subCategory]);

  const availableIngredientOptions = ingredientsList.map((i) => ({
    value: i.id,
    label: `${i.name} [Stock: ${i.currentStock ?? i.stock ?? 0} ${i.unit || 'GM'}]`,
  }));

  if (isInitializing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#8C0D0D] animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading food item editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/foods')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Back to Menu List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-[#8C0D0D]" />
              {isEditMode ? `Edit Dish: ${formData.name || 'Dish Item'}` : 'Add New Food Item'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Single-serving recipe with automatic AI recipe suggestion and inventory provisioning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/foods')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#720505] text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-900/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isEditMode ? 'Update Dish' : 'Save Dish'}</span>
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="text-xs font-bold">{errors.general}</span>
        </div>
      )}

      {/* Main Grid: Left Dish Details & Right Recipe Ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Dish Info, Kitchen/Branch, Pricing, & Photo */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Utensils className="w-4 h-4 text-[#8C0D0D]" />
              Dish Information
            </h3>

            {/* Kitchen & Branch Selection (Simple 2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8C0D0D]" />
                  Select Kitchen <span className="text-rose-600">*</span>
                </label>
                <Select
                  options={kitchenOptions}
                  value={kitchenOptions.find((opt) => String(opt.value) === String(formData.kitchenId)) || null}
                  onChange={(opt) => handleKitchenChange(opt ? opt.value : '')}
                  styles={customSelectStyles}
                  placeholder="Select Kitchen..."
                  isSearchable
                />
                {errors.kitchenId && (
                  <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.kitchenId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#8C0D0D]" />
                  Select Branch Outlet
                </label>
                <Select
                  options={branchOptions}
                  value={branchOptions.find((opt) => String(opt.value) === String(formData.branchId)) || null}
                  onChange={(opt) => handleBranchChange(opt ? opt.value : '')}
                  styles={customSelectStyles}
                  placeholder="Select Branch..."
                  isSearchable
                  isClearable
                />
              </div>
            </div>

            {/* Dish Name with Embedded AI Fill Button (Just like kitchen) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-extrabold flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#8C0D0D]" />
                  Dish Name <span className="text-rose-600">*</span>
                </label>
              </div>

              <div className="relative">
                <Utensils className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  placeholder="Enter dish name (e.g. Paneer Butter Masala, Biryani)"
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
                  className={`w-full rounded-xl border bg-white dark:bg-slate-800 h-11 pl-10 pr-24 text-xs font-bold text-slate-900 dark:text-white outline-none transition duration-200 placeholder:text-slate-400 ${
                    errors.name
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#8C0D0D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAutoSuggestRecipe}
                  disabled={isAiGenerating || !formData.name?.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#8C0D0D] hover:bg-[#720505] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  title="Auto-fill recipe ingredients from AI"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-rose-200" />
                      <span>Filling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI Fill</span>
                    </>
                  )}
                </button>
              </div>
              {errors.name && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* AI Chef Tip Callout */}
            {aiChefTip && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong className="font-extrabold">Chef's Tip:</strong> {aiChefTip}
                </div>
              </div>
            )}

            {/* Selling Price */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#8C0D0D]" />
                Selling Price (₹) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter selling price in ₹ (e.g. 299)"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value });
                    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                  }}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-xs font-extrabold outline-none transition ${
                    errors.price
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#8C0D0D]'
                  }`}
                />
              </div>
              {errors.price && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.price}
                </p>
              )}
            </div>

            {/* Category & SubCategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-[#8C0D0D]" />
                  Category <span className="text-rose-600">*</span>
                </label>
                <CreatableSelect
                  options={categoryOptions}
                  value={selectedCategoryValue}
                  onChange={handleCategoryChange}
                  styles={customSelectStyles}
                  placeholder="Select or type category..."
                  isSearchable
                  isClearable
                />
                {errors.categoryId && (
                  <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                  Sub Category
                </label>
                <CreatableSelect
                  options={subCategoryOptions}
                  value={selectedSubCategoryValue}
                  onChange={handleSubCategoryChange}
                  styles={customSelectStyles}
                  placeholder={
                    formData.categoryId || formData.category
                      ? 'Select or type subcategory...'
                      : 'Select Category First'
                  }
                  isDisabled={!formData.categoryId && !formData.category}
                  isSearchable
                  isClearable
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 font-extrabold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Description
              </label>
              <textarea
                rows="3"
                placeholder="Enter dish description, ingredients, or notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-[#8C0D0D]"
              />
            </div>

            {/* Dish Photo & Presets */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-extrabold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#8C0D0D]" />
                Dish Image
              </label>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Dish Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  ) : (
                    <Utensils className="w-7 h-7 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-xs cursor-pointer hover:bg-rose-100 border border-rose-200/60 shadow-xs transition active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {/* <p className="text-[11px] text-slate-400 font-medium">
                    Upload file or pick a sample preset below:
                  </p> */}
                </div>
              </div>

              {/* Presets Gallery */}
              {/* <div className="grid grid-cols-4 gap-2 pt-1">
                {DISH_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: preset.url,
                        imageFile: null,
                      }))
                    }
                    className={`group relative rounded-xl overflow-hidden border transition active:scale-95 ${
                      formData.imageUrl === preset.url
                        ? 'border-[#8C0D0D] ring-2 ring-[#8C0D0D]/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-11 object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[8.5px] text-white font-bold p-0.5 text-center truncate block">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div> */}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recipe Ingredients Dynamic Table (Just like kitchen) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recipe Formula Header & Stock Capacity */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block mb-1">
                  Single-Serving Recipe Formula
                </span>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Recipe Ingredients ({selectedIngredients.length} Items)
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Deducts automatically from inventory per order. Units like TBSP & TSP auto-convert into Grams.
                </p>
              </div>

              {/* Yield Metric */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center shrink-0 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Stock Ready</span>
                <div className="text-2xl font-black text-amber-300 mt-0.5">
                  {selectedIngredients.length > 0 && recipeYield?.capacity != null ? (
                    <span>
                      {recipeYield.capacity}{' '}
                      <small className="text-xs font-bold text-white">Dishes</small>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {selectedIngredients.length > 0 ? '0 Dishes' : 'Add Items'}
                    </span>
                  )}
                </div>
                {selectedIngredients.length > 0 && recipeYield?.limitingIngredient && (
                  <span className="text-[9.5px] text-rose-200 block mt-1 truncate max-w-[120px]">
                    Limiter: {recipeYield.limitingIngredient}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#8C0D0D]/30 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Recipe Ingredients Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-100 dark:border-slate-800 space-y-5">
            {/* Quick Add Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                + Add Ingredient from Catalog
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6">
                  <Select
                    options={availableIngredientOptions}
                    value={availableIngredientOptions.find((opt) => String(opt.value) === String(tempIngredientId)) || null}
                    onChange={(opt) => setTempIngredientId(opt ? opt.value : '')}
                    styles={customSelectStyles}
                    placeholder="Search ingredient catalog..."
                    isSearchable
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Serving Qty"
                    value={tempQuantity}
                    onChange={(e) => setTempQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-[#8C0D0D]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={tempUnit}
                    onChange={(e) => setTempUnit(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none"
                  >
                    {STANDARD_MEASURE_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="w-full py-2 bg-[#8C0D0D] hover:bg-[#720505] text-white rounded-xl text-xs font-black flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
                    title="Add Ingredient to Recipe"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ingredients Table */}
            {selectedIngredients.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    No Recipe Ingredients Attached Yet
                  </h4>
                  <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                    Click <strong>"AI Fill"</strong> next to dish name above to populate ingredients automatically, or add items from the bar above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-black tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Ingredient</th>
                      <th className="py-3 px-3">Serving Qty</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3">Available Stock</th>
                      <th className="py-3 px-3">Deduction</th>
                      <th className="py-3 px-3 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedIngredients.map((ing) => {
                      const hint = getConversionHint(ing.quantity, ing.unit);
                      const warning = getSanityWarning(ing.quantity, ing.unit);

                      return (
                        <tr
                          key={ing.tempId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {ing.name}
                            </span>
                            {hint && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                                {hint.badge}
                              </span>
                            )}
                            {warning && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                                {warning.message}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 w-28">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={ing.quantity}
                              onChange={(e) =>
                                handleUpdateIngredientRow(ing.tempId, 'quantity', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#8C0D0D]"
                            />
                          </td>
                          <td className="py-3 px-3 w-28">
                            <select
                              value={ing.unit}
                              onChange={(e) =>
                                handleUpdateIngredientRow(ing.tempId, 'unit', e.target.value)
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            >
                              {STANDARD_MEASURE_UNITS.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {ing.currentStock} {ing.stockUnit}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                              {formatRecipeQty(ing.quantity, ing.unit)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredientRow(ing.tempId)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition active:scale-95 cursor-pointer"
                              title="Remove Ingredient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK PROVISION MODAL (AI Suggestions -> Inventory) */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-modal-pop my-auto">
            {/* Modal Header */}
            <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 block mb-1">
                  AI Recipe Provisioning
                </span>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Review & Provision Missing Ingredients
                </h3>
                <p className="text-xs text-rose-100 font-medium mt-1">
                  These ingredients were recommended by AI and are not in your inventory yet. Confirm initial stock or leave optional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Table of Provision Items */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold flex-1">
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-extrabold tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={provisionItems.every((i) => i.selected)}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setProvisionItems((prev) => prev.map((i) => ({ ...i, selected: val })));
                          }}
                          className="rounded border-slate-300 text-[#8C0D0D] focus:ring-[#8C0D0D]"
                        />
                      </th>
                      <th className="py-3 px-3">INGREDIENT</th>
                      <th className="py-3 px-3">CATEGORY</th>
                      <th className="py-3 px-3">RECIPE QTY & UNIT</th>
                      <th className="py-3 px-3">INITIAL STOCK & UNIT [Optional]</th>
                      <th className="py-3 px-3 text-center">DEL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {provisionItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition ${item.selected ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30 opacity-60'}`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setProvisionItems((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, selected: val } : p))
                              );
                            }}
                            className="rounded border-slate-300 text-[#8C0D0D] focus:ring-[#8C0D0D]"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 w-40">
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProvisionItems((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, category: val } : p))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          >
                            {dynamicCategoryOptions.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.recipeQty} {item.recipeUnit}
                          </span>
                        </td>
                        <td className="py-3 px-3 w-48">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={item.initialStock}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProvisionItems((prev) =>
                                  prev.map((p) => (p.id === item.id ? { ...p, initialStock: val } : p))
                                );
                              }}
                              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#8C0D0D]"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProvisionItems((prev) =>
                                  prev.map((p) => (p.id === item.id ? { ...p, unit: val } : p))
                                );
                              }}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            >
                              {STANDARD_MEASURE_UNITS.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setProvisionItems((prev) => prev.filter((p) => p.id !== item.id))
                            }
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition active:scale-95 cursor-pointer"
                            title="Remove from provisioning"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Skip Provisioning
              </button>
              <button
                type="button"
                onClick={handleProvisionSubmit}
                disabled={isProvisioning || provisionItems.filter((i) => i.selected).length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#720505] text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-900/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProvisioning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning to Inventory...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Add {provisionItems.filter((i) => i.selected).length} Items & Attach to Recipe
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMenuPage;
