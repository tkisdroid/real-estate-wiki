import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug, renderMarkdown, getNavigation } from "@/lib/wiki";
import { getSlugMap, getWikiSlug, getUrlSlug } from "@/lib/slugMap";
import { SUBJECT_ICONS } from "@/lib/subjects";
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

  const baseClass = depth === 0
    ? "text-[13px] py-1.5 px-3"
    : depth === 1
    ? "text-[13px] py-1.5 px-3"
    : "text-[12px] py-1 px-3";

  return (
    <Link
      href={`/wiki/${urlSlug || slug}/`}
      className={`sidebar-link block rounded-lg transition-all ${baseClass} ${
        isActive
          ? "bg-[#0071e3] text-white font-medium"
          : "text-[rgba(0,0,0,0.8)] hover:bg-[#f5f5f7]"
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

  const { TOC } = require("@/lib/tocStructure");
  const toc = currentSubject ? TOC[currentSubject] : null;

  return (
    <>
      <Link href="/" className="sidebar-link text-sm text-[#0066cc] hover:underline transition-colors mb-5 flex items-center gap-1.5">
        <span className="text-xs">←</span>
        <span>홈으로</span>
      </Link>

      {toc && toc.map((section: { label: string; slug?: string; children?: Array<{ label: string; slug?: string; children?: Array<{ label: string; slug?: string }> }> }, si: number) => (
        <div key={si} className="mb-5">
          <h3 className="text-[10px] font-semibold text-[rgba(0,0,0,0.48)] uppercase tracking-widest mb-1.5 px-3">
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
                    <span className="block text-[13px] py-1.5 px-3 text-[rgba(0,0,0,0.48)]">{item.label}</span>
                  )}
                  {item.children && (
                    <ul className="ml-3 border-l border-[#d2d2d7]">
                      {item.children.map((child, ci) => (
                        <li key={ci}>
                          {child.slug ? (
                            <TocLink slug={child.slug} label={child.label} wikiSlug={wikiSlug} depth={2} />
                          ) : (
                            <span className="block text-[12px] py-1 px-3 text-[rgba(0,0,0,0.48)]">{child.label}</span>
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
          <h3 className="text-[10px] font-semibold text-[rgba(0,0,0,0.48)] uppercase tracking-widest mb-2.5 px-3">
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
  let enhanced = html.replace(
    /<p>⚠️\s*(.*?)<\/p>/g,
    '<div class="trap-note">⚠️ $1</div>'
  );

  enhanced = enhanced.replace(
    /<p><strong>(Q\d+\.)<\/strong>\s*(.*?)\s*→\s*<strong>(O|X)<\/strong>\s*\((.+)\)<\/p>/g,
    (_, qNum, question, answer, explanation) => {
      const answerClass = answer === "O" ? "answer-o" : "answer-x";
      return `<div class="ox-quiz-item"><strong>${qNum}</strong> ${question} → <span class="${answerClass}">${answer}</span> <span style="color:rgba(0,0,0,0.48)">(${explanation})</span></div>`;
    }
  );

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
  const subjectIcon = SUBJECT_ICONS[page.frontmatter.subject || ""] || "📘";

  const subjectUrlSlug = page.frontmatter.subject
    ? getUrlSlug(`subjects/${page.frontmatter.subject}`)
    : undefined;
  const parentUrlSlug = page.frontmatter.parent
    ? getUrlSlug(`concepts/${page.frontmatter.parent.replace(/\s/g, "")}`)
    : undefined;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple Glass Navigation */}
      <nav className="apple-nav sticky top-0 z-50 h-12">
        <div className="max-w-[980px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="text-white text-sm font-medium tracking-tight">
            에듀랜드 위키
          </Link>
          {page.frontmatter.subject && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{subjectIcon}</span>
              <span className="text-white/60 text-xs">{page.frontmatter.subject}</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 py-6 lg:py-8 flex gap-8">
        {/* Desktop sidebar */}
        <nav className="w-60 shrink-0 hidden lg:block">
          <div className="sticky top-[72px] max-h-[calc(100vh-5rem)] overflow-y-auto pr-2">
            <SidebarContent wikiSlug={wikiSlug} />
          </div>
        </nav>

        {/* Mobile sidebar */}
        <MobileSidebar>
          <SidebarContent wikiSlug={wikiSlug} />
        </MobileSidebar>

        <article className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-[rgba(0,0,0,0.48)] mb-5 overflow-x-auto tracking-[-0.224px]">
            <Link href="/" className="hover:text-[#0066cc] transition-colors shrink-0">홈</Link>
            <span className="shrink-0">›</span>
            {page.frontmatter.subject && subjectUrlSlug && (
              <>
                <Link href={`/wiki/${subjectUrlSlug}/`} className="hover:text-[#0066cc] transition-colors shrink-0">
                  {page.frontmatter.subject}
                </Link>
                <span className="shrink-0">›</span>
              </>
            )}
            {page.frontmatter.parent && parentUrlSlug && (
              <>
                <Link href={`/wiki/${parentUrlSlug}/`} className="hover:text-[#0066cc] transition-colors shrink-0">
                  {page.frontmatter.parent}
                </Link>
                <span className="shrink-0">›</span>
              </>
            )}
            <span className="text-[#1d1d1f] truncate">{page.frontmatter.title}</span>
          </div>

          {/* Meta badges + Bookmark */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {page.frontmatter.subject && (
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-[#f5f5f7] text-[#1d1d1f]">
                {subjectIcon} {page.frontmatter.subject}
              </span>
            )}
            {importance && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                importance === "high"
                  ? "bg-[#0071e3] text-white"
                  : importance === "medium"
                  ? "bg-[#f5f5f7] text-[rgba(0,0,0,0.8)]"
                  : "bg-[#f5f5f7] text-[rgba(0,0,0,0.48)]"
              }`}>
                {importance === "high" ? "⭐ 중요" : importance === "medium" ? "보통" : "낮음"}
              </span>
            )}
            {page.frontmatter.tags?.map((tag) => (
              <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[rgba(0,0,0,0.48)]">
                {tag}
              </span>
            ))}
            <BookmarkButton pageSlug={urlSlug} title={page.frontmatter.title} />
          </div>

          <PageTracker pageSlug={urlSlug} />

          {/* Content — Apple typography */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-[#1d1d1f] prose-headings:tracking-tight
              prose-h1:text-2xl sm:prose-h1:text-[28px] prose-h1:font-semibold prose-h1:leading-[1.14]
              prose-h2:text-xl sm:prose-h2:text-[24px] prose-h2:border-b prose-h2:pb-3 prose-h2:border-[#d2d2d7] prose-h2:font-semibold prose-h2:leading-[1.10]
              prose-h3:text-lg prose-h3:font-semibold prose-h3:leading-[1.19]
              prose-p:text-[rgba(0,0,0,0.8)] prose-p:leading-[1.47] prose-p:tracking-[-0.374px]
              prose-a:text-[#0066cc] prose-a:no-underline hover:prose-a:underline prose-a:font-normal
              prose-table:text-sm
              prose-strong:text-[#1d1d1f]
              prose-code:bg-[#f5f5f7] prose-code:text-[#1d1d1f] prose-code:px-1.5 prose-code:rounded-[5px] prose-code:text-sm prose-code:border-none
              prose-pre:bg-[#1d1d1f] prose-pre:text-[#e5e5ea] prose-pre:rounded-xl prose-pre:p-5
              prose-blockquote:border-l-[#0071e3] prose-blockquote:bg-white prose-blockquote:text-[#1d1d1f] prose-blockquote:py-1 prose-blockquote:rounded-r-lg
              prose-li:my-0.5 prose-li:text-[rgba(0,0,0,0.8)] prose-li:leading-[1.47] prose-li:tracking-[-0.374px]"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          <OXQuizInteractive pageSlug={urlSlug} basePath="/real-estate-wiki" />
        </article>
      </div>
    </div>
  );
}
