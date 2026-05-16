"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Phone, CheckCircle, Clock, AlertCircle, Paperclip, Star, Mic, Square, Sparkles } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getGeminiResponse, type UserContext } from "@/lib/gemini";
import { detectAgentRequest, getClientFingerprint } from "@/lib/utils";
import { checkOnlineAgents, createChatSession, sendLiveMessage, getChatMessages, markMessagesAsRead } from "@/lib/live_chat";
import { triggerAutoAIReply } from "@/lib/ai_chat";
import { saveContactMessage, getUserEnrollments } from "@/lib/enrollment";
import { uploadChatFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { getPublicSentinelConfigs } from "@/lib/sentinel/actions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Mode = "idle" | "ai" | "checking" | "agent" | "offline-form" | "form-success" | "guest-form" | "survey";

interface Message {
  role: "user" | "model" | "agent" | "system";
  content: string;
  timestamp: Date;
}

export default function LiveCS() {
  const { user, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({ adminOnline: false, instructorOnline: false, totalOnline: 0 });
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("LearningAI");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [rating, setRating] = useState(0);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [suggestionChips, setSuggestionChips] = useState<string[]>(["Cara daftar?", "Info Kursus"]);
  const [ticketId, setTicketId] = useState("");
  const [activeContext, setActiveContext] = useState<{ type: string; id?: string; metadata?: any } | null>(null);
  const [userStats, setUserStats] = useState<{ tierName?: string; achievements?: string[] }>({});
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showAiFallback, setShowAiFallback] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const aiFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Offline/Guest form states
  const [offlineForm, setOfflineForm] = useState({ name: "", email: "", subject: "Bantuan CS Live", message: "" });
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });

  const scrollRef = useRef<HTMLDivElement>(null);

  // 0. Proactive Greeting & External Triggers
  useEffect(() => {
    // Listen for external triggers
    const handleTrigger = (e: any) => {
        const { action, message, context, open = true } = e.detail;
        
        if (open) setIsOpen(true);
        if (context) setActiveContext(context);
        
        if (message) {
            setMessages(prev => [...prev, {
                role: "model",
                content: message,
                timestamp: new Date()
            }]);
            setMode("ai");
        }

        if (action === "contact_agent") {
            handleContactAgent();
        }
    };

    window.addEventListener("trigger-live-cs", handleTrigger);

    // Stop if we are on Login or Register pages
    const EXCLUDED_PAGES = ["/login", "/register"];
    if (EXCLUDED_PAGES.includes(pathname)) return () => window.removeEventListener("trigger-live-cs", handleTrigger);

    const hasBeenShown = sessionStorage.getItem("proactive_greeting_shown");
    if (hasBeenShown) return () => window.removeEventListener("trigger-live-cs", handleTrigger);

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("proactive_greeting_shown", "true");
    }, 45000); // 45 seconds default

    return () => {
        clearTimeout(timer);
        window.removeEventListener("trigger-live-cs", handleTrigger);
    };
  }, [pathname]);


  // Fetch enrolled courses for AI awareness
  useEffect(() => {
    if (isLoggedIn && user) {
        getUserEnrollments(user.id).then(enrs => {
            setEnrolledIds(enrs.map(e => e.courseId));
        });

        // Fetch Gamification & Tier Data
        const fetchData = async () => {
            const { getUserBadges } = await import("@/lib/gamification");
            const { getTiers } = await import("@/lib/tiers");
            
            const [badges, tiers] = await Promise.all([
                getUserBadges(user.id),
                getTiers()
            ]);

            const myTier = tiers.find(t => t.id === user.tierId)?.name || "Standar";
            const myBadges = badges.map(b => b.name);

            setUserStats({
                tierName: myTier,
                achievements: myBadges
            });
        };

        fetchData();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Play sound for new messages (incoming only)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && (lastMsg.role === "agent" || lastMsg.role === "model")) {
      playNotificationSound();
    }
  }, [messages, loading]);

  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"); // Premium Pop Sound
      audioRef.current.volume = 0.4;
    }
    audioRef.current.play().catch(() => {}); // Ignore interaction errors
  };

  // Sentinel Guard Check
  useEffect(() => {
    getPublicSentinelConfigs().then(configs => {
      setIsEnabled(configs['live_chat_enabled'] !== false);
      setIsAiEnabled(configs['ai_tutor_beta'] !== false);
    });
  }, []);

  // Handle Persistence & Re-initialization
  useEffect(() => {
    const savedSessionId = localStorage.getItem("learning_chat_session");
    if (savedSessionId && isEnabled !== false) {
      resumeSession(savedSessionId);
    }
  }, [isEnabled]);

  if (isEnabled === false) return null;

  const resumeSession = async (sessionId: string) => {
    setLoading(true);
    // Fetch session details to check if it's still open
    const { data: session, error } = await supabase
      .from("live_chats")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (session && session.status !== "closed") {
      setChatSessionId(sessionId);
      setMode("agent");
      setIsOpen(true);
      
      const history = await getChatMessages(sessionId);
      const formattedHistory: Message[] = history.map(m => ({
        role: m.senderType === "agent" ? "agent" : m.senderType === "bot" ? "model" : "user",
        content: m.content,
        timestamp: new Date(m.createdAt)
      }));
      
      setMessages(formattedHistory);
      markMessagesAsRead(sessionId, "user");
      
      const status = await checkOnlineAgents();
      setOnlineStatus(status);
    } else {
      localStorage.removeItem("learning_chat_session");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = isLoggedIn 
        ? `Halo **${user?.fullName || "Siswa"}**! Senang melihat Anda kembali. Ada yang bisa saya bantu hari ini?`
        : "Halo! Saya **Asisten AI MyLearning**. Saya siap membantu Anda memilih kursus terbaik. Sedang mencari materi apa hari ini? [Lihat Katalog](/courses)";
      
      setMessages([
        {
          role: "model",
          content: greeting,
          timestamp: new Date(),
        },
      ]);
      
      // If guest, maybe offer a voucher after a short delay
      if (!isLoggedIn && isAiEnabled) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "model",
            content: "Khusus untuk pengunjung baru, gunakan kode kupon `NEWLEARNER` untuk diskon 10% pada pembelian pertama Anda! 🎁",
            timestamp: new Date()
          }]);
        }, 3000);
      }
      
      setMode("ai");
    }
  }, [isOpen, isLoggedIn, user]);

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
          if (newMsg.sender_type === "agent" || newMsg.sender_type === "bot") {
            setMessages((prev) => [
              ...prev,
              {
                role: newMsg.sender_type === "agent" ? "agent" : "model",
                content: newMsg.content,
                timestamp: new Date(newMsg.created_at),
              },
            ]);
            setLoading(false);
            if (newMsg.sender_type === "agent") setIsAgentTyping(false);
            if (aiFallbackTimerRef.current) clearTimeout(aiFallbackTimerRef.current);
            setShowAiFallback(false);
            markMessagesAsRead(chatSessionId, "user");
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.sender === "agent") {
          setIsAgentTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsAgentTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatSessionId]);

  // Listener for session status (Active/Closed)
  useEffect(() => {
    if (!chatSessionId) return;

    const channel = supabase
      .channel(`session:${chatSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_chats",
          filter: `id=eq.${chatSessionId}`,
        },
        (payload) => {
          const update = payload.new as any;
          if (update.status === "closed") {
            const closingMsg = "Sesi chat telah diakhiri oleh Agen. Terima kasih!";
            setMessages((prev) => [
              ...prev,
              { 
                role: "system", 
                content: closingMsg, 
                timestamp: new Date() 
              },
            ]);
            
            // Generate and Send Summary Email (Async)
            if (chatSessionId) {
               handleFinalizeSession(chatSessionId);
            }

            setChatSessionId(null);
            localStorage.removeItem("learning_chat_session");
            // Switch to survey mode
            setMode("survey");
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

    // Send typing broadcast for AI or Agent
    await broadcastTyping();

    if (mode === "ai") {
      setLoading(true);
      
      // Check for agent request intent OR AI tutor is disabled
      if (detectAgentRequest(userMsg) || !isAiEnabled) {
        if (!isAiEnabled) {
          setMessages(prev => [...prev, { role: "model", content: "Fitur AI Tutor sedang tidak aktif. Menghubungkan Anda ke agen...", timestamp: new Date() }]);
        }
        await handleContactAgent();
        return;
      }

      // AI Response with UserContext Awareness
      // Truncate history to avoid token overflow and keep UI snappy
      const history = messages.slice(-10).map(m => ({
        role: m.role === "model" ? "model" : "user" as any,
        parts: [{ text: m.content }]
      }));
      
      const context: UserContext = {
        fullName: user?.fullName,
        isLoggedIn: !!isLoggedIn,
        role: user?.role,
        tierName: userStats.tierName,
        level: user?.level,
        xp: user?.xp,
        achievements: userStats.achievements,
        enrolledCourseIds: enrolledIds,
        currentPage: pathname,
        activeContext: activeContext // Pass the lesson/payment context to Gemini
      };


      const response = await getGeminiResponse(history, userMsg, context);
      
      setMessages((prev) => [
        ...prev,
        { role: "model", content: response, timestamp: new Date() },
      ]);

      // Update Suggestion Chips based on context
      if (response.toLowerCase().includes("rekomendasi")) {
        setSuggestionChips(["Berapa harganya?", "Bandingkan", "Cara daftar?"]);
      } else if (response.toLowerCase().includes("materi")) {
        setSuggestionChips(["Lihat bab lain", "Coba gratis", "Daftar sekarang"]);
      } else {
        setSuggestionChips(["Tanya lagi", "Puas, thx!", "Hubungi Agen"]);
      }

      setLoading(false);
    } else if (mode === "agent" && chatSessionId) {
      // Send to live agent
      const success = await sendLiveMessage(chatSessionId, userMsg, "user", user?.id);
      
      if (success) {
        // Start fallback timer if agent hasn't replied
        if (aiFallbackTimerRef.current) clearTimeout(aiFallbackTimerRef.current);
        aiFallbackTimerRef.current = setTimeout(() => {
          setShowAiFallback(true);
        }, 15000); // Show fallback after 15s of waiting
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const file = new File([blob], "voice_message.ogg", { type: "audio/ogg" });
        
        setLoading(true);
        const { url } = await uploadChatFile(file);
        if (url) {
          setInputValue(`[Voice Message](${url})`);
          await handleSendMessage();
        }
        setLoading(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAiFallback = async () => {
    if (!chatSessionId || messages.length === 0) return;
    setShowAiFallback(false);
    setLoading(true);
    
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
    
    await triggerAutoAIReply(chatSessionId, lastUserMsg, {
        currentPage: pathname,
        activeContext
    });
    
    // The real-time listener will pick up the bot message
    setLoading(false);
  };

  const broadcastTyping = async () => {
    if (!chatSessionId) return;
    const channel = supabase.channel(`chat:${chatSessionId}`);
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: "user" },
    });
  };

  const handleFinalizeSession = async (sessionId: string) => {
    try {
        const { getChatInsights } = await import("@/lib/ai_chat");
        const { sendContactReply } = await import("@/lib/email");
        
        const insights = await getChatInsights(sessionId);
        if (insights && (user?.email || guestInfo.email)) {
            await sendContactReply({
                userName: user?.fullName || guestInfo.name || "User",
                userEmail: user?.email || guestInfo.email,
                originalSubject: "Ringkasan Percakapan Live Chat MyLearning",
                replyMessage: `Berikut adalah ringkasan percakapan Anda:\n\n${insights.summary}\n\nTerima kasih telah menghubungi kami!`
            });
        }
    } catch (e) {
        console.error("Error finalizing session:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatSessionId) return;

    setLoading(true);
    const { url, error } = await uploadChatFile(file);
    
    if (url) {
      const content = `![Lampiran Gambar](${url})`;
      await sendLiveMessage(chatSessionId, content, "user", user?.id);
    } else {
      console.error("Upload error:", error);
    }
    setLoading(false);
  };

  const submitSurvey = async () => {
    if (rating === 0) return;
    setLoading(true);
    // You could save this to a 'chat_ratings' table if you want
    // await saveChatRating(chatSessionId, rating);
    await new Promise(r => setTimeout(r, 1000));
    setMode("form-success");
    setLoading(false);
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
        email: user?.email || "guest@email.com",
        metadata: activeContext,
        fingerprint: getClientFingerprint()
      });

      
      if (session) {
        setChatSessionId(session.id);
        localStorage.setItem("learning_chat_session", session.id);
        setMode("agent");
        setMessages((prev) => [
          ...prev,
          { 
            role: "system", 
            content: `Terhubung dengan ${agentName}. Mohon tunggu sebentar...`, 
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
      email: guestInfo.email,
      metadata: activeContext,
      fingerprint: getClientFingerprint()
    });

    
    if (session) {
      setChatSessionId(session.id);
      localStorage.setItem("learning_chat_session", session.id);
      setMode("agent");
      setMessages((prev) => [
        ...prev,
        { 
          role: "system", 
          content: `Terhubung dengan ${agentName}. Halo ${guestInfo.name}, mohon tunggu sebentar...`, 
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
    
    const tid = `TID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setTicketId(tid);
    
    const success = await saveContactMessage(
      offlineForm.name || user?.fullName || "Guest",
      offlineForm.email || user?.email || "guest@email.com",
      `${offlineForm.subject} [${tid}]`,
      offlineForm.message
    );
    
    if (success) {
      setMode("form-success");
    }
    setLoading(false);
  };

  if (["/login", "/register"].includes(pathname)) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          sessionStorage.setItem("proactive_greeting_shown", "true");
        }}
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
              {mode === "ai" ? "Assistant AI" : agentName}
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
              {msg.role === "model" && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-tighter">
                  <Bot size={12} /> Gemini AI Assistant
                </div>
              )}
              {msg.role === "model" || msg.role === "agent" ? (
                <article className="prose-cs">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => {
                        const isInternal = props.href?.startsWith("/");
                        if (isInternal) {
                          return (
                            <Link 
                              href={props.href || "#"} 
                              className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors"
                            >
                              {props.children}
                            </Link>
                          );
                        }
                        return <a target="_blank" rel="noopener noreferrer" {...props} />;
                      },
                      // Custom Rendering for Rich Elements if they are in the markdown
                      code: ({ node, inline, className, children, ...props }: any) => {
                         const match = /language-(\w+)/.exec(className || '');
                         const content = String(children).replace(/\n$/, '');
                         
                         if (!inline && match && match[1] === 'course_card') {
                            try {
                                const data = JSON.parse(content);
                                return (
                                    <div className="my-3 p-3 bg-white/5 border border-white/10 rounded-xl flex gap-3 items-center hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => window.location.href = `/courses/${data.slug}`}>
                                        <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex-shrink-0 overflow-hidden">
                                            <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Rekomendasi</p>
                                            <h4 className="text-xs font-bold text-white truncate">{data.title}</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">{data.description}</p>
                                        </div>
                                    </div>
                                );
                            } catch (e) { return <code>{children}</code>; }
                         }

                         if (!inline && match && match[1] === 'voucher') {
                             try {
                                 const data = JSON.parse(content);
                                 return (
                                     <div className="my-3 p-4 bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-xl border-dashed relative overflow-hidden group">
                                         <div className="relative z-10">
                                             <p className="text-[10px] text-cyan-400 font-bold uppercase">Kupon Spesial</p>
                                             <h4 className="text-lg font-black text-white">{data.code}</h4>
                                             <p className="text-[10px] text-slate-300 mt-1">{data.info}</p>
                                             <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(data.code);
                                                    alert("Voucher disalin!");
                                                }}
                                                className="mt-2 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                                             >
                                                 Salin Kode
                                             </button>
                                         </div>
                                         <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                             <Star size={64} fill="currentColor" />
                                         </div>
                                     </div>
                                 );
                             } catch (e) { return <code>{children}</code>; }
                         }

                         return <code className={className} {...props}>{children}</code>;
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </article>
              ) : (
                <div className="flex flex-col gap-1">
                   {msg.content.startsWith("[Voice Message](") ? (
                    <div className="flex items-center gap-2 py-1">
                      <Mic size={14} className="text-purple-400" />
                      <audio src={msg.content.match(/\((.*?)\)/)?.[1]} controls className="h-7 w-32 filter invert brightness-200" />
                    </div>
                  ) : (
                    msg.content
                  )}
                  {msg.role === "user" && mode === "agent" && (
                    <div className="flex justify-end mt-0.5 opacity-60">
                       <CheckCircle size={10} className="text-white" />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        ))}

        {showAiFallback && mode === "agent" && (
          <div className="flex justify-center animate-in fade-in zoom-in duration-300">
            <button 
              onClick={handleAiFallback}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all shadow-lg"
            >
              <Sparkles size={14} className="text-purple-400" />
              Admin belum balas? Tanya AI saja
            </button>
          </div>
        )}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white/5 rounded-2xl px-4 py-2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {isAgentTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="italic">{agentName} sedang mengetik</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce"></div>
                <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]"></div>
              </div>
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

        {mode === "survey" && (
          <div className="text-center p-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
              <Star className="text-purple-400" size={32} />
            </div>
            <div>
              <h4 className="font-bold text-white">Bantu Kami Meningkat!</h4>
              <p className="text-slate-400 text-xs mt-1">Bagaimana penilaian Anda terhadap layanan CS kami hari ini?</p>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setRating(s)}
                  className={`p-2 transition-all ${rating >= s ? "text-amber-400 scale-125" : "text-slate-600 hover:text-slate-400"}`}
                >
                  <Star fill={rating >= s ? "currentColor" : "none"} size={24} />
                </button>
              ))}
            </div>
            <button 
              onClick={submitSurvey}
              disabled={rating === 0 || loading}
              className="btn-primary w-full text-xs !py-2 disabled:opacity-50"
            >
              Kirim Penilaian
            </button>
          </div>
        )}

        {mode === "form-success" && (
          <div className="text-center p-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <div>
              <h4 className="font-bold text-white">Pesan Terkirim!</h4>
              <p className="text-slate-400 text-xs mt-1">ID Tiket: <span className="text-cyan-400 font-mono font-bold">{ticketId}</span></p>
              <p className="text-slate-400 text-[10px] mt-2 italic">Kami akan menghubungi Anda kembali melalui email sesegera mungkin.</p>
            </div>
            <button onClick={() => setMode("ai")} className="text-purple-400 text-xs hover:underline">Kembali ke Chat AI</button>
          </div>
        )}
      </div>

      {/* Footer / Input Area */}
      <div className="p-3 border-t border-white/10 bg-[#0f0a1a]/80 backdrop-blur-sm">
        {mode === "ai" && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {suggestionChips.map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => {
                   if (chip === "Hubungi Agen") handleContactAgent();
                   else setInputValue(chip);
                }}
                className="text-[10px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors animate-in fade-in"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {mode !== "offline-form" && mode !== "form-success" && mode !== "survey" && (
          <div className="flex gap-2 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
            {mode === "agent" && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-2.5 text-slate-500 hover:text-purple-400 transition-colors"
                title="Unggah Gambar"
              >
                <Paperclip size={20} />
              </button>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                broadcastTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={mode === "agent" ? "Tulis pesan ke agen..." : "Tanya asisten AI..."}
              className="input !py-2.5 !flex-1 !rounded-xl text-sm"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2.5 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-slate-400 hover:text-white"}`}
              title={isRecording ? "Hentikan Rekaman" : "Pesan Suara"}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
