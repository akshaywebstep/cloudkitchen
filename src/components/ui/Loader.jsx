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
      <div className={`grid min-h-screen place-items-center bg-[#0d0707] text-white ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] shadow-[0_10px_30px_rgba(141,6,6,0.5)]">
            <ChefHat size={size ?? 34} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold uppercase tracking-wider text-white">Cloud Kitchen</p>
            <p className="mt-1 text-xs text-white/50">{text}</p>
          </div>
          <Loader2 size={24} className="animate-spin text-[#e63946]" />
        </div>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
        <div className="relative grid size-12 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] shadow-[0_8px_20px_rgba(141,6,6,0.3)]">
          <Loader2 size={size ?? 24} className="animate-spin text-white" />
        </div>
        {text && (
          <p className="text-sm font-semibold text-[#777]">{text}</p>
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
