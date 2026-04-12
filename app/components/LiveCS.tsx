"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Phone, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getGeminiResponse, detectAgentRequest } from "@/lib/gemini";
import { checkOnlineAgents, createChatSession, sendLiveMessage, getChatMessages, type ChatMessage } from "@/lib/live_chat";
import { saveContactMessage } from "@/lib/enrollment";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Mode = "idle" | "ai" | "checking" | "agent" | "offline-form" | "form-success" | "guest-form";

interface Message {
  role: "user" | "model" | "agent" | "system";
  content: string;
  timestamp: Date;
}

export default function LiveCS() {
  const { user, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({ adminOnline: false, instructorOnline: false, totalOnline: 0 });
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  
  // Offline/Guest form states
  const [offlineForm, setOfflineForm] = useState({ name: "", email: "", subject: "Bantuan CS Live", message: "" });
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "model",
          content: "Halo! Saya **Asisten AI MyLearning**. Saya siap membantu Anda memilih kursus terbaik. [Lihat Katalog](/courses)",
          timestamp: new Date(),
        },
      ]);
      setMode("ai");
    }
  }, [isOpen]);

  // Real-time listener for agent chat
  useEffect(() => {
    if (!chatSessionId) return;

    const channel = supabase
      .channel(`chat:${chatSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `chat_id=eq.${chatSessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_type === "agent") {
            setMessages((prev) => [
              ...prev,
              {
                role: "agent",
                content: newMsg.content,
                timestamp: new Date(newMsg.created_at),
              },
            ]);
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatSessionId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    
    // Add user message to UI
    const newMessage: Message = { role: "user", content: userMsg, timestamp: new Date() };
    setMessages((prev) => [...prev, newMessage]);

    if (mode === "ai") {
      setLoading(true);
      
      // Check for agent request intent
      if (detectAgentRequest(userMsg)) {
        await handleContactAgent();
        return;
      }

      // AI Response
      const history = messages.map(m => ({
        role: m.role === "model" ? "model" : "user" as any,
        parts: [{ text: m.content }]
      }));
      
      const response = await getGeminiResponse(history, userMsg);
      
      setMessages((prev) => [
        ...prev,
        { role: "model", content: response, timestamp: new Date() },
      ]);
      setLoading(false);
    } else if (mode === "agent" && chatSessionId) {
      // Send to live agent
      await sendLiveMessage(chatSessionId, userMsg, "user", user?.id);
    }
  };

  const handleContactAgent = async () => {
    setMode("checking");
    setLoading(true);
    
    // Artificial delay for premium feel
    await new Promise(r => setTimeout(r, 1500));
    
    const status = await checkOnlineAgents();
    setOnlineStatus(status);
    
    if (status.totalOnline > 0) {
      if (!isLoggedIn) {
        setMode("guest-form");
        setLoading(false);
        return;
      }
      
      const session = await createChatSession({
        userId: user?.id,
        name: user?.fullName || "Guest",
        email: user?.email || "guest@email.com"
      });
      
      if (session) {
        setChatSessionId(session.id);
        setMode("agent");
        setMessages((prev) => [
          ...prev,
          { 
            role: "system", 
            content: `Terhubung dengan ${status.adminOnline ? "Admin" : "Instruktur"} yang online. Mohon tunggu sebentar...`, 
            timestamp: new Date() 
          },
        ]);
      } else {
        setMode("ai");
        setMessages((prev) => [...prev, { role: "model", content: "Maaf, terjadi kesalahan teknis. Silakan coba lagi.", timestamp: new Date() }]);
      }
    } else {
      setMode("offline-form");
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Maaf, semua Admin dan Instruktur kami sedang offline saat ini. Silakan tinggalkan pesan melalui formulir di bawah ini.", timestamp: new Date() },
      ]);
    }
    setLoading(false);
  };

  const submitGuestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const session = await createChatSession({
      name: guestInfo.name,
      email: guestInfo.email
    });
    
    if (session) {
      setChatSessionId(session.id);
      setMode("agent");
      setMessages((prev) => [
        ...prev,
        { 
          role: "system", 
          content: `Terhubung dengan Agen. Halo ${guestInfo.name}, mohon tunggu sebentar...`, 
          timestamp: new Date() 
        },
      ]);
    } else {
      setMode("ai");
      setMessages((prev) => [...prev, { role: "model", content: "Maaf, gagal membuat sesi chat. Coba lagi.", timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const submitOfflineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await saveContactMessage(
      offlineForm.name || user?.fullName || "Guest",
      offlineForm.email || user?.email || "guest@email.com",
      offlineForm.subject,
      offlineForm.message
    );
    
    if (success) {
      setMode("form-success");
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-[100] animate-float pulse-glow"
        aria-label="Live CS"
      >
        <MessageSquare size={26} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[90vw] h-[520px] max-h-[80vh] glass-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] animate-in slide-in-bottom">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/90 to-cyan-500/90 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            {mode === "ai" ? <Bot size={22} /> : <User size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">
              {mode === "ai" ? "Assistant AI" : "Live Agent Support"}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${mode === "ai" || onlineStatus.totalOnline > 0 ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className="text-[10px] opacity-90 uppercase tracking-widest font-bold">
                {mode === "ai" ? "Online" : onlineStatus.totalOnline > 0 ? "Agent Online" : "Agent Offline"}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f0a1a]/40"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-purple-600 text-white rounded-br-none" 
                : msg.role === "system"
                ? "bg-white/5 text-slate-400 text-xs text-center w-full !rounded-lg"
                : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
            }`}>
              {msg.role === "model" ? (
                <article className="prose-cs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </article>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white/5 rounded-2xl px-4 py-2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {/* Mode Specific UIs */}
        {mode === "guest-form" && (
          <div className="animate-in fade-in pt-2">
            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl mb-3">
              <p className="text-[11px] text-purple-300">Siap menghubungkan Anda dengan Agen online. Silakan lengkapi data Anda:</p>
            </div>
            <form onSubmit={submitGuestForm} className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input 
                type="text" 
                placeholder="Nama Anda" 
                className="input text-xs !py-2" 
                required 
                value={guestInfo.name} 
                onChange={e => setGuestInfo({...guestInfo, name: e.target.value})}
              />
              <input 
                type="email" 
                placeholder="Email Anda" 
                className="input text-xs !py-2" 
                required 
                value={guestInfo.email} 
                onChange={e => setGuestInfo({...guestInfo, email: e.target.value})}
              />
              <button type="submit" className="btn-primary w-full text-xs !py-2 shadow-lg shadow-purple-500/20">
                Mulai Chat dengan Agen
              </button>
              <button type="button" onClick={() => setMode("ai")} className="w-full text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                Batal
              </button>
            </form>
          </div>
        )}

        {mode === "offline-form" && (
          <div className="animate-in fade-in pt-2">
            <form onSubmit={submitOfflineForm} className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input 
                type="text" 
                placeholder="Nama Lengkap" 
                className="input text-xs !py-2" 
                required 
                value={offlineForm.name || user?.fullName || ""} 
                onChange={e => setOfflineForm({...offlineForm, name: e.target.value})}
              />
              <input 
                type="email" 
                placeholder="Alamat Email" 
                className="input text-xs !py-2" 
                required 
                value={offlineForm.email || user?.email || ""} 
                onChange={e => setOfflineForm({...offlineForm, email: e.target.value})}
              />
              <textarea 
                placeholder="Apa yang bisa kami bantu?" 
                className="input text-xs !py-2 !h-20" 
                required 
                value={offlineForm.message}
                onChange={e => setOfflineForm({...offlineForm, message: e.target.value})}
              />
              <button type="submit" className="btn-primary w-full text-xs !py-2">
                Kirim Pesan
              </button>
            </form>
          </div>
        )}

        {mode === "form-success" && (
          <div className="text-center p-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <div>
              <h4 className="font-bold text-white">Pesan Terkirim!</h4>
              <p className="text-slate-400 text-xs mt-1">Kami akan menghubungi Anda kembali melalui email sesegera mungkin.</p>
            </div>
            <button onClick={() => setMode("ai")} className="text-purple-400 text-xs hover:underline">Kembali ke Chat AI</button>
          </div>
        )}
      </div>

      {/* Footer / Input Area */}
      <div className="p-3 border-t border-white/10 bg-[#0f0a1a]/80 backdrop-blur-sm">
        {mode === "ai" && (
          <div className="flex justify-center gap-2 mb-3">
            <button 
              onClick={handleContactAgent}
              className="text-[10px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Phone size={10} /> Hubungi Agen
            </button>
            <button 
              onClick={() => setInputValue("Cara daftar kursus?")}
              className="text-[10px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            >
              Info Kursus
            </button>
          </div>
        )}

        {mode !== "offline-form" && mode !== "form-success" && (
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={mode === "agent" ? "Tulis pesan ke agen..." : "Tanya asisten AI..."}
              className="input !py-2.5 !pr-10 !rounded-xl text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-500 hover:text-cyan-400 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
