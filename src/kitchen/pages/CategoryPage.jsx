import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  UtensilsCrossed,
  Search,
  Plus,
  Building2,
  Package,
  Layers,
  Sparkles,
  Grid,
  List,
  Clock,
  Eye,
  CheckCircle2,
  DollarSign,
  ArrowUpDown,
  Filter,
  X,
  Pencil,
  TrendingUp,
  ChefHat,
  Tag,
  Check,
  RefreshCw,
  Boxes,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppSelect } from "../../components/ui/AppSelect";
import { Pagination } from "../../components/ui/Pagination";
import { Loader } from "../../components/ui/Loader";
import { api, getApiErrorMessage } from "../../api";
import { resolveSelectedBranchId, formatRecipeQty } from "../../utils/helpers";
import { foodImages } from "../../constants/mockData";
import { usePermissions } from "../../utils/permissions";

export function CategoryPage({ apiState, refreshKitchenData, onToast }) {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions(apiState);

  const handleEditDish = (dish) => {
    if (!dish) return;
    navigate("/kitchen/add-menu", {
      state: {
        editDish: {
          id: dish.rawId || dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.priceNum || (typeof dish.price === "string" ? dish.price.replace(/[^\d.]/g, "") : dish.price),
          category: dish.category,
          subCategory: dish.subCategory,
          image: dish.image || dish.rawMenu?.image || "",
          ingredients: dish.rawMenu?.ingredients || dish.ingredients || [],
          rawMenu: dish.rawMenu || dish,
        },
      },
    });
  };

  // Active branch from header context
  const activeBranchId = resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  const selectedBranch = (apiState?.branches || []).find((b) => String(b.id) === String(activeBranchId));

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL | IN_STOCK | OUT_OF_STOCK
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  const [stockStatusMap, setStockStatusMap] = useState({});
  const [apiCategories, setApiCategories] = useState([]);

  // Fetch dynamic categories on mount
  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const res = await api.menuCategories();
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!active) return;
        setApiCategories(data);
      } catch {}
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  // Pagination state from API meta
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    filtered: 0,
    count: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch live menu items from server
  const fetchMenuItems = useCallback(
    async (isSilent = false) => {
      if (!activeBranchId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = {
          page: String(currentPage),
          limit: String(pageSize),
        };
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const res = await api.menus(activeBranchId, params);

        const dataArray = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        setMenuItems(dataArray);

        if (res?.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            page: currentPage,
            limit: pageSize,
            total: dataArray.length,
            filtered: dataArray.length,
            count: dataArray.length,
            totalPages: Math.max(1, Math.ceil(dataArray.length / pageSize)),
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } catch (error) {
        // Fallback to apiState.menus if available
        if (apiState?.menus?.length) {
          setMenuItems(apiState.menus);
        }
        if (!isSilent) {
          const msg = getApiErrorMessage(error, "Failed to fetch menu items");
          onToast?.({ message: msg, type: "error" });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeBranchId, currentPage, pageSize, searchQuery, apiState?.menus]
  );

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Build lookup map for dynamic ingredient names & units from backend
  const ingredientLookup = useMemo(() => {
    const map = new Map();
    (apiState?.ingredients || []).forEach((ing) => {
      if (ing?.id) {
        map.set(String(ing.id), {
          name: ing.name || `Ingredient #${ing.id}`,
          category: ing.category || "General",
          unit: ing.unit || "KG",
          image: ing.image,
        });
      }
    });
    (apiState?.branchIngredients || []).forEach((bi) => {
      const id = String(bi.ingredientId || bi.ingredient?.id || bi.id || "");
      const name = bi.ingredient?.name || bi.name;
      if (id && name) {
        map.set(id, {
          name,
          category: bi.ingredient?.category || bi.category || "General",
          unit: bi.unit || bi.ingredient?.unit || "KG",
          image: bi.ingredient?.image || bi.image,
        });
      }
    });
    return map;
  }, [apiState?.ingredients, apiState?.branchIngredients]);

  // Unified items parsed according to backend structure
  const allDishes = useMemo(() => {
    const sourceList = menuItems.length > 0 ? menuItems : apiState?.menus || [];

    if (sourceList.length > 0) {
      return sourceList.map((menu, index) => {
        const catName =
          typeof menu.category === "object" && menu.category !== null
            ? menu.category?.name
            : menu.category;

        const subCatName =
          typeof menu.subCategory === "object" && menu.subCategory !== null
            ? menu.subCategory?.name
            : menu.subCategory;

        const priceNum = Number(menu.price || 0);
        const nameLower = (menu.name || "").toLowerCase();
        const catLower = (catName || "").toLowerCase();

        const isVeg =
          catLower.includes("veg") ||
          nameLower.includes("veg") ||
          nameLower.includes("paneer") ||
          nameLower.includes("salad") ||
          nameLower.includes("pizza") ||
          nameLower.includes("pasta") ||
          nameLower.includes("cheese");

        // Parse ingredients according to API response structure:
        // ing.inventoryItem?.ingredient?.name / ing.inventoryItem?.unit / ing.quantityRequired
        const rawIngredients = Array.isArray(menu.ingredients) ? menu.ingredients : [];
        const resolvedIngredients = rawIngredients.map((ing, idx) => {
          const invItem = ing.inventoryItem;
          const innerIng = invItem?.ingredient || ing.ingredient;

          const ingId = String(innerIng?.id || invItem?.ingredientId || ing.inventoryItemId || ing.ingredientId || ing.id || "");
          const lookup = ingredientLookup.get(ingId);

          const ingName =
            innerIng?.name ||
            ing.name ||
            lookup?.name ||
            (ingId ? `Ingredient #${ingId}` : `Ingredient #${idx + 1}`);

          const unit =
            invItem?.unit ||
            ing.unit ||
            innerIng?.unit ||
            lookup?.unit ||
            "KG";

          const quantity = ing.quantityRequired ?? ing.quantity ?? 1;

          return {
            id: String(ing.id || idx + 1),
            name: ingName,
            unit: unit,
            quantity: quantity,
            category: innerIng?.category || lookup?.category || "General",
          };
        });

        return {
          id: String(menu.id || `live-${index}`),
          rawId: menu.id,
          rawMenu: menu,
          name: menu.name || "Menu Item",
          description: menu.description || "Fresh kitchen recipe prepared with branch ingredients.",
          price: priceNum > 0 ? `₹${priceNum.toLocaleString()}` : "₹299",
          priceNum: priceNum > 0 ? priceNum : 299,
          category: catName || "Main Course",
          subCategory: subCatName || "",
          image: menu.image || foodImages[index % foodImages.length],
          isLive: true,
          isVeg,
          status: menu.status || "ACTIVE",
          createdAt: menu.createdAt,
          updatedAt: menu.updatedAt,
          ingredients: resolvedIngredients,
          inStock: menu.status ? menu.status.toUpperCase() === "ACTIVE" : true,
        };
      });
    }

    return [];
  }, [menuItems, apiState?.menus, ingredientLookup]);

  // Categories list (strictly from GET /kitchen/menu/categories)
  const categories = useMemo(() => {
    const list = [
      { name: "ALL", label: "All Items", count: allDishes.length },
    ];

    const seen = new Set();

    (apiCategories || [])
      .filter((c) => c && (c.status === undefined || c.status === "ACTIVE"))
      .forEach((c) => {
        const name = (c.name || c.title || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          const count = allDishes.filter((d) => {
            const dCat = typeof d.category === "object" ? d.category?.name : d.category;
            return dCat && (dCat.toLowerCase() === name.toLowerCase() || String(d.categoryId) === String(c.id));
          }).length;
          list.push({
            name,
            label: name,
            id: c.id,
            count,
          });
        }
      });

    // Also extract unique categories dynamically from all live branch dishes
    allDishes.forEach((d) => {
      const dCat = typeof d.category === "object" ? d.category?.name : d.category;
      const trimmed = (dCat || "").trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        const count = allDishes.filter((dish) => {
          const itemCat = typeof dish.category === "object" ? dish.category?.name : dish.category;
          return itemCat && itemCat.toLowerCase() === trimmed.toLowerCase();
        }).length;
        list.push({
          name: trimmed,
          label: trimmed,
          count,
        });
      }
    });

    return list;
  }, [apiCategories, allDishes]);

  // Toggle in-stock status
  const toggleStock = (dishId) => {
    setStockStatusMap((prev) => ({
      ...prev,
      [dishId]: prev[dishId] === false ? true : false,
    }));
  };

  // Filter & sort
  const filteredDishes = useMemo(() => {
    let list = allDishes.map((d) => ({
      ...d,
      inStock: stockStatusMap[d.id] !== undefined ? stockStatusMap[d.id] : d.inStock,
    }));

    if (selectedCategory !== "ALL") {
      list = list.filter((d) => d.category === selectedCategory);
    }

    if (stockFilter === "IN_STOCK") {
      list = list.filter((d) => d.inStock);
    } else if (stockFilter === "OUT_OF_STOCK") {
      list = list.filter((d) => !d.inStock);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.subCategory || "").toLowerCase().includes(q) ||
          (d.description || "").toLowerCase().includes(q) ||
          d.ingredients.some((ing) => (ing.name || "").toLowerCase().includes(q))
      );
    }

    if (sortBy === "PRICE_ASC") {
      list.sort((a, b) => a.priceNum - b.priceNum);
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a, b) => b.priceNum - a.priceNum);
    } else if (sortBy === "NAME_ASC") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [allDishes, selectedCategory, stockFilter, searchQuery, sortBy, stockStatusMap]);

  const activeInStockCount = useMemo(() => {
    return allDishes.filter((d) => (stockStatusMap[d.id] !== undefined ? stockStatusMap[d.id] : d.inStock)).length;
  }, [allDishes, stockStatusMap]);

  return (
    <div className="mx-auto space-y-5 pb-14">
      {/* Top Banner */}
      <PageHeader
        badge="Menu & Food Catalog"
        activeBadge={`${selectedBranch?.name || `Branch #${activeBranchId || "1"}`} (${meta.total || allDishes.length} Items)`}
        title="Dishes & Categories"
        subtitle="Manage live menu items, recipes, prices, and monitor ingredient stock status across kitchen branches."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchMenuItems(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              title="Refresh Menu Items"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>
            {canCreate("menu") && (
              <button
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8D0606] to-[#b80808] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:from-[#7a0505] hover:to-[#a10707] active:scale-98"
                onClick={() => navigate("/kitchen/add-menu")}
                type="button"
              >
                <Plus size={15} />
                <span>Add Menu Food</span>
              </button>
            )}
          </div>
        }
      />

      {/* Target Branch Header Indicator */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs shrink-0">
            <Building2 size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Active Kitchen Branch:</span>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#8D0606] border border-rose-100 whitespace-nowrap">
                {selectedBranch?.name || `Branch #${activeBranchId || "1"}`}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
              Displaying recipe catalog and pricing for this branch.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100 whitespace-nowrap">
            {activeInStockCount} Available
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200 whitespace-nowrap">
            {meta.total || allDishes.length} Total Recipes
          </span>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-2xs ${
                isSelected
                  ? "bg-[#8D0606] text-white shadow-rose-950/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Bar: Search, Filters, Layout Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-2xs border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search recipes and dishes by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#8D0606] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8D0606]/10 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Filter */}
          <div className="flex-1 sm:flex-initial min-w-[130px]">
            <AppSelect
              value={stockFilter}
              onChange={setStockFilter}
              options={[
                { value: "ALL", label: "All Stock" },
                { value: "IN_STOCK", label: "In Stock Only" },
                { value: "OUT_OF_STOCK", label: "Out of Stock" },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className="flex-1 sm:flex-initial min-w-[140px]">
            <AppSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "DEFAULT", label: "Sort: Default" },
                { value: "PRICE_ASC", label: "Price: Low to High" },
                { value: "PRICE_DESC", label: "Price: High to Low" },
                { value: "NAME_ASC", label: "Name: A to Z" },
              ]}
            />
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`grid size-8 place-items-center rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-[#8D0606] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`grid size-8 place-items-center rounded-lg transition ${
                viewMode === "table" ? "bg-white text-[#8D0606] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader variant="page" text="Loading menu items from kitchen server..." />
        </div>
      ) : filteredDishes.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid Cards View */
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {filteredDishes.map((dish) => (
                <FoodItemCard
                  key={dish.id}
                  dish={dish}
                  canUpdate={canUpdate("menu")}
                  onToggleStock={() => toggleStock(dish.id)}
                  onSelectDetail={setSelectedDishDetail}
                  onEdit={() => handleEditDish(dish)}
                />
              ))}
            </div>

            {/* Pagination Component for Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <Pagination
                currentPage={meta.page || currentPage}
                totalItems={meta.total || meta.filtered || meta.count || allDishes.length}
                pageSize={meta.limit || pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[8, 12, 20, 50]}
              />
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="pl-5 pr-2 py-3.5 w-12 text-slate-400">#</th>
                    <th className="px-4 py-3.5">Dish Details</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Recipe Ingredients</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredDishes.map((dish, idx) => {
                    const dishIndex = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={dish.id || idx}
                        onClick={() => setSelectedDishDetail(dish)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="pl-5 pr-2 py-3.5 font-bold text-xs text-[#8D0606]">
                          #{dishIndex}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="size-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate hover:text-[#8D0606]">
                                {dish.name}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[220px]">
                                {dish.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#8D0606] border border-rose-100">
                            {dish.category}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {dish.ingredients.length > 0 ? (
                              dish.ingredients.slice(0, 2).map((ing, iIdx) => (
                                <span
                                  key={iIdx}
                                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600 border border-slate-200/60"
                                >
                                  {ing.name} ({formatRecipeQty(ing.quantity, ing.unit)})
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">None linked</span>
                            )}
                            {dish.ingredients.length > 2 && (
                              <span className="text-[10px] font-bold text-slate-400 self-center">
                                +{dish.ingredients.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {dish.price}
                        </td>

                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleStock(dish.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
                              dish.inStock
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-300 bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${dish.inStock ? "bg-emerald-500" : "bg-slate-400"}`}
                            />
                            <span>{dish.inStock ? "In Stock" : "Out of Stock"}</span>
                          </button>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedDishDetail(dish)}
                              className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-[#8D0606] hover:text-[#8D0606] transition shadow-2xs"
                            >
                              View
                            </button>
                            {canUpdate("menu") && (
                              <button
                                type="button"
                                onClick={() => handleEditDish(dish)}
                                className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-[#8D0606] transition shadow-2xs"
                                title="Edit Dish"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Component for Table */}
            <Pagination
              currentPage={meta.page || currentPage}
              totalItems={meta.total || meta.filtered || meta.count || allDishes.length}
              pageSize={meta.limit || pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center border border-slate-200 shadow-2xs">
          <div className="grid size-12 place-items-center rounded-xl bg-rose-50 text-[#8D0606] mb-2.5">
            <UtensilsCrossed size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No food items found</h3>
          <p className="mt-0.5 text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setStockFilter("ALL");
            }}
            className="mt-3.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedDishDetail && (
        <DishDetailModal
          dish={selectedDishDetail}
          canUpdate={canUpdate("menu")}
          onClose={() => setSelectedDishDetail(null)}
          onEdit={() => handleEditDish(selectedDishDetail)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact Modern Food Card
// ---------------------------------------------------------------------------
function FoodItemCard({ dish, onToggleStock, onSelectDetail, onEdit, canUpdate = true }) {
  return (
    <div
      onClick={() => onSelectDetail(dish)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 cursor-pointer"
    >
      <div>
        {/* Cover Photo */}
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100">
          <img
            src={dish.image}
            alt={dish.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-104"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
            }}
          />

          {/* In Stock Badge */}
          <div className="absolute right-1.5 sm:right-2.5 top-1.5 sm:top-2.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={canUpdate ? onToggleStock : undefined}
              disabled={!canUpdate}
              className={`flex items-center gap-1 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold backdrop-blur-md transition shadow-2xs ${
                dish.inStock
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900"
                  : "bg-slate-950/80 text-slate-300 border border-slate-500/30 hover:bg-slate-900"
              } ${!canUpdate ? "cursor-default opacity-85" : ""}`}
            >
              <span
                className={`size-1.5 rounded-full ${dish.inStock ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
              />
              <span>{dish.inStock ? "In Stock" : "Out"}</span>
            </button>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-1.5 sm:bottom-2.5 right-1.5 sm:right-2.5">
            <span className="rounded-lg sm:rounded-xl bg-[#8D0606] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-white shadow-xs">
              {dish.price}
            </span>
          </div>

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute bottom-1.5 sm:bottom-2.5 left-1.5 sm:left-2.5">
            <div className="flex items-center gap-1 rounded-md bg-white/95 px-1 sm:px-1.5 py-0.5 shadow-2xs backdrop-blur-xs border border-slate-200/80">
              <span
                className={`flex size-2.5 sm:size-3 items-center justify-center rounded-xs border ${
                  dish.isVeg ? "border-emerald-600" : "border-rose-700"
                }`}
              >
                <span
                  className={`size-1 sm:size-1.5 rounded-full ${dish.isVeg ? "bg-emerald-600" : "bg-rose-700"}`}
                />
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700">
                {dish.isVeg ? "Veg" : "Non-Veg"}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-2.5 sm:mt-3">
          <div>
            <h3
              className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#8D0606] transition"
              title={dish.name}
            >
              {dish.name}
            </h3>
          </div>

          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1">
            {dish.description}
          </p>
        </div>
      </div>

      {/* Card Action Row */}
      <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDetail(dish);
          }}
          className="text-[11px] sm:text-xs font-bold text-[#8D0606] hover:underline flex items-center gap-1"
        >
          <span>View Recipe</span>
        </button>

        {canUpdate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit Dish"
            className="grid size-7 sm:size-8 place-items-center rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-[#8D0606] hover:border-rose-200 transition shadow-2xs active:scale-95"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dish Quick Detail Modal
// ---------------------------------------------------------------------------
function DishDetailModal({ dish, onClose, onEdit, canUpdate = true }) {
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const formattedDate = dish.createdAt
    ? new Date(dish.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#8D0606] border border-rose-100">
                {dish.category}
              </span>

              <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200/60">
                <span
                  className={`flex size-3 items-center justify-center rounded-xs border ${
                    dish.isVeg ? "border-emerald-600" : "border-rose-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${dish.isVeg ? "bg-emerald-600" : "bg-rose-700"}`}
                  />
                </span>
                <span className="text-[10px] font-bold text-slate-700 uppercase">
                  {dish.isVeg ? "Veg" : "Non-Veg"}
                </span>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  dish.inStock
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {dish.inStock ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900">{dish.name}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Photo & Price Header */}
          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/70 shadow-xs">
            <img
              src={dish.image}
              alt={dish.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
              }}
            />
            <div className="absolute bottom-3 right-3">
              <span className="rounded-xl bg-[#8D0606] px-3.5 py-1.5 text-base font-extrabold text-white shadow-md">
                {dish.price}
              </span>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Category
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{dish.category || "General"}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Sub-Category
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {dish.subCategory || "None specified"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Ingredients Linked
              </span>
              <p className="text-xs font-bold text-[#8D0606]">
                {dish.ingredients?.length || 0} Ingredients
              </p>
            </div>
          </div>

          {/* Recipe Description Overview */}
          {dish.description && (
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Recipe Overview / Description
              </h4>
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs font-medium text-slate-700 leading-relaxed">
                {dish.description}
              </div>
            </div>
          )}

          {/* Detailed Ingredients Table Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Ingredients & Required Quantities
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                {dish.ingredients?.length || 0} Total
              </span>
            </div>

            {dish.ingredients && dish.ingredients.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="pl-3.5 pr-2 py-2.5 w-8 text-slate-400">#</th>
                      <th className="px-3 py-2.5">Ingredient Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5 text-right">Required Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {dish.ingredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="pl-3.5 pr-2 py-2.5 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>{ing.name}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                            {ing.category || "General"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <span className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-bold text-[#8D0606]">
                            {formatRecipeQty(ing.quantity, ing.unit || "KG")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                No ingredients configured for this dish.
              </div>
            )}
          </div>

          {/* Creation Metadata */}
          {formattedDate && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Created on: <span className="font-semibold text-slate-600">{formattedDate}</span></span>
              <span>Status: <span className="font-semibold text-emerald-600">Active in Menu</span></span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Close
          </button>
          {canUpdate && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#8D0606] py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 hover:bg-[#780404] transition active:scale-98"
            >
              <Pencil size={14} />
              <span>Edit Recipe</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}