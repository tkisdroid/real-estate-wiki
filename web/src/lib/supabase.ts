import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cbdtkygmtjtfuqzzpaep.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZHRreWdtdGp0ZnVxenpwYWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjczOTEsImV4cCI6MjA5MDAwMzM5MX0.A9_bMNF0B8evERqZllOPiOfTTpc5Rihv5DkhEx0RILg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** 현재 로그인된 유저 UID (없으면 null) */
export async function getCurrentUserUid(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
