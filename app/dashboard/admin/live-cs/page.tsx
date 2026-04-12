"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Calendar, User, Send, CheckCircle, Clock, Phone, Bot } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { getOpenChatsForAdmin, getChatMessages, sendLiveMessage, type LiveChatSession, type ChatMessage } from "@/lib/live_chat";
import { supabase } from "@/lib/supabase";

export default function AdminLiveCS() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    
    // Listen for new chat sessions
    const sessionChannel = supabase
      .channel("admin-sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chats" },
        () => fetchSessions()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_chats" },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);

      // Listen for messages in active chat
      const msgChannel = supabase
        .channel(`admin-chat:${activeSession.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "live_chat_messages",
            filter: `chat_id=eq.${activeSession.id}`,
          },
          (payload) => {
            const newMsg = payload.new as any;
            if (newMsg.sender_type === "user" || newMsg.sender_type === "bot") {
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
      };
    }
  }, [activeSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSessions = async () => {
    const data = await getOpenChatsForAdmin();
    setSessions(data);
  };

  const fetchMessages = async (id: string) => {
    const data = await getChatMessages(id);
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeSession || loading) return;

    const val = inputValue.trim();
    setInputValue("");
    setLoading(true);

    const success = await sendLiveMessage(activeSession.id, val, "agent", user?.id);
    if (success) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          chatId: activeSession.id,
          content: val,
          senderType: "agent",
          senderId: user?.id,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  const closeChat = async (id: string) => {
    await supabase.from("live_chats").update({ status: "closed" }).eq("id", id);
    if (activeSession?.id === id) {
      setActiveSession(null);
      setMessages([]);
    }
    fetchSessions();
  };

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6 overflow-hidden animate-fade-in">
      {/* Sessions List */}
      <div className="w-80 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Live <span className="gradient-text">CS Support</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{sessions.length} aktif chat</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="card p-6 text-center">
              <Phone size={30} className="text-slate-700 mx-auto mb-2 opacity-50" />
              <p className="text-slate-500 text-sm">Belum ada chat aktif</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left card p-4 transition-all ${
                  activeSession?.id === session.id
                    ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                    : "hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {(session.guestName || "Guest")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white truncate max-w-[120px] flex items-center gap-1.5">
                        {session.guestName || "Guest"}
                        {!session.userId && (
                          <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-slate-400 font-normal">GUEST</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {session.guestEmail}
                      </p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                  <Clock size={10} />
                  {new Date(session.createdAt).toLocaleTimeString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col overflow-hidden bg-[#0c0c14]/50 border-white/5">
        {activeSession ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <User size={16} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeSession.guestName || "Guest"}
                    {!activeSession.userId && (
                      <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400 font-normal">GUEST USER</span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-1">Chatting Live</p>
                </div>
              </div>
              <button 
                onClick={() => closeChat(activeSession.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Tutup Chat
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderType === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.senderType === "agent"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : msg.senderType === "bot"
                      ? "bg-white/5 text-slate-400 border border-white/10 rounded-bl-none italic"
                      : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
                  }`}>
                    {msg.senderType === "bot" && <div className="flex items-center gap-1.5 mb-1 text-[10px] not-italic opacity-80 uppercase tracking-tighter"><Bot size={10} /> Gemini Assistant</div>}
                    {msg.content}
                    <div className="text-[9px] mt-1 opacity-50 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Kirim pesan balasan..."
                  className="input flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="btn-primary !px-5"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pilih Chat</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Pilih salah satu sesi chat di sebelah kiri untuk mulai berbicara dengan pengguna secara langsung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
