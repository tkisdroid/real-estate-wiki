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
  const lines = content.split("\n");
  const quizzes = [];
  // Pattern 1: single-line with parens — **Q{n}.** {question} → **{O|X}** ({explanation}) [optional trailing text]
  const withExpl = /^\*\*Q(\d+)\.\*\*\s*(.*?)\s*→\s*\*\*(O|X)\*\*\s*\((.+)\)/;
  // Pattern 2: single-line no explanation — **Q{n}.** {question} → **{O|X}**
  const noExpl = /^\*\*Q(\d+)\.\*\*\s*(.*?)\s*→\s*\*\*(O|X)\*\*\s*$/;
  // Pattern 3: question only line — **Q{n}.** {question} (answer on next line)
  const questionOnly = /^\*\*Q(\d+)\.\*\*\s*(.+)$/;
  // Pattern 4: answer on separate line — > **{O|X}** — {explanation} or > **{O|X}** ({explanation})
  const answerLine = /^>\s*\*\*(O|X)\*\*\s*(?:—\s*(.*)|\((.+)\))?\s*$/;
  // Pattern 5: answer line with dash-separated explanation (e.g., from 지대이론_마샬.md)
  const answerLineDash = /^.*→\s*\*\*(O|X)\*\*\s*\((.+)\)\s*-\s*(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Try single-line patterns first
    let match = trimmed.match(withExpl);
    if (match) {
      quizzes.push({
        n: parseInt(match[1]),
        q: match[2].trim(),
        a: match[3] === "O",
        e: match[4].replace(/\*\*/g, "").trim(),
      });
      continue;
    }
    match = trimmed.match(noExpl);
    if (match) {
      quizzes.push({
        n: parseInt(match[1]),
        q: match[2].trim(),
        a: match[3] === "O",
        e: "",
      });
      continue;
    }

    // Try multi-line: question on this line, answer on next
    match = trimmed.match(questionOnly);
    if (match) {
      const qNum = parseInt(match[1]);
      const qText = match[2].trim();
      // Look ahead for answer line
      const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : "";
      const ansMatch = nextLine.match(answerLine);
      if (ansMatch) {
        const explanation = (ansMatch[2] || ansMatch[3] || "").replace(/\*\*/g, "").trim();
        quizzes.push({ n: qNum, q: qText, a: ansMatch[1] === "O", e: explanation });
        i++; // skip the answer line
      }
      // else: orphan question line, skip
    }
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
