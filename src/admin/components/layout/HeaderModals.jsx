import React, { useState } from 'react';
import { X, Bell, BellOff, MessageSquare, MessageSquareOff, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export const HeaderModals = ({ activeModal, closeModal }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promotions, setPromotions] = useState([]);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden">
        
        {/* 1. NOTIFICATIONS MODAL (BELL) */}
        {activeModal === 'notifications' && (
          <div>
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Kitchen Notifications</h3>
                  <p className="text-xs text-blue-100">
                    {notifications.length > 0 ? `${notifications.length} Unread orders & kitchen updates` : 'No unread notifications'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center mb-3 text-blue-500">
                    <BellOff className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">No Data Found</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                    There are no new notifications or alerts at this moment.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl flex items-start gap-3 border transition-all ${
                      item.unread ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 text-xs">{item.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={notifications.length === 0}
                onClick={() => {
                  setNotifications([]);
                  toast.success('All notifications marked as read!');
                  closeModal();
                }}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark all as read
              </button>
              <button
                onClick={() => {
                  closeModal();
                  navigate('/admin/orders');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-700 flex items-center gap-1.5"
              >
                View Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. MESSAGES MODAL (MESSAGE) */}
        {activeModal === 'messages' && (
          <div>
            <div className="bg-sky-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Customer & Driver Messages</h3>
                  <p className="text-xs text-sky-100">
                    {messages.length > 0 ? `${messages.length} Unread conversations` : 'No unread conversations'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-dashed border-sky-200 dark:border-sky-800 flex items-center justify-center mb-3 text-sky-500">
                    <MessageSquareOff className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">No Data Found</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                    There are no unread messages from customers or drivers.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      closeModal();
                      navigate('/admin/chat');
                    }}
                    className="p-3.5 rounded-2xl flex items-center justify-between bg-slate-50 hover:bg-sky-50/80 border border-slate-100 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={msg.avatar} alt={msg.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-200" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{msg.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{msg.text}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {messages.length > 0 ? `${messages.length} pending queries` : '0 pending queries'}
              </span>
              <button
                onClick={() => {
                  closeModal();
                  navigate('/admin/chat');
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs shadow hover:bg-sky-700 flex items-center gap-1.5"
              >
                Open Full Chat <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. PROMOTIONS MODAL (GIFT) */}
        {activeModal === 'promotions' && (
          <div>
            <div className="bg-indigo-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Promotions & Vouchers</h3>
                  <p className="text-xs text-indigo-100">
                    {promotions.length > 0 ? `${promotions.length} Active campaign offers` : 'No active campaign offers'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
              {promotions.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-3 text-indigo-500">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">No Data Found</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                    No active discount vouchers or promotional campaigns found.
                  </p>
                </div>
              ) : (
                promotions.map((promo) => (
                  <div key={promo.code} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-900 text-sm tracking-wider uppercase bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {promo.code}
                        </span>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                          {promo.discount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{promo.desc}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`Voucher code ${promo.code} copied to clipboard!`)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      Copy Code
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  toast.info('Create promotion dialog opened.');
                  closeModal();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-700 flex items-center gap-1.5"
              >
                + Create New Campaign
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
