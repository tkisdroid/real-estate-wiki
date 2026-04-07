"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import type { FuzzyResult } from "@/lib/koreanSearch";

interface SearchEntry {
  u: string; // urlSlug
  t: string; // title
  s: string; // subject
  c: string; // category
  i: string; // importance
  tags: string[];
  p: string; // parent
  x: string; // excerpt
}

const SUBJECT_LABELS: Record<string, string> = {
  부동산학개론: "부동산학개론",
  민법및민사특별법: "민법 및 민사특별법",
  공인중개사법령및중개실무: "중개사법령 및 실무",
  부동산공법: "부동산공법",
  부동산공시법: "부동산공시법",
  부동산세법: "부동산세법",
};

const IMPORTANCE_LABELS: Record<string, string> = {
  high: "중요",
  medium: "보통",
  low: "낮음",
};

const IMPORTANCE_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const FREQ_TAGS = ["매년출제", "자주출제", "가끔출제", "신규출제"];

export default function SearchFilter({ basePath }: { basePath: string }) {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [importanceFilter, setImportanceFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${basePath}/search-index.json`)
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setEntries(data);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, [basePath]);

  const subjects = useMemo(() => {
    const set = new Set(entries.map((e) => e.s).filter(Boolean));
    return Array.from(set).sort();
  }, [entries]);

  const matchesQuery = useCallback(
    (entry: SearchEntry, q: string) => {
      if (!q) return true;
      const lower = q.toLowerCase();
      return (
        entry.t.toLowerCase().includes(lower) ||
        entry.s.toLowerCase().includes(lower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        entry.x.toLowerCase().includes(lower)
      );
    },
    []
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (e.c === "subjects") return false; // hide subject overview pages from search
      if (subjectFilter && e.s !== subjectFilter) return false;
      if (importanceFilter && e.i !== importanceFilter) return false;
      if (tagFilter && !e.tags.includes(tagFilter)) return false;
      if (!matchesQuery(e, query)) return false;
      return true;
    });
  }, [entries, query, subjectFilter, importanceFilter, tagFilter, matchesQuery]);

  const isFiltering = query || subjectFilter || importanceFilter || tagFilter;

  // Fuzzy suggestions when no results (dynamic import to avoid breaking hydration)
  const [suggestions, setSuggestions] = useState<SearchEntry[]>([]);
  useEffect(() => {
    if (!query || filtered.length > 0) { setSuggestions([]); return; }
    import("@/lib/koreanSearch").then(({ fuzzySearch }) => {
      try {
        const nonSubjectEntries = entries.filter((e) => e.c !== "subjects");
        const titles = nonSubjectEntries.map((e) => e.t);
        const fuzzyResults = fuzzySearch(titles, query, 5);
        setSuggestions(fuzzyResults.map((r: FuzzyResult) => nonSubjectEntries[r.index]));
      } catch { setSuggestions([]); }
    }).catch(() => setSuggestions([]));
  }, [query, filtered.length, entries]);

  // Source search fallback
  const [sourceResults, setSourceResults] = useState<Array<{ title: string; excerpt: string }>>([]);
  useEffect(() => {
    if (!query || filtered.length > 0 || query.length < 2) {
      setSourceResults([]);
      return;
    }
    fetch(`${basePath}/source-index.json`)
      .then((r) => r.json())
      .then((data: Array<{ t: string; x: string }>) => {
        const q = query.toLowerCase();
        const matches = data
          .filter((d) => d.t.toLowerCase().includes(q) || d.x.toLowerCase().includes(q))
          .slice(0, 5);
        setSourceResults(matches.map((m) => ({ title: m.t, excerpt: m.x })));
      })
      .catch(() => setSourceResults([]));
  }, [query, filtered.length, basePath]);

  // Record search gaps
  useEffect(() => {
    if (!query || query.length < 2 || filtered.length > 0) return;
    const timer = setTimeout(() => {
      try {
        const gaps = JSON.parse(localStorage.getItem("wiki-search-gaps") || "[]") as Array<{ q: string; ts: number }>;
        if (!gaps.some((g) => g.q === query)) {
          gaps.push({ q: query, ts: Date.now() });
          // Keep only last 50
          if (gaps.length > 50) gaps.splice(0, gaps.length - 50);
          localStorage.setItem("wiki-search-gaps", JSON.stringify(gaps));
        }
      } catch { /* ignore */ }
    }, 2000); // Record after 2s of no results (debounce)
    return () => clearTimeout(timer);
  }, [query, filtered.length]);

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const clearAll = () => {
    setQuery("");
    setSubjectFilter("");
    setImportanceFilter("");
    setTagFilter("");
  };

  if (!isLoaded) return null;

  return (
    <div className="mb-10">
      {/* Search Input */}
      <div className="relative mb-4">
        <input
          id="wiki-search"
          name="wiki-search"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="개념, 법령, 키워드로 검색..."
          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        <svg
          className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Subject Filter */}
        <select
          id="wiki-subject"
          name="wiki-subject"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 과목</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {SUBJECT_LABELS[s] || s}
            </option>
          ))}
        </select>

        {/* Importance Filter */}
        <select
          id="wiki-importance"
          name="wiki-importance"
          value={importanceFilter}
          onChange={(e) => setImportanceFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 중요도</option>
          <option value="high">중요</option>
          <option value="medium">보통</option>
          <option value="low">낮음</option>
        </select>

        {/* Frequency Tag Filter */}
        <select
          id="wiki-tag"
          name="wiki-tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">출제빈도</option>
          {FREQ_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        {isFiltering && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50"
          >
            초기화
          </button>
        )}
      </div>

      {/* Results */}
      {isFiltering && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {filtered.length}개 결과
          </p>

          {filtered.length === 0 ? (
            <div className="py-4">
              {/* Fuzzy suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">이것을 찾으셨나요?</p>
                  <div className="space-y-1.5">
                    {suggestions.map((s) => (
                      <Link
                        key={s.u}
                        href={`/wiki/${s.u}/`}
                        className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-blue-800">{s.t}</span>
                        {s.s && (
                          <span className="text-xs text-blue-600 ml-2">({SUBJECT_LABELS[s.s] || s.s})</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Source fallback results */}
              {sourceResults.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">원본 자료에서 발견</p>
                  <div className="space-y-1.5">
                    {sourceResults.map((s, i) => (
                      <div
                        key={i}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-medium">원본</span>
                          <span className="text-sm font-medium text-amber-900">{s.title}</span>
                        </div>
                        <p className="text-xs text-amber-700 line-clamp-3">{s.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length === 0 && sourceResults.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>검색 결과가 없습니다</p>
                  <p className="text-sm mt-1">다른 키워드나 필터를 시도해보세요</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((entry) => (
                <Link
                  key={entry.u}
                  href={`/wiki/${entry.u}/`}
                  className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {highlightMatch(entry.t, query)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {entry.s && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {SUBJECT_LABELS[entry.s] || entry.s}
                          </span>
                        )}
                        {entry.i && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border ${IMPORTANCE_COLORS[entry.i] || ""}`}
                          >
                            {IMPORTANCE_LABELS[entry.i] || entry.i}
                          </span>
                        )}
                        {entry.tags
                          .filter((tag) => FREQ_TAGS.includes(tag))
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                            >
                              #{tag}
                            </span>
                          ))}
                      </div>
                      {query && entry.x.toLowerCase().includes(query.toLowerCase()) && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                          {entry.x.slice(0, 150)}...
                        </p>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 mt-1 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
              {filtered.length > 50 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  상위 50개 결과를 표시합니다. 검색어를 더 구체적으로 입력해보세요.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
