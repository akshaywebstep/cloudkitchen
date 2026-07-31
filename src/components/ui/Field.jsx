import React from "react";
import { ChevronDown } from "lucide-react";

export function Field({ label, placeholder, textarea, select, options = [], type = "text", className = "", value, onChange }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-3 block text-sm font-semibold">{label}</span> : null}
      <span className="relative block">
        {textarea ? (
          <textarea className="h-28 w-full resize-none rounded border border-[#dce1e7] px-4 py-3 outline-none" placeholder={placeholder} value={value} onChange={onChange} />
        ) : select ? (
          <select className="h-12 w-full appearance-none rounded border border-[#dce1e7] px-4 pr-10 outline-none" value={value} onChange={onChange}>
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input className="p-3 w-full rounded-xl border border-[#dce1e7] px-4 outline-none placeholder:text-[#929aa4]" placeholder={placeholder} type={type} value={value} onChange={onChange} />
        )}
        {select ? <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646464]" size={18} /> : null}
      </span>
    </label>
  );
}
