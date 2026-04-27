"use client";

import { useState, useEffect } from "react";
import { getContactMessages, updateMessageStatus, type ContactMessage } from "@/lib/enrollment";
import { sendContactReply } from "@/lib/email";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Mail, Eye, CheckCircle, Clock, Send, X, Loader2 } from "lucide-react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getContactMessages();
      setMessages(data);
      setLoading(false);
    };
    fetchMessages();
  }, [refresh]);

  const handleMarkRead = async (id: string) => {
    await updateMessageStatus(id, "read");
    setRefresh((r) => r + 1);
  };

  const handleMarkReplied = async (id: string) => {
    await updateMessageStatus(id, "replied");
    setRefresh((r) => r + 1);
  };

  const handleSendReply = async (msg: ContactMessage) => {
    if (!replyText.trim()) return;
    setSending(true);

    try {
      // 1. Send email via EmailJS
      const result = await sendContactReply({
        userName: msg.name,
        userEmail: msg.email,
        originalSubject: msg.subject,
        replyMessage: replyText,
      });

      // 2. Update status + save admin reply note
      await supabase
        .from("contact_messages")
        .update({ 
          status: "replied", 
          admin_notes: replyText,
          replied_at: new Date().toISOString() 
        })
        .eq("id", msg.id);

      setReplyingTo(null);
      setReplyText("");
      setRefresh((r) => r + 1);
    } catch (error) {
      console.error("Reply failed:", error);
    } finally {
      setSending(false);
    }
  };

  const unread = messages.filter((m) => m.status === "unread").length;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading messages...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pesan <span className="gradient-text">Kontak</span></h1>
        <p className="text-slate-400 text-sm mt-1">{messages.length} total pesan • {unread} belum dibaca</p>
      </div>

      {messages.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageSquare size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold">Belum Ada Pesan</p>
          <p className="text-slate-500 text-sm">Pesan dari halaman kontak akan ditampilkan di sini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((msg) => (
            <div key={msg.id} className={`card p-5 ${msg.status === "unread" ? "border-purple-500/20" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      msg.status === "unread" ? "bg-amber-500/15 text-amber-400" :
                      msg.status === "read" ? "bg-cyan-500/15 text-cyan-400" :
                      "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {msg.status === "unread" ? "Belum Dibaca" : msg.status === "read" ? "Dibaca" : "Dibalas"}
                    </span>
                    <span className="text-xs text-slate-600">{new Date(msg.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                  <h3 className="text-white font-medium text-sm mb-1">{msg.subject}</h3>
                  <p className="text-slate-400 text-xs mb-2">Dari: {msg.name} ({msg.email})</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{msg.message}</p>
                  
                  {/* Show admin reply if exists */}
                  {msg.status === "replied" && (msg as any).admin_notes && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Balasan Admin:</p>
                      <p className="text-xs text-slate-300">{(msg as any).admin_notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {msg.status === "unread" && (
                    <button onClick={() => handleMarkRead(msg.id)} className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" title="Tandai Dibaca">
                      <Eye size={14} />
                    </button>
                  )}
                  {msg.status !== "replied" && (
                    <button 
                      onClick={() => { setReplyingTo(replyingTo === msg.id ? null : msg.id); setReplyText(""); }}
                      className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                      title="Balas"
                    >
                      <Mail size={14} />
                    </button>
                  )}
                  {msg.status !== "replied" && (
                    <button onClick={() => handleMarkReplied(msg.id)} className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" title="Tandai Dibalas">
                      <CheckCircle size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === msg.id && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Send size={12} /> Membalas ke: <span className="text-white font-medium">{msg.email}</span>
                  </div>
                  <textarea
                    className="input w-full h-24 text-sm"
                    placeholder="Tulis balasan Anda..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReply(msg)}
                      disabled={sending || !replyText.trim()}
                      className="btn-primary !py-2 !px-4 text-xs flex items-center gap-2"
                    >
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {sending ? "Mengirim..." : "Kirim Balasan"}
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2"
                    >
                      <X size={14} /> Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
