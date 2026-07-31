import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage, totalItems, pageSize, onPageChange, className = "" }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 ${className}`}>
      <p className="text-xs font-normal text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-700">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalItems}</span> entries
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`size-8 rounded-lg text-xs font-medium transition ${
              currentPage === page
                ? "bg-[#8D0606] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
