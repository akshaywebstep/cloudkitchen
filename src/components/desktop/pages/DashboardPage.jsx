import React, { useState } from "react";
import {
  UtensilsCrossed,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle } from "../../ui/Card";
import { SelectPill } from "../../ui/SelectPill";
import { Pagination } from "../../ui/Pagination";
import { orderRows, trendingMenus } from "../../../constants/mockData";

export function DashboardPage({ apiState }) {
  const navigate = useNavigate();
  const liveMenuCount = apiState?.menus?.length || 56;

  return (
    <div className="mx-auto  space-y-7 pb-10">
      {/* Metrics Row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Menus"
          value={String(liveMenuCount)}
          change="+4.2%"
          good
          icon={UtensilsCrossed}
          color="red"
        />
        <MetricCard
          title="Total Orders"
          value="785"
          change="+2.7%"
          good
          icon={ShoppingBag}
          color="emerald"
        />
        <MetricCard
          title="Total Customers"
          value="452"
          change="-1.8%"
          good={false}
          icon={Users}
          color="amber"
        />
        <MetricCard
          title="Total Income"
          value="$6,231"
          change="+5.4%"
          good
          icon={DollarSign}
          color="sky"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueBars />
        <CustomerLine />
      </div>

      {/* Recent Orders & Trending Menus Row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_480px] items-start">
        <RecentOrders navigate={navigate} />
        <TrendingMenus navigate={navigate} />
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
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${good ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
        >
          {good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{change}</span>
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-normal text-slate-400">
        <span>Compared to last month</span>
        <span className="font-semibold text-slate-600">Updated live</span>
      </div>
    </Card>
  );
}

function RevenueBars() {
  const [period, setPeriod] = useState("Monthly");
  const chartData = {
    Monthly: {
      income: [31, 36, 55, 75, 51, 83, 106, 100, 49],
      expense: [22, 28, 48, 65, 35, 66, 96, 78, 42],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    },
    Weekly: {
      income: [42, 55, 61, 48, 72, 90, 67],
      expense: [25, 34, 40, 32, 58, 62, 51],
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    Today: {
      income: [12, 22, 31, 28, 46, 58],
      expense: [8, 12, 19, 16, 24, 33],
      labels: ["8a", "10a", "12p", "2p", "4p", "6p"],
    },
  };
  const { income, expense, labels } = chartData[period];
  return (
    <Card className="p-6 border border-slate-200 shadow-xs">
      <CardTitle
        title="Revenue Overview"
        subtitle={`${period} income vs operational expense`}
        action={<SelectPill value={period} onChange={setPeriod} />}
      />
      <div className="mb-6 mt-4 flex justify-around rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Total Income</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">$561,623</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Total Expense</p>
          <p className="mt-1 text-xl font-semibold text-[#8D0606]">$126,621</p>
        </div>
      </div>
      <BarChart income={income} expense={expense} labels={labels} max={120} />
    </Card>
  );
}

function BarChart({ income, expense, labels, max = 120 }) {
  return (
    <div className="relative h-[280px] px-2 pt-4">
      {[120, 90, 60, 30, 0].map((line) => (
        <div
          key={line}
          className="absolute left-0 right-0 flex items-center gap-3"
          style={{ bottom: `${(line / max) * 210 + 34}px` }}
        >
          <span className="w-7 text-right text-xs text-slate-400">{line}</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
      ))}
      <div className="absolute bottom-8 left-10 right-0 flex h-[210px] items-end justify-between">
        {income.map((value, index) => (
          <div key={labels[index]} className="flex h-full w-8 items-end justify-center gap-1">
            <span
              className="chart-bar w-2 rounded-t-sm bg-sky-500 transition-all duration-300 hover:bg-sky-600"
              style={{ height: `${(value / max) * 100}%` }}
              title={`Income: $${value}`}
            />
            <span
              className="chart-bar w-2 rounded-t-sm bg-[#8D0606] transition-all duration-300 hover:bg-[#700404]"
              style={{ height: `${(expense[index] / max) * 100}%` }}
              title={`Expense: $${expense[index]}`}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs font-medium text-slate-500">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function CustomerLine() {
  const [period, setPeriod] = useState("Monthly");
  return (
    <Card className="p-6 border border-slate-200 shadow-xs">
      <CardTitle
        title="Customer Analytics"
        subtitle="Live traffic & order requests flow"
        action={
          <div className="flex h-9 rounded-xl border border-slate-200 p-1 text-xs font-medium text-slate-600 bg-slate-50">
            {["Monthly", "Weekly", "Today"].map((option) => (
              <button
                key={option}
                className={`rounded-lg px-3 py-1 transition ${period === option ? "bg-[#8D0606] text-white font-semibold shadow-xs" : "hover:text-slate-900"
                  }`}
                onClick={() => setPeriod(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        }
      />
      <LineChart period={period} />
    </Card>
  );
}

function LineChart({ period = "Monthly" }) {
  const redPath =
    period === "Today"
      ? "M0 180 C50 150 80 100 140 130 C210 160 235 70 300 90 C370 110 400 190 470 150 C510 120 540 105 560 115"
      : period === "Weekly"
        ? "M0 150 C55 100 105 190 168 140 C220 90 250 120 304 105 C380 75 410 180 470 150 C520 130 530 85 560 100"
        : "M0 170 C28 110 42 145 62 190 C88 220 130 110 176 100 C220 90 226 180 262 150 C306 115 338 90 384 145 C420 190 470 180 560 165";

  const bluePath =
    period === "Today"
      ? "M0 200 C80 170 110 185 170 145 C230 105 290 120 340 140 C410 180 470 160 560 135"
      : period === "Weekly"
        ? "M0 190 C70 150 105 170 158 140 C220 110 260 140 315 120 C380 95 425 140 560 120"
        : "M0 210 C50 165 85 190 134 165 C194 135 226 120 268 135 C324 155 312 190 382 185 C440 180 480 160 560 165";

  return (
    <div className="relative h-[300px]">
      {[90, 60, 30, 0, -30].map((line) => (
        <div
          key={line}
          className="absolute left-0 right-0 flex items-center gap-3"
          style={{ top: `${24 + ((90 - line) / 120) * 210}px` }}
        >
          <span className="w-7 text-right text-xs text-slate-400">{line}</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
      ))}
      <svg
        className="absolute left-10 right-0 top-8 h-[210px] w-[calc(100%-40px)]"
        viewBox="0 0 560 210"
        preserveAspectRatio="none"
      >
        <path d={redPath} fill="none" stroke="#8D0606" strokeWidth="3.5" strokeLinecap="round" />
        <path d={bluePath} fill="none" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs font-medium text-slate-400">
        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function RecentOrders({ navigate }) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const paginatedOrders = orderRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        <div className="divide-y divide-slate-100 mt-2">
          {paginatedOrders.map((row) => (
            <OrderRow key={`${row[0]}-${row[4]}`} row={row} navigate={navigate} />
          ))}
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={orderRows.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        className="mt-4 rounded-xl"
      />
    </Card>
  );
}

function OrderRow({ row, navigate }) {
  const statusClass =
    row[5] === "DELIVERED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : row[5] === "CANCELED"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <button
      className="grid w-full grid-cols-5 items-center gap-3 py-3 px-2 text-left transition hover:bg-slate-50/80 rounded-xl"
      onClick={() => navigate("/order")}
      type="button"
    >
      {/* Thumbnail + Dish Name + Order Code */}
      <div className="flex col-span-2 items-center gap-3 min-w-0">
        <img src={row[7]} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shrink-0 shadow-2xs" />
        <div className="min-w-0 ]">
          <h4 className="text-[16px] font-medium text-slate-800 truncate" title={row[0]}>{row[0]}</h4>
          <p className="mt-0.5 text-[11px] font-semibold text-[#8D0606]">{row[6]}</p>
        </div>
      </div>

      {/* Customer Name + Address */}
      <div className="min-w-0 hidden sm:block">
        <p className="text-xs font-semibold text-slate-700 truncate">{row[1]}</p>
        <p className="mt-0.5 text-[11px] font-normal text-slate-400 truncate">{row[2]}</p>
      </div>

      {/* Price + Quantity */}
      <div className="text-right sm:text-left">
        <p className="text-xs font-semibold text-slate-900">{row[3]}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{row[4]}</p>
      </div>

      {/* Status Pill */}
      <div className="flex justify-end">
        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${statusClass}`}>
          {row[5]}
        </span>
      </div>
    </button>
  );
}

function TrendingMenus({ navigate }) {
  return (
    <Card className="p-6 border border-slate-200 shadow-xs min-h-[460px]">
      <CardTitle
        title="Daily Trending Menus"
        subtitle="Top ordered dishes in last 24h"
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
      <div className="divide-y divide-slate-100 mt-2">
        {trendingMenus.map((item, index) => (
          <TrendingItem key={item[0]} item={item} index={index} navigate={navigate} />
        ))}
      </div>
    </Card>
  );
}

export function TrendingItem({ item, index, navigate }) {
  const nav = navigate || useNavigate();
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
        <img src={item[3]} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shadow-2xs" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[16px] font-medium text-slate-800 truncate" title={item[0]}>{item[0]}</h4>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8D0606]">{item[1]}</span>
          <span className="text-[11px] font-normal text-slate-400">{item[2]}</span>
        </div>
      </div>
    </button>
  );
}
