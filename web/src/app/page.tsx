import Link from "next/link";
import { getNavigation } from "@/lib/wiki";
import { getUrlSlug } from "@/lib/slugMap";
import { SUBJECT_ORDER, SUBJECT_LABELS, EXAM_LABELS, getSubjectColor } from "@/lib/subjects";
import SearchFilter from "./components/SearchFilter";

export default function Home() {
  const { subjects, conceptsBySubject, laws, practice } = getNavigation();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold">공인중개사 시험 위키</h1>
          <p className="mt-3 text-blue-200 text-sm sm:text-lg">
            에듀랜드 2026 기본서 기반 · 6과목 · 218개 페이지 · 22개년 기출 분석
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search & Filter */}
        <SearchFilter basePath="/real-estate-wiki" />

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

        {/* Practice Section */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">기출 분석 · 출제 경향</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-12">
          {practice
            .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
            .map((p) => (
              <Link
                key={p.slug}
                href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-5"
              >
                <h3 className="font-medium text-gray-900 text-sm">
                  {p.frontmatter.title}
                </h3>
              </Link>
            ))}
        </div>

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
          에듀랜드 2026 기본서 기반 · Karpathy LLM Wiki 패턴 적용
        </div>
      </footer>
    </div>
  );
}
