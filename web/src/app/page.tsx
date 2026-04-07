import Link from "next/link";
import { getNavigation } from "@/lib/wiki";
import { getUrlSlug } from "@/lib/slugMap";

const SUBJECT_ORDER = [
  "부동산학개론",
  "민법및민사특별법",
  "공인중개사법령및중개실무",
  "부동산공법",
  "부동산공시법",
  "부동산세법",
];

const SUBJECT_LABELS: Record<string, string> = {
  부동산학개론: "부동산학개론",
  민법및민사특별법: "민법 및 민사특별법",
  공인중개사법령및중개실무: "공인중개사법령 및 중개실무",
  부동산공법: "부동산공법",
  부동산공시법: "부동산공시법",
  부동산세법: "부동산세법",
};

const EXAM_LABELS: Record<string, string> = {
  부동산학개론: "1차",
  민법및민사특별법: "1차",
  공인중개사법령및중개실무: "2차",
  부동산공법: "2차",
  부동산공시법: "2차",
  부동산세법: "2차",
};

export default function Home() {
  const { subjects, conceptsBySubject, laws, practice } = getNavigation();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold">공인중개사 시험 위키</h1>
          <p className="mt-3 text-blue-200 text-lg">
            에듀랜드 2026 기본서 기반 · 6과목 · 218개 페이지 · 22개년 기출 분석
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "개념 페이지", value: Object.values(conceptsBySubject).flat().length },
            { label: "법령 페이지", value: laws.length },
            { label: "기출 분석", value: practice.length },
            { label: "과목", value: subjects.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-5 text-center">
              <div className="text-3xl font-bold text-blue-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subjects Grid */}
        <h2 className="text-2xl font-bold mb-6">과목별 학습</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {SUBJECT_ORDER.map((subj) => {
            const page = subjects.find((s) => s.frontmatter.subject === subj || s.slug === `subjects/${subj}`);
            const conceptCount = conceptsBySubject[subj]?.length || 0;
            const lawCount = laws.filter((l) => l.frontmatter.subject === subj).length;
            return (
              <Link
                key={subj}
                href={`/wiki/${getUrlSlug(`subjects/${subj}`) || subj}/`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 mb-3">
                  {EXAM_LABELS[subj]}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
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
        <h2 className="text-2xl font-bold mb-6">기출 분석 · 출제 경향</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {practice
            .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
            .map((p) => (
              <Link
                key={p.slug}
                href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5"
              >
                <h3 className="font-medium text-gray-900 text-sm">
                  {p.frontmatter.title}
                </h3>
              </Link>
            ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-2xl font-bold mb-6">법령 해설</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laws
            .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
            .map((l) => (
              <Link
                key={l.slug}
                href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5"
              >
                <h3 className="font-medium text-gray-900 text-sm">
                  {l.frontmatter.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{l.frontmatter.subject}</p>
              </Link>
            ))}
        </div>
      </main>

      <footer className="bg-gray-100 border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-400">
          에듀랜드 2026 기본서 기반 · Karpathy LLM Wiki 패턴 적용
        </div>
      </footer>
    </div>
  );
}
