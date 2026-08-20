import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  UtensilsCrossed,
  DollarSign,
  FolderTree,
  Package,
  Scale,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle2,
  Save,
  X,
  Eye,
  Plus,
  Trash2,
  Boxes,
} from "lucide-react";
import { Loader } from "../../ui/Loader";
import { PageHeader } from "../../ui/PageHeader";
import { api, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns matching form design system
// ---------------------------------------------------------------------------
const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(141, 6, 6, 0.12)"}`
      : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    "&:hover": { borderColor: hasError ? "#ef4444" : "#8D0606" },
    paddingLeft: 4,
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontSize: 13 }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: state.isSelected ? "#8D0606" : state.isFocused ? "#fff1f1" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    padding: "9px 12px",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
});

// ---------------------------------------------------------------------------
// Reusable TextField with inline error and ref forwarding
// ---------------------------------------------------------------------------
const TextField = React.forwardRef(function TextField(
  { label, required, error, textarea, icon: Icon, className = "", ...props },
  ref
) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <div className="relative">
        {Icon && !textarea ? (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={17} />
        ) : null}
        <Comp
          ref={ref}
          {...props}
          rows={textarea ? 3 : undefined}
          className={`w-full rounded-xl border bg-white text-xs font-medium text-[#0f172a] outline-none transition duration-200 placeholder:text-[#94a3b8] ${
            textarea ? "p-3.5" : Icon ? "h-11 pl-10 pr-4" : "h-11 px-3.5"
          } ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[#e2e8f0] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

export function AddMenuPage({ apiState, refreshKitchenData, onToast }) {
  const navigate = useNavigate();
  
  // Use currently active branch from Header/Context
  const activeBranchId = resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  const selectedBranch = (apiState?.branches || []).find((b) => String(b.id) === String(activeBranchId));

  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    subCategory: "",
  });

  // Multiple recipe ingredients state
  const [recipeIngredients, setRecipeIngredients] = useState([
    { ingredientId: "", quantity: "1" },
  ]);

  const [branchIngredients, setBranchIngredients] = useState(apiState?.branchIngredients || []);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Field refs for auto-scroll on validation error
  const nameRef = useRef(null);
  const priceRef = useRef(null);

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Helper to extract stock count
  const extractStock = (item) => {
    if (Array.isArray(item?.stock)) {
      return item.stock.reduce((sum, s) => sum + (Number(s?.quantity ?? s?.stock) || 0), 0);
    }
    if (typeof item?.stock === "object" && item?.stock !== null) {
      return item.stock.quantity ?? item.stock.stock ?? 0;
    }
    if (typeof item?.stock === "number") return item.stock;
    return 0;
  };

  // Load branch ingredients whenever activeBranchId changes
  useEffect(() => {
    if (!activeBranchId) return;
    let active = true;
    async function loadBranchIngredients() {
      setLoadingIngredients(true);
      try {
        const response = await api.branchIngredients(activeBranchId, { limit: "100" });
        const ingredients = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        if (!active) return;
        setBranchIngredients(ingredients);
      } catch {
        if (active) setBranchIngredients(apiState?.branchIngredients || []);
      } finally {
        if (active) setLoadingIngredients(false);
      }
    }
    loadBranchIngredients();
    return () => {
      active = false;
    };
  }, [activeBranchId, apiState?.branchIngredients]);

  // Combine branch ingredients and master ingredients for dropdown options
  const ingredientLookupMap = useMemo(() => {
    const map = new Map();
    branchIngredients.forEach((item) => {
      const id = String(item.ingredientId || item.ingredient?.id || item.id);
      const name = item.ingredient?.name || item.name || `Ingredient #${id}`;
      const unit = item.unit || "KG";
      const stock = extractStock(item);
      map.set(id, { id, name, unit, stock, isBranch: true, raw: item });
    });

    (apiState?.ingredients || []).forEach((item) => {
      const id = String(item.id);
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: item.name || `Ingredient #${id}`,
          unit: item.unit || "KG",
          stock: 0,
          isBranch: false,
          raw: item,
        });
      }
    });
    return map;
  }, [branchIngredients, apiState?.ingredients]);

  const ingredientOptions = useMemo(() => {
    return Array.from(ingredientLookupMap.values()).map((item) => ({
      value: item.id,
      label: `${item.name} (${item.unit}) • Stock: ${item.stock} ${item.unit}`,
      unit: item.unit,
      stock: item.stock,
      name: item.name,
      isBranch: item.isBranch,
    }));
  }, [ingredientLookupMap]);

  // Menu Categories (predefined + dynamically discovered from live menus)
  const menuCategoryOptions = useMemo(() => {
    const defaults = [
      "Main Course",
      "Veg.",
      "Non-Veg.",
      "Starters & Appetizers",
      "Breads & Rice",
      "Biryani & Pulao",
      "Soups & Salads",
      "Desserts & Sweets",
      "Beverages & Drinks",
      "Snacks & Fast Food",
      "Breakfast",
      "Combos & Thali",
      "Chef Specials",
    ];
    const dynamicSet = new Set(defaults);
    (apiState?.menus || []).forEach((m) => {
      const cat = typeof m.category === "object" ? m.category?.name : m.category;
      if (cat?.trim()) dynamicSet.add(cat.trim());
    });
    return Array.from(dynamicSet).map((cat) => ({ value: cat, label: cat }));
  }, [apiState?.menus]);

  // Menu Sub Categories
  const menuSubCategoryOptions = useMemo(() => {
    const defaults = [
      "Paneer Specials",
      "Chicken Specials",
      "Mutton Specials",
      "Gravy Dishes",
      "Dry / Tandoori",
      "Biryani & Rice",
      "Dal & Curry",
      "Noodles & Chinese",
      "Pizza & Burgers",
      "Rolls & Wraps",
      "Shakes & Mocktails",
      "Hot Beverages",
      "Ice Creams & Shakes",
      "Chef Specials",
    ];
    const dynamicSet = new Set(defaults);
    (apiState?.menus || []).forEach((m) => {
      const sub = typeof m.subCategory === "object" ? m.subCategory?.name : m.subCategory;
      if (sub?.trim()) dynamicSet.add(sub.trim());
    });
    return Array.from(dynamicSet).map((sub) => ({ value: sub, label: sub }));
  }, [apiState?.menus]);

  // Ingredient row actions
  const addIngredientRow = () => {
    setRecipeIngredients((prev) => [...prev, { ingredientId: "", quantity: "1" }]);
  };

  const removeIngredientRow = (index) => {
    if (recipeIngredients.length <= 1) return;
    setRecipeIngredients((prev) => prev.filter((_, idx) => idx !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`ingredient_${index}`];
      delete next[`quantity_${index}`];
      return next;
    });
  };

  const updateIngredientRow = (index, field, value) => {
    setRecipeIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrors((prev) => ({
      ...prev,
      [`ingredient_${index}`]: undefined,
      [`quantity_${index}`]: undefined,
      ingredients: undefined,
    }));
  };

  // Form Validation
  const validate = () => {
    const next = {};

    if (!activeBranchId) {
      next.branch = "No active kitchen branch selected in header.";
    }

    if (!form.name.trim()) {
      next.name = "Menu item name is required.";
    }

    if (!form.price) {
      next.price = "Selling price is required.";
    } else if (Number(form.price) <= 0) {
      next.price = "Price must be greater than 0.";
    }

    // Validate ingredients
    if (!recipeIngredients.length) {
      next.ingredients = "Please add at least one ingredient to the recipe.";
    } else {
      let hasValidIngredient = false;
      recipeIngredients.forEach((row, idx) => {
        if (!row.ingredientId) {
          next[`ingredient_${idx}`] = "Select an ingredient.";
        } else {
          hasValidIngredient = true;
        }

        if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
          next[`quantity_${idx}`] = "Enter quantity > 0.";
        }
      });

      if (!hasValidIngredient && !next.ingredients) {
        next.ingredients = "Please select at least one ingredient.";
      }
    }

    setErrors(next);

    if (next.name && nameRef.current) {
      nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current.focus();
    } else if (next.price && priceRef.current) {
      priceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      priceRef.current.focus();
    }

    return Object.keys(next).length === 0;
  };

  // Save Menu Item
  const saveMenu = async () => {
    if (!apiState?.token) {
      setMessageType("error");
      setMessage("Login required before adding menu item.");
      onToast?.({ message: "Login required before adding menu item.", type: "error" });
      return;
    }

    if (!validate()) {
      setMessageType("error");
      setMessage("Please fix the highlighted errors before saving.");
      onToast?.({ message: "Please fix the highlighted errors before saving.", type: "warning" });
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // Ensure all chosen ingredients exist in the active branch inventory
      const validRows = recipeIngredients.filter((row) => row.ingredientId && Number(row.quantity) > 0);

      const missingInBranch = validRows.filter((row) => {
        const itemInfo = ingredientLookupMap.get(String(row.ingredientId));
        return itemInfo && !itemInfo.isBranch;
      });

      if (missingInBranch.length > 0) {
        try {
          await api.createBranchIngredients(activeBranchId, {
            ingredients: missingInBranch.map((row) => {
              const itemInfo = ingredientLookupMap.get(String(row.ingredientId));
              return {
                id: Number(row.ingredientId),
                unit: itemInfo?.unit || "KG",
              };
            }),
          });
        } catch (branchErr) {
          console.warn("Could not attach some ingredients to branch inventory:", branchErr);
        }
      }

      const kitchenId = Number(apiState?.kitchen?.id || selectedBranch?.kitchenId || 1);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        branchId: Number(activeBranchId),
        kitchenId: kitchenId,
        category: {
          name: form.category.trim() || "Main Course",
        },
        ...(form.subCategory.trim() ? { subCategory: { name: form.subCategory.trim() } } : {}),
        ingredients: validRows.map((row) => ({
          id: Number(row.ingredientId),
          quantity: Number(row.quantity),
        })),
      };

      await api.createMenu(activeBranchId, payload);

      await refreshKitchenData?.(undefined, undefined, activeBranchId);
      const successText = `Menu item "${form.name.trim()}" created successfully!`;
      setMessageType("success");
      setMessage(successText);
      onToast?.({ message: successText, type: "success" });
      navigate("/menu");
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to create menu item");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 pb-16">
      {/* Top Banner */}
      <PageHeader
        badge="Menu Recipe Creator"
        activeBadge={selectedBranch?.name || `Branch #${activeBranchId || "1"}`}
        title="Add New Menu Item"
        subtitle="Configure dish details, pricing, and link required recipe ingredients with exact quantities."
        actions={
          <button
            className="flex items-center gap-2 rounded-full border border-[#8D0606]/20 bg-[#fff1f1] px-5 py-2.5 text-xs font-bold text-[#8D0606] transition hover:bg-[#ffe4e4] active:scale-98 shadow-2xs"
            onClick={() => navigate("/menu")}
            type="button"
          >
            <Eye size={15} />
            <span>View Menu Items</span>
          </button>
        }
      />

      {/* Target Branch Header Indicator */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs">
            <Building2 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Target Kitchen Branch:</span>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#8D0606] border border-rose-100">
                {selectedBranch?.name || `Branch #${activeBranchId || "1"}`}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Menu item and linked stock will be created under this active branch (selected in header).
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Basic Menu Info & Pricing */}
      <FormPanel title="Dish Details & Pricing" icon={UtensilsCrossed}>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Menu Name */}
          <TextField
            ref={nameRef}
            icon={UtensilsCrossed}
            label="Dish / Menu Name"
            required
            placeholder="e.g. Paneer Butter Masala"
            value={form.name}
            onChange={updateForm("name")}
            error={errors.name}
          />

          {/* Price */}
          <TextField
            ref={priceRef}
            icon={DollarSign}
            label="Selling Price (₹)"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 299"
            value={form.price}
            onChange={updateForm("price")}
            error={errors.price}
          />

          {/* Category */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
              Category <span className="text-rose-600">*</span>
            </label>
            <CreatableSelect
              styles={selectStyles(!!errors.category)}
              options={menuCategoryOptions}
              value={form.category ? { value: form.category, label: form.category } : null}
              onChange={(opt) => {
                setForm((f) => ({ ...f, category: opt?.value || "" }));
                setErrors((err) => ({ ...err, category: undefined }));
              }}
              placeholder="Select or type category"
              menuPortalTarget={document.body}
            />
            {errors.category && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* Sub Category */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
              Sub Category (Optional)
            </label>
            <CreatableSelect
              styles={selectStyles(false)}
              options={menuSubCategoryOptions}
              value={form.subCategory ? { value: form.subCategory, label: form.subCategory } : null}
              onChange={(opt) => setForm((f) => ({ ...f, subCategory: opt?.value || "" }))}
              placeholder="Select or type"
              menuPortalTarget={document.body}
              isClearable
            />
          </div>

          {/* Description */}
          <TextField
            icon={FileText}
            label="Description (Optional)"
            textarea
            className="md:col-span-2"
            placeholder="Describe the dish ingredients, preparation notes, or allergens..."
            value={form.description}
            onChange={updateForm("description")}
          />
        </div>
      </FormPanel>

      {/* Section 2: Recipe Ingredients & Stock Quantities */}
      <FormPanel
        title="Recipe Ingredients & Quantities"
        icon={Package}
        badge={`${recipeIngredients.length} Item${recipeIngredients.length > 1 ? "s" : ""}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Specify the exact stock quantity of each ingredient required to prepare 1 serving of this dish.
            </p>
            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#8D0606] border border-rose-100 hover:bg-rose-100 transition shadow-2xs active:scale-98"
            >
              <Plus size={14} />
              <span>Add Ingredient</span>
            </button>
          </div>

          {errors.ingredients && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-200">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errors.ingredients}</span>
            </p>
          )}

          {/* Table Header for Ingredients */}
          <div className="hidden sm:grid grid-cols-[32px_1fr_180px_130px_38px] gap-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>#</span>
            <span>Recipe Ingredient <span className="text-rose-600">*</span></span>
            <span>Stock / Quantity Needed <span className="text-rose-600">*</span></span>
            <span>Branch Stock</span>
            <span className="text-right">Action</span>
          </div>

          {/* Ingredients Table/Rows */}
          <div className="space-y-3">
            {recipeIngredients.map((row, index) => {
              const selectedItem = ingredientLookupMap.get(String(row.ingredientId));
              const selectedUnit = selectedItem?.unit || "KG";
              const availableStock = selectedItem ? selectedItem.stock : null;

              return (
                <div
                  key={index}
                  className="flex flex-col sm:grid sm:grid-cols-[32px_1fr_180px_130px_38px] items-start sm:items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-slate-50"
                >
                  {/* Row Serial Number */}
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-2xs">
                    {index + 1}
                  </span>

                  {/* Ingredient Select */}
                  <div className="w-full">
                    <label className="sm:hidden mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Ingredient <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      styles={selectStyles(!!errors[`ingredient_${index}`])}
                      options={ingredientOptions}
                      value={ingredientOptions.find((opt) => String(opt.value) === String(row.ingredientId)) || null}
                      onChange={(opt) => updateIngredientRow(index, "ingredientId", opt?.value || "")}
                      placeholder="Search & select ingredient..."
                      menuPortalTarget={document.body}
                      isLoading={loadingIngredients}
                    />
                    {errors[`ingredient_${index}`] && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600">
                        {errors[`ingredient_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Stock / Quantity Input */}
                  <div className="w-full">
                    <label className="sm:hidden mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Stock / Quantity Needed <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder="e.g. 0.5"
                        value={row.quantity}
                        onChange={(e) => updateIngredientRow(index, "quantity", e.target.value)}
                        className={`h-12 w-full rounded-xl border bg-white pl-3.5 pr-14 text-xs font-bold text-slate-800 outline-none transition ${
                          errors[`quantity_${index}`]
                            ? "border-rose-500 bg-rose-50/20"
                            : "border-slate-200 focus:border-[#8D0606]"
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                        {selectedUnit}
                      </span>
                    </div>
                    {errors[`quantity_${index}`] && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600">
                        {errors[`quantity_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Available Stock Tag */}
                  <div className="w-full sm:w-auto">
                    {availableStock !== null ? (
                      <div className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 border border-slate-200">
                        <Boxes size={12} className="text-amber-600 shrink-0" />
                        <span className="truncate">Stock: <strong className="text-slate-800">{availableStock} {selectedUnit}</strong></span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Select item</span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={recipeIngredients.length <= 1}
                      onClick={() => removeIngredientRow(index)}
                      className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                      title="Remove ingredient"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Ingredient Helper Button */}
          <button
            type="button"
            onClick={addIngredientRow}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-xs font-bold text-slate-600 hover:border-[#8D0606]/50 hover:bg-rose-50/30 hover:text-[#8D0606] transition"
          >
            <Plus size={14} />
            <span>Add Another Ingredient to Recipe</span>
          </button>
        </div>
      </FormPanel>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-40 flex flex-col items-end gap-3 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="flex flex-wrap justify-end items-center gap-3 w-full sm:w-auto">
          <button
            className="flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 transition duration-200 hover:bg-slate-200"
            onClick={() => navigate("/menu")}
            type="button"
          >
            <X size={15} />
            <span>Cancel</span>
          </button>
          <button
            className="flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-bold text-white shadow-[0_8px_20px_rgba(141,6,6,0.3)] transition duration-200 hover:from-[#7a0505] hover:to-[#a10707] active:scale-98 disabled:opacity-60"
            disabled={saving}
            onClick={saveMenu}
            type="button"
          >
            {saving ? (
              <Loader variant="button" text="Saving Menu Item..." />
            ) : (
              <>
                <Save size={16} />
                <span>Save Menu Item</span>
              </>
            )}
          </button>
        </div>
        {message ? (
          <p
            className={`flex items-center gap-1.5 text-xs font-bold ${
              messageType === "error" ? "text-rose-600" : messageType === "success" ? "text-emerald-600" : "text-[#8D0606]"
            }`}
          >
            {messageType === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{message}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FormPanel({ title, icon: Icon, badge, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] bg-[#f8fafc] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {Icon ? <Icon size={17} className="text-[#8D0606]" /> : null}
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">{title}</h3>
        </div>
        {badge ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10.5px] font-bold text-[#8D0606] border border-rose-100">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
