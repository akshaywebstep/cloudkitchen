import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronDown, Check } from "lucide-react";

/**
 * Custom TimePickerInput component with Portal rendering
 * Formats "09:00" -> "09:00 AM" for display and provides an unclipped popup selector
 */
export const TimePickerInput = React.forwardRef(function TimePickerInput(
  { label, required, error, value = "", onChange, className = "" },
  forwardedRef
) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "bottom" });

  // Convert "14:30" 24h format to { hour12: "02", minute: "30", period: "PM" }
  const parse24h = (val) => {
    if (!val || typeof val !== "string" || !val.includes(":")) {
      return { hour12: "09", minute: "00", period: "AM" };
    }
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 9;
    const period = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      hour12: String(h12).padStart(2, "0"),
      minute: mStr ? String(mStr).slice(0, 2).padStart(2, "0") : "00",
      period,
    };
  };

  const parsed = parse24h(value);

  // Format display text (e.g., "09:00 AM")
  const formattedDisplay = value
    ? `${parsed.hour12}:${parsed.minute} ${parsed.period}`
    : "Select time";

  const handleSelectTime = (h12, min, period) => {
    let h24 = parseInt(h12, 10);
    if (period === "PM" && h24 < 12) h24 += 12;
    if (period === "AM" && h24 === 12) h24 = 0;
    const val24 = `${String(h24).padStart(2, "0")}:${min}`;
    onChange?.(val24);
  };

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverHeight = 280;
    const popoverWidth = 288;

    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }

    setCoords({
      top: showAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8,
      left: Math.max(16, left),
      placement: showAbove ? "top" : "bottom",
    });
  };

  const toggleOpen = () => {
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Close popup on outside click and handle scroll / resize
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </label>
      )}

      <div className="relative">
        <button
          ref={(node) => {
            buttonRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          type="button"
          onClick={toggleOpen}
          className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-xs font-semibold outline-none transition duration-200 ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : open
              ? "border-[#8D0606] ring-2 ring-[#8D0606]/15 text-[#0f172a]"
              : "border-[#e2e8f0] text-[#0f172a] hover:border-[#8D0606] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-[#94a3b8]" />
            <span className={value ? "font-bold text-[#0f172a]" : "text-[#94a3b8] font-normal"}>
              {formattedDisplay}
            </span>
          </div>
          <ChevronDown
            size={15}
            className={`text-[#94a3b8] transition-transform duration-200 ${open ? "rotate-180 text-[#8D0606]" : ""}`}
          />
        </button>

        {/* Native hidden time input for form fallbacks */}
        <input
          type="time"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="sr-only"
        />

        {/* TimePicker Dropdown rendered through Portal to avoid any overflow-hidden clipping */}
        {open &&
          createPortal(
            <div
              ref={popoverRef}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 99999,
              }}
              className="w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl animate-in fade-in zoom-in-95 select-none"
            >
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#8D0606]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Time</span>
                </div>
                <span className="rounded-lg bg-[#fff1f1] px-2 py-0.5 text-xs font-extrabold text-[#8D0606] border border-rose-100">
                  {formattedDisplay}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Hour Column */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400 text-center">Hour</span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 sidebar-scroll">
                    {hours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelectTime(h, parsed.minute, parsed.period)}
                        className={`w-full rounded-lg py-1.5 text-xs font-bold transition ${
                          parsed.hour12 === h
                            ? "bg-[#8D0606] text-white shadow-xs"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Column */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400 text-center">Min</span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 sidebar-scroll">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectTime(parsed.hour12, m, parsed.period)}
                        className={`w-full rounded-lg py-1.5 text-xs font-bold transition ${
                          parsed.minute === m
                            ? "bg-[#8D0606] text-white shadow-xs"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM / PM Column */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400 text-center">Period</span>
                  <div className="space-y-1.5">
                    {["AM", "PM"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelectTime(parsed.hour12, parsed.minute, p)}
                        className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition ${
                          parsed.period === p
                            ? "bg-[#8D0606] text-white shadow-xs"
                            : "hover:bg-slate-100 bg-slate-50 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-98 shadow-xs"
              >
                <Check size={14} /> Done
              </button>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
});
