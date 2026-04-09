"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [memId, setMemId] = useState("");
  const [memPass, setMemPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("verify_member", {
        p_mem_id: memId,
        p_password: memPass,
      });
      if (error) throw error;
      if (!data?.ok) {
        setError(data?.error || "로그인에 실패했습니다");
        return;
      }
      localStorage.setItem("eduland_member", JSON.stringify({
        mem_id: data.mem_id,
        mem_name: data.mem_name,
        ts: Date.now(),
      }));
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-[#1e293b] mb-1">로그인</h2>
        <p className="text-sm text-slate-500 mb-5">
          에듀랜드에 무료 회원가입 시 모든 기능을 사용할 수 있습니다
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="mem-id" className="block text-sm font-medium text-slate-700 mb-1">에듀랜드 아이디</label>
            <input
              id="mem-id"
              type="text"
              value={memId}
              onChange={(e) => setMemId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ color: "#1e293b" }}
              placeholder="에듀랜드 아이디"
            />
          </div>
          <div>
            <label htmlFor="mem-pass" className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
            <input
              id="mem-pass"
              type="password"
              value={memPass}
              onChange={(e) => setMemPass(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ color: "#1e293b" }}
              placeholder="비밀번호"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>

        {/* 회원가입 안내 */}
        <div className="mt-5 pt-5 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-3">아직 에듀랜드 회원이 아니신가요?</p>
          <a
            href="https://eduland.or.kr/main/mypage/login.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            에듀랜드 무료 회원가입
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
