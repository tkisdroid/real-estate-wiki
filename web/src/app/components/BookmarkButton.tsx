"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "wiki-bookmarks";

function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setBookmarks(slugs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch { /* ignore */ }
}

export function useBookmarks() {
  const [bookmarks, setBm] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBm(getBookmarks());
    setLoaded(true);
  }, []);

  return { bookmarks, loaded };
}

export default function BookmarkButton({ pageSlug, title }: { pageSlug: string; title: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const bm = getBookmarks();
    setIsBookmarked(bm.includes(pageSlug));
    setLoaded(true);
  }, [pageSlug]);

  const toggle = () => {
    const bm = getBookmarks();
    let next: string[];
    if (bm.includes(pageSlug)) {
      next = bm.filter((s) => s !== pageSlug);
    } else {
      next = [...bm, pageSlug];
    }
    setBookmarks(next);
    setIsBookmarked(!isBookmarked);

    // Also save title mapping for dashboard display
    try {
      const titles = JSON.parse(localStorage.getItem("wiki-bookmark-titles") || "{}");
      if (!isBookmarked) {
        titles[pageSlug] = title;
      } else {
        delete titles[pageSlug];
      }
      localStorage.setItem("wiki-bookmark-titles", JSON.stringify(titles));
    } catch { /* ignore */ }
  };

  if (!loaded) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        isBookmarked
          ? "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
      }`}
      title={isBookmarked ? "북마크 해제" : "북마크 추가"}
    >
      <svg
        className={`w-4 h-4 ${isBookmarked ? "fill-yellow-500" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={isBookmarked ? 0 : 2}
      >
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {isBookmarked ? "북마크됨" : "북마크"}
    </button>
  );
}
