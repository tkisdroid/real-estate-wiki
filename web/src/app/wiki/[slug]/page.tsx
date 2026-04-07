import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug, renderMarkdown, getNavigation } from "@/lib/wiki";
import { getSlugMap, getWikiSlug, getUrlSlug } from "@/lib/slugMap";
import { getSubjectColor, SUBJECT_ICONS } from "@/lib/subjects";
import MobileSidebar from "../../components/MobileSidebar";
import BookmarkButton from "../../components/BookmarkButton";
import OXQuizInteractive from "../../components/OXQuizInteractive";
import PageTracker from "../../components/PageTracker";

export function generateStaticParams() {
  return getSlugMap().map((entry) => ({
    slug: entry.urlSlug,
  }));
}

function SidebarContent({ wikiSlug }: { wikiSlug: string }) {
  const { conceptsBySubject, laws, practice } = getNavigation();
  const currentPage = getPageBySlug(wikiSlug);
  const currentSubject = currentPage?.frontmatter.subject;
  const currentCategory = wikiSlug.split("/")[0];
  const subjectColor = getSubjectColor(currentSubject || "");

  return (
    <>
      <Link href="/" className="sidebar-link text-sm text-slate-500 hover:text-[#1e293b] transition-colors mb-5 flex items-center gap-1.5 group">
        <span className="text-xs group-hover:-translate-x-0.5 transition-transform">←</span>
        <span>홈으로</span>
      </Link>

      {currentSubject && conceptsBySubject[currentSubject] && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-2">
            개념
          </h3>
          <ul className="space-y-0.5">
            {conceptsBySubject[currentSubject]
              .filter((c) => !c.frontmatter.parent)
              .map((c) => {
                const isActive = wikiSlug === c.slug;
                const children = conceptsBySubject[currentSubject].filter(
                  (ch) => ch.frontmatter.parent === c.frontmatter.title
                );
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/wiki/${getUrlSlug(c.slug) || c.slug}/`}
                      className={`sidebar-link block text-sm py-1.5 px-2.5 rounded-lg transition-all ${
                        isActive
                          ? `${subjectColor.accent} ${subjectColor.text} font-medium border-l-2 ${subjectColor.accentBorder}`
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      {c.frontmatter.title}
                    </Link>
                    {children.length > 0 && (
                      <ul className="ml-3 border-l border-slate-100 pl-0.5">
                        {children.map((ch) => (
                          <li key={ch.slug}>
                            <Link
                              href={`/wiki/${getUrlSlug(ch.slug) || ch.slug}/`}
                              className={`sidebar-link block text-xs py-1.5 px-2.5 rounded-lg transition-all ${
                                wikiSlug === ch.slug
                                  ? `${subjectColor.text} font-medium`
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {ch.frontmatter.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {currentSubject && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-2">
            법령
          </h3>
          <ul className="space-y-0.5">
            {laws
              .filter((l) => l.frontmatter.subject === currentSubject)
              .map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                    className={`sidebar-link block text-sm py-1.5 px-2.5 rounded-lg transition-all ${
                      wikiSlug === l.slug
                        ? `${subjectColor.accent} ${subjectColor.text} font-medium border-l-2 ${subjectColor.accentBorder}`
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {l.frontmatter.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}

      {currentCategory === "practice" && (
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-2">
            기출 분석
          </h3>
          <ul className="space-y-0.5">
            {practice.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                  className={`sidebar-link block text-sm py-1.5 px-2.5 rounded-lg transition-all ${
                    wikiSlug === p.slug
                      ? "bg-indigo-50 text-indigo-700 font-medium border-l-2 border-l-indigo-400"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {p.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function enhanceHtml(html: string): string {
  // Highlight trap notes (lines starting with ⚠️)
  let enhanced = html.replace(
    /<p>⚠️\s*(.*?)<\/p>/g,
    '<div class="trap-note">⚠️ $1</div>'
  );

  // Style OX quiz items — with explanation (greedy match for nested parens)
  enhanced = enhanced.replace(
    /<p><strong>(Q\d+\.)<\/strong>\s*(.*?)\s*→\s*<strong>(O|X)<\/strong>\s*\((.+)\)<\/p>/g,
    (_, qNum, question, answer, explanation) => {
      const answerClass = answer === "O" ? "answer-o" : "answer-x";
      return `<div class="ox-quiz-item"><strong>${qNum}</strong> ${question} → <span class="${answerClass}">${answer}</span> <span class="text-gray-500">(${explanation})</span></div>`;
    }
  );

  // Style OX quiz items — without explanation
  enhanced = enhanced.replace(
    /<p><strong>(Q\d+\.)<\/strong>\s*(.*?)\s*→\s*<strong>(O|X)<\/strong><\/p>/g,
    (_, qNum, question, answer) => {
      const answerClass = answer === "O" ? "answer-o" : "answer-x";
      return `<div class="ox-quiz-item"><strong>${qNum}</strong> ${question} → <span class="${answerClass}">${answer}</span></div>`;
    }
  );

  return enhanced;
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: urlSlug } = await params;

  const wikiSlug = getWikiSlug(urlSlug);
  if (!wikiSlug) notFound();

  const page = getPageBySlug(wikiSlug);
  if (!page) notFound();

  let renderedHtml = await renderMarkdown(page.content, "/real-estate-wiki");
  renderedHtml = enhanceHtml(renderedHtml);

  const importance = page.frontmatter.importance;
  const importanceBadge = importance === "high"
    ? "bg-rose-50 text-rose-700 border border-rose-200"
    : importance === "medium"
    ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-slate-50 text-slate-500 border border-slate-200";

  const subjectColor = getSubjectColor(page.frontmatter.subject || "");
  const subjectIcon = SUBJECT_ICONS[page.frontmatter.subject || ""] || "📘";

  const subjectUrlSlug = page.frontmatter.subject
    ? getUrlSlug(`subjects/${page.frontmatter.subject}`)
    : undefined;
  const parentUrlSlug = page.frontmatter.parent
    ? getUrlSlug(`concepts/${page.frontmatter.parent.replace(/\s/g, "")}`)
    : undefined;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header with subject color accent */}
      <header className="bg-[#1e293b] relative">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${subjectColor.gradientFrom} ${subjectColor.gradientTo}`} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-white/90 hover:text-white transition-colors tracking-tight">
            에듀랜드 위키
          </Link>
          {page.frontmatter.subject && (
            <>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{subjectIcon}</span>
                <span className="text-white/60 text-sm">{page.frontmatter.subject}</span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-8">
        {/* Desktop sidebar */}
        <nav className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-4">
            <SidebarContent wikiSlug={wikiSlug} />
          </div>
        </nav>

        {/* Mobile sidebar */}
        <MobileSidebar>
          <SidebarContent wikiSlug={wikiSlug} />
        </MobileSidebar>

        <article className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-5 overflow-x-auto">
            <Link href="/" className="hover:text-slate-600 transition-colors shrink-0">홈</Link>
            <span className="shrink-0 text-slate-300">›</span>
            {page.frontmatter.subject && subjectUrlSlug && (
              <>
                <Link
                  href={`/wiki/${subjectUrlSlug}/`}
                  className="hover:text-slate-600 transition-colors shrink-0"
                >
                  {page.frontmatter.subject}
                </Link>
                <span className="shrink-0 text-slate-300">›</span>
              </>
            )}
            {page.frontmatter.parent && parentUrlSlug && (
              <>
                <Link
                  href={`/wiki/${parentUrlSlug}/`}
                  className="hover:text-slate-600 transition-colors shrink-0"
                >
                  {page.frontmatter.parent}
                </Link>
                <span className="shrink-0 text-slate-300">›</span>
              </>
            )}
            <span className="text-slate-600 truncate">{page.frontmatter.title}</span>
          </div>

          {/* Meta badges + Bookmark */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {page.frontmatter.subject && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${subjectColor.accent} ${subjectColor.text}`}>
                {subjectIcon} {page.frontmatter.subject}
              </span>
            )}
            {importance && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${importanceBadge}`}>
                {importance === "high" ? "⭐ 중요" : importance === "medium" ? "보통" : "낮음"}
              </span>
            )}
            {page.frontmatter.tags?.map((tag) => (
              <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {tag}
              </span>
            ))}
            <BookmarkButton pageSlug={urlSlug} title={page.frontmatter.title} />
          </div>

          {/* Page visit tracker */}
          <PageTracker pageSlug={urlSlug} />

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-[#1e293b] prose-headings:tracking-tight
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-bold
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:pb-3 prose-h2:border-slate-200 prose-h2:font-bold
              prose-h3:text-lg prose-h3:font-semibold
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-table:text-sm prose-th:bg-gray-50
              prose-strong:text-[#1e293b]
              prose-code:bg-slate-100 prose-code:text-slate-700 prose-code:px-1.5 prose-code:rounded prose-code:text-sm prose-code:border prose-code:border-slate-200
              prose-pre:bg-[#1e293b] prose-pre:text-slate-200 prose-pre:rounded-xl prose-pre:p-5 prose-pre:overflow-x-auto
              prose-blockquote:border-l-indigo-300 prose-blockquote:bg-indigo-50/50 prose-blockquote:text-indigo-900 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
              prose-li:my-0.5 prose-li:text-slate-600"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Interactive OX Quiz */}
          <OXQuizInteractive pageSlug={urlSlug} basePath="/real-estate-wiki" />
        </article>
      </div>
    </div>
  );
}
