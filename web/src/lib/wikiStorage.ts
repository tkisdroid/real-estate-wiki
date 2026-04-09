/**
 * 위키 북마크/학습진도 스토리지 추상화
 * - 에듀랜드 로그인 시: Supabase RPC (wiki_* SECURITY DEFINER 함수)
 *   세션 토큰은 localStorage.eduland_member.session_token 에 저장됨
 * - 비로그인 시: localStorage (로컬 데이터)
 */
import { supabase } from "./supabase";

const LOCAL_BM_KEY = "wiki-bookmarks";
const LOCAL_BM_TITLES_KEY = "wiki-bookmark-titles";
const LOCAL_VISITS_KEY = "wiki-page-visits";
const MEMBER_KEY = "eduland_member";

// ─── 세션 토큰 조회 ───

interface EdulandMember {
  mem_id?: string;
  mem_name?: string;
  session_token?: string;
  expires_at?: string;
  ts?: number;
}

/** 유효한 세션 토큰을 가진 에듀랜드 회원 정보 반환 */
function getEdulandMember(): EdulandMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EdulandMember;
    if (!parsed.mem_id) return null;
    // 30일 이내 로그인만 유효
    if (!parsed.ts || Date.now() - parsed.ts >= 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** 서버 RPC 호출 가능한 토큰 (없으면 null → localStorage fallback) */
function getSessionToken(): string | null {
  const m = getEdulandMember();
  return m?.session_token || null;
}

// ─── 북마크 ───

export interface Bookmark {
  pageSlug: string;
  pageTitle: string;
  createdAt: string;
}

/** 북마크 목록 조회 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const token = getSessionToken();

  if (token) {
    const { data, error } = await supabase.rpc("wiki_list_bookmarks", {
      p_token: token,
    });
    if (!error && Array.isArray(data)) {
      return data.map((r: { page_slug: string; page_title: string; created_at: string }) => ({
        pageSlug: r.page_slug,
        pageTitle: r.page_title,
        createdAt: r.created_at,
      }));
    }
    // 에러 시 localStorage fallback
  }

  try {
    const slugs: string[] = JSON.parse(localStorage.getItem(LOCAL_BM_KEY) || "[]");
    const titles: Record<string, string> = JSON.parse(
      localStorage.getItem(LOCAL_BM_TITLES_KEY) || "{}"
    );
    return slugs.map((s) => ({
      pageSlug: s,
      pageTitle: titles[s] || s,
      createdAt: "",
    }));
  } catch {
    return [];
  }
}

/** 북마크 토글 (추가/제거) → 새 상태 반환 */
export async function toggleBookmark(
  pageSlug: string,
  pageTitle: string
): Promise<boolean> {
  const token = getSessionToken();

  if (token) {
    const { data, error } = await supabase.rpc("wiki_toggle_bookmark", {
      p_token: token,
      p_page_slug: pageSlug,
      p_page_title: pageTitle,
    });
    if (!error && typeof data === "boolean") {
      return data;
    }
  }

  // localStorage fallback
  try {
    const slugs: string[] = JSON.parse(localStorage.getItem(LOCAL_BM_KEY) || "[]");
    const titles: Record<string, string> = JSON.parse(
      localStorage.getItem(LOCAL_BM_TITLES_KEY) || "{}"
    );

    if (slugs.includes(pageSlug)) {
      const next = slugs.filter((s) => s !== pageSlug);
      delete titles[pageSlug];
      localStorage.setItem(LOCAL_BM_KEY, JSON.stringify(next));
      localStorage.setItem(LOCAL_BM_TITLES_KEY, JSON.stringify(titles));
      return false;
    } else {
      slugs.push(pageSlug);
      titles[pageSlug] = pageTitle;
      localStorage.setItem(LOCAL_BM_KEY, JSON.stringify(slugs));
      localStorage.setItem(LOCAL_BM_TITLES_KEY, JSON.stringify(titles));
      return true;
    }
  } catch {
    return false;
  }
}

/** 특정 페이지 북마크 여부 */
export async function isBookmarked(pageSlug: string): Promise<boolean> {
  const token = getSessionToken();

  if (token) {
    const { data, error } = await supabase.rpc("wiki_is_bookmarked", {
      p_token: token,
      p_page_slug: pageSlug,
    });
    if (!error && typeof data === "boolean") {
      return data;
    }
  }

  try {
    const slugs: string[] = JSON.parse(localStorage.getItem(LOCAL_BM_KEY) || "[]");
    return slugs.includes(pageSlug);
  } catch {
    return false;
  }
}

// ─── 학습 진도 ───

/** 페이지 방문 기록 */
export async function recordVisit(
  pageSlug: string,
  pageTitle: string
): Promise<void> {
  const token = getSessionToken();

  if (token) {
    const { error } = await supabase.rpc("wiki_record_visit", {
      p_token: token,
      p_page_slug: pageSlug,
      p_page_title: pageTitle,
    });
    if (!error) return;
    // 에러 시 localStorage fallback
  }

  try {
    const visits: Record<string, number> = JSON.parse(
      localStorage.getItem(LOCAL_VISITS_KEY) || "{}"
    );
    visits[pageSlug] = (visits[pageSlug] || 0) + 1;
    localStorage.setItem(LOCAL_VISITS_KEY, JSON.stringify(visits));
  } catch { /* ignore */ }
}
