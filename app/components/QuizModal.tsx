"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ArrowRight, ArrowLeft, CheckCircle, XCircle, RotateCcw, Award, Sparkles } from "lucide-react";
import type { Quiz } from "@/lib/assessments";
import { getActivePromotions, Promotion, trackImpression } from "@/lib/promotions";
import PromotionCard from "./PromotionCard";

interface QuizModalProps {
  quiz: Quiz;
  enrollmentId: string;
  alreadyPassed: boolean;
  previousScore?: number;
  onSubmit: (quizId: string | number, answers: number[]) => Promise<{ score: number; passed: boolean }>;
  onClose: () => void;
}

export default function QuizModal({ quiz, enrollmentId, alreadyPassed, previousScore, onSubmit, onClose }: QuizModalProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [successPromo, setSuccessPromo] = useState<Promotion | null>(null);
  const [hasTracked, setHasTracked] = useState(false);

  const question = quiz.questions[currentQ];
  const allAnswered = answers.every((a) => a !== -1);

  const handleSelect = (optionIdx: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const result = await onSubmit(quiz.id, answers);
    setScore(result.score);
    setPassed(result.passed);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setSubmitted(false);
    setCurrentQ(0);
    setScore(0);
    setPassed(false);
    setSuccessPromo(null);
    setHasTracked(false);
  };

  useEffect(() => {
    if (submitted && passed) {
      getActivePromotions("quiz_success").then(promos => {
        if (promos.length > 0) setSuccessPromo(promos[0]);
      });
    }
  }, [submitted, passed]);

  useEffect(() => {
    if (successPromo && !hasTracked) {
      trackImpression(successPromo.id);
      setHasTracked(true);
    }
  }, [successPromo, hasTracked]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c14] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">{quiz.title}</h2>
            <p className="text-xs text-slate-500">Skor minimal: {quiz.passingScore}%</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {!submitted ? (
          <>
            {/* Progress */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Pertanyaan {currentQ + 1} / {quiz.questions.length}</span>
                <span>{answers.filter((a) => a !== -1).length} dijawab</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className="p-6">
              <h3 className="text-white font-semibold mb-6">{question.question}</h3>
              <div className="space-y-3">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      answers[currentQ] === i
                        ? "border-purple-500/50 bg-purple-500/10 text-white"
                        : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        answers[currentQ] === i ? "bg-purple-500 text-white" : "bg-white/5 text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-sm">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-6 pb-6">
              <button
                onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={16} /> Sebelumnya
              </button>

              {currentQ < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((c) => c + 1)}
                  className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Selanjutnya <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="btn-primary text-sm !py-2 !px-5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex items-center justify-center gap-2 px-6 pb-4">
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    i === currentQ ? "bg-purple-500 text-white" : answers[i] !== -1 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Results */
          <div className="p-6 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
              {passed ? <Award size={36} className="text-emerald-400" /> : <XCircle size={36} className="text-red-400" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {passed ? "Selamat! Quiz Lulus! 🎉" : "Belum Lulus 😔"}
            </h3>
            <p className="text-4xl font-extrabold gradient-text mb-2">{score}%</p>
            <p className="text-slate-400 text-sm mb-6">Skor minimal: {quiz.passingScore}%</p>

            {/* Answer Review */}
            <div className="text-left space-y-4 mb-6 max-h-[300px] overflow-auto">
              {quiz.questions.map((q, i) => {
                const isCorrect = answers[i] === q.correctAnswer;
                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? <CheckCircle size={16} className="text-emerald-400 mt-0.5" /> : <XCircle size={16} className="text-red-400 mt-0.5" />}
                      <p className="text-sm text-white">{q.question}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-6">
                      Jawaban Anda: <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{q.options[answers[i]] || "-"}</span>
                    </p>
                    {!isCorrect && <p className="text-xs text-slate-500 ml-6">Jawaban benar: <span className="text-emerald-400">{q.options[q.correctAnswer]}</span></p>}
                    {q.explanation && <p className="text-xs text-slate-400 ml-6 mt-1 italic">{q.explanation}</p>}
                  </div>
                );
              })}
            </div>

            {/* Reward Ad for Successful Quiz */}
            {passed && successPromo && (
                <div className="mb-8 p-1 rounded-[2rem] bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-white/10 animate-fade-in group">
                    <div className="p-6 bg-[#0c0c14] rounded-[1.8rem] space-y-4">
                        <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={12} /> Hadiah Spesial Untukmu
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {successPromo.imageUrl && (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                                    <Image src={successPromo.imageUrl} alt={successPromo.title} fill className="object-cover" />
                                </div>
                            )}
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-white font-bold">{successPromo.title}</h4>
                                <p className="text-slate-500 text-xs mt-1 italic">{successPromo.description}</p>
                                <a 
                                    href={successPromo.linkUrl} 
                                    target={successPromo.isExternal ? "_blank" : "_self"}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-purple-400 hover:text-purple-300 transition-all uppercase tracking-widest mt-3"
                                >
                                    Ambil Sekarang <ArrowRight size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
