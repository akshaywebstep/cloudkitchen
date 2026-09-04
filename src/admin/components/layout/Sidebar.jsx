import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ChevronDown,
  Plus,
  ChefHat,
  X,
  Building2,
  GitBranch,
  Utensils,
  FolderTree,
  Boxes,
  Trash2,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

import logoImg from '../../assets/logo.jpg';

export const Sidebar = () => {
  const { isAddMenuOpen, setIsAddMenuOpen, isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, logout } = useApp();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Kitchens', path: '/admin/kitchens', icon: Building2 },
    { name: 'Branches', path: '/admin/branches', icon: GitBranch },
    { name: 'Cuisines', path: '/admin/cuisines', icon: Utensils },
    { name: 'Menu Categories', path: '/admin/menu-categories', icon: FolderTree },
    { name: 'Menu Items', path: '/admin/foods', icon: ChefHat },
    { name: 'Ingredients', path: '/admin/ingredients', icon: Boxes },
    { name: 'Waste Management', path: '/admin/waste', icon: Trash2 },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: Sparkles },
    { name: 'Order', path: '/admin/orders', icon: ShoppingBag, hasSub: true, badge: '' },
    { name: 'logout', path: null, icon: LogOut, isLogout: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarCollapsed ? 'w-[68px]' : 'w-64'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden py-6">

          {/* Brand Header */}
          <div className={`flex items-center mb-6 px-4 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Cloud Kitchen Logo"
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#8C0D0D]/40 shadow-md"
                />
                <div className="min-w-0">
                  <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    Cloud Kitchen
                  </h1>
                  <p className="text-[10px] font-bold text-[#8C0D0D] dark:text-rose-400">
                    Admin Control Hub
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={logoImg}
                alt="Cloud Kitchen Logo"
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#8C0D0D]/40 shadow-md shrink-0"
              />
            )}

            {/* Mobile close */}
            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5 flex-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              // Logout button — render as button, not NavLink
              if (item.isLogout) {
                return (
                  <div key="logout" className="relative group pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={logout}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 2xl:py-4 rounded-2xl font-semibold text-xs 2xl:text-[16px] transition-all duration-200 cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-[#8C0D0D] hover:text-white group/btn ${
                        isSidebarCollapsed ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <Icon className={`shrink-0 ${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-colors group-hover:text-white`} />
                      {!isSidebarCollapsed && <span>Logout</span>}
                    </button>
                    {/* Collapsed tooltip */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 flex items-center gap-2">
                        Logout
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <div key={item.name} className="relative group">
                  <NavLink
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 2xl:py-4 rounded-2xl font-semibold text-xs 2xl:text-[16px] transition-all duration-200 ${
                        isSidebarCollapsed ? 'justify-center' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-[#8C0D0D] text-white shadow-md shadow-brand-900/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-brand-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? '' : 'gap-3'}`}>
                      <Icon
                        className={`shrink-0 ${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                          isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.hasSub && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isActive ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </NavLink>

                  {/* Collapsed tooltip */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 flex items-center gap-2">
                      {item.name}
                      {item.badge && (
                        <span className="bg-brand-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {/* Arrow */}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom: Add Menu Promo Box (hidden when collapsed) */}
          {!isSidebarCollapsed && (
            <div className="mt-4 mb-3 mx-2 relative rounded-3xl bg-gradient-to-br from-[#8C0D0D] via-[#a81010] to-[#600808] text-white p-4 shadow-xl shadow-brand-900/20 space-y-2.5">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <p className="text-[11px] font-extrabold leading-snug text-white">
                  Organize your kitchen menus & dishes easily
                </p>
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-md">
                  <ChefHat className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <button
                onClick={() => setIsAddMenuOpen(true)}
                className="w-full py-2 rounded-xl bg-white text-[#8C0D0D] font-extrabold text-[11px] shadow-md hover:bg-brand-50 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 relative z-10"
              >
                <Plus className="w-3.5 h-3.5 text-[#8C0D0D]" />
                 Add Menus
              </button>
            </div>
          )}

          {/* Collapsed: Add Menu icon button */}
          {isSidebarCollapsed && (
            <div className="px-2 mb-3 flex justify-center">
              <button
                onClick={() => setIsAddMenuOpen(true)}
                title="Add Menu"
                className="group relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8C0D0D] to-[#600808] flex items-center justify-center shadow-brand hover:scale-110 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Add Menu
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              </button>
            </div>
          )}

          {/* Footer */}
          {!isSidebarCollapsed && (
            <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 space-y-0.5">
              <p className="font-medium text-slate-500 dark:text-slate-400">Cloud Kitchens Admin Dashboard</p>
              <p>© 2026 All Rights Reserved</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
