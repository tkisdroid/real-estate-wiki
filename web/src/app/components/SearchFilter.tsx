"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

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
          type="text"
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
            <div className="text-center py-8 text-gray-400">
              <p>검색 결과가 없습니다</p>
              <p className="text-sm mt-1">다른 키워드나 필터를 시도해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((entry) => (
                <Link
                  key={entry.u}
                  href={`${basePath}/wiki/${entry.u}/`}
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
