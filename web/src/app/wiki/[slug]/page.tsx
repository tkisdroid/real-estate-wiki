import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug, renderMarkdown, getNavigation } from "@/lib/wiki";
import { getSlugMap, getWikiSlug, getUrlSlug } from "@/lib/slugMap";
import { getSubjectColor } from "@/lib/subjects";
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

  return (
    <>
      <Link href="/" className="sidebar-link text-sm text-blue-600 hover:underline mb-4 block">
        ← 홈으로
      </Link>

      {currentSubject && conceptsBySubject[currentSubject] && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
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
                      className={`sidebar-link block text-sm py-1.5 px-2 rounded ${
                        isActive
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {c.frontmatter.title}
                    </Link>
                    {children.length > 0 && (
                      <ul className="ml-3 border-l border-gray-200">
                        {children.map((ch) => (
                          <li key={ch.slug}>
                            <Link
                              href={`/wiki/${getUrlSlug(ch.slug) || ch.slug}/`}
                              className={`sidebar-link block text-xs py-1.5 px-2 ${
                                wikiSlug === ch.slug
                                  ? "text-blue-900 font-medium"
                                  : "text-gray-500 hover:text-gray-700"
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
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            법령
          </h3>
          <ul className="space-y-0.5">
            {laws
              .filter((l) => l.frontmatter.subject === currentSubject)
              .map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/wiki/${getUrlSlug(l.slug) || l.slug}/`}
                    className={`sidebar-link block text-sm py-1.5 px-2 rounded ${
                      wikiSlug === l.slug
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
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
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            기출 분석
          </h3>
          <ul className="space-y-0.5">
            {practice.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/wiki/${getUrlSlug(p.slug) || p.slug}/`}
                  className={`sidebar-link block text-sm py-1.5 px-2 rounded ${
                    wikiSlug === p.slug
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
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

  // Style OX quiz items
  enhanced = enhanced.replace(
    /<p><strong>(Q\d+\.)<\/strong>\s*(.*?)\s*→\s*<strong>(O|X)<\/strong>\s*\((.*?)\)<\/p>/g,
    (_, qNum, question, answer, explanation) => {
      const answerClass = answer === "O" ? "answer-o" : "answer-x";
      return `<div class="ox-quiz-item"><strong>${qNum}</strong> ${question} → <span class="${answerClass}">${answer}</span> <span class="text-gray-500">(${explanation})</span></div>`;
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
    ? "bg-red-100 text-red-800"
    : importance === "medium"
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

  const subjectColor = getSubjectColor(page.frontmatter.subject || "");

  const subjectUrlSlug = page.frontmatter.subject
    ? getUrlSlug(`subjects/${page.frontmatter.subject}`)
    : undefined;
  const parentUrlSlug = page.frontmatter.parent
    ? getUrlSlug(`concepts/${page.frontmatter.parent.replace(/\s/g, "")}`)
    : undefined;

  return (
    <div className="min-h-screen">
      {/* Header with subject color */}
      <header className={`text-white ${subjectColor.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold hover:text-white/80">
            공인중개사 위키
          </Link>
          <span className="text-white/50">·</span>
          <span className="text-white/80 text-sm">{page.frontmatter.subject}</span>
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
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 overflow-x-auto">
            <Link href="/" className="hover:text-gray-600 shrink-0">홈</Link>
            <span className="shrink-0">/</span>
            {page.frontmatter.subject && subjectUrlSlug && (
              <>
                <Link
                  href={`/wiki/${subjectUrlSlug}/`}
                  className="hover:text-gray-600 shrink-0"
                >
                  {page.frontmatter.subject}
                </Link>
                <span className="shrink-0">/</span>
              </>
            )}
            {page.frontmatter.parent && parentUrlSlug && (
              <>
                <Link
                  href={`/wiki/${parentUrlSlug}/`}
                  className="hover:text-gray-600 shrink-0"
                >
                  {page.frontmatter.parent}
                </Link>
                <span className="shrink-0">/</span>
              </>
            )}
            <span className="text-gray-600 truncate">{page.frontmatter.title}</span>
          </div>

          {/* Meta badges + Bookmark */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {page.frontmatter.subject && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${subjectColor.bg} ${subjectColor.text}`}>
                {page.frontmatter.subject}
              </span>
            )}
            {importance && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${importanceBadge}`}>
                {importance === "high" ? "중요" : importance === "medium" ? "보통" : "낮음"}
              </span>
            )}
            {page.frontmatter.tags?.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
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
              prose-headings:text-gray-900 prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:border-gray-200
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:bg-gray-50
              prose-strong:text-gray-900
              prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm
              prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900 prose-blockquote:py-1
              prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Interactive OX Quiz */}
          <OXQuizInteractive pageSlug={urlSlug} basePath="/real-estate-wiki" />
        </article>
      </div>
    </div>
  );
}
