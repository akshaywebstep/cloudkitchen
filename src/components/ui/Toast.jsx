import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export function Toast({ message, type = "info", onClose, duration = 3500 }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: "bg-[#064e3b]",
      border: "border-[#059669]",
      text: "text-emerald-100",
      icon: <CheckCircle2 className="text-emerald-400 shrink-0" size={22} />,
    },
    error: {
      bg: "bg-[#450a0a]",
      border: "border-[#dc2626]",
      text: "text-rose-100",
      icon: <AlertCircle className="text-rose-400 shrink-0" size={22} />,
    },
    warning: {
      bg: "bg-[#451a03]",
      border: "border-[#d97706]",
      text: "text-amber-100",
      icon: <AlertTriangle className="text-amber-400 shrink-0" size={22} />,
    },
    info: {
      bg: "bg-[#0f172a]",
      border: "border-[#38bdf8]",
      text: "text-sky-100",
      icon: <Info className="text-sky-400 shrink-0" size={22} />,
    },
  };

  const style = styles[type] || styles.info;

  return createPortal(
    <div
      className={`fixed top-6 right-4 sm:right-6 z-[9999999] flex max-w-md items-center gap-3.5 rounded-2xl border ${style.border} ${style.bg} ${style.text} px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-6`}
      role="alert"
    >
      {style.icon}
      <span className="flex-1 text-sm font-semibold leading-snug whitespace-pre-line">
        {message}
      </span>
      <button
        className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white transition"
        onClick={onClose}
        type="button"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>,
    document.body
  );
}
