"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const VISITED_KEY = "wiki-visited-pages";
const BOOKMARK_KEY = "wiki-bookmarks";
const BOOKMARK_TITLES_KEY = "wiki-bookmark-titles";

interface SearchEntry {
  u: string;
  t: string;
  s: string;
  c: string;
  i: string;
  tags: string[];
  p: string;
  x: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  부동산학개론: "부동산학개론",
  민법및민사특별법: "민법",
  공인중개사법령및중개실무: "중개실무",
  부동산공법: "공법",
  부동산공시법: "공시법",
  부동산세법: "세법",
};

const SUBJECT_COLORS: Record<string, string> = {
  부동산학개론: "bg-blue-500",
  민법및민사특별법: "bg-pink-500",
  공인중개사법령및중개실무: "bg-emerald-500",
  부동산공법: "bg-amber-500",
  부동산공시법: "bg-indigo-500",
  부동산세법: "bg-red-500",
};

export function trackVisit(pageSlug: string) {
  try {
    const visited = JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
    if (!visited.includes(pageSlug)) {
      visited.push(pageSlug);
      localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    }
  } catch { /* ignore */ }
}

export default function ProgressDashboard({ basePath }: { basePath: string }) {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkTitles, setBookmarkTitles] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const refreshLocalData = useCallback(() => {
    try {
      setVisited(JSON.parse(localStorage.getItem(VISITED_KEY) || "[]"));
      setBookmarks(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"));
      setBookmarkTitles(JSON.parse(localStorage.getItem(BOOKMARK_TITLES_KEY) || "{}"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshLocalData();

    fetch(`${basePath}/search-index.json`)
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setEntries(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    // Re-read localStorage when tab becomes visible (user returns from wiki page)
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshLocalData();
    };
    // Re-read on focus (covers same-tab navigation back to home)
    const onFocus = () => refreshLocalData();
    // Re-read periodically to catch client-side navigation updates
    const interval = setInterval(refreshLocalData, 2000);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      clearInterval(interval);
    };
  }, [basePath, refreshLocalData]);

  if (!loaded) return null;

  const conceptEntries = entries.filter((e) => e.c === "concepts");
  const subjects = [...new Set(conceptEntries.map((e) => e.s))].filter(Boolean).sort();

  const totalPages = conceptEntries.length;
  const visitedSet = new Set(visited);
  const totalVisited = conceptEntries.filter((e) => visitedSet.has(e.u)).length;
  const overallPercent = totalPages > 0 ? Math.round((totalVisited / totalPages) * 100) : 0;

  // Quiz stats
  let totalQuizAnswered = 0;
  let totalQuizCorrect = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("quiz-results-")) {
        const results = JSON.parse(localStorage.getItem(key) || "{}");
        for (const val of Object.values(results)) {
          totalQuizAnswered++;
          if (val) totalQuizCorrect++;
        }
      }
    }
  } catch { /* ignore */ }

  // Search gaps
  let searchGaps: Array<{ q: string; ts: number }> = [];
  try {
    searchGaps = JSON.parse(localStorage.getItem("wiki-search-gaps") || "[]");
  } catch { /* ignore */ }

  const hasActivity = totalVisited > 0 || totalQuizAnswered > 0 || bookmarks.length > 0 || searchGaps.length > 0;
  if (!hasActivity) return null;

  return (
    <div className="mb-10 bg-white rounded-lg shadow p-5 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">내 학습 현황</h2>

      {/* Overall progress */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900">{totalVisited}</div>
          <div className="text-xs text-gray-500">읽은 페이지</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900">
            {totalQuizAnswered > 0
              ? `${Math.round((totalQuizCorrect / totalQuizAnswered) * 100)}%`
              : "-"}
          </div>
          <div className="text-xs text-gray-500">퀴즈 정답률</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900">{bookmarks.length}</div>
          <div className="text-xs text-gray-500">북마크</div>
        </div>
      </div>

      {/* Per-subject progress bars */}
      <div className="space-y-2 mb-5">
        {subjects.map((subj) => {
          const total = conceptEntries.filter((e) => e.s === subj).length;
          const read = conceptEntries.filter((e) => e.s === subj && visitedSet.has(e.u)).length;
          const pct = total > 0 ? Math.round((read / total) * 100) : 0;
          return (
            <div key={subj} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-16 shrink-0 truncate">
                {SUBJECT_LABELS[subj] || subj}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${SUBJECT_COLORS[subj] || "bg-gray-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-12 text-right shrink-0">
                {read}/{total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">북마크</h3>
          <div className="flex flex-wrap gap-2">
            {bookmarks.slice(0, 10).map((slug) => (
              <Link
                key={slug}
                href={`/wiki/${slug}/`}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100 transition-colors"
              >
                {bookmarkTitles[slug] || slug}
              </Link>
            ))}
            {bookmarks.length > 10 && (
              <span className="text-xs text-gray-400 self-center">+{bookmarks.length - 10}개 더</span>
            )}
          </div>
        </div>
      )}

      {/* Search gaps — topics requested but not in wiki */}
      {searchGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">요청된 주제 (위키에 없음)</h3>
          <div className="flex flex-wrap gap-2">
            {searchGaps.slice(-10).reverse().map((gap) => (
              <span
                key={gap.q + gap.ts}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700"
              >
                {gap.q}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
