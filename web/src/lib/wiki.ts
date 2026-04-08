import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";

// In dev: ../wiki, in Vercel build: ./wiki-data (copied by prebuild script)
const WIKI_DIR = fs.existsSync(path.join(process.cwd(), "wiki-data"))
  ? path.join(process.cwd(), "wiki-data")
  : path.join(process.cwd(), "..", "wiki");

export interface WikiPage {
  slug: string;
  category: string;
  frontmatter: {
    title: string;
    category?: string;
    subject?: string;
    parent?: string;
    tags?: string[];
    importance?: string;
    [key: string]: unknown;
  };
  content: string;
}

export interface WikiPageWithHtml extends WikiPage {
  html: string;
}

function getAllMdFiles(dir: string, base: string = ""): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".md") && entry.name !== "log.md") {
      files.push(rel);
    }
  }
  return files;
}

export function getAllPages(): WikiPage[] {
  const files = getAllMdFiles(WIKI_DIR);
  return files.map((file) => {
    const fullPath = path.join(WIKI_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
    const category = slug.split("/")[0] || "root";
    return {
      slug,
      category,
      frontmatter: data as WikiPage["frontmatter"],
      content,
    };
  });
}

export function getPageBySlug(slug: string): WikiPage | null {
  const filePath = path.join(WIKI_DIR, slug + ".md");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const category = slug.split("/")[0] || "root";
  return {
    slug,
    category,
    frontmatter: data as WikiPage["frontmatter"],
    content,
  };
}

export async function renderMarkdown(content: string, basePath: string = ""): Promise<string> {
  // Lazy-import to avoid circular dependency at module level
  const { getUrlSlug } = await import("./slugMap");

  const CATEGORIES = ["concepts", "laws", "subjects", "practice"];

  // Convert [[wiki-links]] to HTML links using URL-safe slugs
  const withLinks = content.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
    (_, target, label) => {
      const wikiSlug = target.replace(/\s/g, "").replace(/\\+$/, "");
      // Try direct lookup first (e.g. "concepts/물권변동")
      let urlSlug = getUrlSlug(wikiSlug);
      // If not found, try prefixing with each category
      if (!urlSlug) {
        for (const cat of CATEGORIES) {
          urlSlug = getUrlSlug(`${cat}/${wikiSlug}`);
          if (urlSlug) break;
        }
      }
      // Handle anchor links (e.g. 법령명#조항)
      if (!urlSlug && wikiSlug.includes("#")) {
        const baseSlug = wikiSlug.split("#")[0];
        urlSlug = getUrlSlug(baseSlug);
        if (!urlSlug) {
          for (const cat of CATEGORIES) {
            urlSlug = getUrlSlug(`${cat}/${baseSlug}`);
            if (urlSlug) break;
          }
        }
      }
      const text = label || target.split("/").pop() || target;
      if (urlSlug) {
        const href = `${basePath}/wiki/${urlSlug}/`;
        return `<a href="${href}" class="wiki-link">${text}</a>`;
      }
      // No matching page — render as non-clickable styled text
      return `<span class="wiki-link-missing">${text}</span>`;
    }
  );

  const result = await remark().use(remarkGfm).use(html, { sanitize: false }).process(withLinks);
  let output = result.toString();
  // tilde(~)가 삭제선으로 해석되는 문제 → <del> 태그를 원래 ~로 복원
  output = output.replace(/<del>([^]*?)<\/del>/g, "~$1~");

  // ===== Auto-linking: page titles & keywords → wiki links =====
  const { getSlugMap } = await import("./slugMap");
  const allEntries = getSlugMap();

  // Build keyword → urlSlug map. Include titles + common aliases from tags
  const keywordMap: Array<{ keyword: string; urlSlug: string; title: string }> = [];
  for (const entry of allEntries) {
    if (entry.category === "subjects" || entry.category === "practice") continue;
    // Add the title itself
    if (entry.title.length >= 2) {
      keywordMap.push({ keyword: entry.title, urlSlug: entry.urlSlug, title: entry.title });
    }
  }
  // Sort by keyword length descending (longest first to avoid partial matches)
  keywordMap.sort((a, b) => b.keyword.length - a.keyword.length);

  // Auto-link in rendered HTML: only in <p> and <li> text, not in headings/links/code
  // We process the HTML and replace keyword occurrences with links
  const linked = new Set<string>(); // Track already-linked keywords to limit to first occurrence
  for (const { keyword, urlSlug, title } of keywordMap) {
    if (linked.has(urlSlug)) continue;
    // Escape special regex chars in keyword
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match keyword only in plain text (not inside HTML tags or existing links)
    // Use a regex that matches the keyword when NOT inside < > or already in an <a> tag
    const regex = new RegExp(
      `(?<![\\w/])(?<!<[^>]*)(?<!href="[^"]*)(${escaped})(?![^<]*>)(?!</a>)(?![\\w])`,
      ""
    );

    // Simple approach: split by HTML tags, process only text nodes
    const parts = output.split(/(<[^>]+>)/);
    let found = false;
    let inLink = 0;
    let inHeading = 0;
    let inCode = 0;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Track tag state
      if (part.startsWith("<")) {
        if (part.match(/^<a[\s>]/i)) inLink++;
        else if (part.match(/^<\/a>/i)) inLink--;
        else if (part.match(/^<h[1-6][\s>]/i)) inHeading++;
        else if (part.match(/^<\/h[1-6]>/i)) inHeading--;
        else if (part.match(/^<(code|pre)[\s>]/i)) inCode++;
        else if (part.match(/^<\/(code|pre)>/i)) inCode--;
        continue;
      }
      // Skip if inside a link, heading, or code
      if (inLink > 0 || inHeading > 0 || inCode > 0) continue;
      // Try to match keyword in this text node
      const idx = part.indexOf(keyword);
      if (idx !== -1) {
        const href = `${basePath}/wiki/${urlSlug}/`;
        const replacement = `${part.slice(0, idx)}<a href="${href}" class="wiki-link auto-link" title="${title}">${keyword}</a>${part.slice(idx + keyword.length)}`;
        parts[i] = replacement;
        found = true;
        break; // Only link first occurrence
      }
    }
    if (found) {
      output = parts.join("");
      linked.add(urlSlug);
    }
  }

  // Render LaTeX math with KaTeX
  const katex = (await import("katex")).default;
  // Block math: $$...$$
  output = output.replace(/\$\$([^$]+?)\$\$/g, (_, tex) => {
    try {
      const clean = tex.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
      return katex.renderToString(clean, { displayMode: true, throwOnError: false });
    } catch { return `<code>${tex}</code>`; }
  });
  // Inline math: $...$  (but not $$)
  output = output.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      const clean = tex.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
      return katex.renderToString(clean, { displayMode: false, throwOnError: false });
    } catch { return `<code>${tex}</code>`; }
  });

  return output;
}

export function getNavigation() {
  const pages = getAllPages();

  const subjects = pages
    .filter((p) => p.category === "subjects")
    .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));

  const concepts = pages.filter((p) => p.category === "concepts");
  const laws = pages.filter((p) => p.category === "laws");
  const practice = pages.filter((p) => p.category === "practice");

  // Group concepts by subject
  const conceptsBySubject: Record<string, WikiPage[]> = {};
  for (const c of concepts) {
    const subj = c.frontmatter.subject || "기타";
    if (!conceptsBySubject[subj]) conceptsBySubject[subj] = [];
    conceptsBySubject[subj].push(c);
  }

  // Sort each group: hubs first (no parent), then sub-pages
  for (const subj of Object.keys(conceptsBySubject)) {
    conceptsBySubject[subj].sort((a, b) => {
      const aIsHub = !a.frontmatter.parent;
      const bIsHub = !b.frontmatter.parent;
      if (aIsHub && !bIsHub) return -1;
      if (!aIsHub && bIsHub) return 1;
      return a.frontmatter.title.localeCompare(b.frontmatter.title);
    });
  }

  return { subjects, conceptsBySubject, laws, practice };
}
