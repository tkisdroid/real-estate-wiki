"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSignupDone(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
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

        <h2 className="text-xl font-bold text-[#1e293b] mb-1">
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          에듀랜드 회원은 모든 학습 콘텐츠를 이용할 수 있습니다
        </p>

        {signupDone ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📧</div>
            <p className="font-medium text-[#1e293b]">인증 메일을 발송했습니다</p>
            <p className="text-sm text-slate-500 mt-1">이메일을 확인하고 인증 링크를 클릭해주세요</p>
            <button
              onClick={() => { setMode("login"); setSignupDone(false); }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              로그인하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="6자 이상"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>

            <p className="text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>계정이 없으신가요? <button type="button" onClick={() => setMode("signup")} className="text-blue-600 hover:underline font-medium">회원가입</button></>
              ) : (
                <>이미 계정이 있으신가요? <button type="button" onClick={() => setMode("login")} className="text-blue-600 hover:underline font-medium">로그인</button></>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
