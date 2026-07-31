import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import {
  UtensilsCrossed,
  Building2,
  Sparkles,
  ShieldCheck,
  Package,
  FolderTree,
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Scale,
  Search,
} from "lucide-react";
import { ApiCount } from "../../ui/ApiCount";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { api, getApiErrorMessage } from "../../../api";
import { getPlanTitle, resolveSelectedBranchId } from "../../../utils/helpers";

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
  { label, required, error, icon: Icon, className = "", ...props },
  ref
) {
  return (
    <div className={className}>
      {label ? (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? <Icon className="absolute left-4 top-3.5 text-slate-400" size={18} /> : null}
        <input
          ref={ref}
          {...props}
          className={`h-11 w-full rounded-xl border bg-white text-sm font-medium text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 ${
            Icon ? "pl-11 pr-4" : "px-4"
          } ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in">
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
      {label ? (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </label>
      ) : null}
      <Select ref={ref} styles={selectStyles(!!error)} menuPortalTarget={document.body} {...props} />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});

export function IngredientSetupPage({ apiState, refreshKitchenData, selectedPlan, onToast }) {
  const branches = apiState?.branches || [];
  const branchOptions = branches.map((branch) => ({
    value: String(branch.id),
    label: branch.name || `Branch ${branch.id}`,
  }));

  const selectedBranchId = resolveSelectedBranchId(branches, apiState?.selectedBranchId);
  const firstBranchId = selectedBranchId || (branchOptions[0]?.value ? String(branchOptions[0].value) : "");

  const unitOptions = [
    "KG",
    "GM",
    "MG",
    "LITER",
    "ML",
    "ITEM",
    "PIECE",
    "DOZEN",
    "PACKET",
    "BOX",
    "BOTTLE",
    "CAN",
    "PORTION",
    "SERVING",
  ].map((unit) => ({ value: unit, label: unit }));

  const [form, setForm] = useState({ branchId: firstBranchId, unit: "KG", name: "", category: "", image: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [addingId, setAddingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingInventory, setEditingInventory] = useState(null);

  // Pagination states
  const [masterPage, setMasterPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const PAGE_SIZE = 5;

  const nameRef = useRef(null);
  const categoryRef = useRef(null);

  const currentInventory = apiState?.branchIngredients || [];
  const inventoryIngredientIds = new Set(
    currentInventory.map((item) => String(item.ingredientId || item.ingredient?.id || item.id))
  );

  const selectedBranch = branches.find((branch) => String(branch.id) === String(form.branchId));
  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const findOption = (options, value) => options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    setForm((current) => ({ ...current, branchId: firstBranchId || current.branchId }));
  }, [firstBranchId]);

  const changeBranch = async (option) => {
    const branchId = option?.value || "";
    setForm((current) => ({ ...current, branchId }));
    setMessage("");
    setInventoryPage(1);
    if (branchId) await refreshKitchenData?.(undefined, undefined, branchId);
  };

  const addMasterIngredient = async (ingredient) => {
    if (!form.branchId) {
      const msg = "Create or select a branch first, then add ingredients to it.";
      setMessageType("error");
      setMessage(msg);
      onToast?.({ message: msg, type: "error" });
      return;
    }

    if (inventoryIngredientIds.has(String(ingredient.id))) {
      const msg = `${ingredient.name || "Ingredient"} is already added to this branch.`;
      setMessageType("warning");
      setMessage(msg);
      onToast?.({ message: msg, type: "warning" });
      return;
    }

    setAddingId(String(ingredient.id));
    setSaving(true);
    setMessage("");
    try {
      await api.createBranchIngredients(form.branchId, {
        ingredients: [{ id: Number(ingredient.id), unit: form.unit || "KG" }],
      });
      await refreshKitchenData?.(undefined, undefined, form.branchId);
      const successMsg = `${ingredient.name || "Ingredient"} added to branch inventory.`;
      setMessageType("success");
      setMessage(successMsg);
      onToast?.({ message: successMsg, type: "success" });
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to add ingredient");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
      setAddingId("");
    }
  };

  const startEditInventory = (item) => {
    setEditingInventory(item);
    setForm((current) => ({
      ...current,
      branchId: String(item.branchId || form.branchId),
      unit: item.unit || current.unit || "KG",
      name: item.ingredient?.name || item.name || "",
      category: item.ingredient?.category || item.category || "",
      image: item.ingredient?.image || item.image || "",
    }));
    setErrors({});
    setMessage("");
    nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    nameRef.current?.focus();
  };

  const cancelEditInventory = () => {
    setEditingInventory(null);
    setForm((current) => ({ ...current, name: "", category: "", image: "" }));
    setErrors({});
    setMessage("");
  };

  const removeInventoryItem = async (item) => {
    if (!form.branchId || !item?.id) return;
    const label = item.ingredient?.name || item.name || "ingredient";
    if (!window.confirm(`Remove ${label} from this branch inventory?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await api.deleteBranchIngredient(form.branchId, item.id);
      if (editingInventory && String(editingInventory.id) === String(item.id)) {
        setEditingInventory(null);
        setForm((current) => ({ ...current, name: "", category: "", image: "" }));
      }
      await refreshKitchenData?.(undefined, undefined, form.branchId);
      const successMsg = `${label} removed from branch inventory.`;
      setMessageType("success");
      setMessage(successMsg);
      onToast?.({ message: successMsg, type: "success" });
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to remove ingredient");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const validateCustomForm = () => {
    const next = {};
    if (!form.branchId) next.branchId = "Select a branch first.";
    if (!form.name.trim()) next.name = "Custom ingredient name is required.";
    if (!form.category.trim()) next.category = "Category is required.";

    setErrors(next);

    if (next.name && nameRef.current) {
      nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current.focus();
      return false;
    }
    if (next.category && categoryRef.current) {
      categoryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      categoryRef.current.focus();
      return false;
    }

    return Object.keys(next).length === 0;
  };

  const submitManual = async (event) => {
    event.preventDefault();

    if (!validateCustomForm()) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      onToast?.({ message: "Please fill in all required fields.", type: "warning" });
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      if (editingInventory?.id) {
        await api.updateBranchIngredient(form.branchId, editingInventory.id, {
          name: form.name.trim(),
          category: form.category.trim(),
          image: form.image.trim() || undefined,
          unit: form.unit || "KG",
        });
        const successMsg = "Custom ingredient updated successfully.";
        setMessageType("success");
        setMessage(successMsg);
        onToast?.({ message: successMsg, type: "success" });
        setEditingInventory(null);
      } else {
        await api.createBranchIngredients(form.branchId, {
          ingredients: [
            {
              name: form.name.trim(),
              category: form.category.trim(),
              image: form.image.trim() || undefined,
              unit: form.unit || "KG",
            },
          ],
        });
        const successMsg = "Custom ingredient saved to branch inventory.";
        setMessageType("success");
        setMessage(successMsg);
        onToast?.({ message: successMsg, type: "success" });
      }
      await refreshKitchenData?.(undefined, undefined, form.branchId);
      setForm((current) => ({ ...current, name: "", category: "", image: "" }));
    } catch (error) {
      const errMsg = getApiErrorMessage(
        error,
        editingInventory?.id ? "Unable to update custom ingredient" : "Unable to save custom ingredient"
      );
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Filter master ingredients list & paginate
  const filteredMasterIngredients = (apiState?.ingredients || []).filter((ing) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (ing.name || "").toLowerCase().includes(q) || (ing.category || "").toLowerCase().includes(q);
  });

  const paginatedMaster = filteredMasterIngredients.slice(
    (masterPage - 1) * PAGE_SIZE,
    masterPage * PAGE_SIZE
  );

  const paginatedInventory = currentInventory.slice(
    (inventoryPage - 1) * PAGE_SIZE,
    inventoryPage * PAGE_SIZE
  );

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Overview Stat Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <ApiCount
          label="Selected Plan"
          value={selectedPlan ? getPlanTitle(selectedPlan) : "Active Plan"}
          icon={ShieldCheck}
          color="sky"
          badge="Subscription"
        />
        <ApiCount
          label="Configured Branches"
          value={branches.length}
          icon={Building2}
          color="red"
          badge="Branches"
        />
        <ApiCount
          label="Master Ingredients"
          value={apiState?.ingredients?.length || 0}
          icon={Sparkles}
          color="amber"
          badge="Master DB"
        />
        <ApiCount
          label="Branch Inventory"
          value={currentInventory.length}
          icon={UtensilsCrossed}
          color="emerald"
          badge="Live Items"
        />
      </div>

      {/* Header Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid gap-4 md:grid-cols-[1fr_220px] items-center">
          <SelectField
            label="Active Kitchen Branch"
            required
            options={branchOptions}
            value={findOption(branchOptions, form.branchId)}
            onChange={changeBranch}
            placeholder={branchOptions.length ? "Select a branch" : "No branch available"}
            error={errors.branchId}
          />
          <SelectField
            label="Default Inventory Unit"
            options={unitOptions}
            value={findOption(unitOptions, form.unit)}
            onChange={(option) => setForm((f) => ({ ...f, unit: option?.value || "KG" }))}
          />
        </div>
      </div>

      {/* Main Grid: Master Data Table & Custom Ingredient Form */}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Master Ingredients Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Master Data Ingredients</h3>
              <p className="text-xs font-normal text-slate-500">
                Add verified master ingredients directly to active branch
              </p>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMasterPage(1);
                }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {paginatedMaster.map((ingredient) => {
                  const alreadyAdded = inventoryIngredientIds.has(String(ingredient.id));
                  const isThisAdding = saving && addingId === String(ingredient.id);

                  return (
                    <tr key={ingredient.id || ingredient.name} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {ingredient.name || `Ingredient ${ingredient.id}`}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {ingredient.category || ingredient.categoryName || "General"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>{ingredient.status || "ACTIVE"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                            alreadyAdded
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-[#fff1f1] text-[#8D0606] hover:bg-[#8D0606] hover:text-white"
                          }`}
                          disabled={saving || alreadyAdded}
                          onClick={() => addMasterIngredient(ingredient)}
                          type="button"
                        >
                          {isThisAdding ? (
                            <Loader variant="button" text="Adding..." />
                          ) : alreadyAdded ? (
                            <>
                              <CheckCircle2 size={13} /> Added
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Add to Branch
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredMasterIngredients.length ? (
              <p className="py-8 text-center text-xs font-normal text-slate-400">
                {searchQuery ? "No matching ingredients found." : "No master ingredients available."}
              </p>
            ) : null}
          </div>

          <Pagination
            currentPage={masterPage}
            totalItems={filteredMasterIngredients.length}
            pageSize={PAGE_SIZE}
            onPageChange={setMasterPage}
          />
        </section>

        {/* Custom Ingredient Form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingInventory ? "Edit Custom Ingredient" : "Custom Ingredient Entry"}
            </h3>
            <p className="text-xs font-normal text-slate-500">
              {editingInventory
                ? "Update custom ingredient details for this branch"
                : "Add missing custom ingredient directly to branch inventory"}
            </p>
          </div>

          <form className="space-y-3.5 p-5" onSubmit={submitManual} noValidate>
            <TextField
              ref={nameRef}
              icon={Package}
              label="Ingredient Name"
              required
              placeholder="e.g. Organic Tomatoes"
              value={form.name}
              onChange={updateForm("name")}
              error={errors.name}
            />

            <TextField
              ref={categoryRef}
              icon={FolderTree}
              label="Category"
              required
              placeholder="e.g. Vegetables, Spices"
              value={form.category}
              onChange={updateForm("category")}
              error={errors.category}
            />

            <TextField
              icon={ImageIcon}
              label="Image URL (Optional)"
              placeholder="https://images.com/tomato.jpg"
              value={form.image}
              onChange={updateForm("image")}
            />

            <div className="flex gap-2 pt-2">
              {editingInventory ? (
                <button
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                  onClick={cancelEditInventory}
                  type="button"
                >
                  <X size={15} /> Cancel
                </button>
              ) : null}
              <button
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-semibold text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707] disabled:opacity-60"
                disabled={saving || !form.branchId}
                type="submit"
              >
                {saving && !addingId ? (
                  <Loader
                    variant="button"
                    text={editingInventory ? "Updating..." : "Saving..."}
                  />
                ) : (
                  <>
                    <Save size={15} />
                    <span>{editingInventory ? "Update Custom Item" : "Save Custom Item"}</span>
                  </>
                )}
              </button>
            </div>

            {message ? (
              <p
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  messageType === "error"
                    ? "text-rose-600"
                    : messageType === "success"
                    ? "text-emerald-600"
                    : "text-[#8D0606]"
                }`}
              >
                {messageType === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span>{message}</span>
              </p>
            ) : null}
          </form>
        </section>
      </div>

      {/* Branch Inventory Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Live Branch Inventory</h3>
            <p className="text-xs font-normal text-slate-500">
              {selectedBranch ? selectedBranch.name || `Branch #${selectedBranch.id}` : "Select a branch"}
            </p>
          </div>
          <span className="rounded-xl bg-[#fff1f1] px-2.5 py-1 text-xs font-semibold text-[#8D0606]">
            {currentInventory.length} Items Attached
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Ingredient</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {paginatedInventory.map((item) => {
                const isCustom =
                  String(item.ingredient?.status || item.status || "").toUpperCase() === "PENDING";
                return (
                  <tr key={item.id || item.ingredientId || item.ingredient?.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.ingredient?.name || item.name || `Ingredient ${item.ingredientId || item.id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.ingredient?.category || item.category || "General"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        <Scale size={12} />
                        <span>{item.unit || "ITEM"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isCustom
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        <span>{item.ingredient?.status || item.status || "ACTIVE"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {isCustom ? (
                          <button
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                            disabled={saving}
                            onClick={() => startEditInventory(item)}
                            type="button"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        ) : null}
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          disabled={saving}
                          onClick={() => removeInventoryItem(item)}
                          type="button"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!currentInventory.length ? (
            <p className="py-8 text-center text-xs font-normal text-slate-400">
              No ingredients added to this branch inventory yet.
            </p>
          ) : null}
        </div>

        <Pagination
          currentPage={inventoryPage}
          totalItems={currentInventory.length}
          pageSize={PAGE_SIZE}
          onPageChange={setInventoryPage}
        />
      </section>
    </div>
  );
}
