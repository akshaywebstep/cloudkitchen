import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function SelectPill({ label = "Monthly", value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value || label;
  return (
    <div className="relative">
      <button className="inline-flex h-12 min-w-[128px] items-center justify-center gap-3 rounded-full border border-[#ececec] bg-white text-[15px] font-semibold" onClick={() => setOpen((v) => !v)} type="button">
        {selected}
        <ChevronDown size={17} className="text-[#ef4d8d]" />
      </button>
      {open ? (
        <div className="absolute right-0 top-14 z-20 w-36 rounded-xl bg-white p-2 shadow-xl">
          {["Monthly", "Weekly", "Today"].map((option) => (
            <button key={option} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${selected === option ? "bg-[#8D0606] text-white" : "hover:bg-[#fff1f1]"}`} onClick={() => { onChange?.(option); setOpen(false); }} type="button">
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
