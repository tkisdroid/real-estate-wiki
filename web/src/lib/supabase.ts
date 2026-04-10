/**
 * Supabase 클라이언트
 *
 * ⚠️  보안 전제 — 이 파일은 anon 키를 하드코딩한다. 다음 조건이 모두 유지될 때만 안전하다:
 *
 * 1. 이 키는 **anon**(익명) 키다. service_role 키가 아니다.
 *    service_role 키를 여기에 넣으면 즉시 전 테이블이 공개된다.
 *
 * 2. 실제 보안 경계는 Supabase 측의 **Row-Level Security(RLS) 정책**과
 *    `SECURITY DEFINER` 함수(`verify_member`, `wiki_*`)가 담당한다.
 *    anon 키가 호출할 수 있는 것은 RLS가 허용한 읽기와,
 *    SECURITY DEFINER 함수에 `p_token`(에듀랜드 세션 토큰)으로
 *    인증이 통과된 경우의 쓰기뿐이다.
 *
 * 3. Supabase 프로젝트에서 **RLS를 비활성화하거나**, anon 역할에
 *    테이블 직접 쓰기 권한을 부여하는 순간 이 가정은 깨진다.
 *    이 repo에는 DB 스키마/정책이 포함되어 있지 않으므로, 변경 시
 *    반드시 Supabase 콘솔에서 정책을 확인한 뒤 배포할 것.
 *
 * 4. 정적 내보내기(Next.js `output: "export"`)이므로 런타임 환경변수가 없다.
 *    키 교체 시에는 이 파일을 편집하고 재빌드·재배포해야 한다
 *    (`process.env` 변경으로는 교체 불가).
 *
 * 본 코드베이스의 위험 평가는 `.planning/codebase/CONCERNS.md` §H2 참조.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cbdtkygmtjtfuqzzpaep.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZHRreWdtdGp0ZnVxenpwYWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjczOTEsImV4cCI6MjA5MDAwMzM5MX0.A9_bMNF0B8evERqZllOPiOfTTpc5Rihv5DkhEx0RILg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
