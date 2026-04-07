const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const WIKI_DIR = path.join(__dirname, "..", "wiki-data");
const OUT_FILE = path.join(__dirname, "..", "public", "quiz-data.json");
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

function buildUrlSlugMap() {
  const files = getAllMdFiles(WIKI_DIR);
  const grouped = {};
  for (const file of files) {
    const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
    const category = slug.split("/")[0] || "root";
    if (category === "root") continue;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(slug);
  }
  const map = {};
  for (const category of Object.keys(PREFIX_MAP)) {
    const group = (grouped[category] || []).sort();
    const prefix = PREFIX_MAP[category];
    group.forEach((slug, i) => {
      map[slug] = `${prefix}${String(i + 1).padStart(3, "0")}`;
    });
  }
  return map;
}

function parseQuizzes(content) {
  const quizRegex = /\*\*Q(\d+)\.\*\*\s*(.*?)\s*→\s*\*\*(O|X)\*\*\s*\((.*?)\)/g;
  const quizzes = [];
  let match;
  while ((match = quizRegex.exec(content)) !== null) {
    quizzes.push({
      n: parseInt(match[1]),
      q: match[2].trim(),
      a: match[3] === "O",
      e: match[4].trim(),
    });
  }
  return quizzes;
}

function build() {
  if (!fs.existsSync(WIKI_DIR)) {
    console.error("wiki-data not found.");
    process.exit(1);
  }

  const slugMap = buildUrlSlugMap();
  const files = getAllMdFiles(WIKI_DIR);
  const result = {};
  let totalQuizzes = 0;

  for (const file of files) {
    const fullPath = path.join(WIKI_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "").replace(/\\/g, "/");
    const urlSlug = slugMap[slug];
    if (!urlSlug) continue;

    const quizzes = parseQuizzes(content);
    if (quizzes.length > 0) {
      result[urlSlug] = {
        title: data.title || slug.split("/").pop(),
        subject: data.subject || "",
        quizzes,
      };
      totalQuizzes += quizzes.length;
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(result));
  const sizeKB = (Buffer.byteLength(JSON.stringify(result)) / 1024).toFixed(1);
  console.log(`Quiz data: ${Object.keys(result).length} pages, ${totalQuizzes} questions, ${sizeKB}KB`);
}

build();
