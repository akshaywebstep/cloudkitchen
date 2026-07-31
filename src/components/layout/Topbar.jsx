import React, { useState } from "react";
import {
  Menu,
  Bell,
  MessageSquareText,
  Gift,
  Building2,
  ChevronDown,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBranchLabel, resolveSelectedBranchId } from "../../utils/helpers";
import { QuickMenu } from "./QuickMenu";
import { HeaderPanel } from "./HeaderPanel";
import { ProfilePanel } from "./ProfilePanel";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { BackendConnectionModal } from "./BackendConnectionModal";

// Map route paths to human-readable page titles
const PATH_TITLES = {
  "/": "Dashboard Overview",
  "/ingredients": "Ingredient Inventory",
  "/analytics": "Analytics & Reports",
  "/reviews": "Customer Feedback",
  "/order": "Order Details",
  "/orders": "Order List Management",
  "/customers": "Customer Profiles",
  "/icons": "UI Utility Icons",
  "/menu": "Category Foods",
  "/table": "Data Tables",
  "/kitchen": "Add / Edit Branch Kitchen",
  "/add-menu": "Add Menu Item",
};

export function Topbar({ apiState, onLogout, onToast, onLogin, refreshKitchenData, onBranchChange, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPanel, setOpenPanel] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [backendOpen, setBackendOpen] = useState(false);

  const title = PATH_TITLES[location.pathname] || "Dashboard Overview";

  const panelItems = {
    notifications: ["New order #245888 received", "Low stock alert: Rice", "Branch Main profile updated"],
    messages: ["Rider: Order picked up", "Customer requested extra sauce", "Support ticket #102 resolved"],
    gifts: ["15% Special burger campaign live", "Free delivery promo enabled", "Weekend combo activated"],
  };

  const alertBadges = [
    { key: "notifications", icon: Bell, count: 3, color: "bg-[#8D0606]" },
    { key: "messages", icon: MessageSquareText, count: 2, color: "bg-[#8D0606]" },
    { key: "gifts", icon: Gift, count: 1, color: "bg-amber-500" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 shadow-2xs backdrop-blur-md sm:px-8 lg:px-10">
      <div className="flex items-center gap-4">
        <button
          className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-[#8D0606] transition hover:bg-slate-100"
          onClick={onToggleSidebar}
          type="button"
          title="Toggle Sidebar (Collapse / Expand)"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <BranchHeaderSelect apiState={apiState} onBranchChange={onBranchChange} navigate={navigate} />

        {/* Alert Action Icons */}
        <div className="hidden items-center gap-2 md:flex">
          {alertBadges.map(({ key, icon: Icon, count, color }) => (
            <button
              key={key}
              className={`relative grid size-10 place-items-center rounded-xl border transition ${
                openPanel === key
                  ? "border-[#8D0606] bg-[#fff1f1] text-[#8D0606]"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setOpenPanel(openPanel === key ? "" : key)}
              type="button"
            >
              <Icon size={18} />
              <span className={`absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-[10px] font-bold text-white shadow-2xs ${color}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 md:block" />

        {/* Connection Status & Profile Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                apiState?.online ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {apiState?.online ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{apiState?.online ? "API Online" : "Demo Mode"}</span>
            </span>
            <button
              className="block text-xs font-semibold text-slate-800 transition hover:text-[#8D0606] truncate max-w-[140px]"
              onClick={() => setOpenPanel(openPanel === "profile" ? "" : "profile")}
              type="button"
            >
              {apiState?.kitchen?.kitchenName || "Kitchen Admin"}
            </button>
          </div>

          <button
            className="relative grid size-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-rose-50 text-[#8D0606] shadow-2xs transition hover:border-[#8D0606]"
            onClick={() => setOpenPanel(openPanel === "profile" ? "" : "profile")}
            type="button"
            title="Profile Menu"
          >
            <User size={20} />
          </button>
        </div>
      </div>

      {openPanel && openPanel !== "profile" ? (
        <HeaderPanel
          title={openPanel}
          items={panelItems[openPanel] || []}
          onClose={() => setOpenPanel("")}
          onAction={(target) => {
            setOpenPanel("");
            navigate(target);
          }}
        />
      ) : null}

      {openPanel === "profile" ? (
        <ProfilePanel
          apiState={apiState}
          onBranchChange={onBranchChange}
          onClose={() => setOpenPanel("")}
          onLogout={onLogout}
          onReset={() => {
            setOpenPanel("");
            setResetOpen(true);
          }}
          onBackend={() => {
            setOpenPanel("");
            setBackendOpen(true);
          }}
        />
      ) : null}

      {resetOpen ? <ResetPasswordModal onClose={() => setResetOpen(false)} onToast={onToast} /> : null}

      {backendOpen ? (
        <BackendConnectionModal
          apiState={apiState}
          onLogin={onLogin}
          refreshKitchenData={refreshKitchenData}
          onClose={() => setBackendOpen(false)}
        />
      ) : null}
    </header>
  );
}

function BranchHeaderSelect({ apiState, onBranchChange, navigate }) {
  const branches = apiState?.branches || [];
  const selectedBranchId = resolveSelectedBranchId(branches, apiState?.selectedBranchId);

  if (!branches.length) {
    return (
      <button
        className="hidden rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-[#8D0606] transition hover:bg-rose-100 lg:block"
        onClick={() => navigate("/kitchen")}
        type="button"
      >
        + Add Branch
      </button>
    );
  }

  return (
    <div className="hidden lg:block">
      <div className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-2xs">
        <Building2 size={16} className="text-[#8D0606] shrink-0" />
        <select
          className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-4"
          value={selectedBranchId}
          onChange={(e) => onBranchChange?.(e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {getBranchLabel(branch)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
