"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AuthModal from "./AuthModal";

const PROSE_CLASSES = `prose prose-lg max-w-none
  prose-headings:text-[#1e293b] prose-headings:tracking-tight
  prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-bold
  prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:pb-3 prose-h2:border-slate-200 prose-h2:font-bold
  prose-h3:text-lg prose-h3:font-semibold
  prose-p:text-slate-600 prose-p:leading-[1.8]
  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
  prose-table:text-sm prose-th:bg-gray-50
  prose-strong:text-[#1e293b]
  prose-code:bg-slate-100 prose-code:text-slate-700 prose-code:px-1.5 prose-code:rounded prose-code:text-sm prose-code:border prose-code:border-slate-200
  prose-pre:bg-[#1e293b] prose-pre:text-slate-200 prose-pre:rounded-xl prose-pre:p-5 prose-pre:overflow-x-auto
  prose-blockquote:border-l-indigo-300 prose-blockquote:bg-indigo-50/50 prose-blockquote:text-indigo-900 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
  prose-li:my-0.5 prose-li:text-slate-600 prose-li:leading-[1.75]`;

export default function ContentGate({ html }: { html: string }) {
  // 초기 상태: 전체 콘텐츠 표시 (SSR/Bot은 JS 실행 전 전체 HTML을 읽음)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [cutoffHeight, setCutoffHeight] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setChecking(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: unknown } | null) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 비인증 시 30% 높이 계산
  useEffect(() => {
    if (!checking && !isAuthenticated && contentRef.current) {
      const fullHeight = contentRef.current.scrollHeight;
      setCutoffHeight(Math.max(300, fullHeight * 0.3));
    }
  }, [checking, isAuthenticated, html]);

  // 인증 확인 중이거나 인증됨 → 전체 콘텐츠
  if (checking || isAuthenticated) {
    return (
      <div
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // 비인증 → 30%만 표시 + CTA
  return (
    <>
      <div className="relative">
        <div
          ref={contentRef}
          className={`${PROSE_CLASSES} overflow-hidden`}
          style={{ maxHeight: cutoffHeight || 400 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Gradient fade + CTA overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-32 bg-gradient-to-t from-white via-white/95 to-transparent" />
          <div className="bg-white pb-8 pt-2 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-slate-600">나머지 콘텐츠는 회원 전용입니다</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              에듀랜드 회원가입(무료)으로 전체 학습 자료를 이용하세요
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all"
              >
                무료 회원가입
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setIsAuthenticated(true);
          }}
        />
      )}
    </>
  );
}
