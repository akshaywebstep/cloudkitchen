import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Utensils,
  Search,
  Plus,
  Star,
  Tag,
  Check,
  Pencil,
  X,
  DollarSign,
  Image as ImageIcon,
  UploadCloud,
  AlertCircle,
  Eye,
  Building2,
  GitBranch,
  Layers,
  Calendar,
  Scale,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { mockFoods } from '../data/mockData';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getMenuItemsApi,
  getMenuItemsByKitchenApi,
  getMenuItemsByKitchenAndBranchApi,
  getMenuListApi,
  getMenuCategoriesApi,
  getKitchensApi,
  getBranchesApi,
  getIngredientsApi,
  updateMenuItemApi
} from '../services/api';
import { extractFieldErrors, getErrorMessage } from '../utils/errorHelper';
import {
  getConversionHint,
  getSanityWarning,
  formatRecipeQty,
  calculateStockCapacity
} from '../utils/recipeHelper';
import { STANDARD_MEASURE_UNITS, findUnitOption } from '../../constants/measureUnits';

export const Foods = () => {
  const navigate = useNavigate();
  const { setIsAddMenuOpen } = useApp();
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [categoriesList, setCategoriesList] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Category Tabs Horizontal Scroll State & Controls
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollable = () => {
    const el = categoryScrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScrollable();
    const handleResize = () => checkScrollable();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  const handleScrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollable, 300);
    }
  };

  const handleCategoryWheel = (e) => {
    if (categoryScrollRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        categoryScrollRef.current.scrollLeft += e.deltaY;
        checkScrollable();
      }
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIngredients, setEditingIngredients] = useState([]);
  const [tempEditIngId, setTempEditIngId] = useState('');
  const [tempEditQty, setTempEditQty] = useState('');
  const [tempEditUnit, setTempEditUnit] = useState('GM');
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchKitchens();
    fetchBranches();
    fetchIngredients();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [currentPage, itemsPerPage, selectedCategory, selectedKitchenId, selectedBranchId, search]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchMenuItems();
    };
    window.addEventListener('menuItemAdded', handleRefresh);
    return () => window.removeEventListener('menuItemAdded', handleRefresh);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getMenuCategoriesApi({ limit: 200 });
      const rawCats = Array.isArray(res?.allCategories)
        ? res.allCategories
        : Array.isArray(res?.categories)
        ? res.categories
        : Array.isArray(res?.data)
        ? res.data
        : [];

      if (rawCats.length > 0) {
        setCategoriesList(rawCats);
        const rootCats = rawCats.filter((c) => c.parentId === null || !c.parentId);
        const validNames = (rootCats.length > 0 ? rootCats : rawCats)
          .map((c) => (c.name || '').trim())
          .filter(Boolean);
        const unique = Array.from(new Set(validNames));
        if (unique.length > 0) {
          setCategories(['All', ...unique]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchKitchens = async () => {
    try {
      const res = await getKitchensApi({ limit: 200 });
      const raw = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setKitchens(raw);
    } catch (err) {
      console.error('Failed to fetch kitchens:', err);
    }
  };
  const fetchBranches = async () => {
    try {
      const res = await getBranchesApi({ limit: 200 });
      const raw = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setBranches(raw);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await getIngredientsApi({ limit: 500 });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.ingredients)
        ? res.ingredients
        : Array.isArray(res)
        ? res
        : [];
      setIngredientsList(list);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
    }
  };

  const fetchMenuItems = async () => {
    setIsLoading(true);
    showLoading('Loading menu catalog items...');
    try {
      // Fetch menu data from /api/v1/admin/menu?limit=200
      const res = await getMenuListApi({ limit: 200 });

      // 1. Extract and set categories from allCategories or categories
      const rawCats = Array.isArray(res?.allCategories)
        ? res.allCategories
        : Array.isArray(res?.categories)
        ? res.categories
        : Array.isArray(res?.data)
        ? res.data.filter((c) => !c.parentId)
        : [];

      if (rawCats.length > 0) {
        setCategoriesList(rawCats);
        const catNames = rawCats
          .map((c) => (c.name || '').trim())
          .filter(Boolean);
        const unique = Array.from(new Set(catNames));
        if (unique.length > 0) {
          setCategories(['All', ...unique]);
        }
      }

      // 2. Extract and flatten all menu items from res.data
      const extractedDishes = [];
      const seenDishIds = new Set();

      if (res && res.status === true && Array.isArray(res.data)) {
        res.data.forEach((cat) => {
          // Direct menu items in category
          if (Array.isArray(cat.menuItems)) {
            cat.menuItems.forEach((dish) => {
              if (dish && dish.id && !seenDishIds.has(dish.id)) {
                seenDishIds.add(dish.id);
                extractedDishes.push({
                  ...dish,
                  category: cat,
                  categoryId: cat.id,
                });
              }
            });
          }

          // Submenu items in category -> subCategories
          if (Array.isArray(cat.subCategories)) {
            cat.subCategories.forEach((subCat) => {
              const subItems = subCat.subMenuItems || subCat.menuItems || [];
              if (Array.isArray(subItems)) {
                subItems.forEach((dish) => {
                  if (dish && dish.id && !seenDishIds.has(dish.id)) {
                    seenDishIds.add(dish.id);
                    extractedDishes.push({
                      ...dish,
                      category: cat,
                      categoryId: cat.id,
                      subCategory: subCat,
                      subCategoryId: subCat.id,
                    });
                  }
                });
              }
            });
          }

          // Flat item fallback if array item itself is a dish
          if (!cat.subCategories && !cat.menuItems && (cat.price !== undefined || cat.kitchenId !== undefined)) {
            if (cat.id && !seenDishIds.has(cat.id)) {
              seenDishIds.add(cat.id);
              extractedDishes.push(cat);
            }
          }
        });
      }

      // 3. Fallback to getMenuItemsApi if no dishes found
      if (extractedDishes.length === 0) {
        const fallbackRes = await getMenuItemsApi({ limit: 200 });
        if (fallbackRes && fallbackRes.status && Array.isArray(fallbackRes.data)) {
          fallbackRes.data.forEach((dish) => {
            if (dish && dish.id && !seenDishIds.has(dish.id)) {
              seenDishIds.add(dish.id);
              extractedDishes.push(dish);
            }
          });
        }
      }

      // 4. Transform into UI format
      let formatted = extractedDishes.map((item) => {
        const matchedKitchen = kitchens.find(
          (k) => String(k.id) === String(item.kitchenId || item.kitchen?.id)
        );
        const matchedBranch = branches.find(
          (b) => String(b.id) === String(item.branchId || item.branch?.id)
        );

        return {
          id: item.id,
          name: item.name || 'Unnamed Dish',
          description: item.description || '',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          status: item.status || 'ACTIVE',
          categoryId: item.categoryId || item.category?.id,
          category: item.category?.name || (typeof item.category === 'string' ? item.category : 'General'),
          subCategoryId: item.subCategoryId || item.subCategory?.id,
          subCategory: item.subCategory?.name || (typeof item.subCategory === 'string' ? item.subCategory : null),
          subCategoryImage: item.subCategory?.image || null,
          kitchenId: item.kitchenId || item.kitchen?.id,
          kitchenName:
            item.kitchen?.kitchenName ||
            item.kitchen?.name ||
            matchedKitchen?.kitchenName ||
            matchedKitchen?.name ||
            'Assigned Kitchen',
          kitchenEmail: item.kitchen?.email || matchedKitchen?.email || '',
          kitchenPhone: item.kitchen?.phone || matchedKitchen?.phone || '',
          branchId: item.branchId || item.branch?.id,
          branchName:
            item.branch?.name ||
            matchedBranch?.name ||
            'Assigned Branch',
          branchArea: item.branch?.area || matchedBranch?.area || null,
          image:
            item.image ||
            item.imageUrl ||
            item.subCategory?.image ||
            item.category?.image ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          rating: item.rating || 4.8,
          sales: item.sales || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          ingredients: Array.isArray(item.ingredients)
            ? item.ingredients.map((ing) => {
                const rawId =
                  ing.inventoryItem?.ingredient?.id ||
                  ing.inventoryItem?.ingredientId ||
                  ing.ingredientId ||
                  ing.ingredient?.id ||
                  ing.id;
                const rawName =
                  ing.inventoryItem?.ingredient?.name ||
                  ing.ingredient?.name ||
                  ing.name ||
                  'Ingredient';
                const rawUnit =
                  ing.inventoryItem?.unit ||
                  ing.unit ||
                  'GM';
                const rawQty = ing.quantityRequired ?? ing.quantity ?? 0;
                return {
                  id: rawId,
                  name: rawName,
                  image: ing.inventoryItem?.ingredient?.image || ing.ingredient?.image || ing.image || null,
                  category: ing.inventoryItem?.ingredient?.category || ing.ingredient?.category || ing.category || 'General',
                  quantity: rawQty,
                  unit: rawUnit,
                  alertQuantity: ing.inventoryItem?.alertQuantity || null,
                };
              })
            : [],
        };
      });

      // 5. Apply Category filter
      if (selectedCategory && selectedCategory !== 'All') {
        formatted = formatted.filter(
          (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      // 6. Apply Kitchen filter
      if (selectedKitchenId) {
        formatted = formatted.filter(
          (item) => String(item.kitchenId) === String(selectedKitchenId)
        );
      }

      // 7. Apply Branch filter
      if (selectedBranchId) {
        formatted = formatted.filter(
          (item) => String(item.branchId) === String(selectedBranchId)
        );
      }

      // 8. Apply Search filter
      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        formatted = formatted.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
            item.kitchenName.toLowerCase().includes(q) ||
            item.branchName.toLowerCase().includes(q)
        );
      }

      setTotalItems(formatted.length);

      // 9. Paginate
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedFoods = formatted.slice(startIndex, startIndex + itemsPerPage);
      setFoods(paginatedFoods);
    } catch (err) {
      console.error('Failed to fetch menu items from /api/v1/admin/menu:', err);
      setFoods([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  const categoryOptions = categories.map((cat) => ({ value: cat, label: cat }));

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'INACTIVE', label: 'INACTIVE' },
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
      zIndex: 9999,
    }),
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

  const scrollToFirstError = (errObj) => {
    const firstKey = Object.keys(errObj)[0];
    if (firstKey) {
      const el = document.getElementById(`food-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const toggleStock = (id) => {
    setFoods((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: f.status === 'In Stock' ? 'Out of Stock' : 'In Stock' }
          : f
      )
    );
    toast.info('Item stock status updated!');
  };

  const openEditModal = (item) => {
    navigate(`/admin/edit-menu/${item.id}`, { state: { editItem: item } });
  };

  const handleAddEditIngredient = () => {
    if (!tempEditIngId) {
      toast.error('Please select an ingredient from the list.');
      return;
    }
    const parsedQty = parseFloat(tempEditQty);
    if (!tempEditQty || isNaN(parsedQty) || parsedQty <= 0) {
      toast.error('Please specify a valid quantity greater than 0.');
      return;
    }

    const ingObj = ingredientsList.find((i) => i.id === Number(tempEditIngId));
    if (!ingObj) return;

    if (editingIngredients.some((item) => item.id === ingObj.id)) {
      toast.error('Ingredient already added to recipe.');
      return;
    }

    setEditingIngredients((prev) => [
      ...prev,
      {
        id: ingObj.id,
        name: ingObj.name,
        unit: tempEditUnit || ingObj.unit || 'GM',
        quantity: parsedQty,
      },
    ]);

    setTempEditIngId('');
    setTempEditQty('');
    setTempEditUnit('GM');
  };

  const handleUpdateEditIngredient = (id, field, value) => {
    setEditingIngredients((prev) =>
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

  const handleRemoveEditIngredient = (id) => {
    setEditingIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem((prev) => ({ ...prev, image: reader.result, imageFile: file }));
        toast.success('Food photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!editingItem.name || !editingItem.name.trim()) {
      newErrors.name = 'Dish name is required.';
    }
    const numPrice = parseFloat(editingItem.price);
    if (editingItem.price === '' || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      toast.error('Please fix highlighted errors in the dish form.');
      setTimeout(() => scrollToFirstError(newErrors), 100);
      return;
    }

    setEditErrors({});

    try {
      let updatePayload;
      if (editingItem.imageFile instanceof File) {
        const fd = new FormData();
        fd.append('name', editingItem.name);
        fd.append('description', editingItem.description || '');
        fd.append('price', String(numPrice));
        if (editingItem.status) fd.append('status', editingItem.status);
        if (editingItem.categoryId) {
          fd.append('categoryId', Number(editingItem.categoryId));
        }
        if (editingItem.subCategoryId) {
          fd.append('subCategoryId', Number(editingItem.subCategoryId));
        }
        fd.append('image', editingItem.imageFile);
        if (editingIngredients.length > 0) {
          fd.append(
            'ingredients',
            JSON.stringify(
              editingIngredients.map((item) => ({
                id: Number(item.id),
                quantity: Number(item.quantity),
              }))
            )
          );
        }
        updatePayload = fd;
      } else {
        updatePayload = {
          name: editingItem.name,
          description: editingItem.description,
          price: numPrice,
          status: editingItem.status,
          ...(editingItem.categoryId
            ? { categoryId: Number(editingItem.categoryId) }
            : {}),
          ...(editingItem.subCategoryId
            ? { subCategoryId: Number(editingItem.subCategoryId) }
            : {}),
          ...(editingItem.image && !editingItem.image.startsWith('data:')
            ? { image: editingItem.image }
            : {}),
          ingredients: editingIngredients.map((item) => ({
            id: Number(item.id),
            quantity: Number(item.quantity),
          })),
        };
      }

      showLoading('Updating dish details...');
      const res = await updateMenuItemApi(editingItem.id, updatePayload);
      hideLoading();

      if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
        toast.success(res.message || `"${editingItem.name}" updated successfully!`);
        setFoods((prev) =>
          prev.map((f) =>
            f.id === editingItem.id
              ? {
                  ...editingItem,
                  price: numPrice,
                  ingredients: [...editingIngredients],
                }
              : f
          )
        );
        setEditingItem(null);
        fetchMenuItems();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setEditErrors(fieldErrors);
          setTimeout(() => scrollToFirstError(fieldErrors), 100);
        }
        toast.error(getErrorMessage(res, 'Failed to update menu item on server.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to connect to menu server.');
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="space-y-6 pb-8 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Master Menu Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {foods.length} Culinary Items Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Menu Catalog & Recipe Control</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Organize cloud kitchen dishes, active pricing, stock status, and culinary categories across all hub lines.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/admin/add-menu')}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Category Navigation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
        {/* Top Controls Row: Kitchen, Branch & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Kitchen Filter Dropdown */}
            <select
              value={selectedKitchenId}
              onChange={(e) => {
                setSelectedKitchenId(e.target.value);
                setSelectedBranchId('');
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-bold cursor-pointer"
            >
              <option value="">All Kitchens</option>
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kitchenName || k.name || 'Kitchen'}
                </option>
              ))}
            </select>

            {/* Branch Filter Dropdown */}
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-bold cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches
                .filter((b) => {
                  if (!selectedKitchenId) return true;
                  const kId = String(selectedKitchenId);
                  return (
                    String(b.userId) === kId ||
                    String(b.kitchenId) === kId ||
                    String(b.user?.id) === kId ||
                    String(b.kitchen?.id) === kId
                  );
                })
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || 'Branch'}
                  </option>
                ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Bottom Row: Full-width Category Tabs with Smooth Scroll & Arrows */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center group">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollCategories('left')}
                className="absolute -left-3 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-90 cursor-pointer flex items-center justify-center hover:text-[#8C0D0D]"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Category Container */}
            <div
              ref={categoryScrollRef}
              onScroll={checkScrollable}
              onWheel={handleCategoryWheel}
              className="w-full flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto scroll-smooth select-none scrollbar-thin"
              style={{
                scrollbarWidth: 'thin',
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#8C0D0D] text-white shadow-md shadow-rose-900/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollCategories('right')}
                className="absolute -right-3 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-90 cursor-pointer flex items-center justify-center hover:text-[#8C0D0D]"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Food Cards Grid OR Empty State */}
      {foods.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-5">
            {foods.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-card border border-slate-100 dark:border-slate-800 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-38 sm:h-40 overflow-hidden group bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow">
                        {item.category}
                      </span>
                    </div>
                    <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[#8C0D0D] dark:text-rose-400 text-xs font-black shadow-md border border-slate-200/50 dark:border-slate-700/50">
                      ₹{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium mt-1">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
                          {item.subCategory?.name || item.category || 'Culinary Special'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      item.status === 'ACTIVE' || item.status === 'In Stock'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {item.status || 'ACTIVE'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingItem(item)}
                      title="View Full Dish Details & Recipe"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#8C0D0D] hover:text-white transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95 shadow-xs"
                      title="Edit Dish"
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
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <EmptyState
          title="No menu items found"
          description="We couldn't find any dishes in the kitchen catalog matching your selected category tab or search query."
          onReset={() => {
            setSelectedCategory('All');
            setSearch('');
          }}
        />
      )}

      {/* EDIT DISH MODAL WITH VALIDATION */}
      {/* ═══════════ VIEW DISH DETAILS MODAL ═══════════ */}
      {viewingItem &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-3xl w-full overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col my-auto">
              {/* Header */}
              <div className="bg-[#8C0D0D] text-white px-4 sm:px-6 py-3.5 sm:py-6 flex items-center justify-between relative overflow-hidden shrink-0">
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-rose-200" />
                    Dish Specifications
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-medium">
                    Detailed recipe, hierarchy allocation & ingredients breakdown
                  </p>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
                {/* Photo & Main Details */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <img
                    src={viewingItem.image}
                    alt={viewingItem.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-[#8C0D0D]/20 shadow-md shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider">
                        {viewingItem.category}
                      </span>
                      {viewingItem.subCategory && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                          {viewingItem.subCategory}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          viewingItem.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {viewingItem.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {viewingItem.name}
                    </h4>
                    <span className="text-base font-black text-[#8C0D0D] dark:text-rose-400 block">
                      ₹{typeof viewingItem.price === 'number' ? viewingItem.price.toFixed(2) : viewingItem.price}
                    </span>
                  </div>
                </div>

                {/* Kitchen & Branch Hierarchy Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Kitchen Hub
                    </span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#8C0D0D] shrink-0" />
                      {viewingItem.kitchenName}
                    </p>
                    {viewingItem.kitchenPhone && (
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Phone: {viewingItem.kitchenPhone}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Branch Outlet
                    </span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      {viewingItem.branchName}
                    </p>
                    {viewingItem.branchArea && (
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Area: {viewingItem.branchArea}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recipe Ingredients Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400" />
                      Recipe Ingredients Breakdown
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {viewingItem.ingredients.length} Total
                    </span>
                  </div>

                  {viewingItem.ingredients.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {viewingItem.ingredients.map((ing, idx) => {
                        const hint = getConversionHint(ing.quantity, ing.unit);
                        return (
                          <div
                            key={ing.id || idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 gap-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {ing.name}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {ing.category}
                                  </span>
                                  {hint?.badge && (
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/50">
                                      {hint.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-black text-xs shrink-0 whitespace-nowrap">
                              {formatRecipeQty(ing.quantity, ing.unit)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400 text-xs italic">
                      No recipe ingredients assigned to this dish.
                    </p>
                  )}
                </div>

                {/* Description */}
                {viewingItem.description && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Description
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {viewingItem.description}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                {viewingItem.createdAt && (
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Created: {new Date(viewingItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingItem;
                    setViewingItem(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Dish
                </button>

                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
