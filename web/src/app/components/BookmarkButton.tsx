"use client";

import { useState, useEffect } from "react";
import { isBookmarked as checkBookmarked, toggleBookmark } from "@/lib/wikiStorage";

export default function BookmarkButton({ pageSlug, title }: { pageSlug: string; title: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    checkBookmarked(pageSlug).then((v) => {
      setBookmarked(v);
      setLoaded(true);
    });
  }, [pageSlug]);

  const toggle = async () => {
    const newState = await toggleBookmark(pageSlug, title);
    setBookmarked(newState);
  };

  if (!loaded) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        bookmarked
          ? "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
      }`}
      title={bookmarked ? "북마크 해제" : "북마크 추가"}
    >
      <svg
        className={`w-4 h-4 ${bookmarked ? "fill-yellow-500" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={bookmarked ? 0 : 2}
      >
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {bookmarked ? "북마크됨" : "북마크"}
    </button>
  );
}
