import Link from "next/link";
import { getNavigation } from "@/lib/wiki";
import { getUrlSlug } from "@/lib/slugMap";
import { SUBJECT_ORDER, SUBJECT_LABELS, EXAM_LABELS, SUBJECT_ICONS } from "@/lib/subjects";
import SearchWrapper from "./components/SearchWrapper";

export default function Home() {
  const { subjects, conceptsBySubject, laws, practice } = getNavigation();
  const totalConcepts = Object.values(conceptsBySubject).flat().length;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple Glass Navigation */}
      <nav className="apple-nav sticky top-0 z-50 h-12">
        <div className="max-w-[980px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="text-white text-sm font-medium tracking-tight">
            에듀랜드 위키
          </Link>
          <div className="flex items-center gap-5 text-white/80 text-xs">
            <span>1차 · 2차 전과목</span>
            <span>{totalConcepts + laws.length}개 페이지</span>
          </div>
        </div>
      </nav>

      {/* Hero Section — Apple Dark */}
      <section className="bg-black text-white">
        <div className="max-w-[980px] mx-auto px-4 py-20 sm:py-28 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            공인중개사 시험 위키
          </h1>
          <p className="mt-4 text-lg sm:text-xl font-normal text-white/80 leading-relaxed">
            2026 최신교재 기반 · 22개년 기출문제 분석
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="#subjects" className="apple-pill-outline-dark apple-pill">
              과목별 학습 →
            </Link>
            <a
              href="https://www.eduland.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-pill-filled apple-pill"
            >
              에듀랜드 인강
            </a>
          </div>
        </div>
      </section>

      {/* Search Section — Light */}
      <section className="bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-4 py-10">
          <SearchWrapper basePath="/real-estate-wiki" />
        </div>
      </section>

      {/* Subjects Grid — Light */}
      <section id="subjects" className="bg-[#f5f5f7] pb-16">
        <div className="max-w-[980px] mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] text-center tracking-tight mb-10">
            과목별 학습
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUBJECT_ORDER.map((subj) => {
              const icon = SUBJECT_ICONS[subj] || "📘";
              const conceptCount = conceptsBySubject[subj]?.length || 0;
              const lawCount = laws.filter((l) => l.frontmatter.subject === subj).length;
              return (
                <Link
                  key={subj}
                  href={`/wiki/${getUrlSlug(`subjects/${subj}`) || subj}/`}
                  className="apple-card block p-6 group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{icon}</span>
                    <span className="text-xs font-medium text-[#0071e3] tracking-wide uppercase">
                      {EXAM_LABELS[subj]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">
                    {SUBJECT_LABELS[subj]}
                  </h3>
                  <p className="text-sm text-[rgba(0,0,0,0.48)]">
                    개념 {conceptCount}개 · 법령 {lawCount}개
                  </p>
                  <div className="mt-4 text-sm text-[#0066cc] group-hover:underline">
                    학습하기 →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ad Banner — Dark */}
      <section className="bg-black">
        <div className="max-w-[980px] mx-auto px-4 py-12 text-center">
          <a
            href="https://www.eduland.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2997ff] text-lg font-medium hover:underline"
          >
            에듀랜드 공인중개사 인강 — 2026 합격 전략 무료 공개 중 →
          </a>
        </div>
      </section>

      {/* Practice Section — Light */}
      <section className="bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] text-center tracking-tight mb-10">
            기출 분석 · 출제 경향
          </h2>

          {/* 종합분석 */}
          {(() => {
            const overview = practice.filter(
              (p) => p.frontmatter.title.includes("종합") || p.frontmatter.title.includes("판례")
            );
            return (
              overview.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xs font-semibold text-[rgba(0,0,0,0.48)] uppercase tracking-widest mb-4">
                    종합 분석
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {overview.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                        className="apple-card block p-5 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📊</span>
                          <h4 className="font-medium text-[#1d1d1f] text-sm group-hover:text-[#0066cc] transition-colors">
                            {p.frontmatter.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            );
          })()}

          {/* 연도별 기출 */}
          {(() => {
            const exams = practice
              .filter((p) => p.frontmatter.title.includes("회") && p.frontmatter.title.includes("기출"))
              .sort((a, b) => b.frontmatter.title.localeCompare(a.frontmatter.title));
            return (
              exams.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xs font-semibold text-[rgba(0,0,0,0.48)] uppercase tracking-widest mb-4">
                    연도별 기출문제 분석
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                          className="apple-card block text-center p-4 group"
                        >
                          <div className={`text-xl font-semibold ${isRecent ? "text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                            {num}회
                          </div>
                          <div className="text-xs text-[rgba(0,0,0,0.48)] mt-1">{year}년</div>
                          {isRecent && (
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#0071e3] text-white font-medium mt-2">
                              최신
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            );
          })()}

          {/* 과목별 출제빈도 */}
          {(() => {
            const freq = practice
              .filter((p) => p.frontmatter.title.includes("출제빈도"))
              .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
            return (
              freq.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[rgba(0,0,0,0.48)] uppercase tracking-widest mb-4">
                    과목별 출제빈도
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {freq.map((p) => {
                      const subjectMatch = p.frontmatter.title.match(/출제빈도[_\s-]*(.*)/);
                      const subjectName = subjectMatch ? subjectMatch[1] : p.frontmatter.title;
                      return (
                        <Link
                          key={p.slug}
                          href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                          className="apple-card block p-5 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📈</span>
                            <div>
                              <h4 className="font-medium text-[#1d1d1f] text-sm group-hover:text-[#0066cc] transition-colors">
                                {subjectName}
                              </h4>
                              <p className="text-xs text-[rgba(0,0,0,0.48)] mt-0.5">주제별 출제빈도 분석</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            );
          })()}
        </div>
      </section>

      {/* Laws Section — Dark */}
      <section className="bg-black">
        <div className="max-w-[980px] mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center tracking-tight mb-10">
            법령 해설
          </h2>
          <div className="apple-card-dark divide-y divide-white/10 overflow-hidden rounded-xl">
            {laws
              .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
              .map((l) => (
                <Link
                  key={l.slug}
                  href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  <h3 className="font-medium text-white text-sm group-hover:text-[#2997ff] transition-colors">
                    {l.frontmatter.title}
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 shrink-0 ml-3">
                    {l.frontmatter.subject}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Footer — Apple style */}
      <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]">
        <div className="max-w-[980px] mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-[rgba(0,0,0,0.48)] tracking-[-0.08px]">
            에듀랜드 위키 · 공인중개사 시험 대비
          </span>
          <span className="text-xs text-[rgba(0,0,0,0.48)] tracking-[-0.08px]">
            2026 최신교재 기반 · 22개년 기출문제 분석
          </span>
        </div>
      </footer>
    </div>
  );
}
