import React from "react";
import { X, Bell, MessageSquareText, Gift, ChevronRight, Inbox } from "lucide-react";

export function HeaderPanel({ title, items = [], onClose, onAction }) {
  const iconMap = {
    notifications: Bell,
    messages: MessageSquareText,
    gifts: Gift,
  };

  const Icon = iconMap[title] || Bell;
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className="absolute right-3 sm:right-28 top-16 z-50 w-[calc(100vw-24px)] sm:w-[340px] max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-rose-50 text-[#8D0606]">
            <Icon size={16} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">{title}</h3>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
        >
          <X size={15} />
        </button>
      </div>

      {hasItems ? (
        <>
          <div className="space-y-1.5 my-2">
            {items.map((item, index) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50/70 p-3 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 border border-slate-200/50"
                onClick={() => onAction(index === 0 ? "/orders" : index === 1 ? "/menu" : "/")}
                type="button"
              >
                <span className="truncate pr-2">{item}</span>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>

          <button
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#8D0606] text-xs font-semibold text-white shadow-xs transition hover:bg-[#770505]"
            onClick={() => onAction("/orders")}
            type="button"
          >
            <span>View All {title}</span>
          </button>
        </>
      ) : (
        <div className="my-5 py-6 text-center">
          <div className="mx-auto mb-2.5 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox size={22} />
          </div>
          <p className="text-xs font-bold text-slate-700">No Data Found (0)</p>
          <p className="mt-1 text-[11px] text-slate-400">You have 0 active {title}</p>
        </div>
      )}
    </div>
  );
}
