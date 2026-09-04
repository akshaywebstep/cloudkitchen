import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Trash2,
  Search,
  Building2,
  GitBranch,
  Boxes,
  Eye,
  Calendar,
  Layers,
  AlertTriangle,
  Flame,
  AlertOctagon,
  RefreshCw,
  X,
  Clock,
  DollarSign,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLoading } from '../context/LoadingContext';
import {
  getWasteLogsApi,
  getWasteLogByIdApi,
  getKitchensApi,
  getBranchesApi,
} from '../services/api';

const REASON_OPTIONS = [
  { value: 'ALL', label: 'All Reasons' },
  { value: 'DAMAGED', label: 'Damaged Goods' },
  { value: 'EXPIRED', label: 'Expired Stock' },
  { value: 'SPOILED', label: 'Spoiled' },
  { value: 'OVERPRODUCTION', label: 'Overproduction / Surplus' },
  { value: 'SPILLAGE', label: 'Spillage / Accident' },
  { value: 'OTHER', label: 'Other' },
];

export const WasteManagement = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [wasteLogs, setWasteLogs] = useState([]);
  const [summary, setSummary] = useState({ totalWastedQuantity: 0, totalWasteExpense: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [kitchens, setKitchens] = useState([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedReason, setSelectedReason] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Custom Select Styles
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.875rem',
      padding: '2px 4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.25)' : 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
    }),
    placeholder: (base) => ({
      ...base,
      color: theme === 'dark' ? '#94a3b8' : '#64748b',
      fontSize: '0.75rem',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark'
          ? '#334155'
          : '#f8fafc'
        : 'transparent',
      color: state.isSelected ? '#ffffff' : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
  };

  // Load Kitchens on Mount
  useEffect(() => {
    async function loadKitchens() {
      try {
        const res = await getKitchensApi({ limit: 100 });
        if (res?.status === true && Array.isArray(res.data)) {
          setKitchens(res.data);
        }
      } catch (err) {
        console.error('Failed to load kitchens:', err);
      }
    }
    loadKitchens();
  }, []);

  // Load Branches when Kitchen changes
  useEffect(() => {
    async function loadBranches() {
      if (!selectedKitchenId) {
        setBranches([]);
        setSelectedBranchId('');
        return;
      }
      try {
        const res = await getBranchesApi({ kitchenId: selectedKitchenId, limit: 100 });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setBranches(list);
        setSelectedBranchId('');
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranches();
  }, [selectedKitchenId]);

  // Fetch Waste Logs
  const fetchLogs = async () => {
    showLoading('Fetching waste management logs...');
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (selectedKitchenId) params.kitchenId = selectedKitchenId;
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (selectedReason && selectedReason !== 'ALL') params.reason = selectedReason;
      if (search.trim()) params.search = search.trim();

      const res = await getWasteLogsApi(params);
      if (res?.status === true) {
        setWasteLogs(Array.isArray(res.data) ? res.data : []);
        if (res.summary) {
          setSummary({
            totalWastedQuantity: res.summary.totalWastedQuantity || 0,
            totalWasteExpense: res.summary.totalWasteExpense || 0,
          });
        }
        if (res.meta) {
          setMeta({
            page: res.meta.page || 1,
            limit: res.meta.limit || itemsPerPage,
            total: res.meta.total || 0,
            totalPages: res.meta.totalPages || 1,
          });
        }
      } else {
        setWasteLogs([]);
      }
    } catch (err) {
      console.error('Error fetching waste logs:', err);
      toast.error('Failed to fetch waste logs from server.');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, selectedKitchenId, selectedBranchId, selectedReason]);

  // Open Log Details Modal
  const openDetail = async (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
    if (log?.id) {
      setLoadingDetail(true);
      try {
        const res = await getWasteLogByIdApi(log.id);
        if (res?.status === true && res.data) {
          setSelectedLog(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch detailed log:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const getReasonBadge = (reason) => {
    switch (reason?.toUpperCase()) {
      case 'DAMAGED':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50';
      case 'EXPIRED':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50';
      case 'SPOILED':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900/50';
      case 'OVERPRODUCTION':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/50';
      case 'SPILLAGE':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/50';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Kitchen Options
  const kitchenOptions = useMemo(() => {
    return [
      { value: '', label: 'All Kitchens' },
      ...kitchens.map((k) => ({
        value: String(k.id),
        label: k.kitchenName || k.email || `Kitchen #${k.id}`,
      })),
    ];
  }, [kitchens]);

  // Branch Options
  const branchOptions = useMemo(() => {
    return [
      { value: '', label: 'All Branches' },
      ...branches.map((b) => ({
        value: String(b.id),
        label: b.name || `Branch #${b.id}`,
      })),
    ];
  }, [branches]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in mx-auto">
      {/* ─── HERO HEADER BANNER ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Waste Logs & Shrinkage Tracker
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] border border-slate-200 dark:border-slate-700">
                {meta.total} Total Incidents Logged
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Waste Management Listing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Audit culinary waste, damaged goods, expired stock, and spillages across all kitchens and outlets to minimize shrinkage.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/40 text-left">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Total Wasted Qty</span>
              <span className="text-lg font-black text-rose-700 dark:text-rose-300">
                {Number(summary.totalWastedQuantity || 0).toLocaleString()} <span className="text-xs font-semibold">Units</span>
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-left">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Total Waste Cost</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                ₹{Number(summary.totalWasteExpense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Kitchen Filter */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Kitchen Hub
            </label>
            <Select
              options={kitchenOptions}
              value={kitchenOptions.find((o) => o.value === selectedKitchenId) || kitchenOptions[0]}
              onChange={(opt) => {
                setSelectedKitchenId(opt?.value || '');
                setCurrentPage(1);
              }}
              styles={customSelectStyles}
              isSearchable={true}
              placeholder="Select Kitchen..."
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Outlet Branch
            </label>
            <Select
              options={branchOptions}
              value={branchOptions.find((o) => o.value === selectedBranchId) || branchOptions[0]}
              onChange={(opt) => {
                setSelectedBranchId(opt?.value || '');
                setCurrentPage(1);
              }}
              styles={customSelectStyles}
              isSearchable={true}
              placeholder="Select Branch..."
              isDisabled={!selectedKitchenId}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>

          {/* Reason Filter */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Waste Reason
            </label>
            <Select
              options={REASON_OPTIONS}
              value={REASON_OPTIONS.find((o) => o.value === selectedReason) || REASON_OPTIONS[0]}
              onChange={(opt) => {
                setSelectedReason(opt?.value || 'ALL');
                setCurrentPage(1);
              }}
              styles={customSelectStyles}
              isSearchable={false}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>

          {/* Search text */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Search Log
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search notes, ingredient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                    fetchLogs();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-[#8C0D0D]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* View Switcher & Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            {(selectedKitchenId || selectedBranchId || selectedReason !== 'ALL' || search) && (
              <button
                onClick={() => {
                  setSelectedKitchenId('');
                  setSelectedBranchId('');
                  setSelectedReason('ALL');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-[#8C0D0D] dark:text-rose-400 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-[#8C0D0D] dark:text-rose-400 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── DATA LISTING OR EMPTY STATE ─── */}
      {wasteLogs.length > 0 ? (
        <div className="space-y-4">
          {viewMode === 'table' ? (
            /* ═══ TABLE VIEW ═══ */
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 pl-6 w-12 text-center">#</th>
                      <th className="p-4">Ingredient</th>
                      <th className="p-4">Kitchen & Branch</th>
                      <th className="p-4">Qty Wasted</th>
                      <th className="p-4">Cost</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Date Logged</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {wasteLogs.map((log, idx) => {
                      const ing = log.inventoryItem?.ingredient || log.ingredient || {};
                      const kitchen = log.kitchen || {};
                      const branch = log.branch || {};
                      const unit = log.inventoryItem?.unit || 'Units';

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-4 pl-6 text-center font-bold text-slate-400">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          {/* Ingredient */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {ing.image ? (
                                  <img
                                    src={ing.image}
                                    alt={ing.name || 'Ingredient'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Boxes className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                  {ing.name || `Inventory #${log.inventoryItemId}`}
                                </span>
                                {ing.category && (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {ing.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Kitchen & Branch */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {kitchen.kitchenName || `Kitchen #${log.kitchenId}`}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <GitBranch className="w-3 h-3 text-[#8C0D0D] shrink-0" />
                                {branch.name || `Branch #${log.branchId}`}
                              </span>
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="p-4 font-black text-rose-600 dark:text-rose-400 text-sm">
                            {log.quantityWasted} <span className="text-xs font-bold text-slate-500">{unit}</span>
                          </td>

                          {/* Cost */}
                          <td className="p-4">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              ₹{Number(log.totalWasteCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            {Number(log.unitCost || 0) > 0 && (
                              <span className="text-[10px] text-slate-400 block font-semibold">
                                @ ₹{log.unitCost} / {unit}
                              </span>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getReasonBadge(
                                log.reason
                              )}`}
                            >
                              {log.reason}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {log.wastedAt ? new Date(log.wastedAt).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-[10px]">
                              {log.wastedAt
                                ? new Date(log.wastedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="p-4 max-w-[200px]">
                            <span className="truncate block text-slate-600 dark:text-slate-400 text-xs" title={log.notes}>
                              {log.notes || '—'}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => openDetail(log)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#8C0D0D] hover:text-white transition-all border border-slate-200/60 dark:border-slate-700 shadow-xs cursor-pointer"
                              title="View Log Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ═══ GRID VIEW ═══ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {wasteLogs.map((log, idx) => {
                const ing = log.inventoryItem?.ingredient || log.ingredient || {};
                const kitchen = log.kitchen || {};
                const branch = log.branch || {};
                const unit = log.inventoryItem?.unit || 'Units';

                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-card-hover transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            {ing.image ? (
                              <img src={ing.image} alt={ing.name} className="w-full h-full object-cover" />
                            ) : (
                              <Boxes className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                              {ing.name || `Item #${log.inventoryItemId}`}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold">{ing.category || 'General'}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getReasonBadge(
                            log.reason
                          )}`}
                        >
                          {log.reason}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold text-[11px]">Kitchen</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {kitchen.kitchenName || `#${log.kitchenId}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold text-[11px]">Branch</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {branch.name || `#${log.branchId}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span className="text-rose-600 font-extrabold text-[11px]">Wasted</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {log.quantityWasted} {unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold text-[11px]">Expense</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            ₹{Number(log.totalWasteCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl">
                          "{log.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {log.wastedAt ? new Date(log.wastedAt).toLocaleDateString() : ''}
                      </span>
                      <button
                        onClick={() => openDetail(log)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#8C0D0D] hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onLimitChange={(lim) => {
              setItemsPerPage(lim);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <EmptyState
          title="No waste logs found"
          description="There are no waste records matching your selected kitchen, branch, or reason filter."
          onReset={() => {
            setSelectedKitchenId('');
            setSelectedBranchId('');
            setSelectedReason('ALL');
            setSearch('');
            setCurrentPage(1);
          }}
        />
      )}

      {/* ─── DETAIL MODAL ─── */}
      {isDetailOpen && selectedLog &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-modal-pop">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#590707] text-white p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-black text-[10px] uppercase">
                      Log #{selectedLog.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 font-black text-[10px] uppercase">
                      {selectedLog.reason}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">Waste Incident Details</h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Ingredient Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedLog.inventoryItem?.ingredient?.image ? (
                      <img
                        src={selectedLog.inventoryItem.ingredient.image}
                        alt="Ingredient"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Boxes className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedLog.inventoryItem?.ingredient?.name || `Inventory Item #${selectedLog.inventoryItemId}`}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold block">
                      Category: {selectedLog.inventoryItem?.ingredient?.category || 'General'}
                    </span>
                    <span className="text-[11px] font-extrabold text-rose-600">
                      Wasted: {selectedLog.quantityWasted} {selectedLog.inventoryItem?.unit || 'Units'}
                    </span>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Unit Cost</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      ₹{Number(selectedLog.unitCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block mb-0.5">Total Waste Cost</span>
                    <span className="font-black text-rose-700 dark:text-rose-300 text-sm">
                      ₹{Number(selectedLog.totalWasteCost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Kitchen & Outlet Info */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-[#8C0D0D]" />
                    <span>Kitchen & Outlet Fulfillment</span>
                  </div>
                  <div className="space-y-1 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Kitchen: </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedLog.kitchen?.kitchenName || `Kitchen #${selectedLog.kitchenId}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Outlet: </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedLog.branch?.name || `Branch #${selectedLog.branchId}`}
                      </span>
                    </div>
                    {selectedLog.branch?.contactPhone && (
                      <div>
                        <span className="text-slate-400 font-semibold">Phone: </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {selectedLog.branch.contactPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedLog.notes && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Notes / Reason Remarks</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedLog.notes}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Logged on: {selectedLog.wastedAt ? new Date(selectedLog.wastedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
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
