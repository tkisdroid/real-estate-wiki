import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공인중개사 시험 위키",
  description: "에듀랜드 2026 기본서 기반 공인중개사 시험 학습 위키",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
