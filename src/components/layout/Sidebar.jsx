import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { sidebarItems } from "../../constants/mockData";

export function Sidebar({ collapsed = false }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed mainSidebar inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-gradient-to-b from-[#7A0505] via-[#8D0606] to-[#9E0808] text-white lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-all duration-300 ${
        collapsed ? "w-[88px]" : "w-[290px]"
      }`}
    >
      {/* Header Brand Section */}
      <div className={`shrink-0 pt-6 pb-5 transition-all duration-300 ${collapsed ? "px-2 text-center" : "px-6"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3.5"}`}>
          <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs transition hover:scale-105">
            <UtensilsCrossed size={22} />
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-[#7A0505]" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white truncate">Cloud Kitchen</span>
              </div>
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">Enterprise Edition</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation Section */}
      {!collapsed ? (
        <div className="px-6 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
          Main Navigation
        </div>
      ) : null}

      <nav
        className={`sidebar-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pb-4 transition-all duration-300 ${
          collapsed ? "px-2.5" : "px-4"
        }`}
      >
        {sidebarItems.map((item) => {
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
                    : "gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold"
                } ${
                  isActive
                    ? "bg-white text-[#8D0606] shadow-md shadow-black/10 font-bold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={collapsed ? 20 : 18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />
                  {!collapsed ? (
                    <>
                      <span className="flex-1 text-xs font-medium capitalize truncate tracking-wide">
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs">
                          {item.badge}
                        </span>
                      ) : null}
                      {isActive && item.path === "/" ? (
                        <ChevronDown size={14} className="opacity-80" />
                      ) : (
                        <ChevronRight size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
                      )}
                    </>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Action Card Footer */}
      <div className={`shrink-0 pb-5 pt-2 transition-all duration-300 ${collapsed ? "px-2.5" : "px-4"}`}>
        {!collapsed ? (
          <div className="rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-white/15 p-4 backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <Sparkles size={15} className="text-amber-300" />
              <span>Quick Actions</span>
            </div>
            <p className="mb-3 text-[11px] font-medium leading-relaxed text-white/70">
              Add new live dishes & recipes directly to inventory
            </p>
            <button
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white text-xs font-bold text-[#8D0606] shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-98"
              onClick={() => navigate("/add-menu")}
              type="button"
            >
              <Plus size={15} />
              <span>Add New Menu</span>
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
              <Plus size={20} />
            </button>
          </div>
        )}

        {!collapsed ? (
          <div className="mt-3 text-[10px] font-medium text-white/50 text-center tracking-wider">
            © 2026 Cloud Kitchen System
          </div>
        ) : null}
      </div>
    </aside>
  );
}
