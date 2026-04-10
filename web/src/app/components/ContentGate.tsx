"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
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

export default function ContentGate({ html, children }: { html: string; children?: React.ReactNode }) {
  // 초기 상태: 전체 콘텐츠 표시 (SSR/Bot은 JS 실행 전 전체 HTML을 읽음)
  const { isAuthenticated, checking, setAuthenticated } = useAuth({ initialAuthenticated: true });
  const [showModal, setShowModal] = useState(false);

  // 인증 확인 중이거나 인증됨 → 전체 콘텐츠
  if (checking || isAuthenticated) {
    return (
      <>
        <div
          className={PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {children}
      </>
    );
  }

  // 비인증 → 프리뷰 + CTA
  //
  // 레이아웃 원칙:
  //   1. 프리뷰는 .content-gate-preview (CSS로 max-height 제어, vh/svh fallback).
  //      과거 구조는 useEffect로 window.innerHeight를 측정했으나 모바일 주소창
  //      변동에 취약했다.
  //   2. CTA는 absolute 오버레이가 아니라 **일반 flow** 로 프리뷰 아래에 배치.
  //      이유: globals.css의 .prose table th:first-child가 모바일에서
  //      `position: sticky; z-index: 2`를 가지므로, absolute CTA(z-index 없음)
  //      위로 표의 첫 컬럼이 튀어나오던 버그(2026-04-10 보고)를 구조적으로 차단.
  //   3. 프리뷰 하단의 페이드는 .content-gate-fade (z-index: 20)로,
  //      sticky 셀 z-index(2)를 확실히 덮어 시각적 컷오프를 부드럽게 함.
  return (
    <>
      <div className="content-gate-preview">
        <div
          className={PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="content-gate-fade" aria-hidden="true" />
      </div>

      {/* CTA — 일반 flow (프리뷰 바로 아래) */}
      <div className="bg-white pt-6 pb-10 text-center border-t border-slate-100">
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

      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setAuthenticated(true);
          }}
        />
      )}
    </>
  );
}
