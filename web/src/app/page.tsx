import Link from "next/link";
import { getNavigation } from "@/lib/wiki";
import { getUrlSlug } from "@/lib/slugMap";
import { SUBJECT_ORDER, SUBJECT_LABELS, EXAM_LABELS, getSubjectColor } from "@/lib/subjects";
import SearchWrapper from "./components/SearchWrapper";

export default function Home() {
  const { subjects, conceptsBySubject, laws, practice } = getNavigation();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold">에듀랜드 위키 (공인중개사)</h1>
          <p className="mt-3 text-blue-200 text-sm sm:text-lg">
            2026 최신교재 기반 · 22개년 기출문제 분석
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search & Filter */}
        <SearchWrapper basePath="/real-estate-wiki" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[
            { label: "개념 페이지", value: Object.values(conceptsBySubject).flat().length },
            { label: "법령 페이지", value: laws.length },
            { label: "기출 분석", value: practice.length },
            { label: "과목", value: subjects.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-4 sm:p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-900">{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subjects Grid */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">과목별 학습</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {SUBJECT_ORDER.map((subj) => {
            const color = getSubjectColor(subj);
            const conceptCount = conceptsBySubject[subj]?.length || 0;
            const lawCount = laws.filter((l) => l.frontmatter.subject === subj).length;
            return (
              <Link
                key={subj}
                href={`/wiki/${getUrlSlug(`subjects/${subj}`) || subj}/`}
                className={`block rounded-lg shadow hover:shadow-lg transition-shadow p-5 sm:p-6 border ${color.border} ${color.bg}`}
              >
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${color.bg} ${color.text} border ${color.border} mb-3`}>
                  {EXAM_LABELS[subj]}
                </span>
                <h3 className={`text-base sm:text-lg font-semibold ${color.text}`}>
                  {SUBJECT_LABELS[subj]}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  개념 {conceptCount}개 · 법령 {lawCount}개
                </p>
              </Link>
            );
          })}
        </div>

        {/* Practice Section — structured */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">기출 분석 · 출제 경향</h2>

        {/* 종합분석 */}
        {(() => {
          const overview = practice.filter((p) => p.frontmatter.title.includes("종합") || p.frontmatter.title.includes("판례"));
          return overview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">종합 분석</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {overview.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                    className="block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <h4 className="font-medium text-gray-900 text-sm">{p.frontmatter.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 연도별 기출 */}
        {(() => {
          const exams = practice
            .filter((p) => p.frontmatter.title.includes("회") && p.frontmatter.title.includes("기출"))
            .sort((a, b) => b.frontmatter.title.localeCompare(a.frontmatter.title));
          return exams.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">연도별 기출문제 분석</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {exams.map((p) => {
                  const titleMatch = p.frontmatter.title.match(/(\d+)회/);
                  const yearMatch = p.frontmatter.title.match(/(\d{4})년?/);
                  const num = titleMatch ? titleMatch[1] : "";
                  const year = yearMatch ? yearMatch[1] : "";
                  const isRecent = parseInt(num) >= 33;
                  return (
                    <Link
                      key={p.slug}
                      href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                      className={`block rounded-lg border hover:shadow-md transition-shadow p-3 sm:p-4 text-center ${
                        isRecent
                          ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`text-lg sm:text-xl font-bold ${isRecent ? "text-amber-700" : "text-gray-700"}`}>
                        {num}회
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{year}년</div>
                      {isRecent && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 mt-1.5">최신</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 과목별 출제빈도 */}
        {(() => {
          const freq = practice
            .filter((p) => p.frontmatter.title.includes("출제빈도"))
            .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
          return freq.length > 0 && (
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">과목별 출제빈도</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {freq.map((p) => {
                  const subjectMatch = p.frontmatter.title.match(/출제빈도[_\s-]*(.*)/);
                  const subjectName = subjectMatch ? subjectMatch[1] : p.frontmatter.title;
                  return (
                    <Link
                      key={p.slug}
                      href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                      className="block bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📈</span>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{subjectName}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">주제별 출제빈도 분석</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Quick Links */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">법령 해설</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {laws
            .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
            .map((l) => {
              const color = getSubjectColor(l.frontmatter.subject || "");
              return (
                <Link
                  key={l.slug}
                  href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-5"
                >
                  <h3 className="font-medium text-gray-900 text-sm">
                    {l.frontmatter.title}
                  </h3>
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1.5 ${color.bg} ${color.text}`}>
                    {l.frontmatter.subject}
                  </span>
                </Link>
              );
            })}
        </div>
      </main>

      <footer className="bg-gray-100 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs sm:text-sm text-gray-400">
          에듀랜드 위키 · 2026 최신교재 기반 · 22개년 기출문제 분석
        </div>
      </footer>
    </div>
  );
}
