import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FolderTree,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ChevronRight,
  FolderPlus,
  Tag,
  Grid,
  List,
  Building2,
  Globe2,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { api, getApiErrorMessage, getApiBaseUrl } from "../../api";
import { usePermissions } from "../../utils/permissions";

export const resolveCategoryImageUrl = (img) => {
  if (!img || typeof img !== "string") return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  const currentApiBase = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");

  // If local environment (localhost:3000), rewrite remote dev2 URL to local host for /uploads/
  if (currentApiBase.includes("localhost") || currentApiBase.includes("127.0.0.1")) {
    if (trimmed.includes("/uploads/")) {
      const relativePath = trimmed.substring(trimmed.indexOf("/uploads/"));
      return `${currentApiBase}${relativePath}`;
    }
    if (trimmed.startsWith("uploads/")) {
      return `${currentApiBase}/${trimmed}`;
    }
  }

  // If relative path
  if (trimmed.startsWith("/uploads/")) {
    return `${currentApiBase}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${currentApiBase}/${trimmed}`;
  }

  return trimmed;
};

function CategoryThumbnail({ src, name, size = "md", isSub = false }) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = useMemo(() => resolveCategoryImageUrl(src), [src]);

  const sizeClasses =
    size === "sm" ? "size-9 text-xs rounded-lg" : "size-12 text-base rounded-xl";

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`grid shrink-0 place-items-center font-bold shadow-2xs border ${sizeClasses} ${
          isSub
            ? "bg-amber-50 text-amber-700 border-amber-200/80"
            : "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100 text-[#8D0606]"
        }`}
      >
        {(name || "C").charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      className={`${sizeClasses} object-cover border border-slate-200 shrink-0 shadow-2xs`}
      onError={(e) => {
        // Fallback: If rewritten to localhost and failed, try original URL once
        if (e.currentTarget.src.includes("localhost:3000") && src && !src.includes("localhost")) {
          e.currentTarget.src = src;
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

export function MenuCategoryPage({ apiState, onToast }) {
  const { canCreate, canUpdate, canDelete } = usePermissions(apiState);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL | CUSTOM | GLOBAL
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name: "",
    parentId: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // View Subcategories modal
  const [viewingSubCatParent, setViewingSubCatParent] = useState(null);

  const onToastRef = React.useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  });

  // Fetch Categories from API (mounted once, no infinite loop dependency)
  const fetchCategories = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.menuCategories({ type: "ALL" });
      const data = Array.isArray(res?.data) ? res.data : [];
      setCategories(data);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load menu categories");
      onToastRef.current?.({ message: msg, type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Create Modal (optionally with parent preset)
  const openCreateModal = (parent = null) => {
    setEditingCategory(null);
    setForm({
      name: "",
      parentId: parent ? String(parent.id) : "",
      image: "",
    });
    setImageFile(null);
    setImagePreview("");
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal (only for kitchen's own categories)
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || "",
      parentId: cat.parentId ? String(cat.parentId) : "",
      image: cat.image || "",
    });
    setImageFile(null);
    setImagePreview(cat.image || "");
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview("");
    setErrors({});
  };

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB" }));
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setErrors((prev) => ({ ...prev, image: undefined }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((f) => ({ ...f, image: "" }));
  };

  // Save / Update Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setErrors({ name: "Category name is required" });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      if (form.parentId) {
        formData.append("parentId", String(form.parentId));
      }
      if (imageFile instanceof File) {
        formData.append("image", imageFile);
      } else if (form.image) {
        formData.append("image", form.image.trim());
      }

      if (editingCategory) {
        await api.updateMenuCategory(editingCategory.id, formData);
        onToast?.({ message: "Category updated successfully", type: "success" });
      } else {
        await api.createMenuCategory(formData);
        onToast?.({ message: "Category created successfully", type: "success" });
      }

      closeModal();
      await fetchCategories(true);
    } catch (err) {
      const msg = getApiErrorMessage(err, editingCategory ? "Failed to update category" : "Failed to create category");
      setErrors({ general: msg });
      onToast?.({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      await api.deleteMenuCategory(cat.id);
      onToast?.({ message: `Category "${cat.name}" deleted`, type: "success" });
      await fetchCategories(true);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to delete category");
      onToast?.({ message: msg, type: "error" });
    }
  };

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        (cat.name && cat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cat.subCategories &&
          cat.subCategories.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())));

      // Source Filter
      let matchesSource = true;
      if (sourceFilter === "CUSTOM") {
        matchesSource = Boolean(cat.kitchenId);
      } else if (sourceFilter === "GLOBAL") {
        matchesSource = !cat.kitchenId;
      }

      return matchesSearch && matchesSource;
    });
  }, [categories, searchQuery, sourceFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = categories.length;
    const globalCount = categories.filter((c) => !c.kitchenId).length;
    const customCount = categories.filter((c) => Boolean(c.kitchenId)).length;
    const subCount = categories.reduce(
      (acc, c) => acc + (Array.isArray(c.subCategories) ? c.subCategories.length : 0),
      0
    );
    return { total, globalCount, customCount, subCount };
  }, [categories]);

  // Only Kitchen's OWN custom parent categories can have subcategories added by this kitchen
  const parentOptions = useMemo(() => {
    return categories
      .filter((c) => !c.parentId && Boolean(c.kitchenId))
      .map((c) => ({
        value: String(c.id),
        label: `${c.name} (My Kitchen)`,
      }));
  }, [categories]);

  return (
    <div className="mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <PageHeader
        badge="Menu Management"
        activeBadge={`${stats.total} Categories`}
        title="Menu Categories"
        subtitle="Manage global system categories and configure your kitchen's custom categories and subcategories."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchCategories(false)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              title="Refresh Categories"
            >
              <RefreshCw size={14} className={refreshing || loading ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>

            {canCreate("menu") && (
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8D0606] to-[#b80808] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:from-[#780404] hover:to-[#a10707] active:scale-95"
              >
                <Plus size={15} />
                <span>Add Category</span>
              </button>
            )}
          </div>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Categories</span>
            <div className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <FolderTree size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Root & subcategories</span>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-[#fff9f9] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Custom (My Kitchen)</span>
            <div className="grid size-8 place-items-center rounded-xl bg-rose-100 text-[#8D0606]">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#8D0606]">{stats.customCount}</p>
          <span className="text-[11px] text-rose-500/80">Created by your kitchen</span>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-[#f8fbff] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Global (Admin)</span>
            <div className="grid size-8 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <Globe2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-sky-800">{stats.globalCount}</p>
          <span className="text-[11px] text-sky-600/80">Available across all kitchens</span>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-[#fffdf7] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Subcategories</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-800">{stats.subCount}</p>
          <span className="text-[11px] text-amber-600/80">Nested menu divisions</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#8D0606] focus:bg-white focus:ring-2 focus:ring-[#8D0606]/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Source Pills & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSourceFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                sourceFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("CUSTOM")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                sourceFilter === "CUSTOM"
                  ? "bg-white text-[#8D0606] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles size={12} />
              <span>My Kitchen</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("GLOBAL")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                sourceFilter === "GLOBAL"
                  ? "bg-white text-sky-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe2 size={12} />
              <span>Global (Admin)</span>
            </button>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`grid size-7 place-items-center rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-[#8D0606] shadow-xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`grid size-7 place-items-center rounded-lg transition ${
                viewMode === "table" ? "bg-white text-[#8D0606] shadow-xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Display */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <Loader size="lg" text="Loading categories..." />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
            <FolderTree size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Categories Found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {searchQuery
              ? `No category matching "${searchQuery}". Try different keywords.`
              : "No categories available for the selected filter."}
          </p>
          {canCreate("menu") && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#8D0606] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#780404]"
            >
              <Plus size={14} /> Add First Category
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((cat) => {
            const isCustom = Boolean(cat.kitchenId);
            const subCats = Array.isArray(cat.subCategories) ? cat.subCategories : [];

            return (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Top Badge: Global vs Custom */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#8D0606]">
                        <Sparkles size={10} /> My Kitchen
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        <Globe2 size={10} /> Global (Admin)
                      </span>
                    )}

                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                      Active
                    </span>
                  </div>

                  {/* Icon / Image & Category Name */}
                  <div className="flex items-start gap-3">
                    <CategoryThumbnail src={cat.image} name={cat.name} size="md" isSub={Boolean(cat.parentId)} />

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate" title={cat.name}>
                        {cat.name}
                      </h4>
                      {cat.parent && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          Sub of: <strong className="text-slate-600">{cat.parent.name}</strong>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {subCats.length} Subcategor{subCats.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories preview tags */}
                  {subCats.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {subCats.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 truncate max-w-[130px]"
                            title={sub.name}
                          >
                            <Tag size={9} className="text-slate-400" />
                            {sub.name}
                          </span>
                        ))}
                        {subCats.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setViewingSubCatParent(cat)}
                            className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-[#8D0606] hover:underline"
                          >
                            +{subCats.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  {canCreate("menu") && isCustom && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(cat)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8D0606] hover:underline"
                    >
                      <Plus size={12} /> Add Sub
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    {subCats.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewingSubCatParent(cat)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="View Subcategories"
                      >
                        <Layers size={14} />
                      </button>
                    )}

                    {isCustom ? (
                      <>
                        {canUpdate("menu") && (
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Edit Category"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete("menu") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 px-1.5"
                        title="Global category created by admin is read-only"
                      >
                        <Lock size={11} /> Read-only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Subcategories</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const isCustom = Boolean(cat.kitchenId);
                  const subCats = Array.isArray(cat.subCategories) ? cat.subCategories : [];

                  return (
                    <tr key={cat.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryThumbnail src={cat.image} name={cat.name} size="sm" isSub={Boolean(cat.parentId)} />
                          <div>
                            <p className="font-bold text-slate-900">{cat.name}</p>
                            {cat.parent && (
                              <span className="text-[10px] text-slate-400">
                                Parent: {cat.parent.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-600">
                          {cat.parentId ? "Subcategory" : "Parent Category"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#8D0606]">
                            <Sparkles size={10} /> My Kitchen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                            <Globe2 size={10} /> Global (Admin)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {subCats.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewingSubCatParent(cat)}
                            className="inline-flex items-center gap-1 font-bold text-[#8D0606] hover:underline"
                          >
                            <Layers size={12} /> {subCats.length} subcategories
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canCreate("menu") && isCustom && (
                            <button
                              type="button"
                              onClick={() => openCreateModal(cat)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#8D0606] hover:text-[#8D0606] transition"
                            >
                              + Sub
                            </button>
                          )}
                          {isCustom ? (
                            <>
                              {canUpdate("menu") && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(cat)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                  title="Edit Category"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                              {canDelete("menu") && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Delete Category"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1">
                              <Lock size={11} /> Global
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CATEGORY                                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCategory ? "Edit Custom Category" : "Create New Category"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCategory
                    ? "Update category details for your kitchen."
                    : "Add a category or subcategory for your kitchen's menu."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {errors.general && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. North Indian, Fast Food, Desserts"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setErrors((err) => ({ ...err, name: undefined }));
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                />
                {errors.name && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.name}</p>}
              </div>

              {/* Parent Category (Optional for subcategory) */}
              {!editingCategory && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Parent Category</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(optional for subcategory)</span>
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  >
                    <option value="">— None (Create as Top-Level Category) —</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Image */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Category Image</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                </label>

                {imagePreview ? (
                  <div className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="size-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 truncate block">Image selected</span>
                      <span className="text-[10px] text-slate-400">Ready to save</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 transition hover:bg-slate-50 hover:border-[#8D0606]/40">
                    <Upload size={18} className="text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to upload image</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG or WebP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {errors.image && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.image}</p>}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:from-[#780404] hover:to-[#a10707] active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader variant="button" text="Saving..." />
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SUBCATEGORIES OF PARENT                                       */}
      {/* ========================================================================= */}
      {viewingSubCatParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-[#8D0606]" />
                  <span>{viewingSubCatParent.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Subcategories under this category ({viewingSubCatParent.subCategories?.length || 0})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSubCatParent(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {viewingSubCatParent.subCategories?.map((sub) => {
                const isSubCustom = Boolean(sub.kitchenId);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryThumbnail src={sub.image} name={sub.name} size="sm" isSub={true} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{sub.name}</p>
                        <span className="text-[10px] text-slate-400">Subcategory</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSubCustom ? (
                        <span className="rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[9.5px] font-bold text-[#8D0606]">
                          My Kitchen
                        </span>
                      ) : (
                        <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-700">
                          Global
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              {canCreate("menu") && Boolean(viewingSubCatParent?.kitchenId) ? (
                <button
                  type="button"
                  onClick={() => {
                    const parent = viewingSubCatParent;
                    setViewingSubCatParent(null);
                    openCreateModal(parent);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D0606] hover:underline"
                >
                  <Plus size={14} /> Add New Subcategory
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 italic">
                  <Lock size={12} /> Admin Global Category (Read-only)
                </span>
              )}
              <button
                type="button"
                onClick={() => setViewingSubCatParent(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
