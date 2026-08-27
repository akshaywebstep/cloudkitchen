import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppSelect } from "./AppSelect";

export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate dynamic page numbers with ellipses
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 ${className}`}
    >
      {/* Top row on mobile / Left side on desktop */}
      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
        <p className="text-xs font-medium text-slate-500 shrink-0">
          Showing <span className="font-bold text-slate-800">{startItem}–{endItem}</span> of{" "}
          <span className="font-bold text-slate-800">{totalItems}</span> entries
        </p>

        {onPageSizeChange && pageSizeOptions?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-[11.5px] text-slate-400">Show:</span>
            <AppSelect
              value={pageSize}
              onChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange?.(1);
              }}
              minWidth="68px"
              options={pageSizeOptions.map((opt) => ({
                value: String(opt),
                label: String(opt),
              }))}
            />
          </div>
        )}
      </div>

      {/* Bottom row on mobile (centered) / Right side on desktop */}
      <div className="flex items-center justify-center sm:justify-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
        {/* Previous Page */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-white active:scale-95 shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Buttons & Dots */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="flex size-8 items-center justify-center text-xs font-bold text-slate-400 select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(item);
            const isCurrent = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`size-8 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  isCurrent
                    ? "bg-[#8D0606] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-white active:scale-95 shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
