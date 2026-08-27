import React, { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  ChefHat,
  CheckCheck,
  Ban,
  Clock,
  Store,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getApiBaseUrl, getStoredToken } from "../../../api";
import { Card, CardTitle } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { Pagination } from "../../ui/Pagination";
import { resolveSelectedBranchId } from "../../../utils/helpers";

export function DashboardPage({ apiState }) {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const liveMenuCount = apiState?.menus?.length || 0;

  const activeBranchId = resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  const selectedBranch = (apiState?.branches || []).find((b) => String(b.id) === String(activeBranchId));
  const branchName = selectedBranch?.name || apiState?.kitchen?.kitchenName || "-";

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const token = apiState?.token || getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    const statsUrl = activeBranchId
      ? `${getApiBaseUrl()}/kitchen/dashboard/stats?branchId=${activeBranchId}`
      : `${getApiBaseUrl()}/kitchen/dashboard/stats`;

    fetch(statsUrl, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(result);
          const data = parsed?.data ? parsed.data : parsed;
          if (data && (data.overview || data.ordersBreakdown || data.subscription)) {
            setStatsData(data);
          } else if (parsed?.status === true && parsed?.data) {
            setStatsData(parsed.data);
          }
        } catch (e) {
          console.error("Error parsing dashboard stats:", e);
        } finally {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard stats:", error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiState?.token, activeBranchId]);

  const overview = statsData?.overview || {};
  const subscription = statsData?.subscription || {};
  const lowStockItems = statsData?.lowStockItems || [];
  const salesTrend = statsData?.salesTrend || [];
  const ordersBreakdown = statsData?.ordersBreakdown || {};
  const recentOrders = statsData?.recentOrders || [];
  const topSellingItems = statsData?.topSellingItems || [];

  // Formatted Metric Card Values from Dynamic API Response
  const activeMenusValue = String(overview.totalMenuItems ?? liveMenuCount ?? 0);
  const totalOrdersValue = String(overview.totalLifetimeOrders ?? overview.monthOrders ?? 0);
  const totalCustomersValue = String(overview.totalCustomers ?? 0);
  const totalIncomeValue = `₹${Number(overview.totalLifetimeSales ?? overview.monthSales ?? 0).toLocaleString()}`;
  const todayIncomeText = `₹${Number(overview.todaySales || 0).toLocaleString()} today`;
  const todayOrdersText = `${overview.todayOrders || 0} today`;

  const planBadgeText = subscription.planName
    ? `${subscription.planName} • ${subscription.status || "ACTIVE"} (${subscription.billingCycle || "MONTHLY"})`
    : "-";

  const branchBadgeText = subscription.maxBranches
    ? `${subscription.usedBranches || overview.totalBranches || 0}/${subscription.maxBranches} Branches • ${subscription.usedUsers || overview.totalStaff || 0}/${subscription.maxUsers || 0} Users`
    : (apiState?.branches?.length ? `${apiState.branches.length} Active Kitchen Outlets` : "-");

  return (
    <div className="mx-auto space-y-7 pb-10">
      {/* Top Banner with dynamic subscription details */}
      <PageHeader
        badge={planBadgeText}
        activeBadge={branchBadgeText}
        title="Operations Dashboard"
        subtitle={`Live overview, real-time order requests, branch metrics, and performance analytics for ${branchName}.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-full bg-[#8D0606] px-6 py-3 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition hover:bg-[#780404] active:scale-98"
              onClick={() => navigate("/orders")}
              type="button"
            >
              <ShoppingBag size={16} />
              <span>Live POS Feed</span>
            </button>
          </div>
        }
      />

      {/* Low Stock Warning Banner if any items low in stock */}
      {(overview.lowStockCount > 0 || lowStockItems.length > 0) && (
        <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-rose-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left alert info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-[#8D0606] shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Low Stock Alert
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] font-medium text-[#8D0606]">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    <span>{overview.lowStockCount || lowStockItems.length} items low</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                  Items below minimum threshold that need restocking.
                </p>
              </div>
            </div>

            {/* Middle Quick Stock Chips */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1 lg:justify-center">
              {lowStockItems.slice(0, 4).map((item, idx) => {
                const name = item.ingredientName || item.name || item.title || `Item #${idx + 1}`;
                const stock = Number(item.currentStock ?? item.quantity ?? 0);
                const unit = item.unit || "UNIT";
                const isZero = stock === 0;

                return (
                  <button
                    key={item.inventoryItemId || item.id || idx}
                    type="button"
                    onClick={() => navigate("/ingredients")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition border ${
                      isZero
                        ? "bg-rose-50/70 border-rose-200/80 text-rose-800 hover:bg-rose-100"
                        : "bg-amber-50/70 border-amber-200/80 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${isZero ? "bg-rose-500" : "bg-amber-500"}`} />
                    <span className="font-medium text-slate-800">{name}</span>
                    <span className="font-semibold text-slate-500">
                      ({stock} {unit})
                    </span>
                  </button>
                );
              })}
              {lowStockItems.length > 4 && (
                <button
                  type="button"
                  onClick={() => navigate("/ingredients")}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  +{lowStockItems.length - 4} more
                </button>
              )}
            </div>

            {/* Right Action Button */}
            <button
              type="button"
              onClick={() => navigate("/ingredients")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#780404] transition shrink-0"
            >
              <span>Manage Stock</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row (Dynamic values from overview) */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Menus"
          value={activeMenusValue}
          change={`${overview.totalStaff || 0} Staff Active`}
          good
          icon={UtensilsCrossed}
          color="red"
          footerLeft="Total Branch Menus"
          footerRight={`${overview.totalBranches || 1} Branches`}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrdersValue}
          change={todayOrdersText}
          good
          icon={ShoppingBag}
          color="emerald"
          footerLeft="Month Orders"
          footerRight={`${overview.monthOrders || 0} orders`}
        />
        <MetricCard
          title="Total Customers"
          value={totalCustomersValue}
          change={`AOV: ₹${Number(overview.averageOrderValue || 0).toLocaleString()}`}
          good={true}
          icon={Users}
          color="amber"
          footerLeft="Average Order Value"
          footerRight={`₹${Number(overview.averageOrderValue || 0).toLocaleString()}`}
        />
        <MetricCard
          title="Total Lifetime Sales"
          value={totalIncomeValue}
          change={todayIncomeText}
          good
          icon={DollarSign}
          color="sky"
          footerLeft="Month Sales"
          footerRight={`₹${Number(overview.monthSales || 0).toLocaleString()}`}
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueBars salesTrend={salesTrend} overview={overview} />
        <CustomerLine ordersBreakdown={ordersBreakdown} />
      </div>

      {/* Recent Orders & Trending Menus Row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_480px] items-start">
        <RecentOrders navigate={navigate} serverOrders={recentOrders} />
        <TrendingMenus navigate={navigate} serverTrending={topSellingItems} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  good = true,
  icon: Icon,
  color = "red",
  footerLeft = "Live Kitchen Feed",
  footerRight = "Updated live",
}) {
  const colorMap = {
    red: "bg-rose-50 text-[#8D0606] border-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
  };

  const scheme = colorMap[color] || colorMap.red;

  return (
    <Card className="relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`grid size-10 place-items-center rounded-xl border ${scheme}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            good ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{change}</span>
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-normal text-slate-400">
        <span>{footerLeft}</span>
        <span className="font-semibold text-slate-600">{footerRight}</span>
      </div>
    </Card>
  );
}

function RevenueBars({ salesTrend = [], overview = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const trendHasData = Array.isArray(salesTrend) && salesTrend.length > 0;

  // Format dates dynamically from the API (e.g., "2026-08-20" -> "20 Aug")
  const trendItems = trendHasData
    ? salesTrend.map((s) => {
        let label = s.date || "";
        let fullDate = s.date || "";
        try {
          if (s.date && s.date.includes("-")) {
            const parts = s.date.split("-");
            if (parts.length >= 3) {
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const d = Number(parts[2]);
              const m = Number(parts[1]) - 1;
              label = `${d} ${months[m] || ""}`.trim();
              fullDate = `${d} ${months[m] || ""} ${parts[0]}`;
            }
          }
        } catch (err) {
          console.error(err);
        }
        return {
          date: label || s.date || "Day",
          fullDate: fullDate || s.date || "Date",
          revenue: Number(s.revenue) || 0,
          orders: Number(s.orders) || 0,
        };
      })
    : [];

  const maxRevenue = Math.max(...trendItems.map((t) => t.revenue), 100);
  const maxOrders = Math.max(...trendItems.map((t) => t.orders), 1);

  return (
    <Card className="p-5 sm:p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Sales & Orders Trend</h3>
          <p className="text-xs text-slate-500 font-medium">Daily sales revenue (₹) and order count</p>
        </div>

        {/* Clear Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-sky-500" />
            <span className="text-slate-700">Revenue (₹)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#8D0606]" />
            <span className="text-slate-700">Orders</span>
          </div>
        </div>
      </div>

      {/* Dynamic Summary KPI Pills from Overview */}
      <div className="mb-6 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-3.5 text-center border border-slate-100">
        <div className="p-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lifetime Sales</p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
            ₹{Number(overview.totalLifetimeSales || overview.monthSales || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-1 border-l sm:border-x border-slate-200/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Month Sales</p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-800">
            ₹{Number(overview.monthSales || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-1 border-t sm:border-t-0 sm:border-r border-slate-200/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today Sales</p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-[#8D0606]">
            ₹{Number(overview.todaySales || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-1 border-t sm:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today Orders</p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-emerald-700">{overview.todayOrders || 0} Orders</p>
        </div>
      </div>

      {/* Chart with Smart Proportions and Tooltip */}
      <div className="relative h-[260px] px-2 pt-2">
        {/* Y-axis gridlines for Revenue */}
        {[100, 75, 50, 25, 0].map((percent) => (
          <div
            key={percent}
            className="absolute left-0 right-0 flex items-center gap-3"
            style={{ bottom: `${(percent / 100) * 190 + 32}px` }}
          >
            <span className="w-10 text-right text-[11px] font-medium text-slate-400">
              ₹{Math.round((percent / 100) * maxRevenue)}
            </span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
        ))}

        {/* Bars Container */}
        {trendItems.length > 0 ? (
          <div className="absolute bottom-8 left-14 right-4 flex h-[190px] items-end justify-around gap-2">
            {trendItems.map((item, index) => {
              const revHeight = maxRevenue > 0 && item.revenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              const ordHeight = maxOrders > 0 && item.orders > 0 ? (item.orders / maxOrders) * 100 : 0;
              const isHovered = hoveredIdx === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="group relative flex h-full flex-1 max-w-[54px] flex-col items-center justify-end cursor-pointer"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 z-30 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
                      <p className="font-bold text-slate-200 text-[10.5px]">{item.fullDate}</p>
                      <div className="flex items-center gap-2.5 mt-0.5 font-semibold">
                        <span className="text-sky-300">₹{item.revenue.toLocaleString()}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-rose-300">{item.orders} {item.orders === 1 ? "order" : "orders"}</span>
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-slate-900" />
                    </div>
                  )}

                  {/* Bars group */}
                  <div className="flex w-full items-end justify-center gap-1 sm:gap-1.5 h-full">
                    {/* Revenue Bar */}
                    <div className="relative flex flex-col items-center justify-end h-full w-3 sm:w-4">
                      {item.revenue > 0 ? (
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${Math.max(8, revHeight)}%` }}
                        />
                      ) : (
                        <div className="h-0.5 w-full bg-slate-200 rounded-full" />
                      )}
                    </div>

                    {/* Orders Bar */}
                    <div className="relative flex flex-col items-center justify-end h-full w-3 sm:w-4">
                      {item.orders > 0 ? (
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#8D0606] to-rose-500 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${Math.max(8, ordHeight)}%` }}
                        />
                      ) : (
                        <div className="h-0.5 w-full bg-slate-200 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            No sales trend records available for this period.
          </div>
        )}

        {/* X-axis labels */}
        {trendItems.length > 0 && (
          <div className="absolute bottom-0 left-14 right-4 flex justify-around text-[11px] font-bold text-slate-500">
            {trendItems.map((item, idx) => (
              <span
                key={idx}
                className={`flex-1 text-center truncate px-0.5 transition-colors ${
                  hoveredIdx === idx ? "text-[#8D0606]" : "text-slate-500"
                }`}
              >
                {item.date}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function CustomerLine({ ordersBreakdown = {} }) {
  const [activeTab, setActiveTab] = useState("Sources");
  const sources = ordersBreakdown?.bySource || {};
  const status = ordersBreakdown?.byStatus || {};

  const sourceEntries = Object.entries(sources);
  const totalChannelOrders = sourceEntries.reduce((sum, [, val]) => sum + (Number(val?.count) || 0), 0);

  const statusEntries = [
    { label: "Placed", key: "PLACED", color: "border-sky-200 bg-sky-50 text-sky-700", icon: ShoppingBag },
    { label: "Preparing", key: "PREPARING", color: "border-amber-200 bg-amber-50 text-amber-700", icon: ChefHat },
    { label: "Completed", key: "COMPLETED", color: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCheck },
    { label: "Cancelled", key: "CANCELLED", color: "border-rose-200 bg-rose-50 text-rose-700", icon: Ban },
  ];

  const totalStatusOrders = Object.values(status).reduce((sum, count) => sum + (Number(count) || 0), 0);

  const sourceMeta = {
    MANUAL: { name: "Manual / POS Counter", color: "bg-[#8D0606]", barColor: "from-[#8D0606] to-rose-600" },
    SWIGGY: { name: "Swiggy Delivery Feed", color: "bg-amber-500", barColor: "from-amber-500 to-amber-400" },
    ZOMATO: { name: "Zomato Delivery Feed", color: "bg-rose-500", barColor: "from-rose-500 to-pink-500" },
  };

  return (
    <Card className="p-5 sm:p-6 border border-slate-200 shadow-xs">
      <CardTitle
        title="Orders Distribution & Flow"
        subtitle="Distribution across delivery channels & kitchen prep status"
        action={
          <div className="flex h-9 rounded-xl border border-slate-200 p-1 text-xs font-medium text-slate-600 bg-slate-50">
            {["Sources", "Status"].map((option) => (
              <button
                key={option}
                className={`rounded-lg px-3 py-1 transition ${
                  activeTab === option ? "bg-[#8D0606] text-white font-semibold shadow-xs" : "hover:text-slate-900"
                }`}
                onClick={() => setActiveTab(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        }
      />

      {activeTab === "Sources" ? (
        <div className="mt-5 space-y-3.5">
          {sourceEntries.length > 0 ? (
            sourceEntries.map(([sourceKey, channelData]) => {
              const meta = sourceMeta[sourceKey] || {
                name: sourceKey.replace(/_/g, " "),
                color: "bg-indigo-500",
                barColor: "from-indigo-500 to-sky-400",
              };
              const count = Number(channelData?.count) || 0;
              const amount = Number(channelData?.totalAmount) || 0;
              const pct = totalChannelOrders > 0 ? Math.round((count / totalChannelOrders) * 100) : 0;

              return (
                <div key={sourceKey} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-full ${meta.color}`} />
                      <span className="text-slate-800 font-bold">{meta.name}</span>
                      <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-500">
                        {pct}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-semibold">{count} Orders</span>
                      <span className="ml-2 font-extrabold text-[#8D0606]">₹{amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dynamic Progress bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.barColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">No source breakdown data available</div>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {statusEntries.map((st) => {
            const count = Number(status[st.key]) || 0;
            const pct = totalStatusOrders > 0 ? Math.round((count / totalStatusOrders) * 100) : 0;
            const Icon = st.icon;

            return (
              <div key={st.label} className={`rounded-2xl border p-4 transition ${st.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{st.label}</span>
                  {Icon && <Icon size={16} />}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{count}</span>
                  <span className="text-xs font-semibold opacity-75">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RecentOrders({ navigate, serverOrders }) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const ordersToDisplay = Array.isArray(serverOrders) ? serverOrders : [];
  const paginatedOrders = ordersToDisplay.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card className="p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[460px]">
      <div>
        <CardTitle
          title="Recent Order Requests"
          subtitle="Live orders needing kitchen prep & delivery"
          action={
            <button
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 whitespace-nowrap"
              onClick={() => navigate("/orders")}
              type="button"
            >
              <span>View All Orders</span>
              <ChevronRight size={14} />
            </button>
          }
        />
        {ordersToDisplay.length > 0 ? (
          <div className="divide-y divide-slate-100 mt-2">
            {paginatedOrders.map((row) => (
              <OrderRow key={row.id} row={row} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-2.5">
              <ShoppingBag size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Live Orders Yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Orders placed from POS counter or delivery feeds will display here in real-time.
            </p>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-[#8D0606] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#780404]"
            >
              <span>Go to Orders</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {ordersToDisplay.length > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalItems={ordersToDisplay.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          className="mt-4 rounded-xl"
        />
      )}
    </Card>
  );
}

function OrderRow({ row, navigate }) {
  const items = Array.isArray(row.items) ? row.items : [];
  const primaryItemName = items[0]?.menuItem?.name || row.menuItemName || "Custom Order Item";
  const itemsCountText =
    items.length > 1
      ? `${primaryItemName} +${items.length - 1} more`
      : primaryItemName;

  const customerName =
    [row.customer?.firstName, row.customer?.lastName].filter(Boolean).join(" ").trim() ||
    row.customer?.name ||
    row.customerName ||
    "Walk-in Customer";

  const branchName = row.branch?.name || "Main Kitchen";
  const sourceName = row.source || "MANUAL";
  const price = `₹${Number(row.totalAmount || 0).toLocaleString()}`;
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || items.length || 1;
  const status = (row.status || "PLACED").toUpperCase();
  const code = `#ORD-${row.id || "00"}`;
  const image =
    items[0]?.menuItem?.image ||
    row.image ||
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80";

  let formattedTime = "";
  if (row.createdAt) {
    try {
      const d = new Date(row.createdAt);
      formattedTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {}
  }

  const statusClass =
    status === "DELIVERED" || status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "CANCELLED" || status === "CANCELED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <button
      className="flex w-full items-center gap-3 py-3 px-1 sm:px-2 text-left transition hover:bg-slate-50/80 rounded-xl"
      onClick={() => navigate("/orders")}
      type="button"
    >
      {/* Dish Thumbnail */}
      <img src={image} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shrink-0 shadow-2xs" />

      {/* Dynamic Content Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800 truncate" title={itemsCountText}>
            {itemsCountText}
          </h4>
          <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0 whitespace-nowrap">{price}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-slate-600 font-medium truncate">
            <span className="font-bold text-[#8D0606]">{code}</span>{" "}
            <span className="text-slate-400 font-normal">• {customerName}</span>
          </p>
          <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border shrink-0 whitespace-nowrap ${statusClass}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5 truncate">
          <span>{totalQty} {totalQty === 1 ? "item" : "items"}</span>
          <span>•</span>
          <span className="truncate">{branchName} ({sourceName})</span>
          {formattedTime && (
            <>
              <span>•</span>
              <span>{formattedTime}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function TrendingMenus({ navigate, serverTrending }) {
  const trendingList = Array.isArray(serverTrending) ? serverTrending : [];

  return (
    <Card className="p-4 sm:p-6 border border-slate-200 shadow-xs min-h-[460px]">
      <CardTitle
        title="Top Selling Dishes"
        subtitle="Ranked by orders and sales revenue"
        action={
          <button
            className="flex items-center gap-1 text-xs font-semibold text-[#8D0606] hover:underline"
            onClick={() => navigate("/menu")}
            type="button"
          >
            <span>All Menus</span>
            <ChevronRight size={14} />
          </button>
        }
      />
      {trendingList.length > 0 ? (
        <div className="divide-y divide-slate-100 mt-2">
          {trendingList.map((item, index) => (
            <TrendingItem key={item.menuItemId || item.id || index} item={item} index={index} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-14 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-2.5">
            <UtensilsCrossed size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Top Selling Dishes Yet</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Best selling and popular dishes will be ranked here automatically as orders are placed.
          </p>
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-[#8D0606] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#780404]"
          >
            <span>Explore Menu</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
}

export function TrendingItem({ item, index, navigate }) {
  const nav = navigate || useNavigate();
  const isArray = Array.isArray(item);
  const title = isArray ? item[0] : item.name || item.dishName || "Menu Dish";
  const price = isArray ? item[1] : `₹${Number(item.price || 0).toLocaleString()}`;
  const soldCount = item.totalQuantitySold ?? item.ordersCount ?? item.totalOrders ?? 0;
  const revenue = item.totalRevenue ?? (Number(item.price || 0) * Number(soldCount || 1));
  const ordersText = isArray
    ? item[2]
    : `${soldCount} sold • ₹${Number(revenue || 0).toLocaleString()}`;
  const image =
    (isArray ? item[3] : item.image) ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";

  return (
    <button
      className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/80 rounded-xl px-2"
      onClick={() => nav("/menu")}
      type="button"
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#8D0606] text-[10px] font-bold text-white shadow-xs z-10">
          #{index + 1}
        </span>
        <img src={image} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shadow-2xs" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate" title={title}>{title}</h4>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8D0606]">{price}</span>
          <span className="text-[11px] font-medium text-slate-500">{ordersText}</span>
        </div>
      </div>
    </button>
  );
}

