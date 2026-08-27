import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ShoppingBag,
  Plus,
  Search,
  RefreshCw,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Eye,
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  Trash2,
  PackageCheck,
  CreditCard,
  PlusCircle,
  Minus,
  ChefHat,
  Truck,
  CheckCheck,
  Ban,
  Check,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../../api";
import { Card } from "../../ui/Card";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { AppSelect } from "../../ui/AppSelect";
import { resolveSelectedBranchId, setStoredSelectedBranchId } from "../../../utils/helpers";
import { usePermissions } from "../../../utils/permissions";

const ORDER_STATUS_CONFIG = {
  PLACED: {
    label: "Placed",
    badge: "border-blue-200 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
    icon: ShoppingBag,
  },
  PREPARING: {
    label: "Preparing",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500 animate-pulse",
    icon: ChefHat,
  },
  COMPLETED: {
    label: "Completed",
    badge: "border-teal-200 bg-teal-50 text-teal-800",
    dot: "bg-teal-500",
    icon: CheckCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    icon: Ban,
  },
};

const ORDER_STATUS_LIST = [
  "PLACED",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
];

export function OrderListPage({ apiState, refreshKitchenData, onToast }) {
  const { canCreate, canUpdate } = usePermissions(apiState);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalServerItems, setTotalServerItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const activeBranchId = useMemo(() => {
    return resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  }, [apiState?.selectedBranchId, apiState?.branches]);

  // Fetch orders from API with server pagination
  const fetchOrders = async (isSilent = false) => {
    if (!activeBranchId) {
      setLoading(false);
      setRefreshing(false);
      setOrders([]);
      return;
    }
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.orders(activeBranchId, {
        page: currentPage,
        limit: pageSize,
      });
      const ordersData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setOrders(ordersData);
      if (res?.meta?.total !== undefined) {
        setTotalServerItems(res.meta.total);
      } else {
        setTotalServerItems(ordersData.length);
      }
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to load orders");
      onToast?.({ message: msg, type: "error" });
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Status update handler (single or bulk)
  const handleUpdateStatus = async (orderIds, newStatus) => {
    if (!activeBranchId || !orderIds?.length) return;
    const isSingle = orderIds.length === 1;
    if (isSingle) setStatusUpdatingId(orderIds[0]);
    else setIsBulkUpdating(true);

    try {
      await api.updateOrderStatus(activeBranchId, {
        orderIds: orderIds,
        status: newStatus,
      });
      onToast?.({
        message: isSingle
          ? `Order #${orderIds[0]} status updated to ${newStatus}`
          : `${orderIds.length} orders updated to ${newStatus}`,
        type: "success",
      });

      // Update in-memory orders list
      setOrders((prev) =>
        prev.map((o) =>
          orderIds.includes(o.id) ? { ...o, status: newStatus } : o
        )
      );

      // Update active detail modal if currently viewing this order
      if (selectedOrderDetail && orderIds.includes(selectedOrderDetail.id)) {
        setSelectedOrderDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Clear bulk selections
      if (!isSingle) {
        setSelectedOrderIds([]);
      }
    } catch (error) {
      const msg = getApiErrorMessage(error, "Failed to update order status");
      onToast?.({ message: msg, type: "error" });
    } finally {
      setStatusUpdatingId(null);
      setIsBulkUpdating(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeBranchId, currentPage, pageSize, apiState?.token]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "ALL") {
        const st = (order?.status || "PLACED").toUpperCase();
        if (st !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idStr = String(order?.id || "").toLowerCase();
        const customerName = `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.toLowerCase();
        const phone = (order?.customer?.addresses?.[0]?.phoneNumber || "").toLowerCase();
        const address = (order?.customer?.addresses?.[0]?.address1 || "").toLowerCase();
        const itemNames = (order?.items || [])
          .map((i) => i?.menuItem?.name || "")
          .join(" ")
          .toLowerCase();

        return (
          idStr.includes(q) ||
          customerName.includes(q) ||
          phone.includes(q) ||
          address.includes(q) ||
          itemNames.includes(q)
        );
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const displayTotalItems = useMemo(() => {
    if (searchQuery.trim() || statusFilter !== "ALL") {
      return filteredOrders.length;
    }
    return totalServerItems || orders.length;
  }, [searchQuery, statusFilter, filteredOrders.length, totalServerItems, orders.length]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const placedCount = orders.filter((o) => (o?.status || "PLACED").toUpperCase() === "PLACED").length;
    const totalRev = orders.reduce((sum, o) => sum + (Number(o?.totalAmount) || 0), 0);
    const avgValue = totalCount > 0 ? totalRev / totalCount : 0;

    return {
      total: totalCount,
      placed: placedCount,
      revenue: totalRev,
      avg: avgValue,
    };
  }, [orders]);

  return (
    <div className="mx-auto  space-y-6 pb-12">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge="Kitchen Orders Feed"
        activeBadge={`${orders.length} Total Orders`}
        title="Order Management"
        subtitle="Track live kitchen branch orders, customer invoices, and create new manual orders."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {apiState?.branches?.length > 1 && (
              <AppSelect
                value={String(activeBranchId)}
                onChange={async (val) => {
                  if (val) {
                    setStoredSelectedBranchId(String(val));
                    await refreshKitchenData?.(undefined, undefined, String(val));
                  }
                }}
                minWidth="160px"
                options={apiState.branches.map((b) => ({
                  value: String(b.id),
                  label: b.name || `Branch #${b.id}`,
                }))}
                formatOptionLabel={(option) => (
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-[#8D0606] shrink-0" />
                    <span className="truncate">{option.label}</span>
                  </div>
                )}
              />
            )}

            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
              <span>Refresh</span>
            </button>

            {canCreate("order") && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Create New Order</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search orders by Order ID, customer, phone, or dish..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#8D0606] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8D0606]/10 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", ...ORDER_STATUS_LIST].map((st) => {
            const isSelected = statusFilter === st;
            const count =
              st === "ALL"
                ? orders.length
                : orders.filter((o) => (o?.status || "PLACED").toUpperCase() === st).length;

            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#8D0606] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{st === "ALL" ? "All Orders" : ORDER_STATUS_CONFIG[st]?.label || st}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table Listing */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-20">
            <Loader variant="page" text="Fetching branch orders from server..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {canUpdate("order") && (
                    <th className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredOrders.length > 0 &&
                          filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredOrders.map((o) => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="size-4 rounded border-slate-300 text-[#8D0606] focus:ring-[#8D0606]"
                      />
                    </th>
                  )}
                  <th className="px-5 py-4"># & Source</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Ordered Items</th>
                  <th className="px-5 py-4">Delivery Address</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Order Status</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOrders.map((order, idx) => {
                  const orderIndex = (currentPage - 1) * pageSize + idx + 1;
                  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Walk-in Customer";
                  const phone = order.customer?.addresses?.[0]?.phoneNumber || "—";
                  const address = order.customer?.addresses?.[0]?.address1 || "Pickup / Counter";
                  const pincode = order.customer?.addresses?.[0]?.pincode || "";
                  const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
                  const firstItem = order.items?.[0]?.menuItem?.name || "Dish Item";
                  const status = (order.status || "PLACED").toUpperCase();
                  const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PLACED;
                  const total = Number(order.totalAmount) || 0;
                  const isUpdatingThis = statusUpdatingId === order.id;
                  const isSelected = selectedOrderIds.includes(order.id);
                  const formattedDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr
                      key={order.id || idx}
                      onClick={() => setSelectedOrderDetail({ ...order, displayIndex: orderIndex })}
                      className={`transition cursor-pointer ${
                        isSelected ? "bg-rose-50/40" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox Column */}
                      {canUpdate("order") && (
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds((prev) => [...prev, order.id]);
                              } else {
                                setSelectedOrderIds((prev) => prev.filter((id) => id !== order.id));
                              }
                            }}
                            className="size-4 rounded border-slate-300 text-[#8D0606] focus:ring-[#8D0606]"
                          />
                        </td>
                      )}

                      {/* Index & Source */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#8D0606] text-sm">
                            #{orderIndex}
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                            {order.source || "MANUAL"}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                            {customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[140px]">
                              {customerName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">{phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <p className="font-bold text-slate-800 truncate">
                            {firstItem}
                            {order.items?.length > 1 && (
                              <span className="text-[#8D0606] font-normal ml-1">
                                +{order.items.length - 1} more
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {itemsCount} item(s) total
                          </span>
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-[220px]">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={`${address} ${pincode}`}>
                            {address} {pincode ? `(${pincode})` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-sm text-slate-900">
                          ₹{total.toFixed(2)}
                        </span>
                      </td>

                      {/* Status Column with Quick Status Dropdown */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {canUpdate("order") ? (
                          <div className="relative inline-block">
                            <select
                              value={status}
                              disabled={isUpdatingThis}
                              onChange={(e) => handleUpdateStatus([order.id], e.target.value)}
                              className={`appearance-none cursor-pointer rounded-full pl-3 pr-7 py-1 text-[11px] font-bold border transition outline-none focus:ring-2 focus:ring-[#8D0606]/20 ${
                                statusConfig.badge
                              } ${isUpdatingThis ? "opacity-60 pointer-events-none" : ""}`}
                            >
                              {ORDER_STATUS_LIST.map((st) => (
                                <option key={st} value={st} className="bg-white text-slate-800 font-semibold">
                                  {ORDER_STATUS_CONFIG[st]?.label || st}
                                </option>
                              ))}
                            </select>
                            {isUpdatingThis ? (
                              <RefreshCw size={11} className="absolute right-2.5 top-2 animate-spin text-[#8D0606] pointer-events-none" />
                            ) : (
                              <span className="absolute right-2.5 top-2 pointer-events-none text-current opacity-60 text-[9px]">▼</span>
                            )}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusConfig.badge}`}>
                            <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                            <span>{statusConfig.label || status}</span>
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderDetail({ ...order, displayIndex: orderIndex });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#8D0606] hover:text-[#8D0606] transition shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {!filteredOrders.length && (
              <div className="flex flex-col items-center justify-center p-14 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No orders found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Try adjusting your search criteria or status filter."
                    : "Create your first order for this kitchen branch."}
                </p>
                {canCreate("order") && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a0505]"
                  >
                    <Plus size={15} />
                    <span>Create New Order</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pagination Footer */}
        {displayTotalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={displayTotalItems}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedOrderIds.length > 0 && canUpdate("order") && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="grid size-6 place-items-center rounded-lg bg-[#8D0606] text-xs font-black text-white">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-semibold whitespace-nowrap">Orders Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Change to:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ORDER_STATUS_LIST.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={isBulkUpdating}
                  onClick={() => handleUpdateStatus(selectedOrderIds, st)}
                  className="rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-[#8D0606] hover:text-white transition disabled:opacity-50"
                >
                  {ORDER_STATUS_CONFIG[st]?.label || st}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedOrderIds([])}
            className="ml-2 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/20 transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <CreateOrderModal
          branchId={activeBranchId}
          branches={apiState?.branches || []}
          menus={apiState?.menus || []}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchOrders(true);
            onToast?.({ message: "Order placed successfully!", type: "success" });
          }}
          onToast={onToast}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderDetail && (
        <OrderDetailModal
          branchId={activeBranchId}
          order={selectedOrderDetail}
          canUpdate={canUpdate("order")}
          onStatusUpdate={(newStatus) => handleUpdateStatus([selectedOrderDetail.id], newStatus)}
          onClose={() => setSelectedOrderDetail(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Order Modal (Portal-mounted onto document.body)
// ---------------------------------------------------------------------------
function CreateOrderModal({ branchId, branches, menus, onClose, onSuccess, onToast }) {
  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const initialBranchId = branchId || branches?.[0]?.id || "";
  const [selectedBranch, setSelectedBranch] = useState(initialBranchId);
  const targetBranchId = selectedBranch || initialBranchId;
  const [menuList, setMenuList] = useState(menus || []);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
  });

  const [billingAddress, setBillingAddress] = useState({
    address1: "123 MG Road",
    countryId: 101,
    stateId: 4007,
    cityId: 57675,
    pincode: "201301",
    phoneNumber: "",
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    address1: "123 MG Road",
    countryId: 101,
    stateId: 4007,
    cityId: 57675,
    pincode: "201301",
    phoneNumber: "",
  });

  // Selected Order Items
  const [orderItems, setOrderItems] = useState(() => {
    if (menus && menus.length > 0) {
      return [{ menuItemId: menus[0].id, quantity: 1, price: Number(menus[0].price) || 0, name: menus[0].name }];
    }
    return [];
  });

  // Fetch branch menus if not passed
  useEffect(() => {
    if (menus && menus.length > 0) {
      setMenuList(menus);
      if (orderItems.length === 0) {
        setOrderItems([{ menuItemId: menus[0].id, quantity: 1, price: Number(menus[0].price) || 0, name: menus[0].name }]);
      }
    } else if (targetBranchId) {
      setLoadingMenus(true);
      api.menus(targetBranchId)
        .then((res) => {
          const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          setMenuList(items);
          if (items.length > 0 && orderItems.length === 0) {
            setOrderItems([{ menuItemId: items[0].id, quantity: 1, price: Number(items[0].price) || 0, name: items[0].name }]);
          }
        })
        .catch(console.error)
    }
  }, [menus, targetBranchId]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  // Add Item to order
  const addItem = () => {
    if (apiError) setApiError("");
    const list = menuList.length > 0 ? menuList : menus;
    if (!list.length) return;
    const defaultId = list[0]?.id;
    const defaultPrice = Number(list[0]?.price) || 0;
    const defaultName = list[0]?.name || "Menu Item";
    setOrderItems((prev) => [...prev, { menuItemId: defaultId, quantity: 1, price: defaultPrice, name: defaultName }]);
  };

  // Remove Item
  const removeItem = (index) => {
    if (apiError) setApiError("");
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index, field, value) => {
    if (apiError) setApiError("");
    const list = menuList.length > 0 ? menuList : menus;
    setOrderItems((prev) => {
      const next = [...prev];
      if (field === "menuItemId") {
        const found = list.find((m) => String(m.id) === String(value));
        next[index] = {
          ...next[index],
          menuItemId: Number(value),
          name: found?.name || `Item #${value}`,
          price: Number(found?.price) || next[index].price || 299,
        };
      } else if (field === "quantity") {
        next[index] = { ...next[index], quantity: Math.max(1, Number(value) || 1) };
      }
      return next;
    });
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const validate = () => {
    const errs = {};
    if (!customer.firstName.trim()) errs.firstName = "First name is required";
    if (!customer.lastName.trim()) errs.lastName = "Last name is required";
    if (!billingAddress.address1.trim()) errs.billingAddress1 = "Billing address is required";
    if (!billingAddress.phoneNumber.trim()) {
      errs.billingPhone = "Phone number is required";
    } else if (!/^\d{7,15}$/.test(billingAddress.phoneNumber.replace(/[\s+-]/g, ""))) {
      errs.billingPhone = "Valid phone number required";
    }
    if (!sameAsBilling) {
      if (!shippingAddress.address1.trim()) errs.shippingAddress1 = "Shipping address is required";
      if (!shippingAddress.phoneNumber.trim()) errs.shippingPhone = "Phone number is required";
    }
    if (orderItems.length === 0) errs.items = "Add at least one menu item";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      onToast?.({ message: "Please fill out required fields.", type: "warning" });
      return;
    }

    setSubmitting(true);
    setApiError("");
    try {
      const shipAddr = sameAsBilling ? billingAddress : shippingAddress;

      const payload = {
        items: orderItems.map((item) => ({
          menuItemId: Number(item.menuItemId),
          quantity: Number(item.quantity),
        })),
        customer: {
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          gender: customer.gender,
        },
        billingAddress: {
          address1: billingAddress.address1.trim(),
          countryId: Number(billingAddress.countryId) || 101,
          stateId: Number(billingAddress.stateId) || 4007,
          cityId: Number(billingAddress.cityId) || 57675,
          pincode: String(billingAddress.pincode || "201301"),
          phoneNumber: String(billingAddress.phoneNumber.trim()),
        },
        shippingAddress: {
          address1: shipAddr.address1.trim(),
          countryId: Number(shipAddr.countryId) || 101,
          stateId: Number(shipAddr.stateId) || 4007,
          cityId: Number(shipAddr.cityId) || 57675,
          pincode: String(shipAddr.pincode || "201301"),
          phoneNumber: String(shipAddr.phoneNumber.trim()),
        },
      };

      await api.createOrder(targetBranchId, payload);
      onSuccess();
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Failed to create order");
      setApiError(errMsg);
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-xs shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Create New Kitchen Order</h3>
              <p className="text-[11.5px] sm:text-xs font-medium text-slate-500 truncate">
                Enter customer details, select dishes, and generate invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Inline API Error Alert Banner */}
            {apiError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Active Kitchen Branch Indicator */}
            <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs">
                  <Building2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Kitchen Branch
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {branches.find((b) => String(b.id) === String(branchId))?.name || `Branch Outlet #${branchId || "1"}`}
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#8D0606] border border-rose-100 whitespace-nowrap shrink-0">
                Active
              </span>
            </div>

            {/* Customer Details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-[#8D0606]" />
                <span>Customer Information</span>
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">First Name *</label>
                  <input
                    type="text"
                    placeholder="Enter customer first name (e.g. Rahul)"
                    value={customer.firstName}
                    onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                  {errors.firstName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Last Name *</label>
                  <input
                    type="text"
                    placeholder="Enter customer last name (e.g. Sharma)"
                    value={customer.lastName}
                    onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                  {errors.lastName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Gender</label>
                  <AppSelect
                    variant="filter"
                    value={customer.gender}
                    onChange={(val) => setCustomer({ ...customer, gender: val })}
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Menu Items Selector */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Receipt size={14} className="text-[#8D0606]" />
                  <span>Purchased Menu Items</span>
                </h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#8D0606] hover:bg-rose-100"
                >
                  <Plus size={13} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 border border-slate-200 shadow-2xs">
                    <div className="flex-1">
                      <AppSelect
                        variant="filter"
                        value={item.menuItemId}
                        onChange={(val) => updateItem(idx, "menuItemId", val)}
                        options={
                          menuList.length > 0
                            ? menuList.map((m) => ({
                                value: String(m.id),
                                label: `${m.name} (₹${m.price || 299})`,
                              }))
                            : [{ value: "1", label: "Loading menu items..." }]
                        }
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50/50 px-2 text-xs font-bold text-center text-slate-800 outline-none"
                      />
                    </div>

                    <span className="text-xs font-bold text-slate-800 min-w-[70px] text-right">
                      ₹{item.price * item.quantity}
                    </span>

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                <span className="text-slate-600">Calculated Subtotal:</span>
                <span className="text-sm font-bold text-[#8D0606]">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#8D0606]" />
                <span>Billing & Delivery Address</span>
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Address Line 1 *</label>
                  <input
                    type="text"
                    placeholder="Enter delivery address (e.g. 123 MG Road, Sector 15)"
                    value={billingAddress.address1}
                    onChange={(e) => setBillingAddress({ ...billingAddress, address1: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                  {errors.billingAddress1 && <p className="text-[10px] text-rose-600 mt-0.5">{errors.billingAddress1}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone number (e.g. 9876543210)"
                    value={billingAddress.phoneNumber}
                    onChange={(e) => setBillingAddress({ ...billingAddress, phoneNumber: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                  {errors.billingPhone && <p className="text-[10px] text-rose-600 mt-0.5">{errors.billingPhone}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Pincode</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit pincode (e.g. 201301)"
                    value={billingAddress.pincode}
                    onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#8D0606]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Total Payable:</span>
              <span className="text-lg font-bold text-[#8D0606]">₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(141,6,6,0.3)] transition hover:from-[#7a0505] hover:to-[#990707] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader variant="button" text="Placing Order..." />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Order Detail Modal (Portal-mounted)
// ---------------------------------------------------------------------------
function OrderDetailModal({ branchId, order, canUpdate = true, onStatusUpdate, onClose }) {
  const [detailData, setDetailData] = useState(order);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  // Fetch full live order detail from GET /kitchen/order/branch/{branchId}/{orderId}
  useEffect(() => {
    let active = true;
    async function loadDetail() {
      if (!branchId || !order?.id) return;
      setLoadingDetail(true);
      try {
        const res = await api.orderDetail(branchId, order.id);
        const data = res?.data || res;
        if (active && data && typeof data === "object") {
          setDetailData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to load full order detail:", err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    }
    loadDetail();
    return () => {
      active = false;
    };
  }, [branchId, order?.id]);

  const currentOrder = detailData || order;
  const customerName = `${currentOrder.customer?.firstName || ""} ${currentOrder.customer?.lastName || ""}`.trim() || "Walk-in Customer";
  const billingAddr = currentOrder.customer?.addresses?.find((a) => a.type === "BILLING") || currentOrder.customer?.addresses?.[0];
  const shippingAddr = currentOrder.customer?.addresses?.find((a) => a.type === "SHIPPING") || billingAddr;
  const status = (currentOrder.status || "PLACED").toUpperCase();
  const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PLACED;
  const total = Number(currentOrder.totalAmount) || 0;
  const subtotal = Number(currentOrder.subTotal || currentOrder.subtotal || total) || total;
  const tax = Number(currentOrder.taxAmount || currentOrder.tax || 0);
  const deliveryCharge = Number(currentOrder.deliveryCharge || currentOrder.deliveryFee || 0);

  const handleStatusChange = async (newStatus) => {
    if (!canUpdate || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await onStatusUpdate?.(newStatus);
      setDetailData((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 relative bg-gradient-to-br from-[#7A0505] to-[#9E0808] p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              Order #{order.displayIndex || order.id || "1"} • {currentOrder.source || "MANUAL"}
            </span>
            {loadingDetail && (
              <RefreshCw size={12} className="animate-spin text-white/80" />
            )}
          </div>
          <h3 className="text-2xl font-bold tracking-tight mt-1.5">₹{total.toFixed(2)}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
              <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
              <span>Status: {statusConfig.label || status}</span>
            </span>
          </div>
        </div>

        {/* Status Transition Bar (Interactive) */}
        {canUpdate && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Update Order Status
              </span>
              {updatingStatus && (
                <span className="text-[11px] text-[#8D0606] font-semibold flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Updating...
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ORDER_STATUS_LIST.map((st) => {
                const isCurrent = status === st;
                const cfg = ORDER_STATUS_CONFIG[st];
                const IconComp = cfg.icon || Clock;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={updatingStatus || isCurrent}
                    onClick={() => handleStatusChange(st)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition ${
                      isCurrent
                        ? "bg-[#8D0606] text-white border-[#8D0606] shadow-xs font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300 font-medium"
                    } disabled:opacity-60`}
                  >
                    <IconComp size={13} className="mb-0.5" />
                    <span className="text-[10px] leading-tight truncate w-full">{cfg.label || st}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer & Contact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Name
              </span>
              <p className="text-xs font-bold text-slate-800">{customerName}</p>
              <span className="text-[11px] text-slate-400">{currentOrder.customer?.email || "No email"}</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Contact Phone
              </span>
              <p className="text-xs font-bold text-slate-800">
                {billingAddr?.phoneNumber || "—"}
              </p>
              <span className="text-[11px] text-slate-400">Branch #{branchId}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Delivery Address
            </span>
            <p className="text-xs font-bold text-slate-800">
              {shippingAddr?.address1 || "Pickup / Counter Service"}
            </p>
            {shippingAddr?.address2 && (
              <p className="text-xs text-slate-600 mt-0.5">{shippingAddr.address2}</p>
            )}
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pincode: {shippingAddr?.pincode || "—"}
            </p>
          </div>

          {/* Items Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Purchased Menu Items ({(currentOrder.items || []).length})
            </span>
            <div className="divide-y divide-slate-200/60">
              {(currentOrder.items || []).map((item, idx) => {
                const iName = item.menuItem?.name || item.name || `Item #${item.menuItemId || idx + 1}`;
                const iPrice = Number(item.price || item.menuItem?.price || 0);
                const iQty = Number(item.quantity || 1);
                return (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{iName}</p>
                      <span className="text-[11px] text-slate-400">Qty: {iQty} × ₹{iPrice}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{(iQty * iPrice).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Financial Totals */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Items Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Taxes</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Delivery Charge</span>
                  <span>₹{deliveryCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-[#8D0606]">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-200/80 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#8D0606] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7a0505] transition"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Backwards compatibility export
export { OrderListPage as OrderCustomerTable };
