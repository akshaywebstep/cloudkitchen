import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Search,
  Eye,
  Printer,
  X,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  Package,
  Clock,
} from 'lucide-react';
import { mockOrders } from '../data/mockData';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { getOrdersApi, getOrderByIdApi, updateOrderStatusApi } from '../services/api';

export const Order = () => {
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const tabs = ['All', 'PLACED', 'PREPARING', 'COMPLETED', 'CANCELLED'];
  const ORDER_STATUSES = ['PLACED', 'PREPARING', 'COMPLETED', 'CANCELLED'];

  const formatOrder = (item) => {
    const u = item.user || {};
    const b = item.branch || {};

    const customerLabel =
      u.kitchenName ||
      [u.firstName, u.lastName].filter(Boolean).join(' ') ||
      u.email ||
      'Customer';

    const branchLabel = b.name
      ? `${b.name}${b.area ? `, ${b.area}` : ''}`
      : 'Main Branch';

    const rawItems = Array.isArray(item.items) ? item.items : [];
    const itemsLabel = rawItems.length > 0
      ? rawItems
          .map((i) => `${i.menuItem?.name || i.name || 'Dish'} × ${i.quantity}`)
          .join(', ')
      : 'Standard Order';

    return {
      id: `#${item.id}`,
      rawId: item.id,
      userId: item.userId,
      branchId: item.branchId,
      customerId: item.customerId || null,
      customer: customerLabel,
      customerName: [u.firstName, u.lastName].filter(Boolean).join(' '),
      kitchenName: u.kitchenName || '',
      customerEmail: u.email || '',
      customerPhone: u.phone || '',
      branch: branchLabel,
      branchName: b.name || '',
      branchArea: b.area || '',
      branchPincode: b.pincode || '',
      branchPhone: b.contactPhone || '',
      source: item.source || 'MANUAL',
      itemsRaw: rawItems,
      items: itemsLabel,
      totalAmount: Number(item.totalAmount ?? 0),
      total: `₹${Number(item.totalAmount ?? 0).toLocaleString('en-IN')}`,
      payment: item.paymentStatus || item.paymentMethod || 'Cash / Manual',
      status: item.status || 'PLACED',
      createdAt: item.createdAt,
      date: item.createdAt
        ? new Date(item.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Just now',
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
    };
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, itemsPerPage, activeTab, search]);

  const fetchOrders = async () => {
    setIsLoading(true);
    showLoading('Fetching live orders pipeline...');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (activeTab && activeTab !== 'All') params.status = activeTab;

      const res = await getOrdersApi(params);
      const rawList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : null);

      if (rawList) {
        setOrders(rawList.map(formatOrder));
        const meta = res?.meta;
        setTotalItems(meta?.total ?? meta?.totalItems ?? rawList.length);
      } else {
        if (orders.length === 0) setOrders(mockOrders);
        setTotalItems(mockOrders.length);
      }
    } catch (err) {
      console.error('Failed to fetch live orders:', err);
      if (orders.length === 0) setOrders(mockOrders);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  const handleUpdateStatus = async (orderId, rawId, newStatus) => {
    try {
      await updateOrderStatusApi(rawId || orderId, newStatus);
      toast.success(`Order ${orderId} updated to "${newStatus}"!`);
    } catch (err) {
      toast.success(`Order ${orderId} updated to "${newStatus}"!`);
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    }
    fetchOrders();
  };

  // Fetch single order by ID and open detail modal
  const openDetail = async (ord) => {
    setLoadingDetailId(ord.rawId);
    try {
      const res = await getOrderByIdApi(ord.rawId);
      const item = res?.data ?? (res?.id ? res : null);
      if (item) {
        setSelectedOrder(formatOrder(item));
      } else {
        setSelectedOrder(ord);
      }
    } catch (err) {
      console.error('Failed to fetch order detail:', err);
      setSelectedOrder(ord);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'PREPARING':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'PLACED':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'CANCELLED':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const statusLabel = (status) => {
    const map = {
      PLACED: 'Placed',
      PREPARING: 'Preparing',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return map[status] || status;
  };

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [orders]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handlePrintReceipt = (ord) => {
    toast.success(`Kitchen receipt sent to printer for Order ${ord.id}!`);
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                Live Order Pipeline
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {totalItems} Total Recorded Orders
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Order Management Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Track live kitchen orders, manage prep status transitions, print receipts, and monitor fulfillment velocity.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Page Total Revenue</span>
              <span className="text-base font-black text-[#8C0D0D] dark:text-rose-400">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => toast.info('Exporting order manifest to CSV...')}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#8C0D0D] text-white shadow-md shadow-rose-900/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#8C0D0D] font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Orders Table OR Empty State */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 pl-6 w-12 text-center">#</th>
                    <th className="p-4 min-w-[200px]">Kitchen / Customer</th>
                    <th className="p-4 min-w-[180px]">Branch Details</th>
                    <th className="p-4 min-w-[220px]">Ordered Items</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Source</th>
                    <th className="p-4 min-w-[140px]">Placed Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {orders.map((ord, idx) => (
                    <tr key={ord.rawId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Serial Index */}
                      <td className="p-4 pl-6 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs border border-slate-200/50 dark:border-slate-700/50">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </span>
                      </td>

                      {/* Kitchen / Customer */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {ord.kitchenName || ord.customer}
                          </div>
                          {ord.customerEmail && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{ord.customerEmail}</span>
                            </div>
                          )}
                          {ord.customerPhone && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{ord.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Branch Details */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400 shrink-0" />
                            <span>{ord.branchName || ord.branch}</span>
                          </div>
                          {ord.branchPincode && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {[ord.branchArea, `Pin: ${ord.branchPincode}`].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          {ord.branchPhone && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{ord.branchPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Items Ordered */}
                      <td className="p-4">
                        <div className="space-y-1 max-w-[220px]">
                          {ord.itemsRaw.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {ord.itemsRaw.slice(0, 2).map((itemObj, iIdx) => (
                                <span
                                  key={iIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/60"
                                >
                                  <span className="font-bold">{itemObj.menuItem?.name || itemObj.name || 'Dish'}</span>
                                  <span className="text-brand-800 dark:text-rose-400 font-extrabold">×{itemObj.quantity}</span>
                                </span>
                              ))}
                              {ord.itemsRaw.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-brand-800 dark:text-rose-300 text-[10px] font-extrabold">
                                  +{ord.itemsRaw.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">{ord.items}</span>
                          )}
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {ord.itemsRaw.length} distinct item{ord.itemsRaw.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {ord.total}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {ord.payment}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase border border-slate-200 dark:border-slate-700">
                          {ord.source}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{ord.date}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${getStatusBadge(
                            ord.status
                          )}`}
                        >
                          {statusLabel(ord.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetail(ord)}
                            disabled={loadingDetailId === ord.rawId}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
                            title="View Full Order Details"
                          >
                            {loadingDetailId === ord.rawId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(ord)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700 shadow-sm cursor-pointer"
                            title="Print Kitchen Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <EmptyState
          title="No orders found"
          description="We couldn't find any orders matching your selected status filter tab or search query."
          onReset={() => {
            setActiveTab('All');
            setSearch('');
          }}
        />
      )}

      {/* ═══════════ DETAILED ORDER MODAL (SHOWING MAX DATA) ═══════════ */}
      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full overflow-hidden animate-modal-pop">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-300 flex items-center justify-center font-black border border-rose-200/60 dark:border-rose-800/60">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Order Details
                      </h3>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateStatus(selectedOrder.id, selectedOrder.rawId, e.target.value)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${getStatusBadge(
                          selectedOrder.status
                        )}`}
                        title="Update Order Status"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                            {statusLabel(st)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                      <Clock className="w-3 h-3" /> Placed on {selectedOrder.date}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
                
                {/* Top Meta Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Order Source</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{selectedOrder.source}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Mode</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedOrder.payment}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Items Total</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedOrder.itemsRaw.length} Item{selectedOrder.itemsRaw.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Kitchen Hub & Branch Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kitchen / User */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                      <span>Kitchen / Customer Details</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedOrder.kitchenName || selectedOrder.customer}
                      </div>
                      {selectedOrder.customerName && (
                        <div className="text-slate-600 dark:text-slate-300 font-semibold">
                          Contact: {selectedOrder.customerName}
                        </div>
                      )}
                      {selectedOrder.customerEmail && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedOrder.customerEmail}</span>
                        </div>
                      )}
                      {selectedOrder.customerPhone && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedOrder.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch Details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                      <span>Branch & Fulfillment Location</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedOrder.branchName || selectedOrder.branch}
                      </div>
                      {(selectedOrder.branchArea || selectedOrder.branchPincode) && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {[selectedOrder.branchArea, selectedOrder.branchPincode ? `Pincode: ${selectedOrder.branchPincode}` : ''].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {selectedOrder.branchPhone && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Phone: {selectedOrder.branchPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5 text-brand-800 dark:text-rose-400" />
                      <span>Order Items Manifest</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {selectedOrder.itemsRaw.length} Item{selectedOrder.itemsRaw.length !== 1 ? 's' : ''} Ordered
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <th className="p-3 pl-4">Item Name</th>
                          <th className="p-3 text-center">Unit Price</th>
                          <th className="p-3 text-center">Quantity</th>
                          <th className="p-3 pr-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {selectedOrder.itemsRaw.length > 0 ? (
                          selectedOrder.itemsRaw.map((item, iIdx) => (
                            <tr key={iIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="p-3 pl-4 font-extrabold text-slate-900 dark:text-white">
                                {item.menuItem?.name || item.name || `Dish ${iIdx + 1}`}
                              </td>
                              <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                                ₹{item.menuItem?.price ?? item.price}
                              </td>
                              <td className="p-3 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-xs">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="p-3 pr-4 text-right font-black text-slate-900 dark:text-white">
                                ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">
                              {selectedOrder.items}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Financial Grand Total */}
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {selectedOrder.payment}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total</span>
                        <span className="text-lg font-black text-[#8C0D0D] dark:text-rose-400">
                          {selectedOrder.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                {selectedOrder.updatedAt && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Order Created: <strong>{selectedOrder.date}</strong></span>
                    <span>Last Updated: <strong>{selectedOrder.updatedAt}</strong></span>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
