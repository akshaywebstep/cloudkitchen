import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  ChefHat,
  LogOut,
  X,
} from "lucide-react";
import { sidebarSections } from "../../constants/mockData";
import { filterSidebarSections, usePermissions } from "../../utils/permissions";

export function Sidebar({ collapsed = false, onLogout, apiState, mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate();
  const { canCreate, roleName, isStaff } = usePermissions(apiState);

  const kitchenName =
    apiState?.kitchen?.kitchenName ||
    apiState?.kitchen?.parent?.kitchenName ||
    apiState?.kitchen?.name ||
    "Cloud Kitchen";

  const profilePic =
    apiState?.kitchen?.profilePicture ||
    apiState?.kitchen?.parent?.profilePicture ||
    apiState?.kitchen?.avatar;

  const rawRole = roleName || (isStaff ? "Kitchen Staff Manager" : "Kitchen Admin");
  const cleanRole = isStaff
    ? rawRole
        .replace(/\s*[-–]\s*.*$/, "")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
    : "Live System";

  const visibleSections = React.useMemo(() => {
    return filterSidebarSections(sidebarSections, apiState?.kitchen);
  }, [apiState?.kitchen]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed mainSidebar inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-gradient-to-b from-[#8D0606] via-[#a30707] to-[#b80808] text-white shadow-[4px_0_24px_rgba(141,6,6,0.25)] border-r border-rose-900/20 transition-all duration-300 ${
          mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"
        } ${
          collapsed ? "lg:w-[84px]" : "lg:w-[280px]"
        }`}
      >
        {/* Header Brand Section */}
        <div className={`shrink-0 pt-5 pb-4 transition-all duration-300 ${collapsed ? "px-2 text-center" : "px-5"}`}>
          <div className={`flex items-center justify-between ${collapsed ? "lg:justify-center" : "gap-3"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs transition hover:scale-105 overflow-hidden">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt={kitchenName}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <ChefHat size={22} className="text-white drop-shadow-xs" />
                )}
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#8D0606] animate-pulse" />
              </div>

              {(!collapsed || mobileOpen) && (
                <div className={`min-w-0 flex-1 ${collapsed && !mobileOpen ? "hidden lg:hidden" : "block"}`}>
                  <h2 className="text-[15px] font-semibold tracking-tight text-white truncate leading-tight" title={kitchenName}>
                    {kitchenName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 text-[10.5px] font-medium text-rose-100/95 border border-white/10 shadow-2xs">
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{cleanRole}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="grid size-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition lg:hidden shrink-0"
              title="Close Navigation"
            >
              <X size={18} />
            </button>
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
        {visibleSections.map((section, sIdx) => (
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
                    onClick={() => onCloseMobile?.()}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center transition-all duration-200 ${
                        collapsed && !mobileOpen
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
                          size={collapsed && !mobileOpen ? 20 : 19}
                          strokeWidth={isActive ? 2.3 : 1.9}
                          className={`shrink-0 transition-transform duration-200 ${
                            isActive ? "text-[#8D0606]" : "text-white group-hover:scale-110"
                          }`}
                        />
                        {(!collapsed || mobileOpen) && (
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

        {/* Subscription Info Card */}
        {(!collapsed || mobileOpen) && (
          <div className="mx-1 rounded-2xl bg-black/20 p-3.5 border border-white/10 text-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1 text-amber-300">
                <Sparkles size={13} />
                <span>{apiState?.selectedPlan?.name || "Growth Pro"}</span>
              </span>
              <span className="rounded-full bg-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider border border-emerald-400/20">
                Trial Active
              </span>
            </div>
            <p className="text-[11px] text-rose-100/75 leading-tight">
              14 days left in your free trial. All features unlocked.
            </p>
            <button
              type="button"
              onClick={() => {
                onCloseMobile?.();
                navigate("/onboarding");
              }}
              className="w-full rounded-lg bg-white/15 py-1.5 text-[11px] font-bold text-white hover:bg-white/25 transition text-center"
            >
              Manage Subscription
            </button>
          </div>
        )}

        {/* Logout Button at End of Menu */}
        <div className="pt-2">
          {collapsed && !mobileOpen && <div className="my-2 mx-auto h-[1px] w-6 bg-white/20" />}
          <button
            type="button"
            onClick={() => {
              onCloseMobile?.();
              if (onLogout) onLogout();
              else {
                localStorage.clear();
                sessionStorage.clear();
                navigate("/");
                window.location.reload();
              }
            }}
            title={collapsed && !mobileOpen ? "Logout Account" : undefined}
            className={`group relative flex w-full items-center transition-all duration-200 ${
              collapsed && !mobileOpen
                ? "justify-center size-11 mx-auto rounded-xl bg-white/10 hover:bg-rose-950/40 text-rose-100 hover:text-white"
                : "gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold bg-white/10 hover:bg-rose-950/40 text-rose-100 hover:text-white border border-white/15 shadow-2xs hover:border-white/30"
            }`}
          >
            <LogOut
              size={collapsed && !mobileOpen ? 20 : 18}
              strokeWidth={2}
              className="shrink-0 transition-transform duration-200 group-hover:scale-110 text-rose-200 group-hover:text-white"
            />
            {(!collapsed || mobileOpen) && (
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

      {/* Bottom Action Footer - Only if user has CREATE permission on menu */}
      {canCreate("menu") && (
        <div className={`shrink-0 pb-4 pt-2.5 transition-all duration-300 ${collapsed && !mobileOpen ? "px-2" : "px-4"}`}>
          {!collapsed || mobileOpen ? (
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
                onClick={() => {
                  onCloseMobile?.();
                  navigate("/add-menu");
                }}
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
                onClick={() => {
                  onCloseMobile?.();
                  navigate("/add-menu");
                }}
                type="button"
                title="Add New Menu"
              >
                <Plus size={19} />
              </button>
            </div>
          )}

          {(!collapsed || mobileOpen) && (
            <div className="mt-2.5 text-[9.5px] font-bold text-white/60 text-center tracking-widest uppercase">
              Cloud Kitchen POS • 2026
            </div>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
