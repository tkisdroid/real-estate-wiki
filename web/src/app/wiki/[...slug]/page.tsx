import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPages, getPageBySlug, renderMarkdown, getNavigation } from "@/lib/wiki";

export function generateStaticParams() {
  const pages = getAllPages();
  return pages.map((p) => ({
    slug: p.slug.split("/"),
  }));
}

function Sidebar({ currentSlug }: { currentSlug: string }) {
  const { conceptsBySubject, laws, practice } = getNavigation();
  const currentPage = getPageBySlug(currentSlug);
  const currentSubject = currentPage?.frontmatter.subject;

  // Show concepts for current subject, or all laws/practice
  const currentCategory = currentSlug.split("/")[0];

  return (
    <nav className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 block">
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
                  const isActive = currentSlug === c.slug;
                  const children = conceptsBySubject[currentSubject].filter(
                    (ch) => ch.frontmatter.parent === c.frontmatter.title
                  );
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`/wiki/${c.slug}`}
                        className={`block text-sm py-1 px-2 rounded ${
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
                                href={`/wiki/${ch.slug}`}
                                className={`block text-xs py-0.5 px-2 ${
                                  currentSlug === ch.slug
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
                      href={`/wiki/${l.slug}`}
                      className={`block text-sm py-1 px-2 rounded ${
                        currentSlug === l.slug
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
                    href={`/wiki/${p.slug}`}
                    className={`block text-sm py-1 px-2 rounded ${
                      currentSlug === p.slug
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
      </div>
    </nav>
  );
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = getPageBySlug(slugStr);

  if (!page) notFound();

  const html = await renderMarkdown(page.content);

  const importance = page.frontmatter.importance;
  const importanceBadge = importance === "high"
    ? "bg-red-100 text-red-800"
    : importance === "medium"
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen">
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold hover:text-blue-200">
            공인중개사 위키
          </Link>
          <span className="text-blue-300">·</span>
          <span className="text-blue-200 text-sm">{page.frontmatter.subject}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        <Sidebar currentSlug={slugStr} />

        <article className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">홈</Link>
            <span>/</span>
            {page.frontmatter.subject && (
              <>
                <Link
                  href={`/wiki/subjects/${page.frontmatter.subject}`}
                  className="hover:text-gray-600"
                >
                  {page.frontmatter.subject}
                </Link>
                <span>/</span>
              </>
            )}
            {page.frontmatter.parent && (
              <>
                <Link
                  href={`/wiki/concepts/${page.frontmatter.parent.replace(/\s/g, "")}`}
                  className="hover:text-gray-600"
                >
                  {page.frontmatter.parent}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-600">{page.frontmatter.title}</span>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-6">
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
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:border-gray-200
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:bg-gray-50
              prose-strong:text-gray-900
              prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm
              prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900 prose-blockquote:py-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
    </div>
  );
}
