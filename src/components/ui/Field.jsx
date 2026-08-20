import React from "react";
import { AppSelect } from "./AppSelect";

export function Field({ label, placeholder, textarea, select, options = [], type = "text", className = "", value, onChange }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</span> : null}
      <span className="relative block">
        {textarea ? (
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8D0606] transition"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
          />
        ) : select ? (
          <AppSelect
            variant="form"
            placeholder={placeholder}
            value={value}
            onChange={(val) => onChange?.({ target: { value: val } })}
            options={options}
          />
        ) : (
          <input
            className="p-3 w-full rounded-xl border border-slate-200 px-4 outline-none placeholder:text-slate-400 focus:border-[#8D0606] transition text-xs font-semibold text-slate-800"
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
          />
        )}
      </span>
    </label>
  );
}
