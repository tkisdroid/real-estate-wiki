import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "에듀랜드 위키 (공인중개사)",
  description: "2026 최신교재 기반 · 22개년 기출문제 분석 · 공인중개사 시험 학습 위키",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-[#f5f5f7]">{children}</body>
    </html>
  );
}
