"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const MEMBER_KEY = "eduland_member";
const MEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

/** 동기적으로 에듀랜드 회원 로그인 유효성 확인 (localStorage만 검사) */
export function isEdulandMemberValid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed.mem_id && parsed.ts && Date.now() - parsed.ts < MEMBER_TTL_MS);
  } catch {
    return false;
  }
}

interface UseAuthOptions {
  /** 초기 isAuthenticated 값. SSR/봇을 위해 기본 콘텐츠를 노출하려면 true. */
  initialAuthenticated?: boolean;
}

/**
 * 에듀랜드 회원(localStorage) 또는 Supabase auth를 확인하는 훅.
 * - Supabase onAuthStateChange 이벤트가 null 세션을 던져도 eduland 로그인을 덮어쓰지 않음
 *   (두 경로를 모두 다시 평가)
 * - 다른 탭에서 로그인/로그아웃 시 자동 반영 (storage 이벤트)
 */
export function useAuth({ initialAuthenticated = false }: UseAuthOptions = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 에듀랜드 회원 (localStorage) — 주 로그인 경로
      if (isEdulandMemberValid()) {
        setIsAuthenticated(true);
        setChecking(false);
        return;
      }
      // 2. Supabase auth (폴백)
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setChecking(false);
    };
    checkAuth();

    // Supabase 세션 변경 시 전체 재검사 (INITIAL_SESSION의 null이 eduland 로그인을 덮어쓰는 버그 방지)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    // 다른 탭에서 로그인/로그아웃 감지
    const onStorage = (e: StorageEvent) => {
      if (e.key === MEMBER_KEY) {
        checkAuth();
      }
    };
    // 탭 포커스 복귀 / 브라우저 뒤로가기 bfcache 복구 시 재검사
    const onVisible = () => {
      if (document.visibilityState === "visible") checkAuth();
    };
    const onPageShow = () => checkAuth();

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return { isAuthenticated, checking, setAuthenticated: setIsAuthenticated };
}
