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
} from "lucide-react";
import { api, getApiErrorMessage } from "../../../api";
import { Card } from "../../ui/Card";
import { Loader } from "../../ui/Loader";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { AppSelect } from "../../ui/AppSelect";

export function OrderListPage({ apiState, onToast }) {
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

  // Active branch ID
  const activeBranchId = useMemo(() => {
    return (
      apiState?.selectedBranchId ||
      apiState?.kitchen?.branches?.[0]?.id ||
      apiState?.branches?.[0]?.id ||
      2
    );
  }, [apiState?.selectedBranchId, apiState?.kitchen?.branches, apiState?.branches]);

  const [currentBranchId, setCurrentBranchId] = useState(activeBranchId);

  useEffect(() => {
    if (activeBranchId) {
      setCurrentBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // Fetch orders from API with server pagination
  const fetchOrders = async (isSilent = false) => {
    if (!currentBranchId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.orders(currentBranchId, {
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentBranchId, currentPage, pageSize, apiState?.token]);

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
                value={currentBranchId}
                onChange={(val) => setCurrentBranchId(Number(val))}
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

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create New Order</span>
            </button>
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
            placeholder="Search by Order ID, customer, phone, or dish..."
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
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PLACED", "CONFIRMED", "DELIVERED", "CANCELLED"].map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#8D0606] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All Orders" : st}
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
                  <th className="px-5 py-4"># & Source</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Ordered Items</th>
                  <th className="px-5 py-4">Delivery Address</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Status</th>
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
                  const total = Number(order.totalAmount) || 0;
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
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
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

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            status === "PLACED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : status === "CONFIRMED"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : status === "CANCELLED"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              status === "PLACED" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{status}</span>
                        </span>
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
                            setSelectedOrderDetail(order);
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
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a0505]"
                >
                  <Plus size={15} />
                  <span>Create New Order</span>
                </button>
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

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <CreateOrderModal
          branchId={currentBranchId}
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
          order={selectedOrderDetail}
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

  const [selectedBranch, setSelectedBranch] = useState(branchId || 2);
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
  });

  const [billingAddress, setBillingAddress] = useState({
    address1: "",
    countryId: 101,
    stateId: 4007,
    cityId: 57675,
    pincode: "201301",
    phoneNumber: "",
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    address1: "",
    countryId: 101,
    stateId: 4007,
    cityId: 57675,
    pincode: "201301",
    phoneNumber: "",
  });

  // Selected Order Items: [{ menuItemId: 1, quantity: 2, price: 299, name: "Veg." }]
  const [orderItems, setOrderItems] = useState(() => {
    if (menus.length > 0) {
      return [{ menuItemId: menus[0].id, quantity: 1, price: Number(menus[0].price) || 299, name: menus[0].name }];
    }
    return [{ menuItemId: 1, quantity: 2, price: 299, name: "Veg. (Special Item)" }];
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Add Item to order
  const addItem = () => {
    const defaultId = menus[0]?.id || 1;
    const defaultPrice = Number(menus[0]?.price) || 299;
    const defaultName = menus[0]?.name || "Veg. Item";
    setOrderItems((prev) => [...prev, { menuItemId: defaultId, quantity: 1, price: defaultPrice, name: defaultName }]);
  };

  // Remove Item
  const removeItem = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index, field, value) => {
    setOrderItems((prev) => {
      const next = [...prev];
      if (field === "menuItemId") {
        const found = menus.find((m) => String(m.id) === String(value));
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

      await api.createOrder(branchId, payload);
      onSuccess();
    } catch (error) {
      const errMsg = getApiErrorMessage(error, "Failed to create order");
      onToast?.({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-xs">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create New Kitchen Order</h3>
              <p className="text-xs font-semibold text-slate-500">
                Enter customer details, select dishes, and generate invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Active Kitchen Branch Indicator */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 shadow-2xs">
              <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100 shrink-0">
                <Building2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Target Kitchen Branch</span>
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-[#8D0606] border border-rose-100">
                    Header Synced
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                  {branches.find((b) => String(b.id) === String(branchId))?.name || `Branch Outlet #${branchId || "1"}`}
                </p>
              </div>
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
                    placeholder="e.g. Rahul"
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
                    placeholder="e.g. Sharma"
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
                          menus.length > 0
                            ? menus.map((m) => ({
                                value: String(m.id),
                                label: `${m.name} (₹${m.price || 299})`,
                              }))
                            : [{ value: "1", label: "Veg. Special Dish (₹299)" }]
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
                    placeholder="e.g. 123 MG Road, Sector 15"
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
                    placeholder="e.g. 7876060984"
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
                    placeholder="e.g. 201301"
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
function OrderDetailModal({ order, onClose }) {
  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Walk-in Customer";
  const billingAddr = order.customer?.addresses?.find((a) => a.type === "BILLING") || order.customer?.addresses?.[0];
  const shippingAddr = order.customer?.addresses?.find((a) => a.type === "SHIPPING") || billingAddr;
  const status = (order.status || "PLACED").toUpperCase();
  const total = Number(order.totalAmount) || 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto flex max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
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
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            Order #{order.displayIndex || "1"} • {order.source || "MANUAL"}
          </span>
          <h3 className="text-xl font-bold tracking-tight mt-1">₹{total.toFixed(2)}</h3>
          <p className="text-xs text-white/80 font-medium">Status: {status}</p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer & Contact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Name
              </span>
              <p className="text-xs font-bold text-slate-800">{customerName}</p>
              <span className="text-[11px] text-slate-400">{order.customer?.gender || "Male"}</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Contact Phone
              </span>
              <p className="text-xs font-bold text-slate-800">
                {billingAddr?.phoneNumber || "—"}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Delivery Address
            </span>
            <p className="text-xs font-bold text-slate-800">
              {shippingAddr?.address1 || "Pickup"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pincode: {shippingAddr?.pincode || "201301"}
            </p>
          </div>

          {/* Items Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Purchased Menu Items ({(order.items || []).length})
            </span>
            <div className="divide-y divide-slate-200/60">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{item.menuItem?.name || `Item #${item.menuItemId}`}</p>
                    <span className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price || item.menuItem?.price || 20}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{(item.quantity * (item.price || item.menuItem?.price || 20)).toFixed(2)}
                  </span>
                </div>
              ))}
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
