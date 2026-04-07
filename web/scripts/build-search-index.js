const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const WIKI_DIR = path.join(__dirname, "..", "wiki-data");
const OUT_FILE = path.join(__dirname, "..", "public", "search-index.json");

// Same slug mapping logic as slugMap.ts
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

const files = getAllMdFiles(WIKI_DIR);
const grouped = {};

for (const file of files) {
  const fullPath = path.join(WIKI_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
  const category = slug.split("/")[0] || "root";
  if (category === "root") continue;
  if (!grouped[category]) grouped[category] = [];
  grouped[category].push({ slug, category, title: data.title || slug, subject: data.subject || "", tags: data.tags || [], content });
}

const index = [];
for (const category of Object.keys(PREFIX_MAP)) {
  const group = grouped[category] || [];
  group.sort((a, b) => a.slug.localeCompare(b.slug));
  const prefix = PREFIX_MAP[category];
  group.forEach((page, i) => {
    const num = String(i + 1).padStart(3, "0");
    // Extract plain text snippet (strip markdown formatting)
    const plainText = page.content
      .replace(/^---[\s\S]*?---/m, "")
      .replace(/#+\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, t, l) => l || t)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[|`>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    index.push({
      id: `${prefix}${num}`,
      title: page.title,
      subject: page.subject,
      category: page.category,
      tags: page.tags.join(" "),
      // Store first 500 chars for preview, full text for search
      preview: plainText.slice(0, 300),
      text: plainText,
    });
  });
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 0), "utf-8");
console.log(`Search index: ${index.length} pages, ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)}KB`);
