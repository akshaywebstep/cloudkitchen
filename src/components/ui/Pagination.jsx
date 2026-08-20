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
    const delta = 2;
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
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/75 ${className}`}
    >
      {/* Left Details & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{startItem}</span> to{" "}
          <span className="font-bold text-slate-800">{endItem}</span> of{" "}
          <span className="font-bold text-slate-800">{totalItems}</span> entries
        </p>

        {onPageSizeChange && pageSizeOptions?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">|</span>
            <span>Show</span>
            <AppSelect
              value={pageSize}
              onChange={(val) => onPageSizeChange(Number(val))}
              minWidth="75px"
              options={pageSizeOptions.map((opt) => ({
                value: String(opt),
                label: String(opt),
              }))}
            />
            <span>/ page</span>
          </div>
        )}
      </div>

      {/* Right Dynamic Page Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Page */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Buttons & Dots */}
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
                  ? "bg-gradient-to-r from-[#8D0606] to-[#a30707] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
          className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
