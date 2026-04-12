"use client";

import { useState, useEffect } from "react";
import { Send, MessageSquare, Reply, Trash2, CheckCircle2, MoreVertical } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getDiscussionsByLesson, postDiscussion, deleteDiscussion, type Discussion } from "@/lib/discussions";

interface DiscussionSectionProps {
  lessonId: string;
}

export default function DiscussionSection({ lessonId }: DiscussionSectionProps) {
  const { user, isLoggedIn } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [lessonId]);

  const fetchDiscussions = async () => {
    setIsLoading(true);
    const data = await getDiscussionsByLesson(lessonId);
    setDiscussions(data);
    setIsLoading(false);
  };

  const handlePostComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    const { success } = await postDiscussion({
      lessonId,
      userId: user.id,
      content: newComment.trim()
    });
    if (success) {
      setNewComment("");
      await fetchDiscussions();
    }
    setIsSubmitting(false);
  };

  const handlePostReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    setIsSubmitting(true);
    const { success } = await postDiscussion({
      lessonId,
      userId: user.id,
      content: replyContent.trim(),
      parentId
    });
    if (success) {
      setReplyTo(null);
      setReplyContent("");
      await fetchDiscussions();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus diskusi ini?")) return;
    if (!user) return;
    const { success } = await deleteDiscussion(id, user.id);
    if (success) {
      await fetchDiscussions();
    }
  };

  return (
    <div className="mt-16 pt-16 border-t border-white/5 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Diskusi & Tanya Jawab</h3>
          <p className="text-sm text-slate-500">Ajukan pertanyaan atau berikan tanggapan mengenai materi ini</p>
        </div>
      </div>

      {isLoggedIn ? (
        <div className="mb-12">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold shrink-0">
              {user?.fullName?.[0] || "U"}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis pertanyaan atau tanggapan Anda..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all resize-none h-28"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handlePostComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="btn-primary !py-2 !px-6 flex items-center gap-2 text-sm font-bold"
                >
                  {isSubmitting ? "Mengirim..." : <><Send size={16} /> Kirim Diskusi</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-12">
          <p className="text-slate-400 text-sm">
            Silakan <a href="/login" className="text-purple-400 font-bold hover:underline">Masuk</a> untuk ikut berdiskusi.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Memuat diskusi...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 italic text-sm">Belum ada diskusi untuk materi ini. Jadi yang pertama bertanya!</p>
          </div>
        ) : (
          discussions.map((d) => (
            <div key={d.id} className="group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0 overflow-hidden">
                  {d.userAvatar ? (
                    <img src={d.userAvatar} alt={d.userName} className="w-full h-full object-cover" />
                  ) : d.userName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{d.userName}</span>
                    <span className="text-[10px] text-slate-600 font-medium">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-2xl rounded-tl-none border border-white/5">
                    {d.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 ml-1">
                    <button 
                      onClick={() => setReplyTo(replyTo === d.id ? null : d.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Reply size={12} /> Balas
                    </button>
                    {(user?.role === 'admin' || user?.id === d.userId) && (
                      <button 
                        onClick={() => handleDelete(d.id)}
                        className="text-[11px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyTo === d.id && (
                    <div className="mt-4 pl-4 border-l-2 border-purple-500/30">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Tulis balasan..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all resize-none h-20"
                      />
                      <div className="flex justify-end mt-2 gap-2">
                         <button onClick={() => setReplyTo(null)} className="text-xs text-slate-500 px-3 hover:text-white">Batal</button>
                         <button
                           onClick={() => handlePostReply(d.id)}
                           disabled={isSubmitting || !replyContent.trim()}
                           className="btn-primary !py-1.5 !px-4 text-[11px] font-bold"
                         >
                           Kirim Balasan
                         </button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {d.replies && d.replies.length > 0 && (
                    <div className="mt-6 space-y-6 pl-4 md:pl-8 border-l border-white/5">
                      {d.replies.map((r) => (
                        <div key={r.id} className="flex gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-bold grow-0 shrink-0">
                             {r.userName?.[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-xs font-bold text-slate-300">{r.userName}</span>
                               <span className="text-[10px] text-slate-600 italic">{new Date(r.createdAt).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs text-slate-400 leading-relaxed bg-white/[0.01] p-3 rounded-xl rounded-tl-none border border-white/5">
                               {r.content}
                             </p>
                             {(user?.role === 'admin' || user?.id === r.userId) && (
                              <button 
                                onClick={() => handleDelete(r.id)}
                                className="text-[10px] font-bold text-slate-700 hover:text-red-400 mt-1 transition-colors"
                              >
                                Hapus
                              </button>
                            )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
