const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const WIKI_DIR = path.join(__dirname, "..", "wiki-data");
const OUT_FILE = path.join(__dirname, "..", "public", "search-index.json");

const PREFIX_MAP = { concepts: "c", laws: "l", subjects: "s", practice: "p" };

function getAllMdFiles(dir, base = "") {
  const files = [];
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

function stripMarkdown(text) {
  return text
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, t, l) => l || t)
    .replace(/[#*_`>|~\[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndex() {
  if (!fs.existsSync(WIKI_DIR)) {
    console.error("wiki-data not found. Run `npm run prebuild` first.");
    process.exit(1);
  }

  const files = getAllMdFiles(WIKI_DIR);

  // Group by category for URL slug generation (same logic as slugMap.ts)
  const grouped = {};
  const pages = [];

  for (const file of files) {
    const fullPath = path.join(WIKI_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
    const category = slug.split("/")[0] || "root";
    if (category === "root") continue;

    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ slug, category, data, content });
  }

  // Build URL slugs (must match slugMap.ts exactly)
  const entries = [];
  for (const category of Object.keys(PREFIX_MAP)) {
    const group = grouped[category] || [];
    group.sort((a, b) => a.slug.localeCompare(b.slug));
    const prefix = PREFIX_MAP[category];

    group.forEach((page, i) => {
      const num = String(i + 1).padStart(3, "0");
      const plainContent = stripMarkdown(page.content);
      entries.push({
        u: `${prefix}${num}`,
        t: page.data.title || page.slug.split("/").pop(),
        s: page.data.subject || "",
        c: page.category,
        i: page.data.importance || "",
        tags: page.data.tags || [],
        p: page.data.parent || "",
        x: plainContent.slice(0, 2000),
      });
    });
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(entries));

  const sizeKB = (Buffer.byteLength(JSON.stringify(entries)) / 1024).toFixed(1);
  console.log(`Search index: ${entries.length} pages, ${sizeKB}KB`);
}

buildIndex();
