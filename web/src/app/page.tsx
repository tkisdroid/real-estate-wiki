import Link from "next/link";
import { getNavigation } from "@/lib/wiki";
import { getUrlSlug } from "@/lib/slugMap";
import { SUBJECT_ORDER, SUBJECT_LABELS, EXAM_LABELS, SUBJECT_ICONS, getSubjectColor } from "@/lib/subjects";
import SearchWrapper from "./components/SearchWrapper";
import MyBookmarks from "./components/MyBookmarks";

export default function Home() {
  const { subjects, conceptsBySubject, laws, practice } = getNavigation();

  const totalConcepts = Object.values(conceptsBySubject).flat().length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Ad Banner Slot */}
      <div id="ad-banner" className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-center py-2.5 px-4 text-sm font-medium">
        <a href="https://www.eduland.or.kr" target="_blank" rel="noopener noreferrer" className="hover:underline">
          에듀랜드 공인중개사 인강 — 2026 합격 전략 무료 공개 중
        </a>
      </div>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#312e81]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgY3g9IjIwIiBjeT0iMjAiIHI9IjEiLz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                공인중개사 시험 위키
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-300 font-medium">
                by 에듀랜드
              </p>
              <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-md leading-relaxed">
                2026 최신교재 기반 · 22개년 기출문제 분석
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                1차 · 2차 전과목
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span>237개 페이지</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search & Filter */}
        <div className="mb-10">
          <SearchWrapper basePath="/real-estate-wiki" />
        </div>

        {/* My Bookmarks */}
        <MyBookmarks basePath="/real-estate-wiki" />

        {/* Subjects Grid */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">과목별 학습</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{subjects.length}과목</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {SUBJECT_ORDER.map((subj) => {
              const color = getSubjectColor(subj);
              const icon = SUBJECT_ICONS[subj] || "📘";
              const conceptCount = conceptsBySubject[subj]?.length || 0;
              const lawCount = laws.filter((l) => l.frontmatter.subject === subj).length;
              const totalItems = conceptCount + lawCount;
              return (
                <Link
                  key={subj}
                  href={`/wiki/${getUrlSlug(`subjects/${subj}`) || subj}/`}
                  className={`card-hover block rounded-xl bg-white border ${color.border} p-5 sm:p-6 border-l-4 ${color.accentBorder} relative overflow-hidden group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${color.accent} ${color.text} tracking-wider`}>
                          {EXAM_LABELS[subj]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#1e293b] mb-2">
                    {SUBJECT_LABELS[subj]}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    개념 {conceptCount}개 · 법령 {lawCount}개
                  </p>
                  {/* Progress-like bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color.gradientFrom} ${color.gradientTo} opacity-60`}
                      style={{ width: `${Math.min(100, (totalItems / Math.max(totalConcepts * 0.3, 1)) * 100)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Image Ad Banner */}
        <section className="mb-10">
          <a href="https://www.eduland.or.kr" target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
            {/* 광고 이미지: public/images/ad-banner.jpg (권장 사이즈: 1200x200 또는 1200x300) */}
            <img
              src="/real-estate-wiki/images/ad-banner.jpg"
              alt="에듀랜드 공인중개사 인강"
              className="w-full h-auto object-cover"
            />
          </a>
        </section>

        {/* Practice Section */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">기출 분석 · 출제 경향</h2>
          </div>

          {/* 종합분석 */}
          {(() => {
            const overview = practice.filter((p) => p.frontmatter.title.includes("종합") || p.frontmatter.title.includes("판례"));
            return overview.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  종합 분석
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {overview.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                      className="card-hover block bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-xl p-4 sm:p-5 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <h4 className="font-medium text-[#1e293b] text-sm group-hover:text-indigo-700 transition-colors">{p.frontmatter.title}</h4>
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
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  연도별 기출문제 분석
                </h3>
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
                        className={`card-hover block rounded-xl border text-center p-3 sm:p-4 ${
                          isRecent
                            ? "bg-gradient-to-b from-amber-50 to-white border-amber-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className={`text-lg sm:text-xl font-bold ${isRecent ? "text-amber-700" : "text-slate-600"}`}>
                          {num}회
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{year}년</div>
                        {isRecent && (
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium mt-1.5">최신</span>
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
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  과목별 출제빈도
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {freq.map((p) => {
                    const subjectMatch = p.frontmatter.title.match(/출제빈도[_\s-]*(.*)/);
                    const subjectName = subjectMatch ? subjectMatch[1] : p.frontmatter.title;
                    return (
                      <Link
                        key={p.slug}
                        href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                        className="card-hover block bg-white rounded-xl border border-slate-200 p-4 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-sm">📈</div>
                          <div>
                            <h4 className="font-medium text-[#1e293b] text-sm group-hover:text-violet-700 transition-colors">{subjectName}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">주제별 출제빈도 분석</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>

        {/* Laws Section */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">법령 해설</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{laws.length}건</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {laws
              .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
              .map((l) => {
                const color = getSubjectColor(l.frontmatter.subject || "");
                return (
                  <Link
                    key={l.slug}
                    href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <h3 className="font-medium text-[#1e293b] text-sm group-hover:text-indigo-700 transition-colors">
                      {l.frontmatter.title}
                    </h3>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${color.accent} ${color.text} shrink-0 ml-3`}>
                      {l.frontmatter.subject}
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-slate-400">에듀랜드 위키 · 공인중개사 시험 대비</span>
          <span className="text-xs text-slate-300">2026 최신교재 기반 · 22개년 기출문제 분석</span>
        </div>
      </footer>
    </div>
  );
}
