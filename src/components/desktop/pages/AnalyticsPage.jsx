import React, { useState } from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  Heart,
  LineChart,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle } from "../../ui/Card";
import { SelectPill } from "../../ui/SelectPill";
import { Pagination } from "../../ui/Pagination";
import { favoriteItems, foodImages, loyalCustomers, red, trendingMenus } from "../../../constants/mockData";
import { TrendingItem } from "./DashboardPage";

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-3.5 -mx-6 -mt-6 rounded-t-2xl">
      <Icon className="text-[#8D0606]" size={18} />
      <h2 className="text-sm font-semibold tracking-tight text-slate-800">{title}</h2>
      {subtitle ? <span className="ml-auto text-xs font-normal text-slate-400">{subtitle}</span> : null}
    </div>
  );
}

function IconBadge({ icon: Icon }) {
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#8D0606] text-white shadow-xs">
      <Icon size={20} />
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[90%] space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <IconBadge icon={ChartNoAxesCombined} />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Analytics Dashboard</h1>
            <p className="mt-0.5 text-xs font-normal text-slate-400">
              Track sales, customer engagement, and trending menu performance
            </p>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-[#fff1f1] px-4 py-2.5 text-xs font-semibold text-[#8D0606] transition hover:bg-[#ffe4e4]"
          onClick={() => navigate("/menu")}
          type="button"
        >
          <Sparkles size={16} /> View Full Report
        </button>
      </div>

      <FavoritesPanel navigate={navigate} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <SalesSummary />
        <LoyalCustomers navigate={navigate} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <CustomerBars />
        <RevenueArea />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DailyTrendingList navigate={navigate} />
        <BestSellerMenus navigate={navigate} />
      </div>
    </div>
  );
}

function FavoritesPanel({ navigate }) {
  const [activeTab, setActiveTab] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 3;

  const visibleItems =
    activeTab === "All Categories"
      ? favoriteItems
      : favoriteItems.filter((item) =>
          item[0].toLowerCase().includes(activeTab.toLowerCase().split(" ")[0])
        );

  const itemsToDisplay = visibleItems.length ? visibleItems : favoriteItems;
  const paginatedItems = itemsToDisplay.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={Heart} title="Most Favorited Items" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <CardTitle title="Favorites Performance" subtitle="Customer likes, interest index & total sales" />
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-1 text-xs font-medium text-slate-600 bg-slate-50">
          {["All Categories", "Main Course", "Pizza", "Drink", "Dessert"].map((tab) => (
            <button
              key={tab}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === tab ? "bg-[#8D0606] text-white font-semibold shadow-xs" : "hover:text-slate-900"
              }`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {paginatedItems.map((item) => (
          <FavoriteRow key={item[0]} item={item} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={itemsToDisplay.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        className="mt-4"
      />
    </Card>
  );
}

function FavoriteRow({ item }) {
  return (
    <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-[auto_1fr_90px_90px_110px_60px] sm:items-center">
      <img src={item[4]} alt="" className="size-16 rounded-xl object-cover border border-slate-100 shadow-2xs" />
      <div className="min-w-0">
        <h4 className="text-[16px] font-medium text-slate-800 truncate">{item[0]}</h4>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-500">
          <Star size={11} fill="currentColor" />
          <Star size={11} fill="currentColor" />
          <Star size={11} fill="currentColor" />
          <Star size={11} fill="currentColor" />
          <span className="ml-1 font-normal text-slate-400">(454 reviews)</span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#8D0606]">
          <Heart size={13} fill="currentColor" /> 256k Liked
        </p>
      </div>

      <SparkLine />

      <div>
        <p className="text-sm font-semibold text-slate-800">{item[1]}</p>
        <p className="text-[11px] font-normal text-slate-400">Interest</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
          <BarChart3 size={13} className="text-[#8D0606]" />
          {item[2]}
        </p>
        <p className="text-[11px] font-normal text-slate-400">Total Sales</p>
      </div>

      <ProgressRing value={item[3]} />
    </div>
  );
}

function SparkLine() {
  return (
    <svg width="80" height="36" viewBox="0 0 104 48">
      <path d="M2 22 L12 31 L20 18 L29 27 L38 12 L47 32 L56 19 L64 37 L74 14 L84 29 L96 20 L102 28" fill="none" stroke={red} strokeWidth="4" />
    </svg>
  );
}

function ProgressRing({ value }) {
  const num = parseInt(value, 10);
  const dash = `${num} ${100 - num}`;
  return (
    <div className="relative grid size-12 place-items-center">
      <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
        <path d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <path d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" fill="none" stroke={red} strokeWidth="4" strokeDasharray={dash} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[11px] font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function SalesSummary() {
  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={BarChart3} title="Sales Breakdown Summary" />
      <CardTitle title="Sales Summary" subtitle="Menu items sold vs total revenue & savings" action={<SelectPill />} />
      <div className="grid items-center gap-6 mt-4 md:grid-cols-[200px_1fr]">
        <div className="space-y-5">
          <Legend color="#2BC155" value="63,876" label="Menu Sold" />
          <Legend color="#FFB800" value="$873,335" label="Revenue" />
          <Legend color="#8D0606" value="$97,126" label="Savings (20%)" />
        </div>
        <div className="flex justify-center">
          <svg className="size-48" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="78" fill="none" stroke="#f1f5f9" strokeWidth="9" />
            <circle cx="110" cy="110" r="78" fill="none" stroke="#8D0606" strokeWidth="9" strokeDasharray="228 490" strokeLinecap="butt" transform="rotate(-90 110 110)" />
            <circle cx="110" cy="110" r="60" fill="none" stroke="#FFB800" strokeWidth="9" strokeDasharray="270 377" strokeLinecap="butt" transform="rotate(-90 110 110)" />
            <circle cx="110" cy="110" r="42" fill="none" stroke="#18b978" strokeWidth="9" strokeDasharray="225 264" strokeLinecap="butt" transform="rotate(-90 110 110)" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

function Legend({ color, value, label }) {
  return (
    <div className="flex items-center gap-4">
      <span className="size-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
        <p className="text-[11px] font-normal text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function LoyalCustomers({ navigate }) {
  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={Users} title="Top Loyal Customers" />
      <CardTitle title="Loyal Customers" subtitle="Most frequent ordering profiles" />
      <div className="space-y-4 mt-3">
        {loyalCustomers.map((customer) => (
          <div key={customer[0]} className="flex items-center gap-3.5 p-2 rounded-xl transition hover:bg-slate-50/70">
            <div className={`grid size-10 place-items-center rounded-xl shrink-0 ${customer[2]}`}>
              <UserRound size={20} className="text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{customer[0]}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#8D0606]">{customer[1]}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CustomerBars() {
  const plus = [20, 40, 60, 35, 50, 70, 30];
  const minus = [28, 32, 10, 5, 35, 10, 30];
  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={LineChart} title="Customer Traffic Map" />
      <CardTitle title="Customer Traffic" subtitle="Active vs returning user distribution" />
      <div className="relative h-[250px] mt-2">
        {[-60, -30, 0, 30, 60, 90].map((line) => (
          <div key={line} className="absolute left-0 right-0 flex items-center gap-3" style={{ bottom: `${((line + 60) / 150) * 190 + 24}px` }}>
            <span className="w-6 text-right text-xs text-slate-400">{line}</span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
        ))}
        <div className="absolute bottom-[100px] left-9 right-0 h-px bg-slate-200" />
        <div className="absolute bottom-[100px] left-9 right-0 flex justify-around">
          {plus.map((v, i) => (
            <div key={i} className="flex w-5 flex-col items-center">
              <span className="w-2.5 rounded-t bg-[#8D0606]" style={{ height: v }} />
              <span className="w-2.5 rounded-b bg-slate-700" style={{ height: minus[i] }} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-10 right-2 flex justify-between text-xs text-slate-400">
          {["4", "5", "6", "7", "8", "9", "10"].map((x) => <span key={x}>{x}</span>)}
        </div>
      </div>
    </Card>
  );
}

function RevenueArea() {
  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={ChartNoAxesCombined} title="Monthly Revenue Flow" />
      <CardTitle title="Revenue Trend" subtitle="Gross monthly income curve" action={<SelectPill />} />
      <div className="relative h-[250px] mt-2">
        {[120, 100, 80, 60, 40, 20].map((line) => (
          <div key={line} className="absolute left-0 right-0 flex items-center gap-3" style={{ top: `${((120 - line) / 100) * 190}px` }}>
            <span className="w-7 text-right text-xs font-medium text-slate-400">{line}</span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
        ))}
        <svg className="absolute bottom-7 left-10 h-[190px] w-[calc(100%-40px)]" viewBox="0 0 680 230" preserveAspectRatio="none">
          <path d="M0 112 C90 110 100 90 168 130 C242 174 250 74 328 70 C390 65 400 232 478 185 C534 150 520 16 604 22 C640 26 658 42 680 40 L680 230 L0 230 Z" fill="#8D0606" opacity="0.65" />
        </svg>
        <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs font-medium text-slate-500">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </Card>
  );
}

function DailyTrendingList({ navigate }) {
  return (
    <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={Trophy} title="Daily Trending Menus" />
      <CardTitle title="Daily Trending Menus" subtitle="Top ordered items across all branches" />
      <div className="divide-y divide-slate-100 mt-2">
        {trendingMenus.map((item, index) => (
          <TrendingItem key={item[0]} item={item} index={index} navigate={navigate} />
        ))}
      </div>
    </Card>
  );
}

function BestSellerMenus({ navigate }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 p-6 shadow-xs">
      <SectionHeader icon={Sparkles} title="Best Seller Menus" />
      <CardTitle title="Best Seller Highlights" subtitle="Top rated & highest grossing dishes" />
      <div className="space-y-6 mt-3">
        {[foodImages[1], foodImages[2]].map((img) => (
          <article key={img} className="rounded-xl border border-slate-100 p-3 transition hover:shadow-xs">
            <img src={img} alt="" className="h-44 w-full rounded-xl object-cover" />
            <h4 className="mt-3 text-xs font-semibold text-slate-800">Medium Spicy Pizza with Kemangi Leaf</h4>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="text-[#8D0606] font-bold">$6.53</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Heart size={14} className="text-[#8D0606]" fill="currentColor" /> 256k
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <BarChart3 size={14} className="text-[#8D0606]" /> 6,723
              </span>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}