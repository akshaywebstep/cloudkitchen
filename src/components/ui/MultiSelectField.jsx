import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function MultiSelectField({ label, options = [], value = [], onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const toggleValue = (val) => {
    const strVal = String(val);
    const exists = value.includes(strVal);
    const next = exists ? value.filter((v) => v !== strVal) : [...value, strVal];
    onChange?.(next);
  };
  const selectedLabels = options
    .filter((o) => value.includes(String(o.value)))
    .map((o) => o.label);

  return (
    <div className={`relative block ${className}`}>
      <span className="mb-3 block text-sm font-semibold">{label}</span>
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between rounded border border-[#dce1e7] px-4 text-left outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-sm text-[#333]">
          {selectedLabels.length ? selectedLabels.join(", ") : "Select cuisines"}
        </span>
        <ChevronDown size={18} className="shrink-0 text-[#646464]" />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[74px] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#ececec] bg-white p-2 shadow-xl">
          {options.map((option) => {
            const checked = value.includes(String(option.value));
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#fff1f1]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="size-4 accent-[#8D0606]"
                />
                {option.label}
              </label>
            );
          })}
          <button
            type="button"
            className="mt-1 w-full rounded-md bg-[#8D0606] py-2 text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}
