import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  ChefHat,
  LogOut,
} from "lucide-react";
import { sidebarSections } from "../../constants/mockData";

export function Sidebar({ collapsed = false, onLogout }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed mainSidebar inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-gradient-to-b from-[#8D0606] via-[#a30707] to-[#b80808] text-white lg:flex shadow-[4px_0_24px_rgba(141,6,6,0.25)] border-r border-rose-900/20 transition-all duration-300 ${
        collapsed ? "w-[84px]" : "w-[280px]"
      }`}
    >
      {/* Header Brand Section */}
      <div className={`shrink-0 pt-5 pb-4 transition-all duration-300 ${collapsed ? "px-2 text-center" : "px-5"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3.5"}`}>
          <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-md transition hover:scale-105">
            <ChefHat size={23} className="text-white drop-shadow-xs" />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#8D0606] animate-pulse" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-bold tracking-tight text-white truncate">
                  Cloud Kitchen
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[9.5px] font-extrabold text-white uppercase tracking-wider backdrop-blur-xs">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Live System
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Divider */}
      <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent mb-2.5" />

      {/* Navigation Section Grouped Series Wise */}
      <nav
        className={`sidebar-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pt-1 transition-all duration-300 ${
          collapsed ? "px-2.5" : "px-4"
        }`}
      >
        {sidebarSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="space-y-1.5">
            {!collapsed ? (
              <div className="px-3 pb-1 pt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-100/75 flex items-center justify-between">
                <span>{section.title}</span>
              </div>
            ) : sIdx > 0 ? (
              <div className="my-2.5 mx-auto h-[1px] w-6 bg-white/20" />
            ) : null}

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center transition-all duration-200 ${
                        collapsed
                          ? "justify-center size-11 mx-auto rounded-xl"
                          : "gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold"
                      } ${
                        isActive
                          ? "bg-white text-[#8D0606] shadow-md shadow-black/10 font-bold"
                          : "text-white/90 hover:bg-white/15 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={collapsed ? 20 : 19}
                          strokeWidth={isActive ? 2.3 : 1.9}
                          className={`shrink-0 transition-transform duration-200 ${
                            isActive ? "text-[#8D0606]" : "text-white group-hover:scale-110"
                          }`}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-[13.5px] font-medium capitalize truncate tracking-wide">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9.5px] font-extrabold text-white uppercase tracking-wider shadow-2xs">
                                {item.badge}
                              </span>
                            )}
                            {isActive ? (
                              <span className="size-2 rounded-full bg-[#8D0606]" />
                            ) : (
                              <ChevronRight size={14} className="opacity-40 group-hover:opacity-95 transition-opacity" />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button at End of Menu */}
        <div className="pt-2">
          {collapsed && <div className="my-2 mx-auto h-[1px] w-6 bg-white/20" />}
          <button
            type="button"
            onClick={() => {
              if (onLogout) onLogout();
              else {
                localStorage.clear();
                sessionStorage.clear();
                navigate("/");
                window.location.reload();
              }
            }}
            title={collapsed ? "Logout Account" : undefined}
            className={`group relative flex w-full items-center transition-all duration-200 ${
              collapsed
                ? "justify-center size-11 mx-auto rounded-xl bg-white/10 hover:bg-rose-950/40 text-rose-100 hover:text-white"
                : "gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold bg-white/10 hover:bg-rose-950/40 text-rose-100 hover:text-white border border-white/15 shadow-2xs hover:border-white/30"
            }`}
          >
            <LogOut
              size={collapsed ? 20 : 18}
              strokeWidth={2}
              className="shrink-0 transition-transform duration-200 group-hover:scale-110 text-rose-200 group-hover:text-white"
            />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-[13.5px] font-bold tracking-wide">
                  Logout Account
                </span>
                <ChevronRight size={14} className="opacity-40 group-hover:opacity-95 transition-opacity" />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Bottom Action Footer */}
      <div className={`shrink-0 pb-4 pt-2.5 transition-all duration-300 ${collapsed ? "px-2" : "px-4"}`}>
        {!collapsed ? (
          <div className="rounded-2xl bg-gradient-to-b from-white/20 to-white/10 border border-white/25 p-3.5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-300" />
                <span>Quick Recipe</span>
              </span>
              <span className="text-[10.5px] text-white/85 font-medium">Add to Menu</span>
            </div>
            <button
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white text-[12.5px] font-bold text-[#8D0606] shadow-sm transition-all duration-150 hover:bg-rose-50 hover:shadow-md active:scale-98"
              onClick={() => navigate("/add-menu")}
              type="button"
            >
              <Plus size={15} />
              <span>New Menu Item</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              className="grid size-11 place-items-center rounded-xl bg-white text-[#8D0606] shadow-sm transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
              onClick={() => navigate("/add-menu")}
              type="button"
              title="Add New Menu"
            >
              <Plus size={19} />
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="mt-2.5 text-[9.5px] font-bold text-white/60 text-center tracking-widest uppercase">
            Cloud Kitchen POS • 2026
          </div>
        )}
      </div>
    </aside>
  );
}
