import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  UtensilsCrossed,
  DollarSign,
  FolderTree,
  Package,
  Scale,
  FileText,
  Building2,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  Save,
  X,
  Eye,
  PlusCircle,
} from "lucide-react";
import { ApiCount } from "../../ui/ApiCount";
import { Loader } from "../../ui/Loader";
import { api, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns matching form design system
// ---------------------------------------------------------------------------
const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(141, 6, 6, 0.12)"}`
      : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    "&:hover": { borderColor: hasError ? "#ef4444" : "#8D0606" },
    paddingLeft: 4,
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s ease",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontSize: 14 }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: state.isSelected ? "#8D0606" : state.isFocused ? "#fff1f1" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    padding: "10px 14px",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
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
          <Icon className="absolute left-4 top-3.5 text-[#94a3b8]" size={18} />
        ) : null}
        <Comp
          ref={ref}
          {...props}
          rows={textarea ? 3 : undefined}
          className={`w-full rounded-xl border bg-white text-sm font-medium text-[#0f172a] outline-none transition duration-200 placeholder:text-[#94a3b8] ${
            textarea ? "p-3.5" : Icon ? "h-12 pl-11 pr-4" : "h-12 px-4"
          } ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[#e2e8f0] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Reusable SelectField with inline error and ref forwarding
// ---------------------------------------------------------------------------
const SelectField = React.forwardRef(function SelectField(
  { label, required, error, className = "", ...props },
  ref
) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <Select ref={ref} styles={selectStyles(!!error)} menuPortalTarget={document.body} {...props} />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

export function AddMenuPage({ apiState, refreshKitchenData, onToast }) {
  const navigate = useNavigate();
  const firstBranchId = resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  const firstIngredientId =
    apiState?.branchIngredients?.[0]?.ingredientId ||
    apiState?.branchIngredients?.[0]?.ingredient?.id ||
    apiState?.ingredients?.[0]?.id ||
    "";

  const [form, setForm] = useState({
    branchId: firstBranchId,
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    subCategory: "Chef Specials",
    ingredientId: firstIngredientId ? String(firstIngredientId) : "",
    quantity: "1",
    unit: "KG",
  });

  const [branchIngredients, setBranchIngredients] = useState(apiState?.branchIngredients || []);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Field refs for auto-scroll on validation error
  const fieldRefs = {
    branchId: useRef(null),
    name: useRef(null),
    price: useRef(null),
    ingredientId: useRef(null),
    quantity: useRef(null),
    unit: useRef(null),
    category: useRef(null),
  };

  const fieldOrder = ["branchId", "name", "price", "ingredientId", "quantity", "unit", "category"];

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const branchOptions =
    apiState?.branches?.map((branch) => ({
      value: String(branch.id),
      label: branch.name || `Branch ${branch.id}`,
    })) || [];

  const inventoryOptions = branchIngredients.map((item) => ({
    value: String(item.ingredientId || item.ingredient?.id || item.id),
    label: item.ingredient?.name || item.name || `Ingredient ${item.ingredientId || item.id}`,
  }));

  const masterIngredientOptions =
    apiState?.ingredients?.map((ingredient) => ({
      value: String(ingredient.id),
      label: ingredient.name || `Ingredient ${ingredient.id}`,
    })) || [];

  const ingredientOptions = inventoryOptions.length ? inventoryOptions : masterIngredientOptions;

  const findOption = (options, value) => options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      branchId: firstBranchId || current.branchId,
      ingredientId:
        current.ingredientId ||
        (apiState?.branchIngredients?.[0]?.ingredientId
          ? String(apiState.branchIngredients[0].ingredientId)
          : apiState?.branchIngredients?.[0]?.ingredient?.id
          ? String(apiState.branchIngredients[0].ingredient.id)
          : apiState?.ingredients?.[0]?.id
          ? String(apiState.ingredients[0].id)
          : ""),
    }));
    if (apiState?.branchIngredients?.length) {
      setBranchIngredients(apiState.branchIngredients);
    }
  }, [apiState?.branches, apiState?.selectedBranchId, apiState?.branchIngredients, apiState?.ingredients, firstBranchId]);

  useEffect(() => {
    if (!form.branchId) return;
    let active = true;
    async function loadBranchIngredients() {
      setLoadingIngredients(true);
      try {
        const response = await api.branchIngredients(form.branchId);
        const ingredients = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;
        setBranchIngredients(ingredients);
        if (
          ingredients.length &&
          !ingredients.some(
            (item) => String(item.ingredientId || item.ingredient?.id || item.id) === String(form.ingredientId)
          )
        ) {
          setForm((current) => ({
            ...current,
            ingredientId: String(ingredients[0].ingredientId || ingredients[0].ingredient?.id || ingredients[0].id),
          }));
        }
      } catch {
        if (active) setBranchIngredients([]);
      } finally {
        if (active) setLoadingIngredients(false);
      }
    }
    loadBranchIngredients();
    return () => {
      active = false;
    };
  }, [form.branchId]);

  // Validation with auto-scroll to first invalid input
  const validate = () => {
    const next = {};

    if (!form.branchId) next.branchId = "Select a kitchen branch.";
    if (!form.name.trim()) next.name = "Menu item name is required.";

    if (!form.price) next.price = "Price is required.";
    else if (Number(form.price) <= 0) next.price = "Price must be greater than 0.";

    if (!form.ingredientId) next.ingredientId = "Select a primary ingredient.";

    if (!form.quantity) next.quantity = "Ingredient quantity is required.";
    else if (Number(form.quantity) <= 0) next.quantity = "Quantity must be greater than 0.";

    if (!form.unit.trim()) next.unit = "Inventory unit is required.";

    setErrors(next);

    const firstErrorKey = fieldOrder.find((key) => next[key]);
    if (firstErrorKey) {
      const node = fieldRefs[firstErrorKey]?.current;
      if (node) {
        const scrollTarget = typeof node.getBoundingClientRect === "function" ? node : node.controlRef || node;
        scrollTarget.scrollIntoView?.({ behavior: "smooth", block: "center" });
        window.setTimeout(() => node.focus?.(), 300);
      }
    }

    return Object.keys(next).length === 0;
  };

  const saveMenu = async () => {
    if (!apiState?.token) {
      setMessageType("error");
      setMessage("Login required before adding menu item.");
      onToast?.({ message: "Login required before adding menu item.", type: "error" });
      return;
    }
    if (!validate()) {
      setMessageType("error");
      setMessage("Please fix the highlighted fields before saving.");
      onToast?.({ message: "Please fix the highlighted fields before saving.", type: "warning" });
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const ingredientExistsInBranch = branchIngredients.some(
        (item) => String(item.ingredientId || item.ingredient?.id || item.id) === String(form.ingredientId)
      );

      if (!ingredientExistsInBranch) {
        await api.createBranchIngredients(form.branchId, {
          ingredients: [{ id: Number(form.ingredientId), unit: form.unit || "KG" }],
        });
      }

      await api.createMenu(form.branchId, {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: { name: form.category.trim() || "Main Course" },
        subCategory: form.subCategory.trim() ? { name: form.subCategory.trim() } : undefined,
        ingredients: [{ id: Number(form.ingredientId), quantity: Number(form.quantity) }],
      });

      await refreshKitchenData?.(undefined, undefined, form.branchId);
      const successText = "Menu item created successfully!";
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
    <div className="mx-auto max-w-[1000px] space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-[#e2e8f0] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] text-white shadow-[0_6px_16px_rgba(141,6,6,0.35)]">
            <PlusCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">Add New Menu Item</h2>
            <p className="text-xs font-semibold text-[#64748b]">
              Configure recipes & prices linked directly to branch inventory
            </p>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-[#fff1f1] px-5 py-2.5 text-xs font-bold text-[#8D0606] transition hover:bg-[#ffe4e4]"
          onClick={() => navigate("/menu")}
          type="button"
        >
          <Eye size={16} />
          <span>View Menu Foods</span>
        </button>
      </div>

      {/* Form Panel */}
      <FormPanel title="Menu Details & Pricing" icon={UtensilsCrossed}>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Branch Select */}
          <SelectField
            ref={fieldRefs.branchId}
            label="Kitchen Branch"
            required
            options={branchOptions}
            value={findOption(branchOptions, form.branchId)}
            onChange={(option) => {
              setForm((f) => ({ ...f, branchId: option?.value || "" }));
              setErrors((current) => (current.branchId ? { ...current, branchId: undefined } : current));
            }}
            placeholder={branchOptions.length ? "Select a branch" : "No branch available"}
            error={errors.branchId}
          />

          {/* Menu Name */}
          <TextField
            ref={fieldRefs.name}
            icon={UtensilsCrossed}
            label="Menu Name"
            required
            placeholder="e.g. Paneer Butter Masala"
            value={form.name}
            onChange={updateForm("name")}
            error={errors.name}
          />

          {/* Price */}
          <TextField
            ref={fieldRefs.price}
            icon={DollarSign}
            label="Selling Price"
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
          <TextField
            ref={fieldRefs.category}
            icon={FolderTree}
            label="Category"
            placeholder="e.g. Main Course, Starters"
            value={form.category}
            onChange={updateForm("category")}
          />

          {/* Sub Category */}
          <TextField
            icon={FolderTree}
            label="Sub Category"
            placeholder="e.g. Chef Specials, Gravy"
            value={form.subCategory}
            onChange={updateForm("subCategory")}
          />

          {/* Ingredient Select */}
          <SelectField
            ref={fieldRefs.ingredientId}
            label="Primary Ingredient"
            required
            options={ingredientOptions}
            value={findOption(ingredientOptions, form.ingredientId)}
            onChange={(option) => {
              setForm((f) => ({ ...f, ingredientId: option?.value || "" }));
              setErrors((current) => (current.ingredientId ? { ...current, ingredientId: undefined } : current));
            }}
            placeholder={ingredientOptions.length ? "Select primary ingredient" : "No ingredient available"}
            isLoading={loadingIngredients}
            error={errors.ingredientId}
          />

          {/* Quantity */}
          <TextField
            ref={fieldRefs.quantity}
            icon={Package}
            label="Quantity Required"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 1"
            value={form.quantity}
            onChange={updateForm("quantity")}
            error={errors.quantity}
          />

          {/* Unit */}
          <TextField
            ref={fieldRefs.unit}
            icon={Scale}
            label="Inventory Unit"
            required
            placeholder="e.g. KG, Gram, Ltr, Pcs"
            value={form.unit}
            onChange={updateForm("unit")}
            error={errors.unit}
          />

          {/* Description */}
          <TextField
            icon={FileText}
            label="Description"
            textarea
            className="md:col-span-2"
            placeholder="Describe the dish ingredients, spice level, or special preparation note"
            value={form.description}
            onChange={updateForm("description")}
          />
        </div>

        {loadingIngredients ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-[#8D0606]">
            <Loader variant="button" text="Loading branch inventory ingredients..." />
          </div>
        ) : null}
      </FormPanel>

      {/* Metrics Overview Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <ApiCount
          label="Active Branches"
          value={apiState?.branches?.length || 0}
          icon={Building2}
          color="red"
          badge="Configured"
        />
        <ApiCount
          label="Branch Ingredients"
          value={branchIngredients.length}
          icon={UtensilsCrossed}
          color="emerald"
          badge="Inventory"
        />
        <ApiCount
          label="Master Ingredients"
          value={apiState?.ingredients?.length || 0}
          icon={Sparkles}
          color="amber"
          badge="Master DB"
        />
        <ApiCount
          label="Menu Items"
          value={apiState?.menus?.length || 0}
          icon={Layers}
          color="sky"
          badge="Live Foods"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-4 z-40 flex flex-col items-end gap-3 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="flex flex-wrap justify-end items-center gap-3 w-full sm:w-auto">
          <button
            className="flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 transition duration-200 hover:bg-slate-200"
            onClick={() => navigate("/menu")}
            type="button"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button
            className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-sm font-bold text-white shadow-[0_8px_20px_rgba(141,6,6,0.3)] transition duration-200 hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
            disabled={saving}
            onClick={saveMenu}
            type="button"
          >
            {saving ? (
              <Loader variant="button" text="Saving Menu..." />
            ) : (
              <>
                <Save size={18} />
                <span>Save Menu</span>
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

function FormPanel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4">
        {Icon ? <Icon size={18} className="text-[#8D0606]" /> : null}
        <h3 className="text-base font-bold tracking-tight text-[#0f172a]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
