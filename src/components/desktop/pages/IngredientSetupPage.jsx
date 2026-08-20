import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  UtensilsCrossed,
  Building2,
  Sparkles,
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
  Grid,
  List,
  ChevronDown,
  Check,
  RefreshCw,
  PlusCircle,
  Boxes,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { ApiCount } from "../../ui/ApiCount";
import { api, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";

// ---------------------------------------------------------------------------
// Shared styling for react-select dropdowns
// ---------------------------------------------------------------------------
const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#8D0606" : "#e2e8f0",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(141, 6, 6, 0.12)"}`
      : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    "&:hover": { borderColor: hasError ? "#ef4444" : "#8D0606" },
    paddingLeft: 2,
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
    padding: "8px 12px",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
});

// ---------------------------------------------------------------------------
// Helper for vibrant ingredient avatars
// ---------------------------------------------------------------------------
const getIngredientAvatarStyle = (name = "") => {
  const char = (name || "A").charAt(0).toUpperCase();
  const palette = [
    { bg: "bg-rose-50 border-rose-200 text-rose-700" },
    { bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { bg: "bg-amber-50 border-amber-200 text-amber-700" },
    { bg: "bg-indigo-50 border-indigo-200 text-indigo-700" },
    { bg: "bg-violet-50 border-violet-200 text-violet-700" },
    { bg: "bg-sky-50 border-sky-200 text-sky-700" },
  ];
  const idx = (char.charCodeAt(0) || 0) % palette.length;
  return palette[idx];
};

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

  const categoryOptions = useMemo(() => {
    const defaults = [
      "Vegetable",
      "Spices",
      "Dairy",
      "Sauce",
      "Meat & Poultry",
      "Seafood",
      "Grains & Pulses",
      "Bakery & Bread",
      "Oil & Fat",
      "Fruits",
      "Dry Fruits & Nuts",
      "Beverages",
      "Condiments",
      "Packaging",
      "General",
    ];
    const dynamicSet = new Set(defaults);
    (apiState?.ingredients || []).forEach((item) => {
      if (item.category?.trim()) dynamicSet.add(item.category.trim());
    });
    (apiState?.branchIngredients || []).forEach((item) => {
      const cat = item.ingredient?.category || item.category;
      if (cat?.trim()) dynamicSet.add(cat.trim());
    });
    return Array.from(dynamicSet).map((cat) => ({ value: cat, label: cat }));
  }, [apiState?.ingredients, apiState?.branchIngredients]);

  // Tab mode in Add Panel: 'master' | 'custom'
  const [activeTab, setActiveTab] = useState("master");

  // Master Ingredient Search & Select state
  const [masterSearchText, setMasterSearchText] = useState("");
  const [masterSearchResults, setMasterSearchResults] = useState([]);
  const [isSearchingMaster, setIsSearchingMaster] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMasterItems, setSelectedMasterItems] = useState([]);
  const [defaultMasterUnit, setDefaultMasterUnit] = useState("KG");

  // Custom Form state
  const [customForm, setCustomForm] = useState({
    name: "",
    category: "",
    image: "",
    unit: "KG",
  });
  const [activeBranchId, setActiveBranchId] = useState(firstBranchId);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  // Live Inventory server-side pagination & filter state
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryMeta, setInventoryMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    filtered: 0,
    count: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit, setInventoryLimit] = useState(10);
  const [inventoryViewMode, setInventoryViewMode] = useState("table"); // "table" | "grid"
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // "ALL" | "MASTER" | "CUSTOM"

  // Stock update modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState("");

  const searchContainerRef = useRef(null);
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" | "url"
  const [imageFile, setImageFile] = useState(null); // stores raw binary File
  const [imagePreviewUrl, setImagePreviewUrl] = useState(""); // blob URL or remote URL for preview

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast?.({ message: "Please select a valid image file (PNG, JPG, JPEG, WEBP).", type: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onToast?.({ message: "Image size must be less than 5MB.", type: "warning" });
      return;
    }
    // Store binary file directly (No Base64 string conversion)
    setImageFile(file);
    const blobUrl = URL.createObjectURL(file);
    setImagePreviewUrl(blobUrl);
    setCustomForm((f) => ({ ...f, image: "" }));
  };

  const removeImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl("");
    setCustomForm((f) => ({ ...f, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedBranch = branches.find((branch) => String(branch.id) === String(activeBranchId));

  const findOption = (options, value) => options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    if (firstBranchId && firstBranchId !== activeBranchId) {
      setActiveBranchId(firstBranchId);
      setInventoryPage(1);
    }
  }, [firstBranchId]);

  // Close master search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch branch ingredients from backend
  const fetchBranchInventory = useCallback(
    async (branchId, page = 1, limit = 10, search = "") => {
      if (!branchId) {
        setInventoryList([]);
        return;
      }
      setLoadingInventory(true);
      try {
        const params = {
          page: String(page),
          limit: String(limit),
        };
        if (search.trim()) {
          params.name = search.trim();
        }
        const res = await api.branchIngredients(branchId, params);
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : Array.isArray(res?.ingredients)
              ? res.ingredients
              : [];
        setInventoryList(data);
        if (res?.meta) {
          setInventoryMeta(res.meta);
        } else {
          setInventoryMeta({
            page,
            limit,
            total: data.length,
            filtered: data.length,
            count: data.length,
            totalPages: Math.max(1, Math.ceil(data.length / limit)),
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch branch ingredients:", err);
      } finally {
        setLoadingInventory(false);
      }
    },
    []
  );

  // Fetch whenever active branch, page, or limit changes
  useEffect(() => {
    if (activeBranchId) {
      fetchBranchInventory(activeBranchId, inventoryPage, inventoryLimit, inventorySearch);
    }
  }, [activeBranchId, inventoryPage, inventoryLimit, fetchBranchInventory]);

  // Debounced search on inventory
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeBranchId) {
        setInventoryPage(1);
        fetchBranchInventory(activeBranchId, 1, inventoryLimit, inventorySearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inventorySearch]);

  // Lookup of already added ingredient IDs
  const inventoryIngredientIds = useMemo(() => {
    const ids = new Set();
    (apiState?.branchIngredients || []).forEach((item) => {
      ids.add(String(item.ingredientId || item.ingredient?.id || item.id));
    });
    inventoryList.forEach((item) => {
      ids.add(String(item.ingredientId || item.ingredient?.id || item.id));
    });
    return ids;
  }, [apiState?.branchIngredients, inventoryList]);

  // Helper to extract primitive stock number and expiry date safely from item/stock object or array
  const extractStockInfo = useCallback((item, matchingStock) => {
    let stockVal = "";
    let expireVal = "";

    // 1. Check if item.stock is an Array (e.g. item.stock = [{ quantity: 20, expiryDate: null, ... }])
    if (Array.isArray(item?.stock)) {
      if (item.stock.length > 0) {
        const totalQty = item.stock.reduce((acc, s) => acc + (Number(s?.quantity ?? s?.stock) || 0), 0);
        stockVal = totalQty;
        expireVal = item.stock[0]?.expiryDate ?? item.stock[0]?.expireAt ?? "";
      } else {
        stockVal = 0;
      }
    }
    // 2. Check if item.stock is an object
    else if (item?.stock !== undefined && item?.stock !== null && typeof item.stock === "object") {
      stockVal = item.stock.quantity ?? item.stock.stock ?? item.stock.count ?? 0;
      expireVal = item.stock.expiryDate ?? item.stock.expireAt ?? "";
    }
    // 3. Check if item.stock is a primitive number/string
    else if (item?.stock !== undefined && item?.stock !== null) {
      stockVal = item.stock;
    }
    // 4. Fallback to item.currentStock
    else if (item?.currentStock !== undefined && item?.currentStock !== null) {
      if (Array.isArray(item.currentStock)) {
        stockVal = item.currentStock.reduce((acc, s) => acc + (Number(s?.quantity ?? s?.stock) || 0), 0);
        expireVal = item.currentStock[0]?.expiryDate ?? item.currentStock[0]?.expireAt ?? "";
      } else if (typeof item.currentStock === "object") {
        stockVal = item.currentStock.quantity ?? item.currentStock.stock ?? 0;
        expireVal = item.currentStock.expiryDate ?? item.currentStock.expireAt ?? "";
      } else {
        stockVal = item.currentStock;
      }
    }
    // 5. Fallback to matchingStock from separate stocks API
    else if (matchingStock) {
      if (Array.isArray(matchingStock)) {
        stockVal = matchingStock.reduce((acc, s) => acc + (Number(s?.quantity ?? s?.stock) || 0), 0);
        expireVal = matchingStock[0]?.expiryDate ?? matchingStock[0]?.expireAt ?? "";
      } else if (typeof matchingStock === "object") {
        stockVal = matchingStock.quantity ?? matchingStock.stock ?? matchingStock.count ?? 0;
        expireVal = matchingStock.expiryDate ?? matchingStock.expireAt ?? "";
      } else {
        stockVal = matchingStock;
      }
    }

    if (item?.expireAt && !expireVal) {
      expireVal = item.expireAt;
    }
    if (item?.expiryDate && !expireVal) {
      expireVal = item.expiryDate;
    }

    return {
      stock: stockVal !== "" && !isNaN(Number(stockVal)) ? Number(stockVal) : (stockVal === 0 ? 0 : stockVal || 0),
      expireAt: expireVal || "",
    };
  }, []);

  // Stock lookup mapping
  const stockLookupMap = useMemo(() => {
    const map = new Map();
    (apiState?.stocks || []).forEach((stk) => {
      if (!stk || typeof stk !== "object") return;
      if (stk.inventoryItemId) map.set(String(stk.inventoryItemId), stk);
      if (stk.ingredientId) map.set(String(stk.ingredientId), stk);
      if (stk.id) map.set(String(stk.id), stk);
      if (stk.branchIngredientId) map.set(String(stk.branchIngredientId), stk);
    });
    return map;
  }, [apiState?.stocks]);

  // Debounced search for Master Ingredients API
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!masterSearchText.trim()) {
        setMasterSearchResults(apiState?.ingredients || []);
        setIsSearchingMaster(false);
        return;
      }
      setIsSearchingMaster(true);
      try {
        const response = await api.ingredients({
          name: masterSearchText.trim(),
          page: "1",
          limit: "20",
          status: "ACTIVE",
        });
        const items = Array.isArray(response?.data) ? response.data : [];
        setMasterSearchResults(items);
      } catch (err) {
        console.error("Failed to search master ingredients:", err);
        const query = masterSearchText.toLowerCase();
        const fallback = (apiState?.ingredients || []).filter(
          (item) =>
            (item.name || "").toLowerCase().includes(query) ||
            (item.category || "").toLowerCase().includes(query)
        );
        setMasterSearchResults(fallback);
      } finally {
        setIsSearchingMaster(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [masterSearchText, apiState?.ingredients]);

  const changeBranch = async (option) => {
    const branchId = option?.value || "";
    setActiveBranchId(branchId);
    setMessage("");
    setInventoryPage(1);
    if (branchId) {
      await refreshKitchenData?.(undefined, undefined, branchId);
      await fetchBranchInventory(branchId, 1, inventoryLimit, inventorySearch);
    }
  };

  // Toggle selection of a master ingredient
  const toggleSelectMasterItem = (item) => {
    const itemIdStr = String(item.id);
    const isSelected = selectedMasterItems.some((sel) => String(sel.id) === itemIdStr);

    if (isSelected) {
      setSelectedMasterItems((prev) => prev.filter((sel) => String(sel.id) !== itemIdStr));
    } else {
      setSelectedMasterItems((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name || `Ingredient #${item.id}`,
          category: item.category || "General",
          image: item.image,
          unit: defaultMasterUnit,
        },
      ]);
    }
  };

  const removeSelectedMasterItem = (id) => {
    setSelectedMasterItems((prev) => prev.filter((sel) => String(sel.id) !== String(id)));
  };

  const updateSelectedMasterItemUnit = (id, newUnit) => {
    setSelectedMasterItems((prev) =>
      prev.map((sel) => (String(sel.id) === String(id) ? { ...sel, unit: newUnit } : sel))
    );
  };

  // Submit selected Master Ingredients to Branch
  const submitMasterIngredients = async () => {
    if (!activeBranchId) {
      const msg = "Please select an active kitchen branch first.";
      setMessageType("error");
      setMessage(msg);
      onToast?.({ message: msg, type: "error" });
      return;
    }

    if (!selectedMasterItems.length) {
      const msg = "Please select at least one ingredient from the catalog.";
      setMessageType("warning");
      setMessage(msg);
      onToast?.({ message: msg, type: "warning" });
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ingredients: selectedMasterItems.map((item) => ({
          id: Number(item.id),
          unit: item.unit || defaultMasterUnit || "KG",
        })),
      };

      await api.createBranchIngredients(activeBranchId, payload);

      // Instant list API re-fetch & state refresh
      setInventoryPage(1);
      setInventorySearch("");
      await fetchBranchInventory(activeBranchId, 1, inventoryLimit, "");
      refreshKitchenData?.(undefined, undefined, activeBranchId);

      const count = selectedMasterItems.length;
      const successMsg = `Successfully added ${count} ingredient${count > 1 ? "s" : ""} to branch inventory.`;
      setMessageType("success");
      setMessage(successMsg);
      onToast?.({ message: successMsg, type: "success" });
      setSelectedMasterItems([]);
      setMasterSearchText("");
      setIsDropdownOpen(false);
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Unable to add ingredients to branch");
      setMessageType("error");
      setMessage(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Custom ingredient edit / create
  const startEditInventory = (item) => {
    removeImage();
    setEditingInventory(item);
    setActiveTab("custom");
    const existingImg = item.ingredient?.image || item.image || "";
    setCustomForm({
      name: item.ingredient?.name || item.name || "",
      category: item.ingredient?.category || item.category || "",
      image: existingImg,
      unit: item.unit || "KG",
    });
    if (existingImg) {
      setImagePreviewUrl(existingImg);
      setImageInputMode("url");
    } else {
      setImageInputMode("upload");
    }
    setErrors({});
    setMessage("");
    nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    nameRef.current?.focus();
  };

  const cancelEditInventory = () => {
    removeImage();
    setEditingInventory(null);
    setCustomForm({ name: "", category: "", image: "", unit: "KG" });
    setErrors({});
    setMessage("");
  };

  const removeInventoryItem = async (item) => {
    if (!activeBranchId || !item?.id) return;
    const label = item.ingredient?.name || item.name || "ingredient";
    if (!window.confirm(`Remove ${label} from this branch inventory?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await api.deleteBranchIngredient(activeBranchId, item.id);
      if (editingInventory && String(editingInventory.id) === String(item.id)) {
        cancelEditInventory();
      }

      // Instant list API re-fetch
      await fetchBranchInventory(activeBranchId, inventoryPage, inventoryLimit, inventorySearch);
      refreshKitchenData?.(undefined, undefined, activeBranchId);

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

  // Stock Modal handlers
  const openStockModal = (item) => {
    const targetId = String(item.ingredientId || item.ingredient?.id || item.id);
    const matchingStock = stockLookupMap.get(targetId);
    const { stock, expireAt } = extractStockInfo(item, matchingStock);

    let initialExpireDate = "";
    if (expireAt) {
      try {
        const d = new Date(expireAt);
        if (!isNaN(d.getTime())) {
          initialExpireDate = d.toISOString().split("T")[0];
        }
      } catch (_) { }
    }

    setStockItem(item);
    setStockValue(stock !== "" && stock !== undefined && stock !== null ? String(stock) : "0");
    setExpireDate(initialExpireDate);
    setStockError("");
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    if (stockSaving) return;
    setStockModalOpen(false);
    setStockItem(null);
    setStockValue("");
    setExpireDate("");
    setStockError("");
  };

const handleStockSubmit = async (e) => {
  e.preventDefault();
  if (!stockItem || !activeBranchId) return;

  if (
    stockValue === "" ||
    isNaN(Number(stockValue)) ||
    Number(stockValue) < 0
  ) {
    setStockError("Please enter a valid stock quantity (0 or greater).");
    return;
  }

  setStockSaving(true);
  setStockError("");

  try {
    const ingredientId = Number(
      stockItem.ingredientId ||
      stockItem.ingredient?.id ||
      stockItem.id
    );

    let expireAtISO;

    if (expireDate) {
      const d = new Date(expireDate);

      if (!isNaN(d.getTime())) {
        expireAtISO = d.toISOString();
      }
    }

    const payload = {
      stocks: [
        {
          id: ingredientId,
          stock: Number(stockValue),
          ...(expireAtISO ? { expireAt: expireAtISO } : {}),
        },
      ],
    };

    await api.createStock(activeBranchId, payload);

    const label =
      stockItem.ingredient?.name ||
      stockItem.name ||
      `Ingredient #${ingredientId}`;

    const successMsg = `Stock updated successfully for ${label}!`;
    setMessageType("success");
    setMessage(successMsg);
    onToast?.({ message: successMsg, type: "success" });

    closeStockModal();

    // Instant parallel re-fetch of branch ingredients and global state
    await Promise.allSettled([
      fetchBranchInventory(activeBranchId, inventoryPage, inventoryLimit, inventorySearch),
      refreshKitchenData?.(undefined, undefined, activeBranchId),
    ]);
  } catch (error) {
    const errMsg = getApiErrorMessage(
      error,
      "Failed to update ingredient stock"
    );
    setStockError(errMsg);
    onToast?.({ message: errMsg, type: "error" });
  } finally {
    setStockSaving(false);
  }
};

  const validateCustomForm = () => {
    const next = {};
    if (!activeBranchId) next.branchId = "Select a branch first.";
    if (!customForm.name.trim()) next.name = "Ingredient name is required.";
    if (!customForm.category.trim()) next.category = "Category is required.";
    if (!customForm.unit.trim()) next.unit = "Unit is required.";

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

  const submitCustomForm = async (event) => {
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
        if (imageFile instanceof File) {
          const formData = new FormData();
          formData.append("name", customForm.name.trim());
          formData.append("category", customForm.category.trim());
          formData.append("unit", customForm.unit || "KG");
          formData.append("image", imageFile); // Binary File stream!
          await api.updateBranchIngredient(activeBranchId, editingInventory.id, formData);
        } else {
          await api.updateBranchIngredient(activeBranchId, editingInventory.id, {
            name: customForm.name.trim(),
            category: customForm.category.trim(),
            image: customForm.image.trim() || undefined,
            unit: customForm.unit || "KG",
          });
        }
        const successMsg = "Custom ingredient updated successfully.";
        setMessageType("success");
        setMessage(successMsg);
        onToast?.({ message: successMsg, type: "success" });
        cancelEditInventory();
      } else {
        if (imageFile instanceof File) {
          const formData = new FormData();
          formData.append("name", customForm.name.trim());
          formData.append("category", customForm.category.trim());
          formData.append("unit", customForm.unit || "KG");
          formData.append("image", imageFile); // Binary File stream!
          await api.createBranchIngredients(activeBranchId, formData);
        } else {
          await api.createBranchIngredients(activeBranchId, {
            ingredients: [
              {
                name: customForm.name.trim(),
                category: customForm.category.trim(),
                image: customForm.image.trim() || undefined,
                unit: customForm.unit || "KG",
              },
            ],
          });
        }
        const successMsg = "Custom ingredient added to branch inventory.";
        setMessageType("success");
        setMessage(successMsg);
        onToast?.({ message: successMsg, type: "success" });
        removeImage();
        setCustomForm({ name: "", category: "", image: "", unit: "KG" });
      }

      // Instant list API re-fetch & state refresh
      setInventoryPage(1);
      setInventorySearch("");
      await fetchBranchInventory(activeBranchId, 1, inventoryLimit, "");
      refreshKitchenData?.(undefined, undefined, activeBranchId);
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

  // Filtered inventory list
  const activeItemsList = inventoryList.length > 0 ? inventoryList : (apiState?.branchIngredients || []);
  const filteredInventoryList = useMemo(() => {
    let list = activeItemsList;
    if (filterType === "MASTER") {
      list = list.filter((item) => String(item.ingredient?.status || item.status || "").toUpperCase() !== "PENDING");
    } else if (filterType === "CUSTOM") {
      list = list.filter((item) => String(item.ingredient?.status || item.status || "").toUpperCase() === "PENDING");
    }
    return list;
  }, [activeItemsList, filterType]);

  const totalInventoryCount = inventoryMeta?.total ?? activeItemsList.length;
  const customItemsCount = activeItemsList.filter(
    (item) => String(item.ingredient?.status || item.status || "").toUpperCase() === "PENDING"
  ).length;

  return (
    <div className="mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <PageHeader
        badge="Kitchen Inventory"
        activeBadge={`${totalInventoryCount} Active Items`}
        title="Ingredients & Stock"
        subtitle="Manage master ingredients, configure custom recipe items, and record live stock batches for your active kitchen branch."
      />

      {/* 2-Column Responsive SaaS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-6 items-start">

        {/* ========================================================================= */}
        {/* LEFT COLUMN: ADD / ATTACH INGREDIENTS PANEL                              */}
        {/* ========================================================================= */}
        <div className="rounded-[24px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5 lg:sticky lg:top-6">
          {/* Active Target Branch Badge Indicator (Header-synced) */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 shadow-2xs">
            <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shrink-0">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Target Kitchen Branch</span>
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-[#8D0606] border border-rose-100">
                  Active in Header
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {branches.find((b) => String(b.id) === String(activeBranchId))?.name || `Branch Outlet #${activeBranchId || "1"}`}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Master Catalog vs Custom Item */}
          <div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("master");
                  setMessage("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${activeTab === "master"
                    ? "bg-white text-[#8D0606] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Sparkles size={14} />
                <span>Master Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("custom");
                  setMessage("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${activeTab === "custom"
                    ? "bg-white text-[#8D0606] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <PlusCircle size={14} />
                <span>Custom Item</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MASTER CATALOG SEARCH */}
          {activeTab === "master" && !editingInventory && (
            <div className="space-y-4">
              {/* Search input with live dropdown */}
              <div ref={searchContainerRef} className="relative z-30">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Search Master Ingredients
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Type name (Tomato, Onion, Butter)..."
                    value={masterSearchText}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setMasterSearchText(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                  />
                  {isSearchingMaster ? (
                    <div className="absolute right-3 top-3.5">
                      <RefreshCw size={14} className="animate-spin text-[#8D0606]" />
                    </div>
                  ) : masterSearchText ? (
                    <button
                      type="button"
                      onClick={() => setMasterSearchText("")}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <ChevronDown
                      size={15}
                      className={`absolute right-3 top-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  )}
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[70px] z-50 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
                    {isSearchingMaster ? (
                      <div className="py-6 text-center text-xs font-medium text-slate-400">
                        Searching catalog...
                      </div>
                    ) : masterSearchResults.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {masterSearchResults.map((ing) => {
                          const isAlreadyInBranch = inventoryIngredientIds.has(String(ing.id));
                          const isSelected = selectedMasterItems.some(
                            (sel) => String(sel.id) === String(ing.id)
                          );
                          const avatarStyle = getIngredientAvatarStyle(ing.name);

                          return (
                            <div
                              key={ing.id}
                              onClick={() => {
                                if (!isAlreadyInBranch) {
                                  toggleSelectMasterItem(ing);
                                }
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${isSelected
                                  ? "bg-[#fff1f1] border border-rose-200"
                                  : isAlreadyInBranch
                                    ? "bg-slate-50 opacity-50 cursor-not-allowed"
                                    : "hover:bg-slate-50"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {ing.image ? (
                                  <img
                                    src={ing.image}
                                    alt={ing.name}
                                    className="size-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`grid size-8 shrink-0 place-items-center rounded-lg border font-bold text-xs ${avatarStyle.bg}`}
                                  >
                                    {(ing.name || "A").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-800 truncate">{ing.name}</p>
                                  <span className="text-[10px] text-slate-400">{ing.category || "General"}</span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isAlreadyInBranch ? (
                                  <span className="text-[10px] font-bold text-slate-400">Added</span>
                                ) : isSelected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#8D0606] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                    <Check size={10} strokeWidth={3} /> Selected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 hover:border-[#8D0606] hover:text-[#8D0606]">
                                    <Plus size={11} /> Add
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-5 px-3 text-center">
                        <p className="text-xs text-slate-500 mb-2">No matching item found.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomForm((f) => ({ ...f, name: masterSearchText }));
                            setActiveTab("custom");
                            setIsDropdownOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#8D0606] hover:underline"
                        >
                          <PlusCircle size={12} /> Create as Custom Item
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Default Unit Dropdown */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Default Unit
                </label>
                <Select
                  styles={selectStyles(false)}
                  options={unitOptions}
                  value={findOption(unitOptions, defaultMasterUnit)}
                  onChange={(opt) => {
                    const newUnit = opt?.value || "KG";
                    setDefaultMasterUnit(newUnit);
                    setSelectedMasterItems((prev) =>
                      prev.map((item) => ({ ...item, unit: newUnit }))
                    );
                  }}
                  menuPortalTarget={document.body}
                />
              </div>

              {/* Selected Items Tray */}
              {selectedMasterItems.length > 0 && (
                <div className="rounded-2xl border border-rose-100 bg-[#fff9f9] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="grid size-5 place-items-center rounded-full bg-[#8D0606] text-white text-[10px] font-bold">
                        {selectedMasterItems.length}
                      </span>
                      Selected to Attach
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMasterItems([])}
                      className="text-[10.5px] font-bold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {selectedMasterItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={item.unit}
                            onChange={(e) => updateSelectedMasterItemUnit(item.id, e.target.value)}
                            className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-1.5 text-[11px] font-bold text-slate-700 outline-none"
                          >
                            {unitOptions.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeSelectedMasterItem(item.id)}
                            className="grid size-6 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={saving || !activeBranchId}
                    onClick={submitMasterIngredients}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-bold text-white shadow-xs transition hover:from-[#780404] hover:to-[#a10707] active:scale-98 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader variant="button" text="Adding to Branch..." />
                    ) : (
                      <>
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Add {selectedMasterItems.length} to Branch</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM ITEM ENTRY */}
          {(activeTab === "custom" || editingInventory) && (
            <form onSubmit={submitCustomForm} className="space-y-3.5" noValidate>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Item Name <span className="text-rose-600">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="e.g. Special Garam Masala"
                  value={customForm.name}
                  onChange={(e) => {
                    setCustomForm((f) => ({ ...f, name: e.target.value }));
                    setErrors((err) => ({ ...err, name: undefined }));
                  }}
                  className={`h-10 w-full rounded-xl border bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition ${errors.name ? "border-rose-500 bg-rose-50/20" : "border-slate-200 focus:border-[#8D0606]"
                    }`}
                />
                {errors.name && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Category <span className="text-rose-600">*</span>
                </label>
                <CreatableSelect
                  styles={selectStyles(!!errors.category)}
                  options={categoryOptions}
                  value={customForm.category ? { value: customForm.category, label: customForm.category } : null}
                  onChange={(opt) => {
                    setCustomForm((f) => ({ ...f, category: opt?.value || "" }));
                    setErrors((err) => ({ ...err, category: undefined }));
                  }}
                  placeholder="Select or type"
                  menuPortalTarget={document.body}
                />
                {errors.category && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.category}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Unit <span className="text-rose-600">*</span>
                </label>
                <Select
                  styles={selectStyles(!!errors.unit)}
                  options={unitOptions}
                  value={findOption(unitOptions, customForm.unit)}
                  onChange={(opt) =>
                    setCustomForm((f) => ({ ...f, unit: opt?.value || "KG" }))
                  }
                  menuPortalTarget={document.body}
                />
              </div>

              {/* Image Section: Upload File or URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Ingredient Image
                  </label>
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition ${imageInputMode === "upload"
                          ? "bg-white text-[#8D0606] shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition ${imageInputMode === "url"
                          ? "bg-white text-[#8D0606] shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageInputMode === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    {imageFile || (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) ? (
                      <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            className="size-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {imageFile?.name || "Image Selected"}
                            </p>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[11px] font-semibold text-[#8D0606] hover:underline"
                            >
                              Change file
                            </button>
                          </div>
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
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-3 px-4 text-center cursor-pointer hover:border-[#8D0606]/40 hover:bg-rose-50/20 transition"
                      >
                        <div className="grid size-7 place-items-center rounded-lg bg-white border border-slate-200 text-[#8D0606] shadow-2xs">
                          <Upload size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Click to upload image</p>
                          <p className="text-[10px] text-slate-400">Binary file stream (PNG, JPG, WEBP up to 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={customForm.image}
                      onChange={(e) => {
                        setCustomForm((f) => ({ ...f, image: e.target.value }));
                        setImagePreviewUrl(e.target.value);
                      }}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#8D0606]"
                    />
                    {customForm.image ? (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-1.5 border border-slate-200">
                        <img
                          src={customForm.image}
                          alt="Preview"
                          className="size-7 rounded object-cover border border-slate-200 shrink-0"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                        <span className="text-[11px] text-slate-500 truncate flex-1">{customForm.image}</span>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                {editingInventory ? (
                  <button
                    type="button"
                    onClick={cancelEditInventory}
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={saving || !activeBranchId}
                  className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-bold text-white shadow-xs transition hover:from-[#780404] hover:to-[#a10707] active:scale-98 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader variant="button" text="Saving..." />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{editingInventory ? "Update Item" : "Save Custom Item"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {message ? (
            <p
              className={`flex items-center gap-1 text-xs font-semibold ${messageType === "error"
                  ? "text-rose-600"
                  : messageType === "success"
                    ? "text-emerald-600"
                    : "text-[#8D0606]"
                }`}
            >
              {messageType === "error" ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
              <span>{message}</span>
            </p>
          ) : null}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE BRANCH INVENTORY & STOCK CONTROL TABLE                 */}
        {/* ========================================================================= */}
        <div className="rounded-[24px] border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {/* Card Top Toolbar */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search branch ingredients..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                />
                {inventorySearch && (
                  <button
                    type="button"
                    onClick={() => setInventorySearch("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Pills & View Mode */}
              <div className="flex items-center gap-2">
                {/* Filter Pills */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "MASTER", label: "Master" },
                    { id: "CUSTOM", label: "Custom" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterType(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${filterType === f.id
                          ? "bg-[#8D0606] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* View Switcher */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setInventoryViewMode("table")}
                    className={`p-1.5 rounded-lg transition ${inventoryViewMode === "table"
                        ? "bg-white text-[#8D0606] shadow-2xs font-bold"
                        : "text-slate-400 hover:text-slate-700"
                      }`}
                    title="Table View"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryViewMode("grid")}
                    className={`p-1.5 rounded-lg transition ${inventoryViewMode === "grid"
                        ? "bg-white text-[#8D0606] shadow-2xs font-bold"
                        : "text-slate-400 hover:text-slate-700"
                      }`}
                    title="Grid Cards View"
                  >
                    <Grid size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table / Grid Content */}
          {loadingInventory && activeItemsList.length === 0 ? (
            <div className="py-20 text-center">
              <Loader variant="button" text="Loading branch inventory..." />
            </div>
          ) : inventoryViewMode === "table" ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pl-5 pr-3 py-3.5">#</th>
                    <th className="px-4 py-3.5">INGREDIENT</th>
                    <th className="px-4 py-3.5">CATEGORY</th>
                    <th className="px-4 py-3.5">UNIT</th>
                    <th className="px-4 py-3.5">STOCK COUNT</th>
                    <th className="px-4 py-3.5">STATUS</th>
                    <th className="pl-3 pr-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInventoryList.map((item, idx) => {
                    const isCustom =
                      String(item.ingredient?.status || item.status || "").toUpperCase() === "PENDING";
                    const itemName = item.ingredient?.name || item.name || `Ingredient ${idx + 1}`;
                    const itemCategory = item.ingredient?.category || item.category || "General";
                    const itemImg = item.ingredient?.image || item.image;
                    const itemCode = item.ingredientId || item.ingredient?.id || item.id;
                    const matchingStock = stockLookupMap.get(String(itemCode));
                    const { stock: currentStockVal } = extractStockInfo(item, matchingStock);
                    const avatarStyle = getIngredientAvatarStyle(itemName);
                    const itemIndex = (Number(inventoryMeta.page || inventoryPage) - 1) * Number(inventoryMeta.limit || inventoryLimit) + idx + 1;

                    return (
                      <tr
                        key={item.id || item.ingredientId || item.ingredient?.id || idx}
                        className="transition-colors duration-150 hover:bg-rose-50/20"
                      >
                        <td className="pl-5 pr-3 py-3.5 font-mono font-bold text-xs text-slate-500">
                          #{itemIndex}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={itemName}
                                className="size-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div
                                className={`grid size-9 shrink-0 place-items-center rounded-xl border font-bold text-xs shadow-2xs ${avatarStyle.bg}`}
                              >
                                {itemName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-bold text-xs text-slate-800 truncate">
                                {itemName}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {isCustom ? "Custom Item" : "Master Ingredient"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            <FolderTree size={11} className="text-slate-400" />
                            <span>{itemCategory}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 border border-amber-200/60">
                            <Scale size={11} className="text-amber-600" />
                            <span>{item.unit || "ITEM"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs">
                            <Boxes size={13} className="text-amber-600 shrink-0" />
                            <span>{currentStockVal !== undefined && currentStockVal !== null && currentStockVal !== "" ? String(currentStockVal) : "0"}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit || "KG"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${isCustom
                                ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              }`}
                          >
                            <span
                              className={`size-1 rounded-full ${isCustom ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                                }`}
                            />
                            <span>{isCustom ? "CUSTOM" : item.ingredient?.status || item.status || "ACTIVE"}</span>
                          </span>
                        </td>
                        <td className="pl-3 pr-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Update Stock Icon Button */}
                            <button
                              className="grid size-8 place-items-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 transition shadow-2xs active:scale-98 disabled:opacity-50"
                              disabled={saving || stockSaving}
                              onClick={() => openStockModal(item)}
                              type="button"
                              title="Update Stock"
                            >
                              <Boxes size={14} className="text-amber-700" />
                            </button>
                            {isCustom && (
                              <button
                                className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shadow-2xs"
                                disabled={saving || stockSaving}
                                onClick={() => startEditInventory(item)}
                                type="button"
                                title="Edit"
                              >
                                <Pencil size={12.5} />
                              </button>
                            )}
                            {/* Redesigned Delete Button */}
                            <button
                              className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs disabled:opacity-50"
                              disabled={saving || stockSaving}
                              onClick={() => removeInventoryItem(item)}
                              type="button"
                              title="Delete from branch"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredInventoryList.length && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-2 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <UtensilsCrossed size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No branch ingredients found.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Use the catalog search on the left to add items.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Grid Cards View */
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInventoryList.map((item, idx) => {
                  const isCustom =
                    String(item.ingredient?.status || item.status || "").toUpperCase() === "PENDING";
                  const itemName = item.ingredient?.name || item.name || `Ingredient ${idx + 1}`;
                  const itemCategory = item.ingredient?.category || item.category || "General";
                  const itemImg = item.ingredient?.image || item.image;
                  const itemCode = item.ingredientId || item.ingredient?.id || item.id;
                  const matchingStock = stockLookupMap.get(String(itemCode));
                  const { stock: currentStockVal } = extractStockInfo(item, matchingStock);
                  const avatarStyle = getIngredientAvatarStyle(itemName);
                  const itemIndex = (Number(inventoryMeta.page || inventoryPage) - 1) * Number(inventoryMeta.limit || inventoryLimit) + idx + 1;

                  return (
                    <div
                      key={item.id || item.ingredientId || item.ingredient?.id || idx}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={itemName}
                                className="size-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div
                                className={`grid size-10 shrink-0 place-items-center rounded-xl border font-bold text-xs shadow-2xs ${avatarStyle.bg}`}
                              >
                                {itemName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-800 truncate">{itemName}</h4>
                              <span className="text-[10px] font-bold text-slate-400">#{itemIndex}</span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border shrink-0 ${isCustom ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                          >
                            <span>{isCustom ? "CUSTOM" : "ACTIVE"}</span>
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600 truncate max-w-[100px]">
                            {itemCategory}
                          </span>
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-800 border border-amber-200/60">
                            {item.unit || "ITEM"}
                          </span>
                        </div>

                        {/* Stock Count Banner */}
                        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <Boxes size={13} className="text-slate-400" /> Stock Count:
                          </span>
                          <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            {currentStockVal !== undefined && currentStockVal !== null && currentStockVal !== "" ? String(currentStockVal) : "0"} {item.unit || "KG"}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={saving || stockSaving}
                          onClick={() => openStockModal(item)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/90 py-1.5 text-xs font-bold hover:bg-amber-100 transition shadow-2xs active:scale-98"
                        >
                          <Boxes size={12.5} className="text-amber-700" />
                          <span>Update Stock</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => startEditInventory(item)}
                              className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition shadow-2xs"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeInventoryItem(item)}
                            className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                            title="Delete from branch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!filteredInventoryList.length && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-2 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <UtensilsCrossed size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No branch ingredients found.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Use the catalog search on the left to add items.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={inventoryMeta.page || inventoryPage}
            totalItems={inventoryMeta.filtered || inventoryMeta.total || activeItemsList.length}
            pageSize={inventoryMeta.limit || inventoryLimit}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(newLimit) => {
              setInventoryLimit(newLimit);
              setInventoryPage(1);
            }}
            onPageChange={(newPage) => {
              setInventoryPage(newPage);
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: UPDATE STOCK MODAL (PREFILLED & INSTANT API SYNC)                  */}
      {/* ========================================================================= */}
      {stockModalOpen &&
        stockItem &&
        createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-[460px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                    <Boxes size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Update Stock</h3>
                    <p className="text-xs font-medium text-slate-500">
                      {selectedBranch?.name ? `${selectedBranch.name} (Branch #${activeBranchId})` : `Branch #${activeBranchId}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeStockModal}
                  disabled={stockSaving}
                  type="button"
                  className="grid size-8 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Selected Ingredient Info Card */}
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                {stockItem.ingredient?.image || stockItem.image ? (
                  <img
                    src={stockItem.ingredient?.image || stockItem.image}
                    alt={stockItem.ingredient?.name || stockItem.name}
                    className="size-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#8D0606] font-bold text-sm border border-rose-100 shadow-2xs">
                    {(stockItem.ingredient?.name || stockItem.name || "A").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                      {stockItem.ingredient?.name || stockItem.name || `Ingredient #${stockItem.ingredientId || stockItem.id}`}
                    </h4>
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                      #{stockItem.ingredientId || stockItem.ingredient?.id || stockItem.id}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-500">
                      {stockItem.ingredient?.category || stockItem.category || "General"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                      <Scale size={11} /> Unit: {stockItem.unit || "ITEM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Form */}
              <form onSubmit={handleStockSubmit} className="space-y-4" noValidate>
                {/* Stock Quantity Input with Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Stock Quantity <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[10, 50, 100].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = Number(stockValue) || 0;
                            setStockValue(String(cur + inc));
                            setStockError("");
                          }}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition"
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="e.g. 80"
                      value={stockValue}
                      onChange={(e) => {
                        setStockValue(e.target.value);
                        setStockError("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-16 text-sm font-bold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 uppercase">
                      {stockItem.unit || "UNIT"}
                    </span>
                  </div>
                </div>

                {/* Expiry Date Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Expiry Date <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={expireDate}
                      onChange={(e) => {
                        setExpireDate(e.target.value);
                        setStockError("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
                    />
                  </div>
                </div>

                {/* Error Alert */}
                {stockError ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{stockError}</span>
                  </p>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={stockSaving}
                    onClick={closeStockModal}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stockSaving}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-bold text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707] active:scale-98 disabled:opacity-60"
                  >
                    {stockSaving ? (
                      <Loader variant="button" text="Updating..." />
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save Stock</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
