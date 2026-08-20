import React, { useState } from "react";
import { Star, UserRound, MessageSquareQuote } from "lucide-react";
import { SearchFilterRow } from "../../ui/SearchFilterRow";
import { Pagination } from "../../ui/Pagination";
import { PageHeader } from "../../ui/PageHeader";
import { reviewCards } from "../../../constants/mockData";

export function CustomerReviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const filteredReviews = reviewCards.filter((review) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return review[0].toLowerCase().includes(q);
  });

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {/* Top Banner matching Reference */}
      <PageHeader
        badge="Customer Feedback"
        activeBadge={`${filteredReviews.length} Verified Reviews`}
        title="Customer Reviews"
        subtitle="Verified customer ratings and review comments across all kitchen orders."
      />

      <SearchFilterRow
        calendarTone="red"
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      <section className="space-y-6">

        <div className="grid gap-5 xl:grid-cols-2">
          {paginatedReviews.map((review, index) => (
            <ReviewCard key={`${review[0]}-${index}`} review={review} />
          ))}
        </div>

        {!filteredReviews.length ? (
          <p className="py-12 text-center text-xs font-normal text-slate-400">
            No customer reviews found matching your search.
          </p>
        ) : null}

        <Pagination
          currentPage={currentPage}
          totalItems={filteredReviews.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          className="rounded-2xl border border-slate-200 bg-white"
        />
      </section>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md">
      <div className="grid gap-5 md:grid-cols-[1fr_110px] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {review[3] ? (
              <img src={review[3]} alt="" className="size-10 shrink-0 rounded-full object-cover border border-slate-100" />
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-[#8D0606] border border-rose-100">
                <UserRound size={18} />
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-800">{review[0]}</h3>
              <p className="text-[11px] font-normal text-slate-400">2 days ago</p>
            </div>
          </div>

          <p className="mt-3 text-xs font-normal leading-relaxed text-slate-600">
            Great packaging and food quality! Fresh ingredients, delivered hot and right on time. Highly recommended!
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500">
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <Star size={13} fill="currentColor" />
            <span className="ml-1 text-xs font-semibold text-slate-700">{review[1]}</span>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <img
            src={review[2]}
            alt=""
            className="size-24 rounded-xl object-cover border border-slate-100 shadow-2xs"
          />
        </div>
      </div>
    </article>
  );
}