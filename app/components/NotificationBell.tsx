"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2, CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification, type Notification } from "@/lib/notifications";

export default function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchNotifications();
      
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotif: Notification = {
              id: payload.new.id,
              userId: payload.new.user_id,
              title: payload.new.title,
              message: payload.new.message,
              type: payload.new.type,
              linkUrl: payload.new.link_url,
              isRead: payload.new.is_read,
              createdAt: payload.new.created_at
            };
            setNotifications(prev => [newNotif, ...prev]);
            
            // Notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (p) {}
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    const data = await getUserNotifications(user.id);
    setNotifications(data);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all relative"
        id="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong rounded-2xl overflow-hidden shadow-2xl z-[60] animate-fade-in border border-white/10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-sm font-semibold text-white">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">Belum ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-cyan-500/[0.02]' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      n.type === 'error' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {n.type === 'success' ? <CheckCircle2 size={16} /> :
                       n.type === 'warning' ? <AlertCircle size={16} /> :
                       n.type === 'error' ? <AlertCircle size={16} /> :
                       <Info size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      {n.linkUrl && (
                        <Link 
                          href={n.linkUrl}
                          className="inline-flex items-center gap-1 mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          Lihat detail <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="absolute right-2 bottom-2 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={12} />
                  </button>
                  {!n.isRead && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 text-center bg-white/5 border-t border-white/10">
            <Link 
              href="/dashboard/notifications" 
              className="text-xs text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
