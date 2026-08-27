import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { customerReviews } from '../data/mockData';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const Reviews = () => {
  const toast = useToast();
  const { theme } = useTheme();

  // Local state for reviews & replies
  const [reviewsList, setReviewsList] = useState(customerReviews);
  const [replyText, setReplyText] = useState({});
  const [savedReplies, setSavedReplies] = useState({});
  const [likedReviews, setLikedReviews] = useState({});

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedStar, setSelectedStar] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const starFilters = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars & Below'];

  const sortOptions = [
    { value: 'newest', label: 'Most Recent Reviews' },
    { value: 'highest', label: 'Highest Rated First' },
    { value: 'lowest', label: 'Lowest Rated First' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      minWidth: '190px',
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

  const handleReplySubmit = (e, reviewId) => {
    e.preventDefault();
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    setSavedReplies((prev) => ({
      ...prev,
      [reviewId]: [
        ...(prev[reviewId] || []),
        {
          id: Date.now(),
          text,
          time: 'Just now',
          author: 'Executive Chef / Manager',
        },
      ],
    }));

    toast.success(`Manager response sent for review #${reviewId}!`);
    setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
  };

  const toggleLike = (reviewId) => {
    setLikedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
    toast.info(!likedReviews[reviewId] ? 'Marked review as helpful!' : 'Removed helpful mark.');
  };

  // Filter & Sort Logic
  const filteredReviews = reviewsList
    .filter((rev) => {
      const matchesSearch =
        rev.name.toLowerCase().includes(search.toLowerCase()) ||
        rev.dishName.toLowerCase().includes(search.toLowerCase()) ||
        rev.comment.toLowerCase().includes(search.toLowerCase());

      let matchesStar = true;
      if (selectedStar === '5 Stars') matchesStar = rev.rating === 5;
      else if (selectedStar === '4 Stars') matchesStar = rev.rating === 4;
      else if (selectedStar === '3 Stars') matchesStar = rev.rating === 3;
      else if (selectedStar === '2 Stars & Below') matchesStar = rev.rating <= 2;

      return matchesSearch && matchesStar;
    })
    .sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0; // Default newest
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStar, search, sortBy]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-10 animate-fade-in  mx-auto">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Quality Feedback Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                4.8 Avg Star Score
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Diner Reviews & Sentiment Analysis</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Monitor dining experience feedback, recipe rating sentiment, and manage direct kitchen staff responses.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 text-center md:border-r border-slate-100 dark:border-slate-800 pr-4 space-y-2">
          <span className="text-5xl font-black text-slate-900 dark:text-white">4.7</span>
          <div className="flex justify-center text-amber-400 gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-extrabold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Based on 1,420 Verified Customer Orders
          </p>
        </div>

        <div className="md:col-span-8 space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          {[
            { star: 5, count: 980, percent: '70%' },
            { star: 4, count: 320, percent: '22%' },
            { star: 3, count: 80, percent: '5%' },
            { star: 2, count: 30, percent: '2%' },
            { star: 1, count: 10, percent: '1%' },
          ].map((bar) => (
            <div key={bar.star} className="flex items-center gap-3">
              <span className="w-14 text-slate-500 dark:text-slate-400 font-extrabold">{bar.star} Stars</span>
              <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: bar.percent }} />
              </div>
              <span className="w-12 text-right text-slate-400 font-black">{bar.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented Star Rating Pills */}
        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-x-auto no-scrollbar">
          {starFilters.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStar(st)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                selectedStar === st
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Sort Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-60">
            <input
              type="text"
              placeholder="Search reviewer or dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <Select
            options={sortOptions}
            value={sortOptions.find((opt) => opt.value === sortBy)}
            onChange={(opt) => setSortBy(opt ? opt.value : 'newest')}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      {/* Review Cards List OR Empty State */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-5">
          <div className="space-y-5">
            {paginatedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 space-y-4 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-100 dark:ring-slate-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{rev.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Order
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{rev.rating}.0</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs text-slate-400 font-medium">{rev.time}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 shrink-0">
                    Dish: {rev.dishName}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium flex-1">
                    "{rev.comment}"
                  </p>
                  {rev.dishImage && (
                    <img
                      src={rev.dishImage}
                      alt={rev.dishName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm shrink-0 hover:scale-105 transition-transform cursor-pointer"
                    />
                  )}
                </div>

                {savedReplies[rev.id] && savedReplies[rev.id].length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                      Kitchen Manager Responses
                    </span>
                    {savedReplies[rev.id].map((rep) => (
                      <div key={rep.id} className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-slate-800 border border-brand-200/70 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-[#8C0D0D] dark:text-rose-400">{rep.author}</span>
                          <span className="text-slate-400 font-medium">{rep.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">{rep.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => toggleLike(rev.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      likedReviews[rev.id]
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({likedReviews[rev.id] ? 1 : 0})</span>
                  </button>

                  <form onSubmit={(e) => handleReplySubmit(e, rev.id)} className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write a response as Cloud Kitchen Manager..."
                      value={replyText[rev.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-brand"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredReviews.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        <EmptyState
          title="No data in current status"
          description="We couldn't find any reviews matching your selected star filter or search query."
          onReset={() => {
            setSelectedStar('All');
            setSearch('');
          }}
        />
      )}
    </div>
  );
};
