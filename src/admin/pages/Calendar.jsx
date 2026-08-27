import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Trash2,
  Tag,
  Check,
  AlertCircle,
  Truck,
  ChefHat,
  Utensils,
  Wrench,
  Sparkles,
  Filter
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const Calendar = () => {
  const toast = useToast();
  const { theme } = useTheme();

  const today = new Date();
  const realYear = today.getFullYear();
  const realMonthIndex = today.getMonth();
  const realDay = today.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const realMonthYearStr = `${monthNames[realMonthIndex]} ${realYear}`;

  const [currentYear, setCurrentYear] = useState(realYear);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(realMonthIndex);

  const [events, setEvents] = useState([
    { id: 1, title: 'Bulk Catering Order #402', time: '10:30 AM - 12:00 PM', type: 'Catering', date: Math.min(realDay + 2, 28), monthYear: realMonthYearStr, desc: '50x Bento boxes delivery to Acme Corp HQ', color: 'bg-rose-500 text-white', iconColor: 'text-rose-500' },
    { id: 2, title: 'Fresh Produce Supply Truck', time: '07:00 AM', type: 'Inventory', date: realDay, monthYear: realMonthYearStr, desc: 'Weekly organic veggies delivery from Green Farms', color: 'bg-sky-600 text-white', iconColor: 'text-sky-500' },
    { id: 3, title: 'Shift: Chef Marcus & Team', time: '02:00 PM - 10:00 PM', type: 'Shift', date: realDay, monthYear: realMonthYearStr, desc: 'Evening prep shift team for dinner rush', color: 'bg-amber-500 text-white', iconColor: 'text-amber-500' },
    { id: 4, title: 'Equipment Maintenance Check', time: '04:00 PM', type: 'Maintenance', date: Math.min(realDay + 5, 28), monthYear: realMonthYearStr, desc: 'Quarterly oven & freezer inspection by technician', color: 'bg-indigo-600 text-white', iconColor: 'text-indigo-500' },
    { id: 5, title: 'VIP Wedding Tasting Session', time: '01:00 PM - 03:00 PM', type: 'Catering', date: Math.min(realDay + 8, 28), monthYear: realMonthYearStr, desc: 'Special menu tasting for 12 guests', color: 'bg-rose-500 text-white', iconColor: 'text-rose-500' },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayForNewEvent, setSelectedDayForNewEvent] = useState(realDay);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState(realDay);

  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Catering',
    time: '10:00 AM - 02:00 PM',
    desc: '',
  });

  const categoryOptions = [
    { value: 'Catering', label: 'Catering Order' },
    { value: 'Shift', label: 'Kitchen Shift' },
    { value: 'Inventory', label: 'Inventory Delivery' },
    { value: 'Maintenance', label: 'Equipment Maintenance' },
  ];

  const activeMonthYearStr = `${monthNames[currentMonthIndex]} ${currentYear}`;

  const daysInMonthCount = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();

  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const paddingSlots = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const dayOptions = daysArray.map((d) => ({
    value: d,
    label: `Day ${d} (${activeMonthYearStr})`,
  }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': {
        borderColor: theme === 'dark' ? '#475569' : '#cbd5e1',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? theme === 'dark' ? '#334155' : '#f8fafc'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
    }),
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonthIndex(realMonthIndex);
    setCurrentYear(realYear);
    setMobileSelectedDay(realDay);
    toast.info(`Reset calendar view to Today (${realMonthYearStr}).`);
  };

  const handleCreateEventSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title) {
      toast.error('Please enter event title!');
      return;
    }

    const typeColorMap = {
      Catering: 'bg-rose-500 text-white',
      Shift: 'bg-amber-500 text-white',
      Inventory: 'bg-sky-600 text-white',
      Maintenance: 'bg-indigo-600 text-white',
    };

    const created = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      date: selectedDayForNewEvent,
      monthYear: activeMonthYearStr,
      desc: newEvent.desc || 'No description provided.',
      color: typeColorMap[newEvent.type] || 'bg-brand-800 text-white',
    };

    setEvents([...events, created]);
    toast.success(`Event "${newEvent.title}" scheduled for ${selectedDayForNewEvent} ${activeMonthYearStr}!`);
    setIsAddModalOpen(false);
    setNewEvent({ title: '', type: 'Catering', time: '10:00 AM - 02:00 PM', desc: '' });
  };

  const handleDeleteEvent = (id, title) => {
    setEvents(events.filter((ev) => ev.id !== id));
    toast.success(`Event "${title}" removed from schedule.`);
    setSelectedEventDetails(null);
  };

  const filteredEvents = events.filter(
    (ev) =>
      ev.monthYear === activeMonthYearStr &&
      (selectedFilter === 'All' || ev.type === selectedFilter)
  );

  const mobileDayEvents = filteredEvents.filter((e) => e.date === mobileSelectedDay);

  return (
    <div className="space-y-6 pb-10 animate-fade-in mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[10px] sm:text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Kitchen Prep & Schedule Engine
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] sm:text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Current: {realMonthYearStr}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Kitchen Operations & Dispatch Calendar</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Schedule catering orders, shift rosters, batch prep maintenance, and supplier delivery slots.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedDayForNewEvent(realDay);
                setIsAddModalOpen(true);
              }}
              className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Month Calendar Grid */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Calendar Navigation & Filter Ribbon */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-rose-400 shrink-0">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate">{activeMonthYearStr}</h3>
              </div>

              {/* Month Stepper Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-rose-400 text-[11px] sm:text-xs font-extrabold hover:bg-brand-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills — horizontally scrollable on mobile */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar">
              {['All', 'Catering', 'Shift', 'Inventory', 'Maintenance'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    selectedFilter === cat
                      ? 'bg-brand-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Days Grid Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-6 shadow-card border border-slate-100 dark:border-slate-800 space-y-3 sm:space-y-4 overflow-hidden">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-3 text-center text-[9px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Days Grid Items */}
            <div className="grid grid-cols-7 gap-1 sm:gap-3">
              {/* Empty Padding Slots */}
              {paddingSlots.map((slot) => (
                <div key={`pad-${slot}`} className="min-h-[52px] sm:min-h-[110px] p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-50/20 dark:bg-slate-800/20 border border-slate-100/40 dark:border-slate-800/40 pointer-events-none opacity-20" />
              ))}

              {/* Actual Month Days */}
              {daysArray.map((day) => {
                const dayEvents = filteredEvents.filter((e) => e.date === day);
                const isToday = day === realDay && activeMonthYearStr === realMonthYearStr;
                const isMobileSelected = day === mobileSelectedDay;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      setMobileSelectedDay(day);
                      setSelectedDayForNewEvent(day);
                    }}
                    className={`min-h-[52px] sm:min-h-[110px] p-1 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group relative ${
                      isToday
                        ? 'bg-brand-50/80 dark:bg-slate-800 border-brand-800 dark:border-rose-500 ring-2 ring-brand-800/30 shadow-md'
                        : isMobileSelected
                        ? 'bg-brand-50/40 dark:bg-slate-800/70 border-brand-800/40 dark:border-rose-500/40'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-brand-800/40 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] sm:text-xs font-extrabold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                          isToday ? 'bg-brand-800 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 group-hover:text-brand-800 dark:group-hover:text-rose-400'
                        }`}
                      >
                        {day}
                      </span>
                      {/* Desktop-only quick add */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayForNewEvent(day);
                          setIsAddModalOpen(true);
                        }}
                        className="hidden sm:block"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity text-brand-800 dark:text-rose-400" />
                      </button>
                    </div>

                    {/* Mobile: just a dot per event; Desktop: full chip list */}
                    <div className="hidden sm:block space-y-1.5 my-1 flex-1">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventDetails(ev);
                          }}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold truncate cursor-pointer shadow-xs hover:scale-105 transition-transform flex items-center gap-1.5 ${ev.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="flex sm:hidden items-center justify-center gap-0.5 flex-wrap mt-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${ev.color.split(' ')[0]}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile-only: selected day's events list (since chips are hidden in-grid on mobile) */}
          <div className="sm:hidden bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-card border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Day {mobileSelectedDay} · {mobileDayEvents.length} {mobileDayEvents.length === 1 ? 'event' : 'events'}
              </h4>
              <button
                onClick={() => {
                  setSelectedDayForNewEvent(mobileSelectedDay);
                  setIsAddModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-rose-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {mobileDayEvents.length > 0 ? (
              <div className="space-y-2">
                {mobileDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventDetails(ev)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 ${ev.color}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold">No events scheduled. Tap + to add one.</p>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Upcoming Events Sidebar */}
        <div className="lg:col-span-4 space-y-5 min-w-0">
          {/* Quick Category Summary Badges */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-brand-800 dark:text-rose-400 shrink-0" />
              Kitchen Schedule Overview
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 min-w-0">
                  <Utensils className="w-4 h-4 shrink-0" />
                  <span className="truncate">Catering</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white shrink-0">
                  {events.filter((e) => e.monthYear === activeMonthYearStr && e.type === 'Catering').length}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 min-w-0">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Supply</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white shrink-0">
                  {events.filter((e) => e.monthYear === activeMonthYearStr && e.type === 'Inventory').length}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 min-w-0">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Shifts</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white shrink-0">
                  {events.filter((e) => e.monthYear === activeMonthYearStr && e.type === 'Shift').length}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 min-w-0">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span className="truncate">Maint.</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white shrink-0">
                  {events.filter((e) => e.monthYear === activeMonthYearStr && e.type === 'Maintenance').length}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Events Feed Stream OR Empty State */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-card border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">Upcoming Events ({filteredEvents.length})</h3>
              <span className="text-[11px] sm:text-xs font-bold text-brand-800 dark:text-rose-400 shrink-0">{activeMonthYearStr}</span>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventDetails(ev)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 hover:border-brand-800/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                        Day {ev.date}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${ev.color}`}>
                        {ev.type}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-brand-800 dark:group-hover:text-rose-400 transition-colors">
                      {ev.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {ev.time}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No data in current status"
                description={`No scheduled events found for ${activeMonthYearStr} under "${selectedFilter}" category.`}
                onReset={() => setSelectedFilter('All')}
              />
            )}
          </div>
        </div>
      </div>

      {/* 1. SCHEDULE NEW EVENT MODAL */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col">
              <div className="bg-[#8C0D0D] text-white p-6 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
                    <CalendarIcon className="w-5 h-5 text-amber-300 shrink-0" />
                    Schedule Kitchen Event
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5 truncate font-medium">
                    Target Date: Day {selectedDayForNewEvent} ({activeMonthYearStr})
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEventSubmit} className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate Catering Delivery #405"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Event Category
                    </label>
                    <Select
                      options={categoryOptions}
                      value={categoryOptions.find((opt) => opt.value === newEvent.type)}
                      onChange={(opt) => setNewEvent({ ...newEvent, type: opt ? opt.value : 'Catering' })}
                      styles={customSelectStyles}
                      isSearchable={false}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Target Day of Month
                    </label>
                    <Select
                      options={dayOptions}
                      value={dayOptions.find((opt) => opt.value === selectedDayForNewEvent)}
                      onChange={(opt) => setSelectedDayForNewEvent(opt ? opt.value : 1)}
                      styles={customSelectStyles}
                      isSearchable={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Duration
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM - 02:00 PM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Description & Notes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Specific shift instructions, catering dish manifest..."
                    value={newEvent.desc}
                    onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold shadow-brand"
                  >
                    Schedule Event
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 2. EVENT DETAILS MODAL */}
      {selectedEventDetails &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col">
              <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-6 relative shrink-0">
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white inline-block mb-2">
                  {selectedEventDetails.type} Event
                </span>
                <h3 className="text-lg sm:text-xl font-black pr-8">{selectedEventDetails.title}</h3>
                <p className="text-xs text-brand-200 mt-1 flex items-center gap-1 flex-wrap">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {selectedEventDetails.time} • Day {selectedEventDetails.date} ({selectedEventDetails.monthYear})
                </p>
              </div>

              <div className="p-6 space-y-4 text-xs font-semibold overflow-y-auto">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block mb-1">Description & Specs</span>
                  <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium leading-relaxed">
                    {selectedEventDetails.desc}
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDeleteEvent(selectedEventDetails.id, selectedEventDetails.title)}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                  <button
                    onClick={() => setSelectedEventDetails(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};