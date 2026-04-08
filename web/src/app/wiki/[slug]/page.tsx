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

function TocLink({ slug, label, wikiSlug, depth }: { slug: string; label: string; wikiSlug: string; depth: number }) {
  const urlSlug = getUrlSlug(slug);
  const isActive = wikiSlug === slug;
  const page = getPageBySlug(wikiSlug);
  const subjectColor = getSubjectColor(page?.frontmatter.subject || "");

  const baseClass = depth === 0
    ? "text-[13px] py-1.5 px-2.5"
    : depth === 1
    ? "text-[13px] py-1.5 px-2.5"
    : "text-[12px] py-1 px-2.5";

  return (
    <Link
      href={`/wiki/${urlSlug || slug}/`}
      className={`sidebar-link block rounded-md transition-all ${baseClass} ${
        isActive
          ? `${subjectColor.accent} ${subjectColor.text} font-semibold border-l-2 ${subjectColor.accentBorder}`
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

function SidebarContent({ wikiSlug }: { wikiSlug: string }) {
  const { practice } = getNavigation();
  const currentPage = getPageBySlug(wikiSlug);
  const currentSubject = currentPage?.frontmatter.subject;
  const currentCategory = wikiSlug.split("/")[0];

  // Use textbook TOC structure
  const { TOC } = require("@/lib/tocStructure");
  const toc = currentSubject ? TOC[currentSubject] : null;

  return (
    <>
      <Link href="/" className="sidebar-link text-sm text-slate-500 hover:text-[#1e293b] transition-colors mb-5 flex items-center gap-1.5 group">
        <span className="text-xs group-hover:-translate-x-0.5 transition-transform">←</span>
        <span>홈으로</span>
      </Link>

      {toc && toc.map((section: { label: string; slug?: string; children?: Array<{ label: string; slug?: string; children?: Array<{ label: string; slug?: string }> }> }, si: number) => (
        <div key={si} className="mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">
            {section.label}
          </h3>
          {section.slug && !section.children && (
            <TocLink slug={section.slug} label={section.label.replace(/^PART \d+ · /, "")} wikiSlug={wikiSlug} depth={0} />
          )}
          {section.children && (
            <ul className="space-y-px">
              {section.children.map((item, ii) => (
                <li key={ii}>
                  {item.slug ? (
                    <TocLink slug={item.slug} label={item.label} wikiSlug={wikiSlug} depth={1} />
                  ) : (
                    <span className="block text-[13px] py-1.5 px-2.5 text-slate-500">{item.label}</span>
                  )}
                  {item.children && (
                    <ul className="ml-3 border-l border-slate-100">
                      {item.children.map((child, ci) => (
                        <li key={ci}>
                          {child.slug ? (
                            <TocLink slug={child.slug} label={child.label} wikiSlug={wikiSlug} depth={2} />
                          ) : (
                            <span className="block text-[12px] py-1 px-2.5 text-slate-400">{child.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {currentCategory === "practice" && (
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-2">
            기출 분석
          </h3>
          <ul className="space-y-px">
            {practice.map((p) => (
              <li key={p.slug}>
                <TocLink slug={p.slug} label={p.frontmatter.title} wikiSlug={wikiSlug} depth={1} />
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

  // Wrap tables in scrollable container for mobile
  enhanced = enhanced.replace(
    /<table>/g,
    '<div class="table-scroll-wrapper"><table>'
  );
  enhanced = enhanced.replace(
    /<\/table>/g,
    '</table></div>'
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
              prose-p:text-slate-600 prose-p:leading-[1.8]
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-table:text-sm prose-th:bg-gray-50
              prose-strong:text-[#1e293b]
              prose-code:bg-slate-100 prose-code:text-slate-700 prose-code:px-1.5 prose-code:rounded prose-code:text-sm prose-code:border prose-code:border-slate-200
              prose-pre:bg-[#1e293b] prose-pre:text-slate-200 prose-pre:rounded-xl prose-pre:p-5 prose-pre:overflow-x-auto
              prose-blockquote:border-l-indigo-300 prose-blockquote:bg-indigo-50/50 prose-blockquote:text-indigo-900 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
              prose-li:my-0.5 prose-li:text-slate-600 prose-li:leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Interactive OX Quiz */}
          <OXQuizInteractive pageSlug={urlSlug} basePath="/real-estate-wiki" />
        </article>
      </div>
    </div>
  );
}
