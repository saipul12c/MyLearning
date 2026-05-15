"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, X, Megaphone, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SentinelBroadcaster() {
  const [announcement, setAnnouncement] = useState<{
    key: string;
    message: string;
    impact: string;
  } | null>(null);

  useEffect(() => {
    // 0. Initial Fetch for currently disabled features with announcements
    const fetchInitialAnnouncements = async () => {
      const { data } = await supabase
        .from('sentinel_configs')
        .select('key, broadcast_message, metadata, value, broadcast_on_disable')
        .eq('value', false)
        .eq('broadcast_on_disable', true)
        .not('broadcast_message', 'is', null)
        .limit(1); // Show only the most recent/relevant one

      if (data && data.length > 0) {
        setAnnouncement({
          key: data[0].key,
          message: data[0].broadcast_message!,
          impact: data[0].metadata?.impact || "medium",
        });
      }
    };

    fetchInitialAnnouncements();

    // 1. Subscribe to changes in sentinel_configs
    const channel = supabase
      .channel("sentinel_broadcasts")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sentinel_configs",
        },
        (payload) => {
          const { new: newData, old: oldData } = payload;
          
          // Trigger broadcast if:
          // 1. Feature was enabled and is now disabled
          // 2. broadcast_on_disable is true
          // 3. There is a message to show
          if (
            oldData.value === true && 
            newData.value === false && 
            newData.broadcast_on_disable === true &&
            newData.broadcast_message
          ) {
            setAnnouncement({
              key: newData.key,
              message: newData.broadcast_message,
              impact: newData.metadata?.impact || "medium",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!announcement) return null;

  const impactColors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-blue-500",
    low: "bg-emerald-500",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-6 left-0 right-0 z-[10000] flex justify-center px-6 pointer-events-none"
      >
        <div className="max-w-xl w-full glass-strong border border-white/10 rounded-2xl shadow-2xl p-1 flex items-start gap-4 pointer-events-auto overflow-hidden">
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white ${impactColors[announcement.impact] || "bg-blue-500"}`}>
            <ShieldAlert size={24} />
          </div>
          
          <div className="flex-1 py-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2">
              <Megaphone size={10} /> System Announcement
            </h4>
            <p className="text-sm text-white font-medium leading-relaxed">
              {announcement.message}
            </p>
          </div>

          <button 
            onClick={() => setAnnouncement(null)}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors mt-1 mr-1"
          >
            <X size={18} />
          </button>

          {/* Progress bar effect for auto-dismiss if we wanted, but announcements are usually important */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${impactColors[announcement.impact] || "bg-blue-500"}`}
            onAnimationComplete={() => setAnnouncement(null)}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
