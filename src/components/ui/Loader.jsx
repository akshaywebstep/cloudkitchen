import React from "react";
import { Loader2, ChefHat } from "lucide-react";

/**
 * Loader component — three variants:
 *
 * variant="page"    — Full-screen dark splash used during app boot
 * variant="section" — Centered block used inside a page / section area
 * variant="button"  — Inline spinner + text used inside submit buttons
 *
 * Props:
 *   text       {string}  Label shown below/beside the spinner
 *   size       {number}  Icon pixel size (default varies per variant)
 *   className  {string}  Extra Tailwind classes on the wrapper
 */

export function Loader({ variant = "section", text = "Loading...", size, className = "" }) {
  if (variant === "page") {
    return (
      <div className={`grid min-h-screen place-items-center bg-[#F7F6F6] text-slate-900 ${className}`}>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-lg shadow-rose-950/20">
            <ChefHat size={size ?? 34} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight text-slate-900">Cloud Kitchen</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{text}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8D0606] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            <Loader2 size={15} className="animate-spin text-[#8D0606]" />
            <span>Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-[99999] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 min-w-[200px]">
          <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] border border-rose-100 shadow-2xs">
            <Loader2 size={size ?? 22} className="animate-spin text-[#8D0606]" />
          </div>
          {text && <p className="text-xs font-bold text-slate-800">{text}</p>}
        </div>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
        <div className="relative grid size-12 place-items-center rounded-2xl bg-rose-50 border border-rose-100 text-[#8D0606] shadow-xs">
          <Loader2 size={size ?? 22} className="animate-spin text-[#8D0606]" />
        </div>
        {text && (
          <p className="text-xs font-bold text-slate-600">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "button") {
    return (
      <>
        <Loader2 size={size ?? 18} className="animate-spin" />
        {text && <span>{text}</span>}
      </>
    );
  }

  return null;
}
