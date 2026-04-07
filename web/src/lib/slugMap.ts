import { getAllPages, WikiPage } from "./wiki";

export interface SlugEntry {
  urlSlug: string;
  wikiSlug: string;
  title: string;
  category: string;
  subject: string;
}

const PREFIX_MAP: Record<string, string> = {
  concepts: "c",
  laws: "l",
  subjects: "s",
  practice: "p",
};

function buildSlugMap(): SlugEntry[] {
  const pages = getAllPages();

  // Group by category, sort within each group for deterministic numbering
  const grouped: Record<string, WikiPage[]> = {};
  for (const page of pages) {
    // skip root-level files like index.md
    if (page.category === "root") continue;
    if (!grouped[page.category]) grouped[page.category] = [];
    grouped[page.category].push(page);
  }

  const entries: SlugEntry[] = [];

  for (const category of Object.keys(PREFIX_MAP)) {
    const group = grouped[category] || [];
    // Sort alphabetically by slug for deterministic ordering
    group.sort((a, b) => a.slug.localeCompare(b.slug));
    const prefix = PREFIX_MAP[category];

    group.forEach((page, i) => {
      const num = String(i + 1).padStart(3, "0");
      entries.push({
        urlSlug: `${prefix}${num}`,
        wikiSlug: page.slug,
        title: page.frontmatter.title,
        category: page.category,
        subject: page.frontmatter.subject || "",
      });
    });
  }

  return entries;
}

// Cache so we only compute once per build
let _slugMap: SlugEntry[] | null = null;

export function getSlugMap(): SlugEntry[] {
  if (!_slugMap) {
    _slugMap = buildSlugMap();
  }
  return _slugMap;
}

// Lookup: wikiSlug (e.g. "concepts/물권변동") -> urlSlug (e.g. "c062")
let _wikiToUrl: Map<string, string> | null = null;

export function getUrlSlug(wikiSlug: string): string | undefined {
  if (!_wikiToUrl) {
    _wikiToUrl = new Map();
    for (const entry of getSlugMap()) {
      _wikiToUrl.set(entry.wikiSlug, entry.urlSlug);
    }
  }
  return _wikiToUrl.get(wikiSlug);
}

// Lookup: urlSlug (e.g. "c062") -> wikiSlug (e.g. "concepts/물권변동")
let _urlToWiki: Map<string, string> | null = null;

export function getWikiSlug(urlSlug: string): string | undefined {
  if (!_urlToWiki) {
    _urlToWiki = new Map();
    for (const entry of getSlugMap()) {
      _urlToWiki.set(entry.urlSlug, entry.wikiSlug);
    }
  }
  return _urlToWiki.get(urlSlug);
}

// Lookup: wikiSlug -> full SlugEntry
export function getEntryByWikiSlug(wikiSlug: string): SlugEntry | undefined {
  return getSlugMap().find((e) => e.wikiSlug === wikiSlug);
}

// Lookup: urlSlug -> full SlugEntry
export function getEntryByUrlSlug(urlSlug: string): SlugEntry | undefined {
  return getSlugMap().find((e) => e.urlSlug === urlSlug);
}
