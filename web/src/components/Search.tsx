"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchEntry {
  id: string;
  title: string;
  subject: string;
  category: string;
  tags: string;
  preview: string;
  text: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  concepts: "개념",
  laws: "법령",
  subjects: "과목",
  practice: "기출",
};

const basePath = "/real-estate-wiki";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search index on first focus
  const loadIndex = useCallback(async () => {
    if (index) return;
    try {
      const res = await fetch(`${basePath}/search-index.json`);
      const data: SearchEntry[] = await res.json();
      setIndex(data);
    } catch {
      console.error("Failed to load search index");
    }
  }, [index]);

  // Search logic
  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([]);
      return;
    }

    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/);

    const scored = index
      .map((entry) => {
        let score = 0;
        const titleLower = entry.title.toLowerCase();
        const subjectLower = entry.subject.toLowerCase();
        const tagsLower = entry.tags.toLowerCase();
        const textLower = entry.text.toLowerCase();

        for (const term of terms) {
          // Title exact match (highest)
          if (titleLower.includes(term)) score += 100;
          // Subject match
          if (subjectLower.includes(term)) score += 30;
          // Tags match
          if (tagsLower.includes(term)) score += 50;
          // Content match
          if (textLower.includes(term)) {
            score += 10;
            // Bonus for multiple occurrences
            const count = textLower.split(term).length - 1;
            score += Math.min(count, 10) * 2;
          }
        }

        return { entry, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.entry);

    setResults(scored);
    setSelectedIdx(0);
  }, [query, index]);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        loadIndex();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadIndex]);

  // Navigate with keyboard
  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      goTo(results[selectedIdx].id);
    }
  }

  function goTo(id: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`${basePath}/wiki/${id}/`);
  }

  function highlightMatch(text: string, maxLen: number = 150): string {
    if (!query.trim()) return text.slice(0, maxLen);
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text.slice(0, maxLen);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 80);
    let snippet = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
    return snippet;
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="검색 (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setIsOpen(true); loadIndex(); }}
          onKeyDown={onInputKeyDown}
          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto z-50">
          {!index && (
            <div className="p-4 text-sm text-gray-400 text-center">검색 인덱스 로딩 중...</div>
          )}
          {index && results.length === 0 && (
            <div className="p-4 text-sm text-gray-400 text-center">
              &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => goTo(r.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors ${
                i === selectedIdx ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                  {CATEGORY_LABELS[r.category] || r.category}
                </span>
                <span className="font-medium text-gray-900 text-sm truncate">{r.title}</span>
                {r.subject && (
                  <span className="text-xs text-gray-400 shrink-0">{r.subject}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {highlightMatch(r.preview)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && query.trim() && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
