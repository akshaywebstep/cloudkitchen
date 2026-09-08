import React, { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  RefreshCw,
  X,
  Eye,
  ArrowLeft,
  Receipt,
  ChevronRight,
  CheckCircle2,
  Clock,
  ChefHat,
  Building2,
  Package,
} from "lucide-react";
import { api, getStoredToken, getApiErrorMessage } from "../../api";
import { Pagination } from "../../components/ui/Pagination";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/ui/PageHeader";

export function CustomerListPage({ apiState, onToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = useCallback(
    async (isSilent = false) => {
      const token = apiState?.token || getStoredToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await api.customers();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.customers)
          ? res.customers
          : Array.isArray(res)
          ? res
          : [];
        setCustomersData(list);
      } catch (error) {
        const msg = getApiErrorMessage(error, "Failed to load customers list");
        onToast?.({ message: msg, type: "error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiState?.token, onToast]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Normalized customer records
  const customers = useMemo(() => {
    return customersData.map((c, index) => {
      const firstName = c.firstName || c.name?.split(" ")?.[0] || "Customer";
      const lastName = c.lastName || c.name?.split(" ")?.slice(1)?.join(" ") || `#${c.id || index + 1}`;
      const fullName = c.fullName || c.name || `${firstName} ${lastName}`.trim();
      const phone = c.contactPhone || c.phone || c.phoneNumber || c.addresses?.[0]?.phoneNumber || "—";
      const gender = c.gender || "Customer";
      const addrObj = c.addresses?.[0] || {};
      const address = c.deliveryAddress || c.address || addrObj.address1 || addrObj.address || "Local Area";
      const pincode = c.pincode || addrObj.pincode || "";
      const totalOrders = Number(c.totalOrders ?? c.ordersCount ?? c.orders?.length ?? 0) || 0;
      const rawSpend = c.lifetimeSpend ?? c.totalSpent ?? c.totalAmount ?? 0;
      const lifetimeSpend = isNaN(Number(rawSpend)) ? 0 : Number(rawSpend);
      const lastOrderDate = c.lastActive || c.lastOrderDate || c.updatedAt || c.createdAt;
      const recentOrders = Array.isArray(c.recentOrders) ? c.recentOrders : [];

      return {
        id: c.id || index + 1,
        rawId: c.id,
        firstName,
        lastName,
        fullName,
        phone,
        gender,
        address,
        pincode,
        totalOrders,
        totalSpent: lifetimeSpend,
        lifetimeSpend,
        lastOrderDate,
        recentOrders,
        raw: c,
      };
    });
  }, [customersData]);

  // Filter by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const nameMatch = c.fullName.toLowerCase().includes(q);
      const phoneMatch = c.phone.toLowerCase().includes(q);
      const addressMatch = c.address.toLowerCase().includes(q);
      return nameMatch || phoneMatch || addressMatch;
    });
  }, [customers, searchQuery]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Header Banner matching Reference */}
      <PageHeader
        badge="Customer Network"
        activeBadge={`${customers.length} Registered Customers`}
        title="Customer Profiles"
        subtitle="Manage customer contact information, order histories, and lifetime spending records."
        actions={
          <button
            type="button"
            onClick={() => fetchCustomers(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            title="Refresh Customers"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search customers by name, phone, or address..."
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
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-[#8D0606] hover:bg-rose-100 transition"
          >
            Reset Search
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-20">
            <Loader variant="page" text="Loading customer records from server..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="pl-5 pr-2 py-4 w-12 text-slate-400">#</th>
                  <th className="px-5 py-4">Customer Name</th>
                  <th className="px-5 py-4">Contact Phone</th>
                  <th className="px-5 py-4">Delivery Address</th>
                  <th className="px-5 py-4">Total Orders</th>
                  <th className="px-5 py-4">Lifetime Spend</th>
                  <th className="px-5 py-4">Last Active</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedCustomers.map((c, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  const formattedDate = c.lastOrderDate
                    ? new Date(c.lastOrderDate).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={c.id || idx}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="pl-5 pr-2 py-4 font-bold text-xs text-[#8D0606] whitespace-nowrap">
                        #{itemIndex}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white font-bold text-xs shadow-2xs">
                            {c.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 whitespace-nowrap">{c.fullName}</p>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {c.gender}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="font-semibold">{c.phone}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-[250px]">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={c.address}>
                            {c.address} {c.pincode ? `(${c.pincode})` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 shrink-0 whitespace-nowrap border border-slate-200/60 shadow-2xs">
                          <ShoppingBag size={13} className="text-[#8D0606] shrink-0" />
                          <span>{c.totalOrders} order(s)</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-[#8D0606] whitespace-nowrap">
                          ₹{c.lifetimeSpend.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{formattedDate}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#8D0606] hover:text-[#8D0606] hover:bg-rose-50/60 transition shadow-2xs active:scale-95"
                          title="View Customer Orders"
                        >
                          <Eye size={13} />
                          <span>View Orders</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!paginatedCustomers.length && (
              <div className="flex flex-col items-center justify-center p-14 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                  <Users size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No customers found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {searchQuery ? "No customer matches your search query." : "No customer records available yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 8, 15, 25]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Customer Orders & Details Modal */}
      {selectedCustomer && (
        <CustomerOrdersModal
          customer={selectedCustomer}
          apiState={apiState}
          onClose={() => setSelectedCustomer(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer Orders & Details Modal (Mounted via Portal)
// ---------------------------------------------------------------------------
function CustomerOrdersModal({ customer, onClose, apiState, onToast }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const orders = customer?.recentOrders || [];

  // When selectedOrder changes, fetch /kitchen/order/branch/{branchId}/{orderId}
  useEffect(() => {
    let active = true;
    if (!selectedOrder) {
      setOrderDetail(null);
      setDetailError(null);
      return;
    }

    const branchId = selectedOrder.branchId || selectedOrder.branch?.id || apiState?.selectedBranchId || 6;
    const orderId = selectedOrder.id;

    if (!branchId || !orderId) {
      setOrderDetail(selectedOrder);
      return;
    }

    async function fetchOrderInfo() {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await api.orderDetail(branchId, orderId);
        const data = res?.data || res;
        if (active && data) {
          setOrderDetail(data);
        }
      } catch (err) {
        if (active) {
          const msg = getApiErrorMessage(err, "Failed to load order details");
          setDetailError(msg);
        }
      } finally {
        if (active) setLoadingDetail(false);
      }
    }

    fetchOrderInfo();
    return () => {
      active = false;
    };
  }, [selectedOrder, apiState?.selectedBranchId]);

  const currentOrder = orderDetail || selectedOrder;

  const STATUS_CONFIG = {
    COMPLETED: { label: "Completed", badge: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-500" },
    PLACED: { label: "Placed", badge: "border-blue-200 bg-blue-50 text-blue-800", dot: "bg-blue-500" },
    PREPARING: { label: "Preparing", badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500 animate-pulse" },
    READY: { label: "Ready", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", badge: "border-rose-200 bg-rose-50 text-rose-800", dot: "bg-rose-500" },
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Customer Identity */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white font-extrabold text-base shadow-sm">
              {customer.firstName?.charAt(0) || "C"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-slate-900 truncate">{customer.fullName}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600 border border-slate-200">
                  {customer.gender}
                </span>
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-[#8D0606] border border-rose-100">
                  ID: #{customer.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Phone size={12} className="text-slate-400" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1 text-slate-500 truncate max-w-xs" title={customer.address}>
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  {customer.address} {customer.pincode ? `(${customer.pincode})` : ""}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition shadow-2xs border border-slate-200/80"
          >
            <X size={16} />
          </button>
        </div>

        {/* Customer Stats Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white border-b border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Orders
            </span>
            <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag size={13} className="text-[#8D0606]" />
              {customer.totalOrders} order(s)
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Lifetime Spend
            </span>
            <p className="text-xs font-extrabold text-[#8D0606]">
              ₹{customer.lifetimeSpend.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Last Order
            </span>
            <p className="text-xs font-semibold text-slate-700 truncate">
              {customer.lastOrderDate
                ? new Date(customer.lastOrderDate).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Modal Body: Either Single Order Details OR Orders List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {selectedOrder ? (
            /* ------------------------------------------------------------- */
            /* SINGLE ORDER DETAIL VIEW (GET /kitchen/order/branch/{b}/{id}) */
            /* ------------------------------------------------------------- */
            <div className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D0606] hover:underline"
              >
                <ArrowLeft size={14} />
                <span>Back to Customer's Orders List</span>
              </button>

              {/* Order Meta Header */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900">
                      Order #{selectedOrder.id}
                    </span>
                    {(() => {
                      const st = (currentOrder?.status || "PLACED").toUpperCase();
                      const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PLACED;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${cfg.badge}`}
                        >
                          <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                      {currentOrder?.source || "MANUAL"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {currentOrder?.branch?.name
                      ? `Branch: ${currentOrder.branch.name}`
                      : `Branch #${selectedOrder.branchId || ""}`}
                  </span>
                  <span className="text-base font-extrabold text-[#8D0606]">
                    ₹{Number(currentOrder?.totalAmount || selectedOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Loading or Items Content */}
              {loadingDetail ? (
                <div className="py-12 bg-white rounded-2xl border border-slate-200">
                  <Loader variant="page" text="Fetching order menu items..." />
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-800">
                  <p className="font-bold">Error loading order items</p>
                  <p className="mt-0.5">{detailError}</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                    <span>Menu Items Ordered</span>
                    <span>{currentOrder?.items?.length || 0} Item(s)</span>
                  </h4>

                  {currentOrder?.items && currentOrder.items.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs divide-y divide-slate-100">
                      {currentOrder.items.map((it, idx) => {
                        const m = it.menuItem || {};
                        const itemPrice = Number(it.price || m.price || 0);
                        const itemQty = Number(it.quantity || 1);
                        const itemTotal = itemPrice * itemQty;

                        return (
                          <div
                            key={it.id || idx}
                            className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {m.image ? (
                                <img
                                  src={m.image}
                                  alt={m.name || "Dish"}
                                  className="size-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
                                  }}
                                />
                              ) : (
                                <div className="grid size-12 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shrink-0">
                                  <ChefHat size={20} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-900 truncate">
                                  {m.name || `Menu Item #${it.menuItemId || idx + 1}`}
                                </p>
                                {m.description && (
                                  <p className="text-[10.5px] text-slate-400 truncate max-w-xs mt-0.5">
                                    {m.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                    ₹{itemPrice} each
                                  </span>
                                  <span className="text-[10.5px] font-extrabold text-[#8D0606]">
                                    Qty: ×{itemQty}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-slate-900">
                                ₹{itemTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                      No item breakdown available for this order.
                    </div>
                  )}

                  {/* Order Bill Summary */}
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Items Total:</span>
                      <span className="font-bold">
                        ₹{Number(currentOrder?.totalAmount || selectedOrder.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-900 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-[#8D0606]">
                        ₹{Number(currentOrder?.totalAmount || selectedOrder.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* ORDERS LIST VIEW (All orders placed by this customer)         */
            /* ------------------------------------------------------------- */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Customer Order History
                </h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {orders.length} Order(s)
                </span>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-2.5">
                  {orders.map((ord) => {
                    const st = (ord.status || "PLACED").toUpperCase();
                    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.PLACED;
                    const formattedDate = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-[#8D0606]/30 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100">
                            <Receipt size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-900">
                                Order #{ord.id}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badge}`}
                              >
                                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              {ord.branch?.name && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                  <Building2 size={10} />
                                  {ord.branch.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock size={11} />
                              {formattedDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-sm font-extrabold text-[#8D0606]">
                            ₹{Number(ord.totalAmount || 0).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8D0606] hover:bg-[#780404] text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition active:scale-95"
                          >
                            <Eye size={13} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 mb-2">
                    <ShoppingBag size={22} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">No Orders Found</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                    This customer has not placed any orders recorded for this kitchen yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            {selectedOrder ? `Inspecting Order #${selectedOrder.id}` : `${customer.fullName}'s Profile`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Export alias for backwards compatibility
export { CustomerListPage as OrderCustomerTable };

