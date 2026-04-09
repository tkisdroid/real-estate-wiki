/**
 * 위키 북마크/학습진도 스토리지 추상화
 * - 로그인 시: Supabase DB (이용자별 데이터)
 * - 비로그인 시: localStorage (로컬 데이터)
 */
import { supabase, getCurrentUserUid } from "./supabase";

const LOCAL_BM_KEY = "wiki-bookmarks";
const LOCAL_BM_TITLES_KEY = "wiki-bookmark-titles";
const LOCAL_VISITS_KEY = "wiki-page-visits";

// ─── 북마크 ───

export interface Bookmark {
  pageSlug: string;
  pageTitle: string;
  createdAt: string;
}

/** 북마크 목록 조회 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const uid = await getCurrentUserUid();

  if (uid) {
    const { data } = await supabase
      .from("wiki_bookmark")
      .select("page_slug, page_title, created_at")
      .eq("user_uid", uid)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => ({
      pageSlug: r.page_slug,
      pageTitle: r.page_title,
      createdAt: r.created_at,
    }));
  }

  // localStorage fallback
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
  const uid = await getCurrentUserUid();

  if (uid) {
    const { data: existing } = await supabase
      .from("wiki_bookmark")
      .select("id")
      .eq("user_uid", uid)
      .eq("page_slug", pageSlug)
      .maybeSingle();

    if (existing) {
      await supabase.from("wiki_bookmark").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase
        .from("wiki_bookmark")
        .insert({ user_uid: uid, page_slug: pageSlug, page_title: pageTitle });
      return true;
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
  const uid = await getCurrentUserUid();

  if (uid) {
    const { data } = await supabase
      .from("wiki_bookmark")
      .select("id")
      .eq("user_uid", uid)
      .eq("page_slug", pageSlug)
      .maybeSingle();
    return !!data;
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
  const uid = await getCurrentUserUid();

  if (uid) {
    const { data: existing } = await supabase
      .from("wiki_study_progress")
      .select("id, visit_count")
      .eq("user_uid", uid)
      .eq("page_slug", pageSlug)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("wiki_study_progress")
        .update({
          visit_count: existing.visit_count + 1,
          last_visited_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("wiki_study_progress").insert({
        user_uid: uid,
        page_slug: pageSlug,
        page_title: pageTitle,
      });
    }
    return;
  }

  // localStorage fallback
  try {
    const visits: Record<string, number> = JSON.parse(
      localStorage.getItem(LOCAL_VISITS_KEY) || "{}"
    );
    visits[pageSlug] = (visits[pageSlug] || 0) + 1;
    localStorage.setItem(LOCAL_VISITS_KEY, JSON.stringify(visits));
  } catch { /* ignore */ }
}
