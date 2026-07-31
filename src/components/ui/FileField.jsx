import React from "react";
import { Upload } from "lucide-react";

export function FileField({ label, file, onChange }) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-semibold">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded border border-[#dce1e7] bg-white px-4">
        <Upload size={18} className="text-[#8D0606]" />
        <input className="min-w-0 flex-1 text-sm file:mr-4 file:rounded file:border-0 file:bg-[#fff1f1] file:px-3 file:py-1.5 file:font-semibold file:text-[#8D0606]" type="file" onChange={onChange} />
      </span>
      {file ? <span className="mt-2 block text-xs font-semibold text-[#2f8f4e]">{file.name}</span> : null}
    </label>
  );
}
