import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  X,
  Boxes,
  UtensilsCrossed,
  Building2,
  TrendingDown,
  Calendar,
  DollarSign,
  PackageX,
  FileText,
  User,
  Clock,
  Filter,
  Flame,
  AlertOctagon,
  Sparkles,
  Layers,
} from "lucide-react";
import { getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";
import { usePermissions } from "../../../utils/permissions";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { AppSelect } from "../../ui/AppSelect";

const REASON_OPTIONS = [
  { value: "ALL", label: "All Reasons" },
  { value: "EXPIRED", label: "Expired Stock" },
  { value: "OVERPRODUCTION", label: "Overproduction / Surplus" },
  { value: "SPOILED", label: "Spoiled" },
  { value: "DAMAGED", label: "Damaged Goods" },
  { value: "SPILLAGE", label: "Spillage / Accident" },
  { value: "OTHER", label: "Other" },
];

export function WasteManagementPage({ apiState, onToast }) {
  const { canCreate, canUpdate, canDelete } = usePermissions(apiState);

  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null); // null = create, object = edit

  // Active Branch ID dynamically resolved
  const activeBranchId = useMemo(() => {
    return resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  }, [apiState?.selectedBranchId, apiState?.branches]);

  // Clear any legacy mock cache on mount
  useEffect(() => {
    try {
      localStorage.removeItem("ck_waste_logs");
    } catch (_) {}
  }, []);

  // Fetch Waste logs from backend API
  const fetchWasteLogs = async (isSilent = false) => {
    if (!activeBranchId) {
      setWasteLogs([]);
      return;
    }
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const token = apiState?.token || getStoredToken();
    const myHeaders = new Headers();
    if (token) myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/kitchen/branch/${activeBranchId}/waste`,
        requestOptions
      );

      const text = await response.text();
      console.log("Waste listing response:", text);

      if (response.ok) {
        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error("Failed to parse waste JSON:", e);
        }

        const list = Array.isArray(parsed?.data)
          ? parsed.data
          : Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.wasteLogs)
          ? parsed.wasteLogs
          : Array.isArray(parsed?.wastes)
          ? parsed.wastes
          : [];

        setWasteLogs(list || []);
      } else {
        setWasteLogs([]);
      }
    } catch (error) {
      console.warn("Waste API error:", error);
      setWasteLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWasteLogs();
  }, [apiState?.token, activeBranchId]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return wasteLogs.filter((log) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const itemStr = (log.itemName || log.inventoryItem?.name || log.ingredient?.name || "").toLowerCase();
        const reasonStr = (log.reason || "").toLowerCase();
        const notesStr = (log.notes || "").toLowerCase();
        const idStr = String(log.id || "");
        const invIdStr = String(log.inventoryItemId || "");
        const stockIdStr = String(log.stockId || "");
        if (
          !itemStr.includes(q) &&
          !reasonStr.includes(q) &&
          !notesStr.includes(q) &&
          !idStr.includes(q) &&
          !invIdStr.includes(q) &&
          !stockIdStr.includes(q)
        ) {
          return false;
        }
      }

      // Reason Filter
      if (reasonFilter !== "ALL" && log.reason !== reasonFilter) {
        return false;
      }

      return true;
    });
  }, [wasteLogs, searchQuery, reasonFilter]);

  // Paginated records
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCost = wasteLogs.reduce((sum, item) => {
      const q = Number(item.quantityWasted || item.quantity || 0);
      const c = Number(item.unitCost || item.cost || 0);
      return sum + (q * c > 0 ? q * c : c > 0 ? c : 0);
    }, 0);

    const totalQty = wasteLogs.reduce((sum, item) => {
      return sum + Number(item.quantityWasted || item.quantity || 0);
    }, 0);

    const totalCount = wasteLogs.length;

    // Reason frequency
    const reasonCounts = {};
    wasteLogs.forEach((item) => {
      const r = item.reason || "OTHER";
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });

    let topReason = "None";
    let maxCount = 0;
    Object.entries(reasonCounts).forEach(([r, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topReason = r.replace(/_/g, " ");
      }
    });

    return {
      totalCost,
      totalCount,
      totalQty,
      topReason,
    };
  }, [wasteLogs]);

  // Helper for Reason Badges
  const getReasonBadge = (reason) => {
    switch (reason) {
      case "EXPIRED":
        return {
          label: "Expired",
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          dot: "bg-rose-500",
        };
      case "OVERPRODUCTION":
        return {
          label: "Overproduction",
          bg: "bg-blue-50 border-blue-200 text-blue-700",
          dot: "bg-blue-500",
        };
      case "SPOILED":
        return {
          label: "Spoiled",
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          dot: "bg-amber-500",
        };
      case "DAMAGED":
        return {
          label: "Damaged",
          bg: "bg-purple-50 border-purple-200 text-purple-700",
          dot: "bg-purple-500",
        };
      case "SPILLAGE":
        return {
          label: "Spillage",
          bg: "bg-orange-50 border-orange-200 text-orange-700",
          dot: "bg-orange-500",
        };
      case "OTHER":
      default:
        return {
          label: reason?.replace(/_/g, " ") || "Other",
          bg: "bg-slate-100 border-slate-200 text-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <PageHeader
        badge="Loss Control & Audit"
        activeBadge={`${wasteLogs.length} Recorded Losses`}
        title="Waste Management"
        subtitle="Record food waste, expired inventory items, and discarded batches to audit and minimize kitchen cost loss."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchWasteLogs(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>

            {canCreate("wasteManagement") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLog(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-full bg-[#8D0606] px-4 sm:px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Create Waste Entry</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search waste records by item name, reason, or batch ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:bg-white focus:ring-2 focus:ring-[#8D0606]/10"
            />
          </div>

          {/* Reason Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-48">
              <AppSelect
                value={reasonFilter}
                onChange={(val) => {
                  setReasonFilter(val);
                  setCurrentPage(1);
                }}
                options={REASON_OPTIONS}
              />
            </div>

            {(searchQuery || reasonFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setReasonFilter("ALL");
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                <th className="pl-6 pr-3 py-3.5">#</th>
                <th className="px-4 py-3.5">Inventory Item</th>
                <th className="px-4 py-3.5">Stock Batch</th>
                <th className="px-4 py-3.5">Quantity Wasted</th>
                <th className="px-4 py-3.5">Unit Cost (₹)</th>
                <th className="px-4 py-3.5">Total Loss (₹)</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-6 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Loader variant="page" text="Loading waste records..." />
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606]">
                      <Trash2 size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No waste entries recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || reasonFilter !== "ALL"
                        ? "Try resetting your search filters."
                        : "Click 'Create Waste Entry' to discard expired or wasted stock."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1;
                  const reasonBadge = getReasonBadge(log.reason);
                  const itemName =
                    log.itemName ||
                    log.inventoryItem?.name ||
                    log.ingredient?.name ||
                    `Item #${log.inventoryItemId || log.id}`;
                  const qty = Number(log.quantityWasted || log.quantity || 0);
                  const unitPrice = Number(log.unitCost || log.cost || 0);
                  const totalLoss = qty * unitPrice > 0 ? qty * unitPrice : unitPrice;

                  return (
                    <tr key={log.id} className="transition duration-150 hover:bg-slate-50/80">
                      {/* Index */}
                      <td className="pl-6 pr-3 py-4 font-bold text-xs text-[#8D0606] whitespace-nowrap">
                        #{itemIndex}
                      </td>

                      {/* Inventory Item */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100 font-bold text-xs shadow-2xs">
                            <Boxes size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                              {itemName}
                            </p>
                            <span className="text-[10.5px] font-mono text-slate-400 font-semibold block">
                              Item ID: #{log.inventoryItemId || log.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stock Batch */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                          <Layers size={13} className="text-slate-400 shrink-0" />
                          <span>Stock #{log.stockId || "—"}</span>
                        </span>
                      </td>

                      {/* Quantity Wasted */}
                      <td className="px-4 py-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                        {qty} <span className="text-[11px] text-slate-400 font-semibold uppercase">{log.unit || "units"}</span>
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-4 font-semibold text-slate-700 whitespace-nowrap">
                        ₹{unitPrice.toLocaleString()}
                      </td>

                      {/* Total Loss */}
                      <td className="px-4 py-4 font-black text-rose-700 text-sm whitespace-nowrap">
                        ₹{totalLoss.toLocaleString()}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${reasonBadge.bg}`}
                        >
                          <span className={`size-1.5 rounded-full ${reasonBadge.dot}`} />
                          <span>{reasonBadge.label}</span>
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-4 text-xs text-slate-600 max-w-[200px] truncate" title={log.notes}>
                        {log.notes || "—"}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-right text-[11px] text-slate-500 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLogs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <WasteCreateModal
          branchId={activeBranchId}
          apiState={apiState}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLog(null);
          }}
          onSuccess={() => {
            fetchWasteLogs(true);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Waste Modal Component
// ---------------------------------------------------------------------------
function WasteCreateModal({ branchId, apiState, onClose, onSuccess, onToast }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original || "unset";
    };
  }, []);

  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [apiError, setApiError] = useState("");

  // Form State matching exact POST payload:
  // { inventoryItemId, stockId, quantityWasted, unitCost, reason, notes }
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [stockId, setStockId] = useState("");
  const [quantityWasted, setQuantityWasted] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch branch ingredients (including expired query)
  useEffect(() => {
    const fetchBranchIngredients = async () => {
      setLoadingIngredients(true);
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      try {
        // Fetch expired ingredients
        const res = await fetch(
          `${getApiBaseUrl()}/kitchen/branch/${branchId}/ingredient?isExpired=true`,
          requestOptions
        );
        const text = await res.text();
        console.log("Branch ingredients (isExpired=true) response:", text);

        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (_) {}

        let rawList = Array.isArray(parsed?.data)
          ? parsed.data
          : Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.ingredients)
          ? parsed.ingredients
          : [];

      
        // Normalize ingredients array to support item.ingredient, item.stock, item.stocks, etc.
        const list = (rawList && rawList.length > 0 ? rawList : []).map((item) => {
          const rawBatches = Array.isArray(item.stock)
            ? item.stock
            : Array.isArray(item.stocks)
            ? item.stocks
            : Array.isArray(item.batches)
            ? item.batches
            : [];

          const batches = rawBatches.map((b) => ({
            id: b.id,
            quantity: Number(b.quantity ?? b.stock ?? b.currentStock ?? 0),
            stock: Number(b.quantity ?? b.stock ?? b.currentStock ?? 0),
            expiryDate: b.expiryDate || b.expireAt || b.expiry_date || "",
            expireAt: b.expiryDate || b.expireAt || b.expiry_date || "",
            batchNumber: b.batchNumber || b.batchNo || null,
            unitCost: Number(b.unitCost || b.cost || b.price || item.cost || item.unitCost || 0),
          }));

          // If no inner batches array but item has stock / expiry info directly
          if (batches.length === 0 && (item.expiryDate || item.expireAt || item.currentStock !== undefined || item.stock !== undefined)) {
            batches.push({
              id: item.stockId || item.id,
              quantity: Number(item.currentStock ?? item.stock ?? item.quantity ?? 0),
              stock: Number(item.currentStock ?? item.stock ?? item.quantity ?? 0),
              expiryDate: item.expiryDate || item.expireAt || "",
              expireAt: item.expiryDate || item.expireAt || "",
              batchNumber: item.batchNumber || null,
              unitCost: Number(item.unitCost || item.cost || 0),
            });
          }

          const name =
            item.ingredient?.name ||
            item.name ||
            item.ingredientName ||
            item.title ||
            (item.ingredientId ? `Ingredient #${item.ingredientId}` : `Item #${item.id}`);

          const category =
            item.ingredient?.category ||
            item.category ||
            item.ingredientCategory ||
            "General";

          const unit = item.unit || item.ingredient?.unit || "KG";
          const currentStock = Number(item.currentStock ?? item.stock ?? item.quantity ?? 0);
          const hasExpiredBatches = batches.some((b) => {
            const exp = b.expiryDate || b.expireAt;
            return exp && new Date(exp) < new Date();
          });

          return {
            id: item.id,
            ingredientId: item.ingredientId || item.ingredient?.id,
            name,
            category,
            unit,
            currentStock,
            stocks: batches,
            hasExpiredBatches,
          };
        });

        console.log("Normalized isExpired ingredients list for dropdown:", list);
        setIngredients(list || []);
      } catch (err) {
        console.warn("Failed to fetch branch ingredients:", err);
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchBranchIngredients();
  }, [branchId, apiState?.token]);

  // Selected Ingredient & Stocks
  const selectedIngredient = useMemo(() => {
    return ingredients.find((i) => String(i.id) === String(inventoryItemId));
  }, [ingredients, inventoryItemId]);

  const availableStocks = useMemo(() => {
    if (!selectedIngredient) return [];
    if (Array.isArray(selectedIngredient.stocks) && selectedIngredient.stocks.length > 0) {
      return selectedIngredient.stocks;
    }
    return [];
  }, [selectedIngredient]);

  // When ingredient selection changes
  const handleIngredientChange = (newInvId) => {
    setInventoryItemId(newInvId);
    setStockId("");
    setQuantityWasted("");
    setUnitCost("");
    if (apiError) setApiError("");
  };

  // When stock batch selection changes
  const handleStockChange = (newStockId) => {
    setStockId(newStockId);
    if (apiError) setApiError("");
    const foundStock = availableStocks.find((s) => String(s.id) === String(newStockId));
    if (foundStock && foundStock.unitCost !== undefined && foundStock.unitCost !== null) {
      setUnitCost(String(foundStock.unitCost));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inventoryItemId) {
      onToast?.({ message: "Please select an inventory item.", type: "error" });
      return;
    }
    if (!stockId) {
      onToast?.({ message: "Please select a stock batch.", type: "error" });
      return;
    }
    if (!quantityWasted || Number(quantityWasted) <= 0) {
      onToast?.({ message: "Please enter a valid quantity wasted greater than 0.", type: "error" });
      return;
    }
    if (!reason) {
      onToast?.({ message: "Please select a waste reason.", type: "error" });
      return;
    }

    setSaving(true);
    setApiError("");

    const payload = {
      inventoryItemId: Number(inventoryItemId),
      stockId: Number(stockId),
      quantityWasted: Number(quantityWasted),
      unitCost: Number(unitCost || 0),
      reason: reason || "EXPIRED",
      notes: notes || "",
    };

    try {
      const token = apiState?.token || getStoredToken();
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      if (token) myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(payload),
        redirect: "follow",
      };

      const response = await fetch(
        `${getApiBaseUrl()}/kitchen/branch/${branchId}/waste`,
        requestOptions
      );

      const resultText = await response.text();
      console.log("Waste create response:", resultText);

      let parsed = null;
      try {
        parsed = resultText ? JSON.parse(resultText) : null;
      } catch (_) {}

      if (!response.ok || (parsed && parsed.status === false)) {
        throw new Error(parsed?.message || `Failed to create waste record (${response.status})`);
      }

      onToast?.({ message: "Waste entry created successfully!", type: "success" });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Waste create error:", error);
      const msg = getApiErrorMessage(error, "Failed to create waste record");
      setApiError(msg);
      onToast?.({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const totalCalculatedLoss = (Number(quantityWasted) || 0) * (Number(unitCost) || 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xs flex min-h-screen items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Kitchen Waste</h3>
              <p className="text-xs text-slate-400 font-medium">
                Log discarded ingredients and expired stock batches
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Inline API Error Alert Banner */}
          {apiError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Inventory Item Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Inventory Item <span className="text-rose-600">*</span>
            </label>
            {loadingIngredients ? (
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse flex items-center px-3 text-xs text-slate-400">
                Loading available ingredients...
              </div>
            ) : (
              <AppSelect
                value={inventoryItemId}
                onChange={handleIngredientChange}
                options={[
                  { value: "", label: "Select inventory item..." },
                  ...ingredients.map((item) => ({
                    value: String(item.id),
                    label: `${item.name}${item.category ? ` (${item.category})` : ""} — ${item.currentStock || 0} ${item.unit} in stock${item.hasExpiredBatches ? " ⚠️ [Expired Batches]" : ""}`,
                  })),
                ]}
              />
            )}
          </div>

          {/* Stock Batch Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Stock Batch (Batch ID) <span className="text-rose-600">*</span>
              </label>
              {availableStocks.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400">
                  {availableStocks.length} batch{availableStocks.length > 1 ? "es" : ""} available
                </span>
              )}
            </div>
            <AppSelect
              value={stockId}
              onChange={handleStockChange}
              options={[
                {
                  value: "",
                  label: selectedIngredient
                    ? availableStocks.length
                      ? "Select stock batch..."
                      : "No stock batches found for this item"
                    : "Select an inventory item first...",
                },
                ...availableStocks.map((s) => {
                  const expDate = s.expiryDate || s.expireAt;
                  const expStr = expDate ? new Date(expDate).toLocaleDateString() : "No Exp Date";
                  const isExpired = expDate && new Date(expDate) < new Date();
                  const batchNumStr = s.batchNumber ? `Batch #${s.batchNumber} (ID: ${s.id})` : `Batch #${s.id}`;
                  const qty = s.quantity ?? s.stock ?? 0;

                  return {
                    value: String(s.id),
                    label: `${batchNumStr} — Available: ${qty} ${selectedIngredient?.unit || ""} (Exp: ${expStr})${isExpired ? " [EXPIRED]" : ""}`,
                  };
                }),
              ]}
            />
          </div>

          {/* Selected Item Info Card */}
          {selectedIngredient && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-rose-50 text-[#8D0606] font-bold text-[11px] border border-rose-100">
                  <Boxes size={14} />
                </div>
                <div>
                  <span className="font-bold text-slate-800">{selectedIngredient.name}</span>
                  <span className="text-slate-400 font-mono text-[10px] ml-1.5">#{selectedIngredient.id}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">Total Stock: {selectedIngredient.currentStock} {selectedIngredient.unit}</span>
              </div>
            </div>
          )}

          {/* Quantity Wasted & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Quantity Wasted <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="Enter quantity wasted (e.g. 10)"
                value={quantityWasted}
                onChange={(e) => {
                  setQuantityWasted(e.target.value);
                  if (apiError) setApiError("");
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Unit Cost (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="Enter unit cost in ₹ (e.g. 40)"
                value={unitCost}
                onChange={(e) => {
                  setUnitCost(e.target.value);
                  if (apiError) setApiError("");
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
              />
            </div>
          </div>

          {/* Waste Reason */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Waste Reason <span className="text-rose-600">*</span>
            </label>
            <AppSelect
              value={reason}
              onChange={(val) => {
                setReason(val);
                if (apiError) setApiError("");
              }}
              options={[
                { value: "", label: "Select waste reason..." },
                { value: "EXPIRED", label: "EXPIRED (Passed Expiry Date)" },
                { value: "OVERPRODUCTION", label: "OVERPRODUCTION (Surplus / Batch Overcooked)" },
                { value: "SPOILED", label: "SPOILED (Quality Deterioration)" },
                { value: "DAMAGED", label: "DAMAGED (Package / Storage Damage)" },
                { value: "SPILLAGE", label: "SPILLAGE (Spill / Dropped / Accident)" },
                { value: "OTHER", label: "OTHER (Other Reason)" },
              ]}
            />
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Remarks / Loss Description
            </label>
            <textarea
              rows={2}
              placeholder="Enter remarks or reason for waste (e.g. Batch expired, discarded)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
            />
          </div>

          {/* Total Loss Indicator Banner */}
          {totalCalculatedLoss > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs">
              <span className="font-semibold text-slate-600">Total Calculated Monetary Loss:</span>
              <span className="font-black text-[#8D0606] text-sm">₹{totalCalculatedLoss.toLocaleString()}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#7a0505] active:scale-98 disabled:opacity-60"
            >
              {saving ? (
                <Loader variant="button" text="Recording..." />
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Log Waste Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
