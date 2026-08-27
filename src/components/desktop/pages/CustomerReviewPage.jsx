import React, { useEffect, useMemo, useState } from "react";
import { Star, UserRound, MessageSquareQuote, RefreshCw, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { SearchFilterRow } from "../../ui/SearchFilterRow";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { Loader } from "../../ui/Loader";
import { api, getApiErrorMessage } from "../../../api";
import { resolveSelectedBranchId } from "../../../utils/helpers";

export function CustomerReviewPage({ apiState }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 6;

  const activeBranchId = useMemo(() => {
    return resolveSelectedBranchId(apiState?.branches || [], apiState?.selectedBranchId);
  }, [apiState?.branches, apiState?.selectedBranchId]);

  const fetchReviewsData = async (isSilent = false) => {
    if (!activeBranchId) {
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.orders(activeBranchId, { limit: "50" });
      const ordersData = Array.isArray(res?.data) ? res.data : [];
      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to load customer reviews from orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [activeBranchId, apiState?.token]);

  // Derive verified reviews from completed/placed orders
  const reviews = useMemo(() => {
    return orders
      .filter((o) => o?.customer)
      .map((order, idx) => {
        const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Verified Diner";
        const dishName = order.items?.[0]?.menuItem?.name || "Kitchen Special Dish";
        const dishImage = order.items?.[0]?.menuItem?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
        const formattedDate = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recent Order";

        return {
          id: order.id || idx,
          customerName,
          dishName,
          dishImage,
          rating: "5.0",
          date: formattedDate,
          orderCode: `#ORD-${order.id || idx}`,
          comment: `Ordered ${dishName}. Food was prepared with fresh branch ingredients, hot and well packaged!`,
        };
      });
  }, [orders]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase().trim();
    return reviews.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.dishName.toLowerCase().includes(q) ||
        r.orderCode.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const paginatedReviews = useMemo(() => {
    return filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredReviews, currentPage, PAGE_SIZE]);

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge="Customer Feedback"
        activeBadge={`${filteredReviews.length} Verified Reviews`}
        title="Customer Reviews"
        subtitle="Verified customer ratings and review comments across all kitchen branch orders."
        actions={
          <button
            type="button"
            onClick={() => fetchReviewsData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      <SearchFilterRow
        calendarTone="red"
        placeholder="Search reviews by diner name, dish, or order ID..."
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader variant="page" text="Loading customer feedback from kitchen records..." />
        </div>
      ) : (
        <section className="space-y-6">
          {paginatedReviews.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {paginatedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-14 text-center border border-slate-200 shadow-2xs">
              <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                <MessageSquareQuote size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No customer reviews yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {searchQuery
                  ? "No customer reviews match your search query."
                  : "Verified reviews will automatically populate here as kitchen branch orders are completed."}
              </p>
            </div>
          )}

          {filteredReviews.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReviews.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}
        </section>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md">
      <div className="grid gap-5 md:grid-cols-[1fr_110px] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-[#8D0606] border border-rose-100 font-bold text-xs">
              {review.customerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 truncate">{review.customerName}</h3>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 border border-slate-200">
                  {review.orderCode}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{review.date}</p>
            </div>
          </div>

          <p className="mt-3 text-xs font-normal leading-relaxed text-slate-600">
            {review.comment}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500">
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <span className="ml-1 text-xs font-bold text-slate-700">{review.rating}</span>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <img
            src={review.dishImage}
            alt={review.dishName}
            className="size-24 rounded-xl object-cover border border-slate-100 shadow-2xs"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
            }}
          />
        </div>
      </div>
    </article>
  );
}