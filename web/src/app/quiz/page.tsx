"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

const SUBJECT_LABELS: Record<string, string> = {
  부동산학개론: "부동산학개론",
  민법및민사특별법: "민법 및 민사특별법",
  공인중개사법령및중개실무: "중개사법령 및 실무",
  부동산공법: "부동산공법",
  부동산공시법: "부동산공시법",
  부동산세법: "부동산세법",
};

const SUBJECT_COLORS: Record<string, string> = {
  부동산학개론: "bg-slate-100 text-slate-700 border-slate-200",
  민법및민사특별법: "bg-rose-50 text-rose-700 border-rose-200",
  공인중개사법령및중개실무: "bg-emerald-50 text-emerald-700 border-emerald-200",
  부동산공법: "bg-amber-50 text-amber-700 border-amber-200",
  부동산공시법: "bg-violet-50 text-violet-700 border-violet-200",
  부동산세법: "bg-orange-50 text-orange-700 border-orange-200",
};

interface Quiz {
  n: number;
  q: string;
  a: boolean;
  e: string;
}

interface QuizPage {
  title: string;
  subject: string;
  quizzes: Quiz[];
}

type QuizData = Record<string, QuizPage>;

type ViewMode = "select" | "quiz";

function getStorageKey(id: string) {
  return `quiz-practice-${id}`;
}

function loadResults(id: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(getStorageKey(id));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveResults(id: string, results: Record<string, boolean>) {
  try { localStorage.setItem(getStorageKey(id), JSON.stringify(results)); } catch { /* */ }
}

export default function QuizPracticePage() {
  const [data, setData] = useState<QuizData | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("select");

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [sessionResults, setSessionResults] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    fetch("/real-estate-wiki/quiz-data.json")
      .then((r) => r.json())
      .then((d: QuizData) => setData(d))
      .catch(() => {});
  }, []);

  // All subjects from data
  const subjects = useMemo(() => {
    if (!data) return [];
    const set = new Set(Object.values(data).map((p) => p.subject).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([, p]) => !subjectFilter || p.subject === subjectFilter)
      .sort(([, a], [, b]) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
  }, [data, subjectFilter]);

  // Build quiz list from selected pages
  const quizList = useMemo(() => {
    if (!data || selectedPages.length === 0) return [];
    const list: Array<Quiz & { pageSlug: string; pageTitle: string; subject: string }> = [];
    for (const slug of selectedPages) {
      const page = data[slug];
      if (!page) continue;
      for (const q of page.quizzes) {
        list.push({ ...q, pageSlug: slug, pageTitle: page.title, subject: page.subject });
      }
    }
    return list;
  }, [data, selectedPages]);

  const togglePage = (slug: string) => {
    setSelectedPages((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAllFiltered = () => {
    const slugs = filteredPages.map(([slug]) => slug);
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      slugs.forEach((s) => newSet.add(s));
      return Array.from(newSet);
    });
  };

  const deselectAllFiltered = () => {
    const slugs = new Set(filteredPages.map(([slug]) => slug));
    setSelectedPages((prev) => prev.filter((s) => !slugs.has(s)));
  };

  const startQuiz = useCallback(() => {
    if (quizList.length === 0) return;
    const id = `session-${Date.now()}`;
    setSessionId(id);
    setCurrentIdx(0);
    setRevealed(false);
    setUserAnswer(null);
    setSessionResults({});
    setViewMode("quiz");
  }, [quizList]);

  const handleAnswer = (answer: boolean) => {
    if (revealed) return;
    setUserAnswer(answer);
    setRevealed(true);
    const quiz = quizList[currentIdx];
    const correct = answer === quiz.a;
    const key = `${quiz.pageSlug}-${quiz.n}`;
    const newResults = { ...sessionResults, [key]: correct };
    setSessionResults(newResults);
    saveResults(sessionId, newResults);
  };

  const nextQuiz = () => {
    if (currentIdx < quizList.length - 1) {
      setCurrentIdx((i) => i + 1);
      setRevealed(false);
      setUserAnswer(null);
    }
  };

  const prevQuiz = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setRevealed(false);
      setUserAnswer(null);
    }
  };

  const totalAnswered = Object.keys(sessionResults).length;
  const totalCorrect = Object.values(sessionResults).filter(Boolean).length;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-slate-400">퀴즈 데이터 로딩 중...</p>
      </div>
    );
  }

  // Quiz solving mode
  if (viewMode === "quiz" && quizList.length > 0) {
    const quiz = quizList[currentIdx];
    const isCorrect = userAnswer !== null ? userAnswer === quiz.a : null;

    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <header className="bg-[#1e293b]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <button onClick={() => setViewMode("select")} className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              목록으로
            </button>
            <div className="flex items-center gap-3">
              {totalAnswered > 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  accuracy >= 80 ? "bg-emerald-500/20 text-emerald-300" :
                  accuracy >= 50 ? "bg-amber-500/20 text-amber-300" :
                  "bg-red-500/20 text-red-300"
                }`}>
                  {totalCorrect}/{totalAnswered} ({accuracy}%)
                </span>
              )}
              <span className="text-white/50 text-sm">{currentIdx + 1} / {quizList.length}</span>
            </div>
          </div>
        </header>

        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${((currentIdx + 1) / quizList.length) * 100}%` }} />
        </div>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Source info */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${SUBJECT_COLORS[quiz.subject] || "bg-slate-100 text-slate-600"}`}>
              {SUBJECT_LABELS[quiz.subject] || quiz.subject}
            </span>
            <span className="text-xs text-slate-400">{quiz.pageTitle}</span>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <span className="text-lg font-bold text-slate-300 shrink-0">Q{quiz.n}</span>
              <p className="text-base sm:text-lg text-[#1e293b] leading-relaxed font-medium">{quiz.q}</p>
            </div>

            {!revealed ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 py-4 rounded-xl text-lg font-bold bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.98] transition-all"
                >
                  O
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 py-4 rounded-xl text-lg font-bold bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.98] transition-all"
                >
                  X
                </button>
              </div>
            ) : (
              <div>
                <div className={`rounded-xl p-4 mb-4 ${isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl`}>{isCorrect ? "O" : "X"}</span>
                    <span className={`text-sm font-bold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                      {isCorrect ? "정답입니다!" : "오답입니다"}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      정답: {quiz.a ? "O" : "X"} · 내 답: {userAnswer ? "O" : "X"}
                    </span>
                  </div>
                  {quiz.e && (
                    <p className="text-sm text-slate-600 leading-relaxed">{quiz.e}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevQuiz}
                    disabled={currentIdx === 0}
                    className="flex-1 py-3 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    이전
                  </button>
                  {currentIdx < quizList.length - 1 ? (
                    <button
                      onClick={nextQuiz}
                      className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                      다음 문제
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewMode("select")}
                      className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white transition-all"
                    >
                      완료 ({totalCorrect}/{totalAnswered}, {accuracy}%)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Selection mode
  const totalQuizCount = selectedPages.reduce((sum, slug) => sum + (data[slug]?.quizzes.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#1e293b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-white/70 hover:text-white text-sm mb-1 inline-block">← 홈으로</Link>
            <h1 className="text-2xl font-bold text-white">OX 퀴즈 연습</h1>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-xs">전체 {Object.values(data).reduce((s, p) => s + p.quizzes.length, 0)}문제</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Subject filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSubjectFilter("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              !subjectFilter ? "bg-[#1e293b] text-white border-[#1e293b]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            전체
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s === subjectFilter ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                s === subjectFilter ? "bg-[#1e293b] text-white border-[#1e293b]" : `${SUBJECT_COLORS[s] || "bg-white text-slate-600"} hover:opacity-80`
              }`}
            >
              {SUBJECT_LABELS[s] || s}
            </button>
          ))}
        </div>

        {/* Select/Deselect all */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={selectAllFiltered} className="text-xs text-blue-600 hover:underline">전체 선택</button>
            <span className="text-slate-300">|</span>
            <button onClick={deselectAllFiltered} className="text-xs text-slate-400 hover:underline">전체 해제</button>
          </div>
          <span className="text-xs text-slate-400">
            {selectedPages.length}개 선택 · {totalQuizCount}문제
          </span>
        </div>

        {/* Page list */}
        <div className="space-y-2 mb-8">
          {filteredPages.map(([slug, page]) => {
            const isSelected = selectedPages.includes(slug);
            return (
              <button
                key={slug}
                onClick={() => togglePage(slug)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#1e293b]">{page.title}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border ${SUBJECT_COLORS[page.subject] || ""}`}>
                        {SUBJECT_LABELS[page.subject] || page.subject}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{page.quizzes.length}문제</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Start button */}
        {totalQuizCount > 0 && (
          <div className="sticky bottom-4">
            <button
              onClick={startQuiz}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all"
            >
              {totalQuizCount}문제 풀기 시작
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
