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
      const href = urlSlug ? `${basePath}/wiki/${urlSlug}/` : `${basePath}/wiki/${wikiSlug}/`;
      const text = label || target.split("/").pop() || target;
      return `<a href="${href}" class="wiki-link">${text}</a>`;
    }
  );

  const result = await remark().use(remarkGfm).use(html, { sanitize: false }).process(withLinks);
  return result.toString();
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
