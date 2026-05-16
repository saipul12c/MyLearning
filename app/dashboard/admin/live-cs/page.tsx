"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Calendar, User, Send, CheckCircle, Clock, Phone, Bot, Sparkles, Zap, RotateCcw, StickyNote, UserPlus, Mic, Square, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { getOpenChatsForAdmin, getChatMessages, sendLiveMessage, type LiveChatSession, type ChatMessage, markMessagesAsRead, updateInternalNotes, transferChat, getAvailableAgents } from "@/lib/live_chat";
import { getAgentAISuggestions, getChatInsights, translateMessage, searchKnowledgeBase, type ChatInsights } from "@/lib/ai_chat";
import { supabase } from "@/lib/supabase";
import { uploadChatFile } from "@/lib/storage";

export default function AdminLiveCS() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [insights, setInsights] = useState<Record<string, ChatInsights>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [kbQuery, setKbQuery] = useState("");
  const [kbResult, setKbResult] = useState("");
  const [kbLoading, setKbLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [availableAgents, setAvailableAgents] = useState<{ id: string; fullName: string; role: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
      fetchInsights(activeSession.id);
      setInternalNotes(activeSession.metadata?.internal_notes || "");
      markMessagesAsRead(activeSession.id, "agent");
      fetchAvailableAgents();

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
              playNotificationSound();
              setIsUserTyping(false);
              markMessagesAsRead(activeSession.id, "agent");
            }
          }
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload.sender === "user") {
            setIsUserTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 3000);
          }
        })
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

  const handleSendMessage = async (customValue?: string) => {
    const val = (customValue || inputValue).trim();
    if (!val || !activeSession || loading) return;

    if (!customValue) setInputValue("");
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
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setAiSuggestions([]); // Clear suggestions after sending
    }
    setLoading(false);
  };

  const handleTranslate = async (msgId: string, text: string) => {
    if (translations[msgId]) return;
    const translation = await translateMessage(text);
    if (translation) {
      setTranslations(prev => ({ ...prev, [msgId]: translation }));
    }
  };

  const handleKBSearch = async () => {
    if (!kbQuery.trim() || kbLoading) return;
    setKbLoading(true);
    const result = await searchKnowledgeBase(kbQuery);
    setKbResult(result);
    setKbLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!activeSession) return;
    const success = await updateInternalNotes(activeSession.id, internalNotes);
    if (success) {
      // Show small toast or notification
    }
  };

  const handleTransfer = async (agentId: string) => {
    if (!activeSession) return;
    const success = await transferChat(activeSession.id, agentId);
    if (success) {
      setActiveSession(null);
      fetchSessions();
    }
  };

  const fetchAvailableAgents = async () => {
    const agents = await getAvailableAgents();
    setAvailableAgents(agents.filter(a => a.id !== user?.id));
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
          await handleSendMessage(`[Voice Message](${url})`);
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

  const fetchAISuggestions = async () => {
    if (!activeSession || suggesting) return;
    setSuggesting(true);
    try {
      const suggestions = await getAgentAISuggestions(activeSession.id);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setSuggesting(false);
    }
  };

  const fetchInsights = async (id: string) => {
    if (insights[id]) return; // Avoid re-fetching if already present
    const data = await getChatInsights(id);
    if (data) {
      setInsights(prev => ({ ...prev, [id]: data }));
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positif": return "😊";
      case "negatif": return "😠";
      case "bingung": return "🤔";
      default: return "😐";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const quickReplies = [
    "Halo! Ada yang bisa kami bantu hari ini?",
    "Mohon tunggu sebentar ya, kami sedang mengecek data Anda.",
    "Baik, informasi tersebut akan kami teruskan ke tim terkait.",
    "Terima kasih atas kesabarannya. Ada hal lain yang bisa kami bantu?",
    "Sama-sama! Senang bisa membantu Anda."
  ];

  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audioRef.current.volume = 0.5;
    }
    audioRef.current.play().catch(() => {});
  };

  const broadcastTyping = async () => {
    if (!activeSession) return;
    const channel = supabase.channel(`admin-chat:${activeSession.id}`);
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: "agent" },
    });
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
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock size={10} />
                        {new Date(session.createdAt).toLocaleTimeString()}
                    </div>
                    {insights[session.id] && (
                        <span title={insights[session.id].sentiment} className="text-xs grayscale hover:grayscale-0 transition-all cursor-help">
                        {getSentimentIcon(insights[session.id].sentiment)}
                        </span>
                    )}
                  </div>
                  {insights[session.id] && (
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getScoreColor(insights[session.id].satisfactionScore)} transition-all`} 
                        style={{ width: `${insights[session.id].satisfactionScore}%` }}
                      />
                    </div>
                  )}
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
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center relative">
                  <User size={16} className="text-purple-400" />
                  {insights[activeSession.id] && (
                    <span className="absolute -bottom-1 -right-1 text-[10px] bg-[#0c0c14] rounded-full border border-white/10 p-0.5">
                       {getSentimentIcon(insights[activeSession.id].sentiment)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeSession.guestName || "Guest"}
                    {!activeSession.userId && (
                      <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400 font-normal">GUEST USER</span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Chatting Live</p>
                    {insights[activeSession.id]?.labels.map(label => (
                      <span key={label} className="text-[8px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {insights[activeSession.id] && (
                  <div className="hidden lg:flex flex-col items-end mr-4 max-w-[200px]">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">AI Summary</p>
                    <p className="text-[10px] text-slate-300 italic text-right line-clamp-1">"{insights[activeSession.id].summary}"</p>
                  </div>
                )}
                <button 
                  onClick={() => closeChat(activeSession.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Tutup Chat
                </button>
              </div>
            </div>

            {/* Development Notice for Email */}
            <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/10 flex items-center justify-center gap-2">
               <AlertCircle size={10} className="text-amber-500" />
               <p className="text-[9px] text-amber-500/80 font-medium uppercase tracking-widest">
                 Fitur Notifikasi Email sedang dikembangkan & dalam tahap ujicoba internal
               </p>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderType === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.senderType === "agent"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : msg.senderType === "bot"
                        ? "bg-white/5 text-slate-400 border border-white/10 rounded-bl-none italic"
                        : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
                    }`}>
                        {msg.senderType === "bot" && <div className="flex items-center gap-1.5 mb-1 text-[10px] not-italic opacity-80 uppercase tracking-tighter"><Bot size={10} /> Gemini Assistant</div>}
                        
                        {msg.content.startsWith("[Voice Message](") ? (
                          <div className="flex items-center gap-3 py-1">
                            <Mic size={16} className={msg.senderType === "agent" ? "text-white/60" : "text-purple-400"} />
                            <audio src={msg.content.match(/\((.*?)\)/)?.[1]} controls className="h-8 w-40 filter invert brightness-200" />
                          </div>
                        ) : (
                          msg.content
                        )}
                        
                        {translations[msg.id] && (
                          <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-slate-400 italic">
                            <span className="font-bold not-italic text-[9px] uppercase text-purple-400 mr-1">ID:</span>
                            {translations[msg.id]}
                          </div>
                        )}

                        <div className="text-[9px] mt-1 opacity-50 flex items-center justify-end gap-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.senderType === "agent" && (
                            <span title={msg.isRead ? "Dibaca" : "Terkirim"}>
                              <CheckCircle size={10} className={msg.isRead ? "text-cyan-300" : "opacity-40"} />
                            </span>
                          )}
                        </div>
                    </div>
                    {msg.senderType === "user" && !translations[msg.id] && (
                      <button 
                        onClick={() => handleTranslate(msg.id, msg.content)}
                        className="text-[9px] text-slate-500 hover:text-purple-400 transition-colors self-start ml-2"
                      >
                        Terjemahkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-xl px-3 py-1.5 text-[10px] text-slate-500 flex items-center gap-2">
                    <span className="italic">User sedang mengetik</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-3">
              {/* AI & Quick Replies */}
              <div className="flex flex-wrap gap-2 mb-1">
                <button
                  onClick={fetchAISuggestions}
                  disabled={suggesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                >
                  {suggesting ? (
                    <RotateCcw size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {suggesting ? "Berpikir..." : "Saran AI"}
                </button>
                
                {aiSuggestions.map((suggestion, idx) => (
                  <button
                    key={`ai-${idx}`}
                    onClick={() => handleSendMessage(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] border border-cyan-500/20 hover:bg-cyan-500/20 transition-all animate-in fade-in slide-in-from-left-2"
                  >
                    <Zap size={10} />
                    {suggestion}
                  </button>
                ))}

                {!suggesting && aiSuggestions.length === 0 && quickReplies.map((reply, idx) => (
                  <button
                    key={`qr-${idx}`}
                    onClick={() => handleSendMessage(reply)}
                    className="px-3 py-1.5 rounded-full bg-white/5 text-slate-400 text-[10px] border border-white/10 hover:border-white/20 hover:text-white transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    broadcastTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Kirim pesan balasan..."
                  className="input flex-1"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading}
                  className="btn-primary !px-5"
                >
                  <Send size={18} />
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-slate-400 hover:text-white"}`}
                  title={isRecording ? "Hentikan Rekaman" : "Pesan Suara"}
                >
                  {isRecording ? <Square size={18} /> : <Mic size={18} />}
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

      {/* Right Sidebar: Knowledge Assistant */}
      <div className="w-72 flex flex-col gap-4 animate-fade-in">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Knowledge Assistant
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Cari materi kuis & kursus</p>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text"
                  value={kbQuery}
                  onChange={(e) => setKbQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleKBSearch()}
                  placeholder="Tanya info kursus..."
                  className="input text-xs !pr-10"
                />
                <button 
                  onClick={handleKBSearch}
                  disabled={kbLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                >
                  {kbLoading ? <RotateCcw size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>

            {kbResult ? (
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{kbResult}</p>
                <button 
                  onClick={() => {
                    setInputValue(kbResult);
                    setKbResult("");
                    setKbQuery("");
                  }}
                  className="mt-3 w-full py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                >
                  Salin ke Balasan
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Bot size={40} className="mb-2" />
                <p className="text-[10px]">Tanyakan apa saja tentang materi MyLearning</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
             <p className="text-[8px] text-slate-500 uppercase tracking-widest text-center">Powered by Gemini AI v1.5</p>
          </div>
        </div>

        {/* Human CS Panel */}
        <div className="card flex-[0.8] flex flex-col overflow-hidden border-cyan-500/10">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
             <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <StickyNote size={16} className="text-cyan-400" />
              Internal Admin
            </h4>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4">
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Catatan Internal</p>
              <textarea 
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Hanya admin yang bisa lihat..."
                className="input text-xs !h-32 !bg-transparent !border-white/5 focus:!border-cyan-500/30"
              />
            </div>

            <div className="space-y-1.5 mt-2">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                <UserPlus size={10} /> Transfer ke Agen Lain
              </p>
              <div className="grid grid-cols-1 gap-2">
                {availableAgents.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">Tidak ada agen online lain.</p>
                ) : (
                  availableAgents.map(agent => (
                    <button 
                      key={agent.id}
                      onClick={() => handleTransfer(agent.id)}
                      className="text-left p-2 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group"
                    >
                      <p className="text-[10px] font-bold text-white group-hover:text-cyan-400">{agent.fullName}</p>
                      <p className="text-[8px] text-slate-500 uppercase">{agent.role}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
