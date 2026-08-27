import React, { useState } from 'react';
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, Image, Paperclip, CheckCheck } from 'lucide-react';
import { mockChats } from '../data/mockData';

export const Chat = () => {
  const [chats, setChats] = useState(mockChats);
  const [activeChat, setActiveChat] = useState(mockChats[0]);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Jons Sena', text: 'Hi! Is extra chili oil available for order #CK-9082?', time: '14:20', isMe: false },
    { id: 2, sender: 'Me', text: 'Hello Jons! Yes absolutely, our kitchen team will add 2 cups of house chili oil for you.', time: '14:22', isMe: true },
    { id: 3, sender: 'Jons Sena', text: 'Awesome! Thank you so much for the quick response!', time: '14:23', isMe: false },
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'Me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');

    // Simulate auto reply after 1.5 seconds
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: activeChat.sender,
          text: 'Got it! Thanks for updating.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
        },
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Live Dispatch & Support Hub
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Messaging Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Kitchen Support & Rider Dispatch Chat</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Communicate directly in real-time with customers, kitchen line cooks, and fleet riders.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Interface Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Conversation List */}
        <div className="lg:col-span-4 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-brand-800 text-slate-900 dark:text-slate-100"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="space-y-1">
              {chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChat(c)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    activeChat.id === c.id
                      ? 'bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={c.avatar} alt={c.sender} className="w-10 h-10 rounded-full object-cover" />
                      <span className="w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{c.sender}</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate max-w-[140px]">{c.lastMsg}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{c.time}</span>
                    {c.unread > 0 && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-brand-800 dark:bg-rose-600 text-white rounded-full text-[9px] font-extrabold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Active Chat Box */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/40">
          {/* Active Chat Header */}
          <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={activeChat.avatar} alt={activeChat.sender} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{activeChat.sender}</h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{activeChat.role} • Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200">
                <Video className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[420px]">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs md:max-w-sm p-3.5 rounded-2xl text-xs space-y-1 shadow-sm ${
                    m.isMe
                      ? 'bg-brand-800 dark:bg-rose-700 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <div className={`flex items-center justify-end gap-1 text-[9px] ${m.isMe ? 'text-brand-200' : 'text-slate-400 dark:text-slate-400'}`}>
                    <span>{m.time}</span>
                    {m.isMe && <CheckCheck className="w-3 h-3 text-brand-200" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Message Input */}
          <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Type your message to customer..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-800"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-800 dark:bg-rose-700 hover:bg-brand-900 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
