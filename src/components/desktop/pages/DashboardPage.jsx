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
  Boxes,
  Sparkles,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl, getStoredToken } from "../../../api";
import { Card, CardTitle } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { SelectPill } from "../../ui/SelectPill";
import { Pagination } from "../../ui/Pagination";
import { resolveSelectedBranchId } from "../../../utils/helpers";

export function DashboardPage({ apiState }) {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const liveMenuCount = apiState?.menus?.length || 0;
  
  const activeBranchId = resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  const selectedBranch = (apiState?.branches || []).find((b) => String(b.id) === String(activeBranchId));
  const branchName = selectedBranch?.name || apiState?.kitchen?.kitchenName || "Main Cloud Kitchen";

  useEffect(() => {
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
        console.log(result);
        try {
          const parsed = JSON.parse(result);
          if (parsed && (parsed.status === true || parsed.data)) {
            setStatsData(parsed.data || parsed);
          }
        } catch (e) {
          console.error("Error parsing dashboard stats:", e);
        }
      })
      .catch((error) => console.error(error));
  }, [apiState?.token, activeBranchId]);

  const overview = statsData?.overview || {};
  const subscription = statsData?.subscription || {};
  const lowStockItems = statsData?.lowStockItems || [];
  const salesTrend = statsData?.salesTrend || [];
  const ordersBreakdown = statsData?.ordersBreakdown || {};

  // Formatted Metric Card Values
  const activeMenusValue = String(overview.totalMenuItems ?? liveMenuCount);
  const totalOrdersValue = String(overview.totalLifetimeOrders ?? overview.monthOrders ?? 0);
  const totalCustomersValue = String(overview.totalCustomers ?? 0);
  const totalIncomeValue = `₹${Number(overview.totalLifetimeSales ?? overview.monthSales ?? 0).toLocaleString()}`;
  const todayIncomeText = `₹${Number(overview.todaySales || 0).toLocaleString()} today`;
  const todayOrdersText = `${overview.todayOrders || 0} placed today`;

  return (
    <div className="mx-auto space-y-7 pb-10">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge={subscription.planName ? `${subscription.planName} • ${subscription.status || "Active"}` : "Cloud Kitchen Hub"}
        activeBadge={`${apiState?.branches?.length || overview.totalBranches || 1} Active Kitchen Outlets`}
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
      {lowStockItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Low Inventory Warning ({overview.lowStockCount || lowStockItems.length} items need restock)
              </h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {lowStockItems.slice(0, 4).map((item) => (
                  <span
                    key={item.inventoryItemId}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200 shadow-2xs"
                  >
                    <span>{item.ingredientName}</span>
                    <span className="font-bold text-rose-700">({item.currentStock} {item.unit})</span>
                  </span>
                ))}
                {lowStockItems.length > 4 && (
                  <span className="text-[11px] font-bold text-amber-700 self-center">
                    +{lowStockItems.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/ingredients")}
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 shadow-xs"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Menus"
          value={activeMenusValue}
          change={`Total Menu Items`}
          good
          icon={UtensilsCrossed}
          color="red"
        />
        <MetricCard
          title="Total Orders"
          value={totalOrdersValue}
          change={todayOrdersText}
          good
          icon={ShoppingBag}
          color="emerald"
        />
        <MetricCard
          title="Total Customers"
          value={totalCustomersValue}
          change={`AOV: ₹${overview.averageOrderValue || 0}`}
          good={true}
          icon={Users}
          color="amber"
        />
        <MetricCard
          title="Total Sales"
          value={totalIncomeValue}
          change={todayIncomeText}
          good
          icon={DollarSign}
          color="sky"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueBars salesTrend={salesTrend} overview={overview} />
        <CustomerLine ordersBreakdown={ordersBreakdown} />
      </div>

      {/* Recent Orders & Trending Menus Row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_480px] items-start">
        <RecentOrders navigate={navigate} serverOrders={statsData?.recentOrders} />
        <TrendingMenus navigate={navigate} serverTrending={statsData?.topSellingItems} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, good = true, icon: Icon, color = "red" }) {
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
        <span>Live Kitchen Feed</span>
        <span className="font-semibold text-slate-600">Updated live</span>
      </div>
    </Card>
  );
}

function RevenueBars({ salesTrend = [], overview = {} }) {
  const [period, setPeriod] = useState("Weekly");

  const trendHasData = salesTrend && salesTrend.length > 0;
  const trendLabels = trendHasData ? salesTrend.map((s) => s.date ? s.date.slice(5) : "") : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const trendIncome = trendHasData ? salesTrend.map((s) => s.revenue || 0) : [0, 0, 0, 0, 0, 0, 0];
  const trendOrders = trendHasData ? salesTrend.map((s) => s.orders || 0) : [0, 0, 0, 0, 0, 0, 0];

  const maxVal = Math.max(...trendIncome, ...trendOrders, 100);

  return (
    <Card className="p-6 border border-slate-200 shadow-xs">
      <CardTitle
        title="Sales & Orders Trend"
        subtitle="Recent daily sales revenue vs order count"
        action={<SelectPill value={period} onChange={setPeriod} />}
      />
      <div className="mb-6 mt-4 flex justify-around rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Month Sales</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">₹{Number(overview.monthSales || 0).toLocaleString()}</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Today Sales</p>
          <p className="mt-1 text-xl font-semibold text-[#8D0606]">₹{Number(overview.todaySales || 0).toLocaleString()}</p>
        </div>
      </div>
      <BarChart income={trendIncome} expense={trendOrders} labels={trendLabels} max={maxVal} />
    </Card>
  );
}

function BarChart({ income, expense, labels, max = 120 }) {
  const safeMax = max > 0 ? max : 100;
  return (
    <div className="relative h-[280px] px-2 pt-4">
      {[100, 75, 50, 25, 0].map((percent) => (
        <div
          key={percent}
          className="absolute left-0 right-0 flex items-center gap-3"
          style={{ bottom: `${(percent / 100) * 210 + 34}px` }}
        >
          <span className="w-7 text-right text-xs text-slate-400">{Math.round((percent / 100) * safeMax)}</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
      ))}
      <div className="absolute bottom-8 left-10 right-0 flex h-[210px] items-end justify-between">
        {income.map((value, index) => (
          <div key={labels[index] || index} className="flex h-full w-8 items-end justify-center gap-1">
            <span
              className="chart-bar w-2.5 rounded-t-sm bg-sky-500 transition-all duration-300 hover:bg-sky-600"
              style={{ height: `${Math.max(4, (value / safeMax) * 100)}%` }}
              title={`Revenue: ₹${value}`}
            />
            <span
              className="chart-bar w-2.5 rounded-t-sm bg-[#8D0606] transition-all duration-300 hover:bg-[#700404]"
              style={{ height: `${Math.max(4, ((expense[index] || 0) / safeMax) * 100)}%` }}
              title={`Orders: ${expense[index] || 0}`}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs font-medium text-slate-500">
        {labels.map((label, idx) => (
          <span key={idx}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function CustomerLine({ ordersBreakdown = {} }) {
  const [activeTab, setActiveTab] = useState("Sources");
  const sources = ordersBreakdown?.bySource || {};
  const status = ordersBreakdown?.byStatus || {};

  return (
    <Card className="p-6 border border-slate-200 shadow-xs">
      <CardTitle
        title="Orders Distribution & Flow"
        subtitle="Distribution across delivery channels & prep status"
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
        <div className="mt-6 space-y-4">
          {[
            { name: "Manual / POS Counter", key: "MANUAL", color: "bg-[#8D0606]", textColor: "text-[#8D0606]" },
            { name: "Swiggy Delivery Feed", key: "SWIGGY", color: "bg-amber-500", textColor: "text-amber-600" },
            { name: "Zomato Delivery Feed", key: "ZOMATO", color: "bg-rose-500", textColor: "text-rose-600" },
          ].map((ch) => {
            const channelData = sources[ch.key] || { count: 0, totalAmount: 0 };
            return (
              <div key={ch.key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${ch.color}`} />
                    <span className="text-slate-800">{ch.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900">{channelData.count} Orders</span>
                    <span className="ml-2 font-extrabold text-[#8D0606]">₹{Number(channelData.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { label: "Placed", count: status.PLACED || 0, color: "border-sky-200 bg-sky-50 text-sky-700" },
            { label: "Preparing", count: status.PREPARING || 0, color: "border-amber-200 bg-amber-50 text-amber-700" },
            { label: "Completed", count: status.COMPLETED || 0, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
            { label: "Cancelled", count: status.CANCELLED || 0, color: "border-rose-200 bg-rose-50 text-rose-700" },
          ].map((st) => (
            <div key={st.label} className={`rounded-xl border p-4 text-center ${st.color}`}>
              <p className="text-xs font-bold uppercase tracking-wider">{st.label}</p>
              <p className="mt-1 text-2xl font-bold">{st.count}</p>
            </div>
          ))}
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
    <Card className="p-6 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[460px]">
      <div>
        <CardTitle
          title="Recent Order Requests"
          subtitle="Live orders needing kitchen prep & delivery"
          action={
            <button
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
            {paginatedOrders.map((row, idx) => (
              <OrderRow key={Array.isArray(row) ? `${row[0]}-${row[4]}` : row.id || idx} row={row} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-2.5">
              <ShoppingBag size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Live Orders Yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Orders placed from POS or delivery feeds will display here in real-time.
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

      {ordersToDisplay.length > 0 && (
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
  const isArray = Array.isArray(row);
  const title = isArray ? row[0] : row.items?.[0]?.menuItem?.name || "Order Item";
  const customer = isArray ? row[1] : `${row.customer?.firstName || ""} ${row.customer?.lastName || ""}`.trim() || "Walk-in";
  const address = isArray ? row[2] : row.customer?.addresses?.[0]?.address1 || "Pickup / Counter";
  const price = isArray ? row[3] : `₹${row.totalAmount || 0}`;
  const qty = isArray ? row[4] : `${row.items?.length || 1} items`;
  const status = isArray ? row[5] : (row.status || "PLACED").toUpperCase();
  const code = isArray ? row[6] : `#ORD-${row.id || "00"}`;
  const image = isArray ? row[7] : "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80";

  const statusClass =
    status === "DELIVERED" || status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "CANCELLED" || status === "CANCELED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <button
      className="grid w-full grid-cols-5 items-center gap-3 py-3 px-2 text-left transition hover:bg-slate-50/80 rounded-xl"
      onClick={() => navigate("/orders")}
      type="button"
    >
      <div className="flex col-span-2 items-center gap-3 min-w-0">
        <img src={image} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shrink-0 shadow-2xs" />
        <div className="min-w-0">
          <h4 className="text-[16px] font-medium text-slate-800 truncate" title={title}>{title}</h4>
          <p className="mt-0.5 text-[11px] font-semibold text-[#8D0606]">{code}</p>
        </div>
      </div>

      <div className="min-w-0 hidden sm:block">
        <p className="text-xs font-semibold text-slate-700 truncate">{customer}</p>
        <p className="mt-0.5 text-[11px] font-normal text-slate-400 truncate">{address}</p>
      </div>

      <div className="text-right sm:text-left">
        <p className="text-xs font-semibold text-slate-900">{price}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{qty}</p>
      </div>

      <div className="flex justify-end">
        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${statusClass}`}>
          {status}
        </span>
      </div>
    </button>
  );
}

function TrendingMenus({ navigate, serverTrending }) {
  const trendingList = Array.isArray(serverTrending) ? serverTrending : [];

  return (
    <Card className="p-6 border border-slate-200 shadow-xs min-h-[460px]">
      <CardTitle
        title="Daily Trending Menus"
        subtitle="Top ordered dishes in kitchen"
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
            <TrendingItem key={Array.isArray(item) ? item[0] : item.id || index} item={item} index={index} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-14 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-2.5">
            <UtensilsCrossed size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Trending Menus Yet</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Best selling and popular dishes will be ranked here automatically.
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
  const price = isArray ? item[1] : `₹${item.price || 0}`;
  const ordersText = isArray ? item[2] : `${item.ordersCount || item.totalOrders || 0} orders`;
  const image = isArray ? item[3] : item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";

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
        <h4 className="text-[16px] font-medium text-slate-800 truncate" title={title}>{title}</h4>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8D0606]">{price}</span>
          <span className="text-[11px] font-normal text-slate-400">{ordersText}</span>
        </div>
      </div>
    </button>
  );
}
