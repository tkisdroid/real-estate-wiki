"use client";

import { useState, useEffect, useCallback } from "react";

interface Quiz {
  n: number;
  q: string;
  a: boolean; // true = O, false = X
  e: string;
}

interface QuizPage {
  title: string;
  subject: string;
  quizzes: Quiz[];
}

type QuizData = Record<string, QuizPage>;

function getStorageKey(slug: string) {
  return `quiz-results-${slug}`;
}

function loadResults(slug: string): Record<number, boolean | null> {
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResults(slug: string, results: Record<number, boolean | null>) {
  try {
    localStorage.setItem(getStorageKey(slug), JSON.stringify(results));
  } catch { /* ignore */ }
}

export default function OXQuizInteractive({ pageSlug, basePath }: { pageSlug: string; basePath: string }) {
  const [quizPage, setQuizPage] = useState<QuizPage | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<Record<number, boolean | null>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${basePath}/quiz-data.json`)
      .then((r) => r.json())
      .then((data: QuizData) => {
        if (data[pageSlug]) {
          setQuizPage(data[pageSlug]);
          setResults(loadResults(pageSlug));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [pageSlug, basePath]);

  const handleAnswer = useCallback((quizNum: number, userAnswer: boolean) => {
    if (revealed.has(quizNum)) return;
    setAnswers((prev) => ({ ...prev, [quizNum]: userAnswer }));
    setRevealed((prev) => new Set(prev).add(quizNum));

    const quiz = quizPage?.quizzes.find((q) => q.n === quizNum);
    if (quiz) {
      const correct = userAnswer === quiz.a;
      const newResults = { ...results, [quizNum]: correct };
      setResults(newResults);
      saveResults(pageSlug, newResults);
    }
  }, [revealed, quizPage, results, pageSlug]);

  const resetAll = useCallback(() => {
    setRevealed(new Set());
    setAnswers({});
    setResults({});
    saveResults(pageSlug, {});
  }, [pageSlug]);

  if (!loaded || !quizPage || quizPage.quizzes.length === 0) return null;

  const totalAnswered = Object.keys(results).length;
  const totalCorrect = Object.values(results).filter(Boolean).length;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="mt-8 border-t-2 border-blue-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          OX 퀴즈
          <span className="text-sm font-normal text-gray-500">
            ({quizPage.quizzes.length}문제)
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {totalAnswered > 0 && (
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              accuracy >= 80 ? "bg-green-100 text-green-700" :
              accuracy >= 50 ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {totalCorrect}/{totalAnswered} ({accuracy}%)
            </span>
          )}
          {totalAnswered > 0 && (
            <button
              onClick={resetAll}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {quizPage.quizzes.map((quiz) => {
          const isRevealed = revealed.has(quiz.n);
          const userAnswer = answers[quiz.n];
          const isCorrect = results[quiz.n];
          const prevResult = !isRevealed && results[quiz.n] !== undefined ? results[quiz.n] : undefined;

          return (
            <div
              key={quiz.n}
              className={`rounded-lg border p-4 transition-colors ${
                isRevealed
                  ? isCorrect
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                  : prevResult !== undefined
                    ? prevResult
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50"
                    : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold text-gray-400 mt-0.5 shrink-0">Q{quiz.n}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 leading-relaxed">{quiz.q}</p>

                  {!isRevealed ? (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAnswer(quiz.n, true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95 transition-all min-w-[60px]"
                      >
                        O
                      </button>
                      <button
                        onClick={() => handleAnswer(quiz.n, false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95 transition-all min-w-[60px]"
                      >
                        X
                      </button>
                      {prevResult !== undefined && (
                        <span className={`text-xs self-center ml-2 ${prevResult ? "text-green-600" : "text-red-500"}`}>
                          (이전: {prevResult ? "정답" : "오답"})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${quiz.a ? "text-green-600" : "text-red-600"}`}>
                          정답: {quiz.a ? "O" : "X"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}>
                          {isCorrect ? "정답!" : "오답"}
                        </span>
                        <span className="text-xs text-gray-400">
                          (내 답: {userAnswer ? "O" : "X"})
                        </span>
                      </div>
                      {quiz.e && (
                        <p className="text-xs text-gray-600 bg-white/60 rounded p-2">
                          {quiz.e}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
