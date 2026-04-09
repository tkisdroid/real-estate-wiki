"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBookmarks, type Bookmark } from "@/lib/wikiStorage";

export default function MyBookmarks({ basePath }: { basePath: string }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getBookmarks().then((bm) => {
      setBookmarks(bm);
      setLoaded(true);
    });
  }, []);

  if (!loaded || bookmarks.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <h2 className="text-lg sm:text-xl font-bold text-[#1e293b] tracking-tight">내 북마크</h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
          {bookmarks.length}개
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {bookmarks.slice(0, 12).map((bm) => (
          <Link
            key={bm.pageSlug}
            href={`/wiki/${bm.pageSlug}/`}
            className="card-hover block bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-xl p-3 sm:p-4 group"
          >
            <h3 className="font-medium text-[#1e293b] text-xs sm:text-sm group-hover:text-indigo-700 transition-colors line-clamp-2">
              {bm.pageTitle}
            </h3>
          </Link>
        ))}
      </div>
      {bookmarks.length > 12 && (
        <p className="text-xs text-slate-400 text-center mt-3">
          +{bookmarks.length - 12}개 더
        </p>
      )}
    </section>
  );
}
