import React, { useState } from 'react';
import {
  Search,
  Bell,
  BellOff,
  MessageSquare,
  MessageSquareOff,
  Gift,
  Menu,
  ArrowRight,
  X,
  Package,
  Truck,
  AlertTriangle,
  Star,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const Header = () => {
  const { searchQuery, setSearchQuery, setIsSidebarOpen, logout, user, isSidebarCollapsed, setIsSidebarCollapsed } = useApp();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  // Data states for header badges & dropdowns
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promotions, setPromotions] = useState([]);

  // Active Dropdown state: null | 'notifications' | 'messages' | 'promotions' | 'profile'
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeAll = () => setActiveDropdown(null);

  const handleLogout = () => {
    closeAll();
    logout();
    toast.success('Logged out successfully.');
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1c2739] backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Sidebar Toggle + Mobile Menu + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-800 dark:hover:text-rose-400 transition-all hover:scale-105 active:scale-95"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed
              ? <PanelLeftOpen className="w-5 h-5" />
              : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-5 pr-12 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-sm focus:outline-none focus:border-brand-800 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
            />
            <button className="absolute right-4 top-3.5 text-slate-400 hover:text-brand-800 dark:hover:text-brand-400 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Section: Badges & Profile Dropdowns */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5">
            {/* DARK / LIGHT THEME TOGGLE BUTTON */}
            <button
              onClick={() => {
                toggleTheme();
                toast.info(`Switched to ${theme === 'light' ? 'Midnight Dark' : 'Light'} Mode`);
              }}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shadow-xs"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </button>

            {/* 1. BELL NOTIFICATION DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('notifications')}
                className={`relative p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs ${
                  activeDropdown === 'notifications'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-blue-50/80 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400'
                }`}
                title={notifications.length > 0 ? `Notifications (${notifications.length})` : 'Notifications'}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Popup */}
              {activeDropdown === 'notifications' && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-dropdown text-left">
                  <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm">Kitchen Notifications</h4>
                      <p className="text-[11px] text-blue-100">
                        {notifications.length > 0 ? `${notifications.length} Unread orders & kitchen updates` : 'No unread notifications'}
                      </p>
                    </div>
                    <button onClick={closeAll} className="p-1 text-white/80 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center mb-3 text-blue-500 dark:text-blue-400">
                          <BellOff className="w-6 h-6" />
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Data Found</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                          There are no new notifications or kitchen alerts at this moment.
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const ItemIcon = item.icon || Package;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl flex items-start gap-2.5 border transition-all text-xs ${
                              item.unread ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${item.iconColor || 'text-sky-600 bg-sky-50'}`}>
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px]">{item.title}</h5>
                                <span className="text-[9px] text-slate-400">{item.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 truncate">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      disabled={notifications.length === 0}
                      onClick={() => {
                        setNotifications([]);
                        toast.success('All notifications marked as read!');
                        closeAll();
                      }}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={() => {
                        closeAll();
                        navigate('/admin/orders');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 flex items-center gap-1"
                    >
                      View Orders <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. MESSAGE CHAT DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('messages')}
                className={`relative p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs ${
                  activeDropdown === 'messages'
                    ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                    : 'bg-sky-50/80 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400'
                }`}
                title={messages.length > 0 ? `Messages (${messages.length})` : 'Messages'}
              >
                <MessageSquare className="w-5 h-5" />
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
                    {messages.length}
                  </span>
                )}
              </button>

              {/* Messages Dropdown Popup */}
              {activeDropdown === 'messages' && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-dropdown text-left">
                  <div className="bg-sky-600 text-white p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm">Customer & Driver Messages</h4>
                      <p className="text-[11px] text-sky-100">
                        {messages.length > 0 ? `${messages.length} Unread messages` : 'No unread messages'}
                      </p>
                    </div>
                    <button onClick={closeAll} className="p-1 text-white/80 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-dashed border-sky-200 dark:border-sky-800 flex items-center justify-center mb-3 text-sky-500 dark:text-sky-400">
                          <MessageSquareOff className="w-6 h-6" />
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Data Found</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                          There are no unread customer or delivery driver conversations.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => {
                            closeAll();
                            navigate('/admin/chat');
                          }}
                          className="p-3 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-sky-50/80 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={msg.avatar} alt={msg.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-200" />
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{msg.name}</h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">{msg.text}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">{msg.time}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {messages.length > 0 ? `${messages.length} active chats` : '0 active chats'}
                    </span>
                    <button
                      onClick={() => {
                        closeAll();
                        navigate('/admin/chat');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-[11px] hover:bg-sky-700 flex items-center gap-1"
                    >
                      Open Chat <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. GIFT PROMOTIONS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('promotions')}
                className={`relative p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs ${
                  activeDropdown === 'promotions'
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                    : 'bg-indigo-50/80 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                }`}
                title={promotions.length > 0 ? `Rewards & Offers (${promotions.length})` : 'Rewards & Offers'}
              >
                <Gift className="w-5 h-5" />
                {promotions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
                    {promotions.length}
                  </span>
                )}
              </button>

              {/* Promotions Dropdown Popup */}
              {activeDropdown === 'promotions' && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-dropdown text-left">
                  <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm">Promotions & Loyalty Vouchers</h4>
                      <p className="text-[11px] text-indigo-100">
                        {promotions.length > 0 ? `${promotions.length} Active campaign offers` : 'No active campaign offers'}
                      </p>
                    </div>
                    <button onClick={closeAll} className="p-1 text-white/80 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {promotions.length === 0 ? (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-3 text-indigo-500 dark:text-indigo-400">
                          <Gift className="w-6 h-6" />
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Data Found</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                          No active promotional vouchers or discount campaigns found.
                        </p>
                      </div>
                    ) : (
                      promotions.map((promo) => (
                        <div key={promo.code} className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-indigo-900 dark:text-indigo-200 text-xs bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                                {promo.code}
                              </span>
                              <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                {promo.discount}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">{promo.desc}</p>
                          </div>
                          <button
                            onClick={() => {
                              toast.success(`Coupon ${promo.code} copied!`);
                              closeAll();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {promotions.length > 0 ? `${promotions.length} Active Coupons` : '0 Active Coupons'}
                    </span>
                    <button
                      onClick={() => {
                        toast.info('Create promotion dialog opened.');
                        closeAll();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700"
                    >
                      + Add Voucher
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block mx-1" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
              className="flex items-center gap-3 p-1.5 pr-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-400 font-medium">Hello,</span>
                <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name || 'Chef Admin'}
                </span>
              </div>
              <div className="relative">
                <img
                  src={user?.avatar || user?.profile}
                  alt={user?.name || 'Chef Admin'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-800/40 shadow-sm"
                />
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 absolute bottom-0 right-0" />
              </div>
            </button>

            {/* Profile Dropdown */}
            {activeDropdown === 'profile' && (
              <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-dropdown text-left space-y-0.5">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{user?.name || 'Chef Admin'}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{user?.email || 'admin@cloudkitchens.io'}</p>
                </div>
                <button
                  onClick={() => {
                    closeAll();
                    toast.info('Opening Kitchen Account Profile...');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-800 dark:hover:text-brand-400 transition-colors"
                >
                  Account Profile
                </button>
                <button
                  onClick={() => {
                    closeAll();
                    toast.info('Switching active kitchen branch...');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-800 dark:hover:text-brand-400 transition-colors"
                >
                  Branch Manager
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between"
                  >
                    <span>Log Out</span>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
