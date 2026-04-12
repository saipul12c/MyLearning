"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, Send, Award, RotateCcw, FileText } from "lucide-react";
import type { Assignment } from "@/lib/assessments";

interface AssignmentModalProps {
  assignment: Assignment;
  enrollmentId: string;
  alreadyCompleted: boolean;
  onSubmit: (assignmentId: string | number, answers: string[]) => Promise<{ score: number; passed: boolean; results: boolean[] }>;
  onClose: () => void;
}

export default function AssignmentModal({ assignment, enrollmentId, alreadyCompleted, onSubmit, onClose }: AssignmentModalProps) {
  const [answers, setAnswers] = useState<string[]>(new Array((assignment.questions || []).length).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const handleAnswerChange = (idx: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const result = await onSubmit(assignment.id, answers);
    setScore(result.score);
    setPassed(result.passed);
    setResults(result.results);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers(new Array((assignment.questions || []).length).fill(""));
    setSubmitted(false);
    setScore(0);
    setPassed(false);
    setResults([]);
  };

  const allAnswered = answers.every((a) => a.trim() !== "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c14] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">{assignment.title}</h2>
            <p className="text-xs text-slate-500">{(assignment.questions || []).length} soal • Skor minimal: 70%</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {!submitted ? (
          <div className="p-6">
            <p className="text-slate-400 text-sm mb-6">{assignment.description}</p>
            
            {assignment.instructions && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Instruksi:</h4>
                <p className="text-sm text-slate-300">{assignment.instructions}</p>
              </div>
            )}

            <div className="space-y-6">
              {(assignment.questions || []).map((question, idx) => (
                <div key={idx} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium text-sm">{idx + 1}. {question}</h4>
                  </div>
                  
                  <textarea
                    value={answers[idx]}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Ketik jawaban Anda di sini..."
                    className="input text-sm min-h-[100px] py-3 resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="btn-primary text-sm !py-3 !px-8 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-purple-500/20"
              >
                <Send size={16} /> Submit Tugas
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
              {passed ? <Award size={36} className="text-emerald-400" /> : <XCircle size={36} className="text-red-400" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {passed ? "Tugas Berhasil! ✅" : "Belum Lulus 😔"}
            </h3>
            <p className="text-4xl font-extrabold gradient-text mb-2">{score}%</p>
            <p className="text-slate-400 text-sm mb-6">Skor minimal: 70%</p>

            <div className="text-left space-y-3 mb-6">
              {(assignment.questions || []).map((question, i) => (
                <div key={i} className={`p-4 rounded-xl border ${results[i] ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className="flex items-start gap-3">
                    {results[i] ? <CheckCircle size={18} className="text-emerald-400 mt-0.5" /> : <XCircle size={18} className="text-red-400 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium mb-2">{question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Jawaban Anda:</p>
                          <p className={`text-sm ${results[i] ? "text-emerald-400" : "text-red-400"} font-bold bg-black/20 p-2 rounded-lg`}>{answers[i]}</p>
                        </div>
                        {!results[i] && assignment.correctAnswers?.[i] && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Jawaban Benar:</p>
                            <p className="text-sm text-emerald-400 font-bold bg-black/20 p-2 rounded-lg">{assignment.correctAnswers[i]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!passed && (
                <button onClick={handleRetry} className="btn-primary text-sm !py-2.5 flex items-center gap-2">
                  <RotateCcw size={16} /> Coba Lagi
                </button>
              )}
              <button onClick={onClose} className="btn-secondary text-sm !py-2.5">Tutup</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
