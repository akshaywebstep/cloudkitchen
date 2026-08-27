import React, { useState } from "react";
import Select from "react-select";
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
  "/reviews": "Customer Feedback",
  "/orders": "Order List Management",
  "/customers": "Customer Profiles",
  "/menu": "Food Menu",
  "/kitchen": "Add / Edit Branch Kitchen",
  "/add-menu": "Add Menu Item",
  "/staff": "Staff Management",
  "/roles": "Role Management",
  "/profile": "Kitchen Profile",
  "/waste": "Waste Management",
};

export function Topbar({ apiState, onLogout, onToast, onLogin, refreshKitchenData, onBranchChange, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPanel, setOpenPanel] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [backendOpen, setBackendOpen] = useState(false);

  const title = PATH_TITLES[location.pathname] || "Dashboard Overview";

  const panelItems = {
    notifications: [],
    messages: [],
    gifts: [],
  };

  const alertBadges = [
    { key: "notifications", icon: Bell, count: 0, color: "bg-slate-400" },
    { key: "messages", icon: MessageSquareText, count: 0, color: "bg-slate-400" },
    { key: "gifts", icon: Gift, count: 0, color: "bg-slate-400" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 sm:h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3.5 shadow-2xs backdrop-blur-md sm:px-8 lg:px-10">
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-[#8D0606] transition hover:bg-slate-100 active:scale-95"
          onClick={onToggleSidebar}
          type="button"
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[15px] sm:text-lg font-semibold tracking-tight text-slate-900 truncate max-w-[160px] sm:max-w-none leading-tight">
            {title}
          </h1>
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

        {/* Subscription Plan Badge */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => navigate("/onboarding")}
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-[#F1DFDA] bg-rose-50/70 px-3 py-1 text-xs font-bold text-[#8D0606] shadow-2xs hover:bg-rose-100 transition"
            title="Subscription Plan"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{apiState?.selectedPlan?.name || "Growth Pro Plan"}</span>
            <span className="text-[10px] text-[#A65B47]">• 14d Trial</span>
          </button>
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
              {apiState?.kitchen?.kitchenName || "-"}
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

const branchSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    backgroundColor: "#f8fafc",
    borderColor: state.isFocused ? "#8D0606" : "#e2e8f0",
    borderRadius: "0.75rem",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(141, 6, 6, 0.12)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#8D0606" : "#cbd5e1",
    },
    cursor: "pointer",
    paddingLeft: "2px",
    fontSize: "12px",
    fontWeight: "700",
    transition: "all 0.15s ease",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "12px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "6px",
    zIndex: 99999,
    overflow: "hidden",
    marginTop: "6px",
  }),
  menuList: (base) => ({
    ...base,
    padding: "2px",
    maxHeight: "220px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#8D0606"
      : state.isFocused
      ? "#fff1f1"
      : "transparent",
    color: state.isSelected ? "#ffffff" : state.isFocused ? "#8D0606" : "#334155",
    borderRadius: "0.6rem",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: state.isSelected ? "700" : "600",
    cursor: "pointer",
    transition: "all 0.12s ease",
    "&:active": {
      backgroundColor: state.isSelected ? "#8D0606" : "#fee2e2",
    },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#8D0606" : "#94a3b8",
    padding: "4px 8px",
    transition: "transform 0.2s ease, color 0.15s ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
    "&:hover": {
      color: "#8D0606",
    },
  }),
};

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

  const options = branches.map((branch) => ({
    value: String(branch.id),
    label: getBranchLabel(branch),
  }));

  const currentOption =
    options.find((opt) => String(opt.value) === String(selectedBranchId)) || options[0];

  return (
    <div className="hidden lg:block w-52">
      <Select
        options={options}
        value={currentOption}
        onChange={(selected) => onBranchChange?.(selected?.value)}
        isSearchable={false}
        styles={branchSelectStyles}
        formatOptionLabel={(option, { context }) => (
          <div className="flex items-center gap-2">
            <Building2
              size={14}
              className={
                context === "menu" && option.value === currentOption.value
                  ? "text-inherit shrink-0"
                  : "text-[#8D0606] shrink-0"
              }
            />
            <span className="truncate">{option.label}</span>
          </div>
        )}
      />
    </div>
  );
}
