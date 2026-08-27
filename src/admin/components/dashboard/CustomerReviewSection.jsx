import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { customerReviews } from '../../data/mockData';

export const CustomerReviewSection = () => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Customer Review</h3>
          <p className="text-xs text-slate-400 font-medium">Eum fuga consequuntur utadsjn et.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-brand-800 dark:hover:bg-rose-600 hover:text-white hover:border-brand-800 transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-brand-800 dark:hover:bg-rose-600 hover:text-white hover:border-brand-800 transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {customerReviews.map((review) => (
          <div
            key={review.id}
            className="min-w-[340px] max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex items-center justify-between relative overflow-visible hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="pr-16 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-100 dark:ring-slate-800"
                />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{review.name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{review.time}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">
                {review.comment}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{review.rating}</span>
              </div>
            </div>

            {/* Circular Food Image Badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl shrink-0 group">
              <img
                src={review.dishImage}
                alt={review.dishName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
