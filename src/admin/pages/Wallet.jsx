import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Download,
  CheckCircle,
  X,
  Search,
  Building2,
  ShieldCheck,
  Copy,
  Receipt,
  AlertCircle,
  Zap,
  Percent,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { mockWalletTransactions } from '../data/mockData';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { useTheme } from '../context/ThemeContext';

// Static financial snapshot — swap for live data when the payouts API is wired up.
const AVAILABLE_BALANCE = 14890.5;
const PENDING_ESCROW = 2410.0;
const YTD_PAYOUTS = 128450.0;
const ESCROW_ORDER_COUNT = 24;

const PAYOUT_METHODS = [
  {
    value: 'chase',
    label: 'Chase Bank Checking (****4829)',
    short: 'Chase ****4829',
    eta: '1–2 business days',
    icon: Building2,
  },
  {
    value: 'stripe',
    label: 'Stripe Instant Payout (Debit Card)',
    short: 'Stripe Instant',
    eta: 'Usually within 30 minutes',
    icon: Zap,
  },
  {
    value: 'paypal',
    label: 'PayPal Business Account',
    short: 'PayPal Business',
    eta: 'Same business day',
    icon: WalletIcon,
  },
];

// Visual language for each transaction type — one glance should tell you the money's direction.
const getTypeVisual = (type) => {
  const t = type.toLowerCase();
  if (t.includes('income')) {
    return { icon: ArrowDownLeft, iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', iconColor: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (t.includes('payout')) {
    return { icon: ArrowUpRight, iconBg: 'bg-brand-50 dark:bg-rose-950/40', iconColor: 'text-brand-800 dark:text-rose-400' };
  }
  if (t.includes('fee')) {
    return { icon: Percent, iconBg: 'bg-amber-50 dark:bg-amber-950/60', iconColor: 'text-amber-600 dark:text-amber-400' };
  }
  return { icon: Receipt, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400' };
};

export const Wallet = () => {
  const toast = useToast();
  const { theme } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  // Modals & Forms
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('chase');
  const [withdrawErrors, setWithdrawErrors] = useState({});

  // Filters & Search
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filterTabs = ['All', 'Order Income', 'Payouts', 'Platform Fee'];

  const tabCounts = useMemo(() => {
    const counts = {};
    filterTabs.forEach((tab) => {
      counts[tab] =
        tab === 'All'
          ? mockWalletTransactions.length
          : mockWalletTransactions.filter((tx) => tx.type.toLowerCase().includes(tab.toLowerCase())).length;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escrowPercent = Math.round((PENDING_ESCROW / (AVAILABLE_BALANCE + PENDING_ESCROW)) * 100);

  const activeMethod = PAYOUT_METHODS.find((m) => m.value === selectedMethod);
  const parsedAmount = parseFloat(withdrawAmount);
  const remainingAfterPayout =
    !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= AVAILABLE_BALANCE
      ? AVAILABLE_BALANCE - parsedAmount
      : null;

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      minHeight: '46px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': {
        borderColor: theme === 'dark' ? '#475569' : '#cbd5e1',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark' ? '#334155' : '#f8fafc'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '10px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
    }),
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || withdrawAmount === '') {
      newErrors.withdrawAmount = 'Enter a withdrawal amount.';
    } else if (isNaN(amt) || amt <= 0) {
      newErrors.withdrawAmount = 'Amount must be a valid positive number.';
    } else if (amt > AVAILABLE_BALANCE) {
      newErrors.withdrawAmount = `Amount cannot exceed your available balance of $${AVAILABLE_BALANCE.toLocaleString()}.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setWithdrawErrors(newErrors);
      toast.error('Fix the highlighted field before submitting.');
      const el = document.getElementById('wallet-withdrawAmount');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      return;
    }

    setWithdrawErrors({});
    showLoading('Sending payout to your bank...');
    setTimeout(() => {
      hideLoading();
      toast.success(`Payout of $${amt.toLocaleString()} sent to ${activeMethod.short}.`);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
    }, 1200);
  };

  const copyAccountNum = () => {
    navigator.clipboard.writeText('4829103948');
    toast.success('Account number copied to clipboard!');
  };

  const setQuickAmount = (fraction) => {
    const val = fraction === 1 ? AVAILABLE_BALANCE : Math.floor(AVAILABLE_BALANCE * fraction * 100) / 100;
    setWithdrawAmount(String(val));
    if (withdrawErrors.withdrawAmount) setWithdrawErrors({});
  };

  // Filter transactions
  const filteredTxns = mockWalletTransactions.filter((tx) => {
    const matchesTab = activeTab === 'All' || tx.type.toLowerCase().includes(activeTab.toLowerCase());
    const matchesSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.method.toLowerCase().includes(search.toLowerCase()) ||
      tx.type.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);
  const paginatedTxns = filteredTxns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-7 pb-10 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Payouts & Earnings Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Balance Sync
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Financial Wallet</span>
              <WalletIcon className="w-6 h-6 text-[#8C0D0D] dark:text-rose-400 shrink-0" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Manage cloud kitchen payouts, bank accounts, escrow settlements & earnings, all in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => toast.info('Generating 2026 1099-K Tax Form PDF...')}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#8C0D0D] shrink-0" />
              <span>1099-K Tax Form</span>
            </button>

            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Request Bank Payout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Digital Wallet Card */}
        <div className="group bg-gradient-to-br from-[#8C0D0D] via-[#a81010] to-[#590707] rounded-3xl p-6 md:p-7 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[228px]">
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner shadow-amber-600/40 shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-brand-200 truncate">Cloud Kitchen Executive Card</span>
            </div>
            <WalletIcon className="w-6 h-6 text-white/80 shrink-0" />
          </div>

          <div className="relative z-10 my-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-200 block">Available Balance</span>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-0.5">
              ${AVAILABLE_BALANCE.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-300 font-extrabold mt-1.5 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
              </span>
              Cleared & ready for instant payout
            </p>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-brand-100 font-extrabold font-mono tracking-wider">
            <span>Chase Business ****4829</span>
            <button
              onClick={copyAccountNum}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1 text-[11px] font-sans"
            >
              <Copy className="w-3 h-3" /> Copy Routing
            </button>
          </div>

          {/* Ambient glow + subtle shine sweep on hover */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Pending Escrow Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pending Escrow</span>
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `conic-gradient(#d97706 ${escrowPercent * 3.6}deg, #fde68a22 0deg)` }}
              title={`${escrowPercent}% of gross balance held in escrow`}
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              ${PENDING_ESCROW.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{ESCROW_ORDER_COUNT} active line prep orders</p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Settles into wallet</span>
            <span className="font-black">&lt; 24 Hours</span>
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Payouts (YTD 2026)</span>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              ${YTD_PAYOUTS.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Direct bank transfers processed</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <span>Tax compliance status</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Transaction History Table OR Empty State */}
      {filteredTxns.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 p-6 md:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Financial Transactions</h3>
              <button
                onClick={() => toast.info('Exporting transaction statement...')}
                className="text-xs font-extrabold text-brand-800 dark:text-rose-400 flex items-center gap-1 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Download Statement
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 pl-2">Transaction</th>
                    <th className="p-4">Destination / Source</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {paginatedTxns.map((tx, idx) => {
                    const { icon: TypeIcon, iconBg, iconColor } = getTypeVisual(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                              <TypeIcon className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white">{tx.type}</div>
                              <div className="text-brand-800 dark:text-rose-400 font-black text-[11px]">
                                #{(currentPage - 1) * itemsPerPage + idx + 1}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{tx.method}</td>
                        <td className="p-4 text-slate-400 dark:text-slate-500">{tx.date}</td>
                        <td
                          className={`p-4 font-black text-sm ${
                            tx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {tx.amount}
                        </td>
                        <td className="p-4 pr-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTxns.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        <EmptyState
          title="No data in current status"
          description="We couldn't find any financial transactions matching your search query or selected type filter."
          onReset={() => {
            setActiveTab('All');
            setSearch('');
          }}
        />
      )}

      {/* Withdrawal Modal */}
      {isWithdrawOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-amber-300" />
                    Request Bank Payout
                  </h3>
                  <p className="text-xs text-brand-200 mt-0.5">Transfer cleared funds directly to your verified bank</p>
                </div>
                <button onClick={() => setIsWithdrawOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-extrabold">
                    Destination Bank Account
                  </label>
                  <Select
                    options={PAYOUT_METHODS.map(({ value, label }) => ({ value, label }))}
                    value={PAYOUT_METHODS.filter((opt) => opt.value === selectedMethod).map(({ value, label }) => ({ value, label }))[0]}
                    onChange={(opt) => setSelectedMethod(opt ? opt.value : 'chase')}
                    styles={customSelectStyles}
                    isSearchable={false}
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Estimated arrival: <span className="font-bold text-slate-500 dark:text-slate-400">{activeMethod.eta}</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold">
                      Withdrawal Amount ($) *
                    </label>
                    <div className="flex items-center gap-1">
                      {[0.25, 0.5, 0.75, 1].map((f) => (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setQuickAmount(f)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-800 hover:text-white dark:hover:bg-rose-500 transition-colors"
                        >
                          {f === 1 ? 'Max' : `${f * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="wallet-withdrawAmount"
                    type="number"
                    placeholder="e.g. 2500"
                    max="14890"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      if (withdrawErrors.withdrawAmount) setWithdrawErrors({});
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none font-medium transition-all ${
                      withdrawErrors.withdrawAmount
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand-800'
                    }`}
                  />
                  {withdrawErrors.withdrawAmount ? (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {withdrawErrors.withdrawAmount}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Max available balance: ${AVAILABLE_BALANCE.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                {remainingAfterPayout !== null && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">Remaining balance after payout</span>
                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                      ${remainingAfterPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand flex items-center gap-1.5"
                  >
                    Send Payout <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};