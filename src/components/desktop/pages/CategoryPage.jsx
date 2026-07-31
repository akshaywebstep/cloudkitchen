import React, { useState } from "react";
import {
  ChevronRight,
  CreditCard,
  Globe2,
  Heart,
  ReceiptText,
  Upload,
  Building2,
  UtensilsCrossed,
  Package,
  Layers,
  Plus,
  Star,
  PlusCircle,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { SearchFilterRow } from "../../ui/SearchFilterRow";
import { ApiCount } from "../../ui/ApiCount";
import { Pagination } from "../../ui/Pagination";
import { orderMenu, popularDishes, recentCategoryOrders } from "../../../constants/mockData";

export function CategoryPage({ liveMenuItems = [], apiState }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [popularPage, setPopularPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const PAGE_SIZE = 3;

  const rawPopular = liveMenuItems.length
    ? liveMenuItems.map((item) => [item.name, item.price, item.image, false])
    : popularDishes;

  const rawRecent = liveMenuItems.length
    ? liveMenuItems.map((item) => [item.name, item.price, "Live menu item", item.image])
    : recentCategoryOrders;

  // Filter items by search query
  const filteredPopular = rawPopular.filter((item) => {
    if (!searchQuery.trim()) return true;
    return item[0].toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredRecent = rawRecent.filter((item) => {
    if (!searchQuery.trim()) return true;
    return item[0].toLowerCase().includes(searchQuery.toLowerCase());
  });

  const paginatedPopular = filteredPopular.slice((popularPage - 1) * PAGE_SIZE, popularPage * PAGE_SIZE);
  const paginatedRecent = filteredRecent.slice((recentPage - 1) * PAGE_SIZE, recentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 pb-12">
      {/* Search Row */}
      <SearchFilterRow
        calendarTone="red"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Backend Status Banner */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border px-5 py-3.5 text-xs font-medium shadow-xs transition-colors md:flex-row md:items-center md:justify-between ${
          apiState?.menus?.length
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${apiState?.menus?.length ? "bg-emerald-600" : "bg-amber-600"}`}
          />
          {apiState?.menus?.length
            ? `Showing ${apiState.menus.length} live menu item(s) from backend API.`
            : "Demo menu items shown. Log in and add branch & menus to view live database food items."}
        </span>
        <button
          className="flex items-center gap-1.5 rounded-xl bg-[#8D0606] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#770505]"
          onClick={() => navigate("/add-menu")}
          type="button"
        >
          <PlusCircle size={15} />
          <span>Add New Menu</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <ApiCount
          label="Branches"
          value={apiState?.branches?.length || 0}
          icon={Building2}
          color="red"
          badge="Configured"
        />
        <ApiCount
          label="Branch Ingredients"
          value={apiState?.branchIngredients?.length || 0}
          icon={UtensilsCrossed}
          color="emerald"
          badge="Inventory"
        />
        <ApiCount
          label="Inventory Stocks"
          value={apiState?.stocks?.length || 0}
          icon={Package}
          color="amber"
          badge="Stocks"
        />
        <ApiCount
          label="Menu Items"
          value={apiState?.menus?.length || 0}
          icon={Layers}
          color="sky"
          badge="Live Foods"
        />
      </div>

      {/* Popular Dishes Section */}
      <CategorySection
        title="Popular Dishes"
        items={paginatedPopular}
        totalItems={filteredPopular.length}
        currentPage={popularPage}
        onPageChange={setPopularPage}
        pageSize={PAGE_SIZE}
        type="popular"
        navigate={navigate}
      />

      {/* Recent Orders Section */}
      <CategorySection
        title="Recent Order Categories"
        items={paginatedRecent}
        totalItems={filteredRecent.length}
        currentPage={recentPage}
        onPageChange={setRecentPage}
        pageSize={PAGE_SIZE}
        type="recent"
        navigate={navigate}
      />

      {/* Balance & Checkout Card */}
      <Card className="p-6 border border-slate-200 shadow-xs">
        <div className="grid gap-8 border-b border-slate-100 pb-8 xl:grid-cols-[1fr_1fr]">
          {/* Balance */}
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-800">Your Account Balance</h2>
            <div className="flex max-w-[440px] items-center gap-5 rounded-2xl bg-gradient-to-br from-[#8D0606] to-[#b80808] p-5 text-white shadow-sm sm:gap-6">
              <div className="rounded-xl bg-white px-5 py-3.5 text-slate-800 shadow-inner">
                <p className="text-[11px] font-medium text-slate-400">Available Balance</p>
                <p className="text-xl font-semibold">$12.000</p>
              </div>
              <BalanceAction icon={<CreditCard size={22} />} label="Top Up" />
              <BalanceAction icon={<Upload size={22} />} label="Transfer" />
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery Address</h2>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-[#8D0606]">
                    <MapPin size={16} />
                  </span>
                  Elm Street, 23, Suite 4
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#8D0606] transition hover:bg-rose-50 hover:border-rose-200"
                type="button"
              >
                Change
              </button>
            </div>
            <p className="mb-4 text-xs font-normal leading-relaxed text-slate-500">
              Primary delivery address for online kitchen orders & aggregator pickups.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                type="button"
              >
                + Add Details
              </button>
              <button
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                type="button"
              >
                + Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="grid gap-8 pt-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-slate-800">Order Menu Items</h2>
            <div className="space-y-3">
              {orderMenu.map((item) => (
                <div
                  key={item[0]}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-xl p-2 transition hover:bg-slate-50/70 border border-transparent hover:border-slate-100"
                >
                  <img
                    src={item[3]}
                    alt=""
                    className="size-12 rounded-xl object-cover border border-slate-100 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-semibold text-slate-800">{item[0]}</h4>
                    <p className="text-[11px] font-medium text-[#8D0606]">{item[1]}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{item[2]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200/80">
            <div className="mb-5 space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span className="font-normal">Service Fee</span>
                <span className="font-semibold text-slate-800">+$1.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-sm font-semibold text-slate-900">
                <span>Total Amount</span>
                <span className="text-[#8D0606] font-bold text-base">$202.00</span>
              </div>
            </div>
            <button
              className="mb-3 flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              type="button"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-[#8D0606] text-white">
                <ReceiptText size={15} />
              </span>
              <span className="flex-1 text-center">Have a coupon code?</span>
              <ChevronRight size={15} className="text-slate-400" />
            </button>
            <button
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] text-xs font-semibold text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707]"
              onClick={() => navigate("/order")}
              type="button"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CategorySection({ title, items, totalItems, currentPage, onPageChange, pageSize, type, navigate }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-slate-800">{title}</h2>
        <button
          className="group flex items-center gap-1 text-xs font-semibold text-[#8D0606] hover:underline"
          onClick={() => navigate(type === "popular" ? "/menu" : "/orders")}
          type="button"
        >
          <span>View all</span>
          <ChevronRight className="transition-transform group-hover:translate-x-0.5" size={15} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) =>
          type === "popular" ? (
            <PopularDishCard key={item[0]} item={item} navigate={navigate} />
          ) : (
            <RecentCategoryCard key={item[0]} item={item} navigate={navigate} />
          )
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        className="mt-4 rounded-xl border border-slate-200 bg-white"
      />
    </section>
  );
}

function PopularDishCard({ item, navigate }) {
  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <span className="absolute left-0 top-5 rounded-r-full bg-[#8D0606] px-3 py-1 text-[10px] font-semibold text-white shadow-2xs">
        15% Off
      </span>
      <button
        type="button"
        aria-label="Toggle favorite"
        className="absolute right-5 top-5 transition-transform hover:scale-110"
      >
        <Heart className={item[3] ? "text-rose-500" : "text-slate-300"} size={20} fill="currentColor" />
      </button>

      <div className="mt-4 flex h-[140px] items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        <img
          src={item[2]}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-amber-500">
        <Star size={12} fill="currentColor" />
        <Star size={12} fill="currentColor" />
        <Star size={12} fill="currentColor" />
        <Star size={12} fill="currentColor" />
        <Star size={12} fill="currentColor" />
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-slate-800" title={item[0]}>{item[0]}</h3>
          <p className="text-sm font-semibold text-[#8D0606]">
            ${item[1].replace("$", "")}
          </p>
        </div>
        <button
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#8D0606] text-white shadow-xs transition hover:bg-[#770505] active:scale-95"
          onClick={() => navigate("/order")}
          type="button"
          aria-label={`Add ${item[0]} to cart`}
        >
          <Plus size={16} />
        </button>
      </div>
    </article>
  );
}

function RecentCategoryCard({ item, navigate }) {
  return (
    <button
      className="group relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md"
      onClick={() => navigate("/order")}
      type="button"
    >
      <span className="absolute right-5 top-5 transition-transform hover:scale-110">
        <Heart className="text-slate-300" size={20} fill="currentColor" />
      </span>

      <div className="flex h-[140px] items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        <img
          src={item[3]}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <h3 className="mt-4 truncate text-xs font-semibold text-slate-800">{item[0]}</h3>
      <p className="mt-1 text-sm font-semibold text-[#8D0606]">
        ${item[1].replace("$", "")}
      </p>
      <p className="mt-1 text-[11px] font-normal text-slate-400">{item[2]}</p>
    </button>
  );
}

function BalanceAction({ icon, label }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-xl bg-white text-[#8D0606] shadow-xs transition hover:scale-105">
        {icon}
      </div>
      <p className="mt-1.5 text-xs font-semibold">{label}</p>
    </div>
  );
}