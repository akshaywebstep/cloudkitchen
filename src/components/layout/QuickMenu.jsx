import React from "react";
import { ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUICK_LINKS = [
  { label: "Dashboard",         path: "/" },
  { label: "Analytics",         path: "/analytics" },
  { label: "Order List",        path: "/orders" },
  { label: "Category / Menu",   path: "/menu" },
  { label: "Add Menu",          path: "/add-menu" },
  { label: "Customer List",     path: "/customers" },
  { label: "Customer Review",   path: "/reviews" },
  { label: "Add / Edit Kitchen", path: "/kitchen" },
];

export function QuickMenu({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="absolute left-[330px] top-24 z-40 w-[280px] rounded-xl bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="mb-2 flex items-center justify-between px-2">
        <b>Quick Menu</b>
        <button onClick={onClose} type="button"><X size={18} /></button>
      </div>
      {QUICK_LINKS.map((link) => (
        <button
          key={link.path}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold hover:bg-[#fff1f1] hover:text-[#8D0606]"
          onClick={() => { navigate(link.path); onClose(); }}
          type="button"
        >
          {link.label}<ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}
