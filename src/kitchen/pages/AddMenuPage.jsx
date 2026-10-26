import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Link2,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  ChefHat,
  Zap,
} from "lucide-react";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/ui/PageHeader";
import { api, getApiErrorMessage } from "../../api";
import {
  resolveSelectedBranchId,
  formatRecipeQty,
  getRecipeConversionHint,
  getRecipeSanityWarning,
  calculateStockYield,
  STANDARD_MEASURE_UNITS,
  findUnitOption,
} from "../../utils/helpers";
import { usePermissions } from "../../utils/permissions";

const DISH_PRESETS = [
  { name: "Curry & Rice", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80" },
  { name: "Artisan Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80" },
  { name: "Creamy Pasta", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80" },
  { name: "Chicken Roast", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80" },
  { name: "Fresh Salad", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80" },
  { name: "Gourmet Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80" },
  { name: "Dessert Cake", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80" },
  { name: "Beverage / Juice", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80" },
];

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

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns matching form design system
// ---------------------------------------------------------------------------
const compactSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(141, 6, 6, 0.15)" : "none",
    fontSize: 11,
    fontWeight: 600,
    "&:hover": { borderColor: "#8D0606" },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
    height: 32,
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: 11,
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1e293b",
    fontSize: 11,
    fontWeight: 600,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: 32,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: 2,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 11,
    fontWeight: 500,
    backgroundColor: state.isSelected ? "#8D0606" : state.isFocused ? "#fff1f2" : "#ffffff",
    color: state.isSelected ? "#ffffff" : state.isFocused ? "#8D0606" : "#1e293b",
    cursor: "pointer",
    padding: "6px 10px",
  }),
};

export const normalizeInventoryStockUnit = (unit = "", weightInGm = null) => {
  const u = String(unit || "").trim().toUpperCase();
  const culinaryNonInventory = [
    "TSP",
    "TBSP",
    "CUP",
    "PINCH",
    "SPOON",
    "BOWL",
    "PLATE",
    "PORTION",
    "SERVING",
    "SLICE",
  ];
  if (culinaryNonInventory.includes(u)) {
    if (weightInGm && Number(weightInGm) >= 1000) return "KG";
    return "GM";
  }
  if (u === "KILOGRAM" || u === "KGS") return "KG";
  if (u === "GRAM" || u === "GRAMS" || u === "G") return "GM";
  if (u === "MILLILITER" || u === "MILLI") return "ML";
  if (u === "LITRE" || u === "LTR" || u === "L") return "LITER";
  if (u === "PCS" || u === "PC" || u === "PIECES") return "PIECE";
  if (!u) return "GM";
  return u;
};

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
  const location = useLocation();
  const editDish = location.state?.editDish || null;
  const isEditing = Boolean(editDish?.id);

  const { canCreate, canUpdate } = usePermissions(apiState);

  useEffect(() => {
    if (isEditing && !canUpdate("menu")) {
      navigate("/kitchen/menu", { replace: true });
    } else if (!isEditing && !canCreate("menu")) {
      navigate("/kitchen/menu", { replace: true });
    }
  }, [isEditing, canCreate, canUpdate, navigate]);
  
  // Use currently active branch from Header/Context
  const branches = apiState?.branches || [];
  const hasBranches = branches.length > 0;
  const activeBranchId = hasBranches ? resolveSelectedBranchId(branches, apiState?.selectedBranchId) : "";
  const selectedBranch = hasBranches ? branches.find((b) => String(b.id) === String(activeBranchId)) : null;

  const existingDishImage = editDish?.image || editDish?.rawMenu?.image || "";

  // Form State
  const [form, setForm] = useState(() => {
    if (editDish) {
      const rawPrice = editDish.priceNum || (typeof editDish.price === "string" ? editDish.price.replace(/[^\d.]/g, "") : editDish.price) || "";
      const catName = typeof editDish.category === "object" ? editDish.category?.name : editDish.category;
      const catId = typeof editDish.category === "object" ? editDish.category?.id : editDish.categoryId;
      const subCatName = typeof editDish.subCategory === "object" ? editDish.subCategory?.name : editDish.subCategory;
      const subCatId = typeof editDish.subCategory === "object" ? editDish.subCategory?.id : editDish.subCategoryId;
      return {
        name: editDish.name || "",
        description: editDish.description || "",
        price: rawPrice ? String(rawPrice) : "",
        category: catName || "Main Course",
        categoryId: catId ? String(catId) : "",
        subCategory: subCatName || "",
        subCategoryId: subCatId ? String(subCatId) : "",
        image: existingDishImage || "",
      };
    }
    return {
      name: "",
      description: "",
      price: "",
      category: "Main Course",
      categoryId: "",
      subCategory: "",
      subCategoryId: "",
      image: "",
    };
  });

  // Image Upload / Preset State
  const [imageInputMode, setImageInputMode] = useState(existingDishImage ? "url" : "upload"); // "upload" | "url" | "presets"
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(existingDishImage || "");
  const [imageUrlInput, setImageUrlInput] = useState(existingDishImage || "");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast?.({ message: "Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF).", type: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onToast?.({ message: "Image size must be less than 5MB.", type: "warning" });
      return;
    }
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(blobUrl);
    setImageUrlInput("");
    setForm((f) => ({ ...f, image: "" }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast?.({ message: "Please drop a valid image file (PNG, JPG, JPEG, WEBP, GIF).", type: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onToast?.({ message: "Image size must be less than 5MB.", type: "warning" });
      return;
    }
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(blobUrl);
    setImageUrlInput("");
    setForm((f) => ({ ...f, image: "" }));
  };

  const removeImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl("");
    setImageUrlInput("");
    setForm((f) => ({ ...f, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectPreset = (url) => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(url);
    setImageUrlInput(url);
    setForm((f) => ({ ...f, image: url }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlChange = (val) => {
    setImageUrlInput(val);
    setImageFile(null);
    setImagePreviewUrl(val);
    setForm((f) => ({ ...f, image: val }));
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const unitOptions = STANDARD_MEASURE_UNITS;

  // Multiple recipe ingredients state
  const [recipeIngredients, setRecipeIngredients] = useState(() => {
    if (editDish && Array.isArray(editDish.ingredients) && editDish.ingredients.length > 0) {
      return editDish.ingredients.map((ing) => {
        const invItem = ing.inventoryItem;
        const innerIng = invItem?.ingredient || ing.ingredient;
        const ingId = String(
          innerIng?.id ||
          invItem?.ingredientId ||
          ing.ingredientId ||
          ing.inventoryItemId ||
          ing.id ||
          ""
        );
        const qty = String(ing.quantityRequired ?? ing.quantity ?? "1");
        const rowUnit = ing.unit || innerIng?.unit || invItem?.unit || "KG";
        return { ingredientId: ingId, quantity: qty, unit: rowUnit };
      });
    }
    return [{ ingredientId: "", quantity: "1", unit: "KG" }];
  });

  const [branchIngredients, setBranchIngredients] = useState(apiState?.branchIngredients || []);
  const [apiCategories, setApiCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // AI Recipe Auto-Fill States
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [unmatchedAiItems, setUnmatchedAiItems] = useState([]);
  const [aiChefTip, setAiChefTip] = useState("");

  // Quick Provision States (for AI suggestions -> branch inventory + stock)
  const [showStockModal, setShowStockModal] = useState(false);
  const [provisionItems, setProvisionItems] = useState([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [activeImageModalIdx, setActiveImageModalIdx] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState("");

  // Dynamic category options loaded STRICTLY from Categories API (GET /kitchen/menu/categories)
  const dynamicCategoryOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (apiCategories || [])
      .filter((cat) => cat && (cat.status === undefined || cat.status === "ACTIVE"))
      .forEach((cat) => {
        const catName = (cat.name || "").trim();
        if (catName && !seen.has(catName.toLowerCase())) {
          seen.add(catName.toLowerCase());
          list.push({
            value: catName,
            label: catName,
            id: cat.id,
          });
        }
        if (Array.isArray(cat.subCategories)) {
          cat.subCategories.forEach((sub) => {
            const subName = (sub?.name || "").trim();
            if (subName && !seen.has(subName.toLowerCase())) {
              seen.add(subName.toLowerCase());
              list.push({
                value: subName,
                label: `${subName} (${catName})`,
                id: sub.id,
              });
            }
          });
        }
      });

    // Ensure currently selected dish category is included at top
    if (form.category?.trim() && !seen.has(form.category.trim().toLowerCase())) {
      seen.add(form.category.trim().toLowerCase());
      list.unshift({
        value: form.category.trim(),
        label: form.category.trim(),
      });
    }

    return list;
  }, [apiCategories, form.category]);

  // Field refs for auto-scroll on validation error
  const nameRef = useRef(null);
  const priceRef = useRef(null);

  const handleAutoSuggestRecipe = async () => {
    const dishName = form.name?.trim();
    if (!dishName) {
      onToast?.({ message: "Please enter a Dish / Menu Name first to auto-fill recipe!", type: "warning" });
      nameRef.current?.focus();
      return;
    }

    setIsAiGenerating(true);
    setUnmatchedAiItems([]);
    setAiChefTip("");

    try {
      const res = await api.aiRecipe(
        {
          dishName,
          servingSize: 1,
          kitchenId: apiState?.kitchen?.id || selectedBranch?.kitchenId || undefined,
          branchId: activeBranchId || undefined,
        },
        activeBranchId
      );

      if (!res || res.status === false) {
        onToast?.({ message: res?.message || "Failed to auto-suggest recipe for this dish.", type: "error" });
        setIsAiGenerating(false);
        return;
      }

      // Auto-populate description if currently empty
      if (!form.description?.trim() && res.description) {
        setForm((prev) => ({ ...prev, description: res.description }));
      }

      if (res.chefTip) {
        setAiChefTip(res.chefTip);
      }

      const aiIngredients = Array.isArray(res.data) ? res.data : [];
      if (aiIngredients.length === 0) {
        onToast?.({ message: `AI generated details, but no ingredients found for "${dishName}".`, type: "info" });
        setIsAiGenerating(false);
        return;
      }

      const matchedList = [];
      const unmatchedList = [];

      aiIngredients.forEach((item) => {
        let branchItem = null;

        // 1. Match by inventoryItemId
        if (item.inventoryItemId) {
          branchItem = branchIngredients.find((b) => Number(b.id) === Number(item.inventoryItemId));
        }

        // 2. Match by ingredientId
        if (!branchItem && item.ingredientId) {
          branchItem = branchIngredients.find(
            (b) => Number(b.ingredientId || b.ingredient?.id) === Number(item.ingredientId)
          );
        }

        // 3. Match by matchedName
        if (!branchItem && item.matchedName) {
          const matchNorm = item.matchedName.toLowerCase().trim();
          branchItem = branchIngredients.find(
            (b) => (b.ingredient?.name || b.name || "").toLowerCase().trim() === matchNorm
          );
        }

        // 4. Fuzzy fallback match
        if (!branchItem && item.name) {
          const cleanItemName = item.name.toLowerCase().replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
          const firstWord = cleanItemName.split(" ")[0];
          branchItem = branchIngredients.find((b) => {
            const bName = (b.ingredient?.name || b.name || "").toLowerCase().replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
            if (bName === cleanItemName) return true;
            if (bName.includes(cleanItemName) || cleanItemName.includes(bName)) return true;
            if (firstWord && firstWord.length >= 4 && bName.includes(firstWord)) return true;
            return false;
          });
        }

        if (branchItem) {
          const ingId = String(branchItem.ingredientId || branchItem.ingredient?.id || branchItem.id);
          matchedList.push({
            ingredientId: ingId,
            name: branchItem.ingredient?.name || branchItem.name,
            quantity: String(item.quantity || "1"),
            unit: item.unit || branchItem.unit || "KG",
            hint: item.hint || (item.weightInGm ? `~${item.weightInGm}g` : ""),
          });
        } else {
          const autoStockUnit = normalizeInventoryStockUnit(item.unit, item.weightInGm);
          unmatchedList.push({
            name: item.name,
            image: item.image || "",
            hint: item.hint || (item.weightInGm ? `~${item.weightInGm}g` : ""),
            weightInGm: item.weightInGm,
            quantity: String(item.quantity || "1"),
            unit: item.unit || "GM",
            recipeQty: String(item.quantity || "1"),
            recipeUnit: item.unit || "GM",
            category: form.category?.trim() || apiCategories?.[0]?.name || "General",
            initialStock: "0",
            stockUnit: autoStockUnit,
            selected: true,
          });
        }
      });

      if (matchedList.length > 0) {
        // Deduplicate matched ingredients
        const uniqueMatched = [];
        const seen = new Set();

        for (const m of matchedList) {
          if (seen.has(m.ingredientId)) {
            const existing = uniqueMatched.find((u) => u.ingredientId === m.ingredientId);
            if (existing && existing.unit === m.unit) {
              existing.quantity = String(parseFloat((parseFloat(existing.quantity) + parseFloat(m.quantity)).toFixed(4)));
            }
            if (existing && m.hint && !existing.hint?.includes(m.hint)) {
              existing.hint = `${existing.hint}, ${m.hint}`;
            }
          } else {
            seen.add(m.ingredientId);
            uniqueMatched.push({
              ingredientId: m.ingredientId,
              quantity: m.quantity,
              unit: m.unit,
              hint: m.hint,
            });
          }
        }

        setRecipeIngredients(uniqueMatched);
        setUnmatchedAiItems(unmatchedList);

        onToast?.({
          message: `✨ Recipe auto-filled with ${uniqueMatched.length} ingredients for "${dishName}"!`,
          type: "success",
        });
      } else {
        setUnmatchedAiItems(unmatchedList);
        onToast?.({
          message: `AI suggested ${unmatchedList.length} ingredients, but none matched your branch inventory.`,
          type: "info",
        });
      }
    } catch (err) {
      console.error("Error generating AI recipe:", err);
      onToast?.({ message: getApiErrorMessage(err, "Failed to auto-suggest recipe."), type: "error" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Quick Provision Handlers (AI Suggestions -> Branch Inventory + Recipe)
  const handleRemoveSuggestedItem = (idxToRemove) => {
    setUnmatchedAiItems((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleToggleSuggestedItem = (idxToToggle) => {
    setUnmatchedAiItems((prev) =>
      prev.map((item, idx) => (idx === idxToToggle ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAllSuggested = (selectVal) => {
    setUnmatchedAiItems((prev) => prev.map((item) => ({ ...item, selected: selectVal })));
  };

  const handleOpenProvisionModal = () => {
    const selected = unmatchedAiItems.filter((item) => item.selected !== false);
    if (selected.length === 0) {
      onToast?.({ message: "Please select at least one ingredient to add!", type: "warning" });
      return;
    }
    setProvisionItems(
      selected.map((item) => ({
        name: item.name,
        image: item.image || "",
        category: item.category || form.category?.trim() || apiCategories?.[0]?.name || "General",
        recipeQty: item.recipeQty || item.quantity || "1",
        recipeUnit: item.recipeUnit || item.unit || "GM",
        initialStock: item.initialStock !== undefined && item.initialStock !== "" ? item.initialStock : "0",
        stockUnit: item.stockUnit || normalizeInventoryStockUnit(item.unit, item.weightInGm),
        hint: item.hint || "",
      }))
    );
    setShowStockModal(true);
  };

  const handleConfirmProvision = async () => {
    if (!activeBranchId) {
      onToast?.({ message: "Please select an active kitchen branch first!", type: "error" });
      return;
    }
    setIsProvisioning(true);
    try {
      const payload = {
        items: provisionItems.map((item) => ({
          name: item.name,
          category: item.category || "General",
          image: item.image?.trim() || undefined,
          unit: item.stockUnit || item.recipeUnit || "GM",
          initialStock: parseFloat(item.initialStock) || 0,
          alertQuantity: 5,
        })),
      };

      const res = await api.quickProvisionIngredients(activeBranchId, payload);
      if (!res || res.status === false) {
        throw new Error(res?.message || "Failed to add ingredients to branch inventory");
      }

      // Refresh branch ingredients in local state
      const branchRes = await api.branchIngredients(activeBranchId, { page: "1", limit: "100" });
      const freshList = Array.isArray(branchRes?.data) ? branchRes.data : Array.isArray(branchRes) ? branchRes : [];
      setBranchIngredients(freshList);

      // Map newly provisioned items into recipeIngredients table rows
      const createdItems = Array.isArray(res?.data) ? res.data : [];
      const newRecipeRows = provisionItems.map((prov) => {
        const matchingCreated = createdItems.find(
          (c) => c.name?.toLowerCase().trim() === prov.name?.toLowerCase().trim()
        );
        const ingredientId = String(
          matchingCreated?.ingredientId || matchingCreated?.id || ""
        );
        return {
          ingredientId,
          name: prov.name,
          quantity: String(prov.recipeQty || "1"),
          unit: prov.recipeUnit || prov.stockUnit || "GM",
          hint: prov.hint,
        };
      });

      // Filter out empty rows from current recipeIngredients and append new ones
      setRecipeIngredients((prev) => {
        const existingValid = prev.filter((r) => r.ingredientId);
        return [...existingValid, ...newRecipeRows];
      });

      // Remove added items from unmatchedAiItems
      const addedNames = new Set(provisionItems.map((p) => p.name.toLowerCase().trim()));
      setUnmatchedAiItems((prev) => prev.filter((item) => !addedNames.has(item.name.toLowerCase().trim())));

      setShowStockModal(false);
      onToast?.({
        message: `✨ ${newRecipeRows.length} ingredients added to Branch Inventory with Stock & linked to Recipe!`,
        type: "success",
      });
    } catch (err) {
      console.error("Error provisioning ingredients:", err);
      onToast?.({ message: getApiErrorMessage(err, "Failed to provision ingredients"), type: "error" });
    } finally {
      setIsProvisioning(false);
    }
  };

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Helper to extract stock count
  const extractStock = (item) => {
    if (typeof item?.currentStock === "number") return item.currentStock;
    if (item?.currentStock !== undefined && item?.currentStock !== null && !isNaN(Number(item.currentStock))) {
      return Number(item.currentStock);
    }
    if (Array.isArray(item?.stock)) {
      return item.stock.reduce((sum, s) => sum + (Number(s?.quantity ?? s?.stock) || 0), 0);
    }
    if (typeof item?.stock === "object" && item?.stock !== null) {
      return item.stock.quantity ?? item.stock.stock ?? 0;
    }
    if (typeof item?.stock === "number") return item.stock;
    return 0;
  };

  // Fetch dynamic categories from GET /kitchen/menu/categories
  useEffect(() => {
    let active = true;
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const res = await api.menuCategories();
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!active) return;
        setApiCategories(data);
      } catch (err) {
        console.warn("Failed to fetch menu categories:", err);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  // Load branch ingredients whenever activeBranchId changes
  useEffect(() => {
    if (!activeBranchId) {
      setBranchIngredients([]);
      return;
    }
    let active = true;
    async function loadBranchIngredients() {
      setLoadingIngredients(true);
      try {
        const response = await api.branchIngredients(activeBranchId, { page: "1", limit: "50" });
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

  // Use ONLY active branch ingredients for recipe dropdown options
  const ingredientLookupMap = useMemo(() => {
    const map = new Map();
    branchIngredients.forEach((item) => {
      const id = String(item.ingredientId || item.ingredient?.id || item.id);
      const name = item.ingredient?.name || item.name || `Ingredient #${id}`;
      const unit = item.unit || "KG";
      const stock = extractStock(item);
      map.set(id, {
        id,
        branchIngredientId: item.id,
        name,
        unit,
        stock,
        isBranch: true,
        raw: item,
      });
    });
    return map;
  }, [branchIngredients]);

  const ingredientOptions = useMemo(() => {
    return Array.from(ingredientLookupMap.values()).map((item) => ({
      value: item.id,
      label: `${item.name} (${item.unit}) • Stock: ${item.stock} ${item.unit}`,
      unit: item.unit,
      stock: item.stock,
      name: item.name,
      isBranch: true,
    }));
  }, [ingredientLookupMap]);

  // Dynamic Menu Categories (STRICTLY from GET /kitchen/menu/categories)
  const menuCategoryOptions = useMemo(() => {
    return (apiCategories || [])
      .filter((cat) => cat && (cat.status === undefined || cat.status === "ACTIVE"))
      .map((cat) => ({
        value: String(cat.id),
        label: cat.name,
        id: cat.id,
        name: cat.name,
        subCategories: Array.isArray(cat.subCategories) ? cat.subCategories : [],
      }));
  }, [apiCategories]);

  // Selected Category Object
  const selectedCategoryObj = useMemo(() => {
    return menuCategoryOptions.find(
      (c) =>
        (form.categoryId && String(c.id) === String(form.categoryId)) ||
        (form.category && c.name.toLowerCase() === form.category.trim().toLowerCase())
    );
  }, [menuCategoryOptions, form.categoryId, form.category]);

  // Dynamic Sub Category Options (STRICTLY from selected category's subCategories in API)
  const menuSubCategoryOptions = useMemo(() => {
    if (!selectedCategoryObj || !Array.isArray(selectedCategoryObj.subCategories)) {
      return [];
    }
    return selectedCategoryObj.subCategories
      .filter((sub) => sub && (sub.status === undefined || sub.status === "ACTIVE"))
      .map((sub) => ({
        value: String(sub.id),
        label: sub.name,
        id: sub.id,
        name: sub.name,
      }));
  }, [selectedCategoryObj]);

  const handleCategoryChange = (opt) => {
    if (!opt) {
      setForm((f) => ({ ...f, category: "", categoryId: "", subCategory: "", subCategoryId: "" }));
      setErrors((err) => ({ ...err, category: undefined }));
      return;
    }
    const match = menuCategoryOptions.find(
      (c) => String(c.value) === String(opt.value) || c.name.toLowerCase() === (opt.label || opt.value).toLowerCase()
    );
    const catId = match?.id || (opt.__isNew__ ? "" : match?.value || "");
    const catName = match?.name || opt.label || opt.value;
    setForm((f) => ({
      ...f,
      category: catName,
      categoryId: catId ? String(catId) : "",
      subCategory: "",
      subCategoryId: "",
    }));
    setErrors((err) => ({ ...err, category: undefined }));
  };

  const handleSubCategoryChange = (opt) => {
    if (!opt) {
      setForm((f) => ({ ...f, subCategory: "", subCategoryId: "" }));
      return;
    }
    const match = menuSubCategoryOptions.find(
      (s) => String(s.value) === String(opt.value) || s.name.toLowerCase() === (opt.label || opt.value).toLowerCase()
    );
    const subId = match?.id || (opt.__isNew__ ? "" : match?.value || "");
    const subName = match?.name || opt.label || opt.value;
    setForm((f) => ({
      ...f,
      subCategory: subName,
      subCategoryId: subId ? String(subId) : "",
    }));
  };

  // Ingredient row actions
  const addIngredientRow = () => {
    setRecipeIngredients((prev) => [...prev, { ingredientId: "", quantity: "1", unit: "KG" }]);
  };

  const removeIngredientRow = (index) => {
    setRecipeIngredients((prev) => prev.filter((_, idx) => idx !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`ingredient_${index}`];
      delete next[`quantity_${index}`];
      delete next.ingredients;
      return next;
    });
  };

  const handleSelectIngredient = (index, opt) => {
    const ingId = opt?.value || "";
    const selectedItem = ingredientLookupMap.get(String(ingId));
    const defaultUnit = selectedItem?.unit || "KG";

    setRecipeIngredients((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        ingredientId: ingId,
        unit: next[index]?.unit && next[index]?.unit !== "KG" ? next[index].unit : defaultUnit,
      };
      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [`ingredient_${index}`]: undefined,
      ingredients: undefined,
    }));
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

  // Solution 3: Real-time Stock Yield & Capacity calculation
  const stockYield = useMemo(() => {
    return calculateStockYield(recipeIngredients, ingredientLookupMap);
  }, [recipeIngredients, ingredientLookupMap]);

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

    // Validate ingredients (OPTIONAL - only validate filled rows)
    recipeIngredients.forEach((row, idx) => {
      if (row.ingredientId) {
        if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
          next[`quantity_${idx}`] = "Enter quantity > 0.";
        }
      }
    });

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

    if (!hasBranches || !activeBranchId) {
      setMessageType("error");
      setMessage("Please add at least one kitchen branch first before creating or updating menu items.");
      onToast?.({ message: "Please add at least one kitchen branch first before creating or updating menu items.", type: "warning" });
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

      const kitchenId = Number(apiState?.kitchen?.id || selectedBranch?.kitchenId || "");

      // Send ID in category / subCategory payload if available, or object with name/id
      const categoryPayload = form.categoryId
        ? { id: Number(form.categoryId), name: form.category.trim() }
        : { name: form.category.trim() || "Main Course" };

      const subCategoryPayload = form.subCategoryId
        ? { id: Number(form.subCategoryId), name: form.subCategory.trim() }
        : form.subCategory.trim()
        ? { name: form.subCategory.trim() }
        : undefined;

      const validIngredients = validRows.map((row) => ({
        id: Number(row.ingredientId),
        quantity: Number(row.quantity),
        ...(row.unit ? { unit: row.unit } : {}),
      }));

      let payload;
      if (imageFile instanceof File) {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("description", form.description.trim());
        formData.append("price", String(form.price));
        formData.append("branchId", String(activeBranchId));
        if (kitchenId) formData.append("kitchenId", String(kitchenId));
        if (form.categoryId) formData.append("categoryId", String(form.categoryId));
        formData.append("category", JSON.stringify(categoryPayload));
        if (form.subCategoryId) formData.append("subCategoryId", String(form.subCategoryId));
        if (subCategoryPayload) formData.append("subCategory", JSON.stringify(subCategoryPayload));
        formData.append("ingredients", JSON.stringify(validIngredients));
        formData.append("image", imageFile);
        payload = formData;
      } else {
        payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          branchId: Number(activeBranchId),
          ...(kitchenId ? { kitchenId } : {}),
          ...(form.categoryId ? { categoryId: Number(form.categoryId) } : {}),
          category: categoryPayload,
          ...(form.subCategoryId ? { subCategoryId: Number(form.subCategoryId) } : {}),
          ...(subCategoryPayload ? { subCategory: subCategoryPayload } : {}),
          ingredients: validIngredients,
          ...(imagePreviewUrl ? { image: imagePreviewUrl.trim() } : {}),
        };
      }

      if (isEditing) {
        try {
          await api.updateMenu(activeBranchId, editDish.id, payload);
        } catch (updateErr) {
          console.warn("PUT updateMenu failed, attempting POST fallback:", updateErr);
          await api.createMenu(activeBranchId, payload);
        }
        await refreshKitchenData?.(undefined, undefined, activeBranchId);
        const successText = `Menu item "${form.name.trim()}" updated successfully!`;
        setMessageType("success");
        setMessage(successText);
        onToast?.({ message: successText, type: "success" });
        navigate("/kitchen/menu");
      } else {
        await api.createMenu(activeBranchId, payload);
        await refreshKitchenData?.(undefined, undefined, activeBranchId);
        const successText = `Menu item "${form.name.trim()}" created successfully!`;
        setMessageType("success");
        setMessage(successText);
        onToast?.({ message: successText, type: "success" });
        navigate("/kitchen/menu");
      }
    } catch (error) {
      const errMsg = getApiErrorMessage(error, isEditing ? "Unable to update menu item" : "Unable to create menu item");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 pb-16">
      {/* Top Banner with Back Arrow */}
      <PageHeader
        onBack={() => navigate("/kitchen/menu")}
        badge={isEditing ? "Menu Recipe Editor" : "Menu Recipe Creator"}
        activeBadge={
          !hasBranches
            ? "No Branches Configured"
            : selectedBranch?.name
            ? `${selectedBranch.name} • ${isEditing ? `ID #${editDish.id}` : "New Item"}`
            : `Branch #${activeBranchId}`
        }
        title={isEditing ? `Edit Menu Item: ${editDish.name}` : "Add New Menu Item"}
        subtitle={
          isEditing
            ? "Update dish details, category, pricing, and adjust recipe ingredient quantities."
            : "Configure dish details, pricing, and link required recipe ingredients with exact quantities."
        }
        actions={
          <button
            className="flex items-center gap-2 rounded-full border border-[#8D0606]/20 bg-[#fff1f1] px-4 py-2 text-xs font-bold text-[#8D0606] transition hover:bg-[#ffe4e4] active:scale-98 shadow-2xs whitespace-nowrap"
            onClick={() => navigate("/kitchen/menu")}
            type="button"
          >
            <Eye size={15} />
            <span>View Catalog</span>
          </button>
        }
      />

      {/* Target Branch Header Indicator */}
      {!hasBranches ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs text-amber-900">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-900">No Kitchen Branch Configured</h4>
              <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                You must add at least one kitchen branch before creating or managing menu items and recipes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/kitchen/branches")}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition shrink-0"
          >
            <Plus size={14} />
            <span>Add Branch First</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Target Kitchen Branch:</span>
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-[#8D0606] border border-rose-100 whitespace-nowrap">
                  {selectedBranch?.name || `Branch #${activeBranchId}`}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                Menu item and linked stock will be created under this active branch (selected in header).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Basic Menu Info & Pricing */}
      <FormPanel title="Dish Details & Pricing" icon={UtensilsCrossed}>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Menu Name */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569]">
                Dish / Menu Name <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestRecipe}
                disabled={isAiGenerating || !form.name?.trim()}
                className="text-[11px] font-bold text-[#8D0606] hover:text-[#720505] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Auto-fill recipe ingredients from AI"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8D0606]" />
                    <span>Auto-filling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-fill with AI</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <UtensilsCrossed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={17} />
              <input
                ref={nameRef}
                type="text"
                placeholder="Enter dish / menu name (e.g. Paneer Butter Masala)"
                value={form.name}
                onChange={updateForm("name")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAutoSuggestRecipe();
                  }
                }}
                className={`w-full rounded-xl border bg-white h-11 pl-10 pr-24 text-xs font-medium text-[#0f172a] outline-none transition duration-200 placeholder:text-[#94a3b8] ${
                  errors.name
                    ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-[#e2e8f0] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                }`}
              />
              <button
                type="button"
                onClick={handleAutoSuggestRecipe}
                disabled={isAiGenerating || !form.name?.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#8D0606] hover:bg-[#720505] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
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
            {errors.name ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.name}</span>
              </p>
            ) : null}
          </div>

          {/* Price */}
          <TextField
            ref={priceRef}
            icon={DollarSign}
            label="Selling Price (₹)"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter selling price in ₹ (e.g. 299)"
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
              value={form.category ? { value: form.categoryId || form.category, label: form.category } : null}
              onChange={handleCategoryChange}
              placeholder="Select or type category (e.g. Main Course, Desserts)"
              menuPortalTarget={document.body}
              isLoading={loadingCategories}
              isClearable
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
              Sub Category 
            </label>
            <CreatableSelect
              styles={selectStyles(false)}
              options={menuSubCategoryOptions}
              value={form.subCategory ? { value: form.subCategoryId || form.subCategory, label: form.subCategory } : null}
              onChange={handleSubCategoryChange}
              placeholder={selectedCategoryObj ? `Select subcategory for ${selectedCategoryObj.name}` : "Select or type subcategory (e.g. Curry, Gravy)"}
              menuPortalTarget={document.body}
              isClearable
            />
          </div>

          {/* Description */}
          <TextField
            icon={FileText}
            label="Description "
            textarea
            className="md:col-span-2"
            placeholder="Enter dish description, ingredients, or allergen notes..."
            value={form.description}
            onChange={updateForm("description")}
          />
        </div>
      </FormPanel>

      {/* Section 2: Dish Image & Visuals */}
      <FormPanel
        title="Dish Image & Visuals"
        icon={ImageIcon}
        badge={imagePreviewUrl ? (imageFile ? "Custom File" : "Image Attached") : "Optional"}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-700">Dish Presentation Image</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Upload a photo from your computer, provide an external image link, or select from curated sample dishes.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setImageInputMode("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  imageInputMode === "upload"
                    ? "bg-white text-[#8D0606] shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload size={13} />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode("url")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  imageInputMode === "url"
                    ? "bg-white text-[#8D0606] shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Link2 size={13} />
                <span>Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode("presets")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  imageInputMode === "presets"
                    ? "bg-white text-[#8D0606] shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles size={13} />
                <span>Presets</span>
              </button>
            </div>
          </div>

          {/* Active Preview Banner (when image exists) */}
          {imagePreviewUrl ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl border border-rose-200 bg-white shadow-2xs">
                  <img
                    src={imagePreviewUrl}
                    alt="Dish Preview"
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {imageFile?.name || (form.name ? `${form.name} Photo` : "Selected Dish Photo")}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#8D0606] border border-rose-200 shrink-0">
                      {imageFile
                        ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : imageInputMode === "presets"
                        ? "Preset Photo"
                        : "Web Link"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {imageFile
                      ? `Ready for binary upload • ${imageFile.type || "image"}`
                      : imagePreviewUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {imageInputMode === "upload" && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Upload size={13} />
                    <span>Change File</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                  title="Remove image"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Mode 1: File Upload */}
          {imageInputMode === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                className="hidden"
                onChange={handleImageFileUpload}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-8 px-4 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-[#8D0606] bg-rose-50/50 scale-[0.99]"
                    : "border-slate-200 bg-slate-50/60 hover:border-[#8D0606]/40 hover:bg-rose-50/20"
                }`}
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-white border border-slate-200 text-[#8D0606] shadow-2xs">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag and drop dish image here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports PNG, JPG, JPEG, WEBP or GIF (Max file size: 5MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Image URL */}
          {imageInputMode === "url" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Dish Image Web URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    placeholder="Enter image URL (e.g. https://images.unsplash.com/...)"
                    value={imageUrlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10 placeholder:text-slate-400"
                  />
                  {imageUrlInput && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Paste a direct link to any public image URL (Unsplash, Cloudinary, AWS S3, etc.)
                </p>
              </div>
            </div>
          )}

          {/* Mode 3: Presets Gallery */}
          {imageInputMode === "presets" && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select from Popular Dish Presets
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DISH_PRESETS.map((preset, idx) => {
                  const isSelected = imagePreviewUrl === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPreset(preset.url)}
                      className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#8D0606] ring-2 ring-[#8D0606]/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#8D0606]/30 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="grid size-7 place-items-center rounded-full bg-[#8D0606] text-white shadow-md">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-white">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#8D0606]" : "text-slate-700"
                          }`}
                        >
                          {preset.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FormPanel>

      {/* Section 3: Recipe Ingredients & Stock Quantities */}
      <FormPanel
        title="Recipe Ingredients"
        icon={Package}
        badge={recipeIngredients.some((r) => r.ingredientId) ? `${recipeIngredients.filter((r) => r.ingredientId).length} Item${recipeIngredients.filter((r) => r.ingredientId).length > 1 ? "s" : ""}` : "Optional"}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs text-slate-500 font-medium">
              Specify the stock quantity of each ingredient required per serving to enable automated stock deduction.
            </p>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleAutoSuggestRecipe}
                disabled={isAiGenerating || !form.name?.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition shadow-2xs active:scale-98 shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Auto-suggest single-serving recipe ingredients using AI"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-700" />
                    <span>Generating Recipe...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Auto-fill Recipe with AI</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-[#8D0606] border border-rose-100 hover:bg-rose-100 transition shadow-2xs active:scale-98 shrink-0 whitespace-nowrap"
              >
                <Plus size={14} />
                <span>Add Ingredient</span>
              </button>
            </div>
          </div>

          {branchIngredients.length === 0 && !loadingIngredients && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
              <div className="flex items-center gap-2.5 text-amber-800 font-medium">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  {!hasBranches
                    ? "No kitchen branches available. Please add a branch first before configuring recipe ingredients."
                    : `No ingredients found in this branch inventory (${selectedBranch?.name || `Branch #${activeBranchId}`}). Please attach ingredients from Ingredients & Stock first.`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(!hasBranches ? "/kitchen/branches" : "/ingredients")}
                className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 font-bold text-white shadow-2xs hover:bg-amber-700 transition"
              >
                {!hasBranches ? "Add Branch →" : "Manage Ingredients →"}
              </button>
            </div>
          )}

          {/* Table Header for Ingredients */}
          {recipeIngredients.length > 0 && (
            <div className="hidden sm:grid grid-cols-[32px_1fr_130px_110px_130px_38px] gap-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>#</span>
              <span>Recipe Ingredient</span>
              <span>Weight / Qty</span>
              <span>Unit</span>
              <span>Branch Stock</span>
              <span className="text-right">Action</span>
            </div>
          )}

          {/* Ingredients Table/Rows */}
          {recipeIngredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-center">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] mb-2">
                <Package size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700">No ingredients added</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                Ingredients are optional. You can add ingredients anytime to track stock deductions per order.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleAutoSuggestRecipe}
                  disabled={isAiGenerating || !form.name?.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Auto-fill recipe ingredients from AI"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Auto-fill with AI</span>
                </button>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  <Plus size={14} />
                  <span>Add Ingredient</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recipeIngredients.map((row, index) => {
                const selectedItem = ingredientLookupMap.get(String(row.ingredientId));
                const itemDefaultUnit = selectedItem?.unit || "KG";
                const currentUnit = row.unit || itemDefaultUnit;
                const availableStock = selectedItem ? selectedItem.stock : null;

                // Solution 1: Live conversion hint
                const conversionHint = getRecipeConversionHint(row.quantity, currentUnit);

                // Solution 2: Smart sanity warning badge for oversized single serving inputs
                const sanityWarning = getRecipeSanityWarning(row.quantity, currentUnit);

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-slate-50 space-y-2.5"
                  >
                    <div className="flex flex-col sm:grid sm:grid-cols-[32px_1fr_130px_110px_130px_38px] items-start sm:items-center gap-3">
                      {/* Row Serial Number */}
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-2xs">
                        {index + 1}
                      </span>

                      {/* Ingredient Select */}
                      <div className="w-full">
                        <label className="sm:hidden mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Ingredient
                        </label>
                        <Select
                          styles={selectStyles(!!errors[`ingredient_${index}`])}
                          options={ingredientOptions}
                          value={ingredientOptions.find((opt) => String(opt.value) === String(row.ingredientId)) || null}
                          onChange={(opt) => handleSelectIngredient(index, opt)}
                          placeholder="Search and select ingredient from inventory..."
                          menuPortalTarget={document.body}
                          isLoading={loadingIngredients}
                        />
                        {row.hint && (
                          <span className="mt-1 inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {row.hint}
                          </span>
                        )}
                        {errors[`ingredient_${index}`] && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-600">
                            {errors[`ingredient_${index}`]}
                          </p>
                        )}
                      </div>

                      {/* Weight / Quantity Input */}
                      <div className="w-full">
                        <label className="sm:hidden mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Weight / Qty
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          placeholder="Enter quantity (e.g. 0.5)"
                          value={row.quantity}
                          onChange={(e) => updateIngredientRow(index, "quantity", e.target.value)}
                          className={`h-11 w-full rounded-xl border bg-white px-3 text-xs font-bold text-slate-800 outline-none transition ${
                            errors[`quantity_${index}`]
                              ? "border-rose-500 bg-rose-50/20"
                              : "border-slate-200 focus:border-[#8D0606]"
                          }`}
                        />
                        {errors[`quantity_${index}`] && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-600">
                            {errors[`quantity_${index}`]}
                          </p>
                        )}
                      </div>

                      {/* Unit Dropdown */}
                      <div className="w-full">
                        <label className="sm:hidden mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Unit
                        </label>
                        <Select
                          styles={selectStyles(false)}
                          options={unitOptions}
                          value={findUnitOption(currentUnit)}
                          onChange={(opt) => updateIngredientRow(index, "unit", opt?.value || "KG")}
                          menuPortalTarget={document.body}
                        />
                      </div>

                      {/* Available Branch Stock Tag */}
                      <div className="w-full sm:w-auto">
                        {availableStock !== null ? (
                          <div className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            <Boxes size={12} className="text-amber-600 shrink-0" />
                            <span className="truncate">Stock: <strong className="text-slate-800">{availableStock} {itemDefaultUnit}</strong></span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Select item</span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <div className="flex justify-end w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(index)}
                          className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                          title="Remove ingredient"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Solution 2: Sanity Warning Badge */}
                    {sanityWarning ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl bg-amber-50/90 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 shadow-2xs animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                          <span>
                            <strong>{sanityWarning.warning}</strong> {sanityWarning.suggestion}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateIngredientRow(index, "unit", sanityWarning.fixTarget.unit);
                            updateIngredientRow(index, "quantity", sanityWarning.fixTarget.quantity);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition shrink-0 self-end sm:self-auto"
                        >
                          <Sparkles size={12} />
                          <span>{sanityWarning.fixLabel}</span>
                        </button>
                      </div>
                    ) : conversionHint && !errors[`quantity_${index}`] ? (
                      /* Solution 1: Live Conversion Hint */
                      <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-slate-600">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>{conversionHint.text}</span>
                        </span>
                        <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 font-bold text-emerald-800 text-[10.5px]">
                          (= {conversionHint.badge})
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Ingredient Helper Button */}
          <button
            type="button"
            onClick={addIngredientRow}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-xs font-bold text-slate-600 hover:border-[#8D0606]/50 hover:bg-rose-50/30 hover:text-[#8D0606] transition"
          >
            <Plus size={14} />
            <span>Add Another Ingredient to Recipe</span>
          </button>

          {/* AI Chef Tip Notification */}
          {aiChefTip && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5 animate-in fade-in shadow-2xs">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-purple-950 block">
                  👨‍🍳 Chef's Culinary Tip:
                </span>
                <p className="text-[11.5px] leading-relaxed text-purple-800 font-medium">
                  {aiChefTip}
                </p>
              </div>
            </div>
          )}

          {/* Unmatched Ingredients Notification with Multi-Add and Remove */}
          {unmatchedAiItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-3 animate-in fade-in shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-2.5">
                <div className="flex items-center gap-2 font-extrabold text-xs text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {unmatchedAiItems.length} recipe ingredient{unmatchedAiItems.length > 1 ? "s" : ""} suggested by AI not found in this branch inventory
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSuggested(true)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-amber-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllSuggested(false)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 font-medium">
                AI suggested these ingredients for <strong>&ldquo;{form.name}&rdquo;</strong>. Select the ones you want to add or remove unwanted ones:
              </p>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {unmatchedAiItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition shadow-2xs ${
                      item.selected !== false
                        ? "bg-white border-amber-300 text-amber-950"
                        : "bg-amber-100/60 border-amber-200/60 text-slate-400 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected !== false}
                      onChange={() => handleToggleSuggestedItem(idx)}
                      className="size-3.5 rounded border-amber-300 text-[#8D0606] focus:ring-[#8D0606] cursor-pointer"
                    />
                    <span className="cursor-pointer select-none" onClick={() => handleToggleSuggestedItem(idx)}>
                      {item.name}
                    </span>
                    {item.hint && (
                      <span className="text-[10px] text-slate-500 font-medium select-none">
                        ({item.hint})
                      </span>
                    )}
                    {item.category && (
                      <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-[9.5px] font-extrabold text-amber-900 tracking-wide select-none border border-amber-200/50">
                        {item.category}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSuggestedItem(idx)}
                      className="ml-1 size-4 grid place-items-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove from suggested list"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[10.5px] text-amber-700 font-medium">
                  💡 Tip: You can set initial stock quantities while adding so they track deductions in future orders.
                </p>
                <button
                  type="button"
                  onClick={handleOpenProvisionModal}
                  disabled={unmatchedAiItems.filter((i) => i.selected !== false).length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#720505] active:scale-98 transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>
                    Add Selected to Recipe ({unmatchedAiItems.filter((i) => i.selected !== false).length})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Solution 3: Stock Yield Calculator (Kitchen Managers' Favorite) */}
          {stockYield && stockYield.items.length > 0 && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-rose-50/30 p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-[#8D0606] text-white shadow-xs">
                    <ChefHat size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Stock Yield & Dish Capacity</span>
                      <span className="rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-extrabold text-[#8D0606]">
                        Live Estimate
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Calculates how many servings of &ldquo;{form.name.trim() || "this dish"}&rdquo; can be made from active branch stock.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-500">Max Estimated Yield:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-extrabold shadow-2xs border ${
                      stockYield.maxServings > 50
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : stockYield.maxServings > 0
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    <span>~{stockYield.maxServings.toLocaleString("en-IN")} Servings</span>
                  </span>
                </div>
              </div>

              {/* Bottleneck Alert */}
              {stockYield.bottleneck && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl bg-amber-50/90 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle size={15} className="text-amber-600 shrink-0" />
                    <span>
                      ⚠️ <strong>{stockYield.bottleneck.name}</strong> will run out first (Lowest stock bottleneck: ~{stockYield.bottleneck.possibleDishes} dishes max).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/kitchen/ingredients")}
                    className="shrink-0 text-[11px] font-bold text-amber-800 hover:underline hover:text-amber-950"
                  >
                    Update Stock &rarr;
                  </button>
                </div>
              )}

              {/* Grid of Ingredient Yield Calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {stockYield.items.map((item, idx) => {
                  const isBottleneck = item.ingredientId === stockYield.bottleneck?.ingredientId;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-xl p-3 border transition ${
                        isBottleneck
                          ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40 shadow-2xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          {isBottleneck && (
                            <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-900 uppercase">
                              Bottleneck
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Stock: {item.availableStock} {item.stockUnit} • Req: {item.reqQty} {item.reqUnit}/dish
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-extrabold ${isBottleneck ? "text-amber-700" : "text-slate-800"}`}>
                          ~{item.possibleDishes.toLocaleString("en-IN")}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400">dishes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FormPanel>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-40 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 sm:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-initial flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 sm:px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-200 shrink-0"
            onClick={() => navigate("/kitchen/menu")}
            type="button"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
          <button
            className="flex-[2] sm:flex-initial flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-[#8D0606] px-3.5 sm:px-6 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98 disabled:opacity-60"
            disabled={saving || !hasBranches}
            onClick={saveMenu}
            type="button"
            title={!hasBranches ? "Please add a kitchen branch first" : undefined}
          >
            {saving ? (
              <Loader variant="button" text={isEditing ? "Updating..." : "Saving..."} />
            ) : (
              <>
                <Save size={15} />
                <span>{isEditing ? "Update Recipe" : "Save Menu Item"}</span>
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

      {/* Quick Provision Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden space-y-0 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-xl bg-rose-50 text-[#8D0606] grid place-items-center shadow-2xs shrink-0">
                  <Boxes size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Setup Category, Units & Stock for Ingredients</h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Verify culinary category, recipe/inventory units, and initial stock before adding to kitchen.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 grid place-items-center cursor-pointer transition shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Items List */}
            <div className="p-3.5 sm:p-5 flex-1 overflow-y-auto space-y-3">
              {/* Quick Bulk Category Apply */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11.5px] font-bold text-slate-700">Quick Apply Category to All:</span>
                <div className="w-full sm:w-64">
                  <CreatableSelect
                    menuPortalTarget={document.body}
                    styles={compactSelectStyles}
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
                  <div className="grid grid-cols-[1.2fr_1.1fr_140px_140px] gap-2.5 px-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Ingredient</span>
                    <span>Category</span>
                    <span>Recipe Qty & Unit</span>
                    <span>Initial Stock & Unit</span>
                  </div>

                  {provisionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1.2fr_1.1fr_140px_140px] gap-2.5 items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image ? (
                          <div className="relative group shrink-0 size-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
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
                              className="absolute inset-0 bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
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
                            className="size-9 rounded-lg border border-dashed border-slate-300 hover:border-[#8D0606] bg-white hover:bg-rose-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-[#8D0606] shrink-0 transition cursor-pointer shadow-2xs"
                            title="Add optional photo"
                          >
                            <ImageIcon size={13} />
                            <span className="text-[8px] font-bold leading-none mt-0.5">+Img</span>
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <strong className="text-slate-800 block text-xs font-bold truncate">{item.name}</strong>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.hint && <span className="text-[10px] text-slate-400 font-medium truncate">{item.hint}</span>}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveImageModalIdx(idx);
                                setTempImageUrl(item.image || "");
                              }}
                              className="text-[10px] font-semibold text-rose-700 hover:underline cursor-pointer"
                            >
                              {item.image ? "Change photo" : "+ Photo (opt)"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <CreatableSelect
                          menuPortalTarget={document.body}
                          styles={compactSelectStyles}
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
                            className="h-8 w-14 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#8D0606] text-center"
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
                            className="h-8 rounded-lg border border-slate-200 bg-white px-1 text-[11px] font-bold text-slate-700 outline-none focus:border-[#8D0606] cursor-pointer"
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
                            className="h-8 w-14 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#8D0606] text-center"
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
                            className="h-8 rounded-lg border border-slate-200 bg-white px-1 text-[11px] font-bold text-slate-700 outline-none focus:border-[#8D0606] cursor-pointer"
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

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Branch inventory stock is tracked in standard units like <strong>GM / KG / PIECE / LITER</strong> (not TSP or CUP). You can change recipe and inventory units anytime. Initial stock can stay <strong>0</strong> if physical raw material is not yet inwarded. Photo is <strong>optional</strong>.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                disabled={isProvisioning}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProvision}
                disabled={isProvisioning}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#720505] active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                {isProvisioning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Adding to Inventory & Recipe...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Add to Recipe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Photo Picker Modal (Optional) */}
      {activeImageModalIdx !== null && provisionItems[activeImageModalIdx] && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden space-y-0">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-[#8D0606]" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Ingredient Photo (Optional)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {provisionItems[activeImageModalIdx]?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveImageModalIdx(null)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 grid place-items-center cursor-pointer transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {tempImageUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={tempImageUrl}
                    alt="Preview"
                    className="size-16 rounded-lg object-cover border border-slate-200 shadow-2xs"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=200&q=80";
                    }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Active Preview
                    </span>
                    <p className="text-[10px] text-slate-500 truncate">{tempImageUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempImageUrl("")}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Image Web URL
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={tempImageUrl}
                    onChange={(e) => setTempImageUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                    className="h-9 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Direct link from web, Unsplash, Cloudinary, or choose from common presets below.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
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
                            ? "border-[#8D0606] bg-rose-50/60 ring-1 ring-[#8D0606]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="size-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => {
                  setProvisionItems((prev) =>
                    prev.map((p, i) => (i === activeImageModalIdx ? { ...p, image: "" } : p))
                  );
                  setActiveImageModalIdx(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Skip / Clear
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveImageModalIdx(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#8D0606] hover:bg-[#720505] rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormPanel({ title, icon: Icon, badge, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] bg-[#f8fafc] px-4 sm:px-5 py-3 sm:py-3.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {Icon ? <Icon size={17} className="text-[#8D0606] shrink-0" /> : null}
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] truncate">{title}</h3>
        </div>
        {badge ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10.5px] font-bold text-[#8D0606] border border-rose-100 whitespace-nowrap shrink-0">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
