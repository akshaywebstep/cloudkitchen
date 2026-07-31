import React, { useState, useEffect, useRef } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

/**
 * Custom TimePickerInput component
 * Formats "09:00" -> "9:00 AM" for display and provides a clean popup selector
 */
export const TimePickerInput = React.forwardRef(function TimePickerInput(
  { label, required, error, value = "", onChange, className = "" },
  ref
) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

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

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#475569]">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </label>
      )}

      <div className="relative">
        <button
          ref={ref}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm font-medium outline-none transition duration-200 ${
            error
              ? "border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[#e2e8f0] text-[#0f172a] hover:border-[#8D0606] focus:border-[#8D0606] focus:ring-2 focus:ring-[#8D0606]/10"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-[#94a3b8]" />
            <span className={value ? "font-bold text-[#0f172a]" : "text-[#94a3b8]"}>
              {formattedDisplay}
            </span>
          </div>
          <ChevronDown size={16} className="text-[#94a3b8]" />
        </button>

        {/* Native hidden time input for form fallbacks */}
        <input
          type="time"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="sr-only"
        />

        {/* TimePicker Dropdown Modal */}
        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase text-slate-500">Pick Time</span>
              <span className="rounded-md bg-[#fff1f1] px-2 py-0.5 text-xs font-bold text-[#8D0606]">
                {formattedDisplay}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Hour Column */}
              <div>
                <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400 text-center">Hour</span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectTime(h, parsed.minute, parsed.period)}
                      className={`w-full rounded-lg py-1.5 text-xs font-bold transition ${
                        parsed.hour12 === h
                          ? "bg-[#8D0606] text-white"
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
                <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400 text-center">Min</span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectTime(parsed.hour12, m, parsed.period)}
                      className={`w-full rounded-lg py-1.5 text-xs font-bold transition ${
                        parsed.minute === m
                          ? "bg-[#8D0606] text-white"
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
                <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400 text-center">AM/PM</span>
                <div className="space-y-1">
                  {["AM", "PM"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectTime(parsed.hour12, parsed.minute, p)}
                      className={`w-full rounded-lg py-2 text-xs font-bold transition ${
                        parsed.period === p
                          ? "bg-[#8D0606] text-white"
                          : "hover:bg-slate-100 text-slate-700"
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
              className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Check size={14} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
