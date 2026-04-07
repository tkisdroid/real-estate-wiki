const fs = require("fs");
const path = require("path");

const SOURCES_DIR = path.join(__dirname, "..", "..", "sources");
const OUT_FILE = path.join(__dirname, "..", "public", "source-index.json");

function readTextFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".txt")) continue;
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    results.push({ file, content });
  }
  return results;
}

function extractParagraphs(text, minLength = 30, maxLength = 300) {
  // Split by double newline or section markers
  const blocks = text.split(/\n{2,}|(?=제\d+조)|(?=\d+\.\s)/).filter(Boolean);
  const paragraphs = [];
  for (const block of blocks) {
    const clean = block.replace(/\s+/g, " ").trim();
    if (clean.length >= minLength && clean.length <= maxLength * 2) {
      paragraphs.push(clean.slice(0, maxLength));
    }
  }
  return paragraphs;
}

function buildIndex() {
  const entries = [];

  // Index extracted law texts
  const lawFiles = readTextFiles(path.join(SOURCES_DIR, "laws", "extracted"));
  for (const { file, content } of lawFiles) {
    const title = file.replace(".txt", "").replace(/\(.*?\)/g, "").trim();
    const paragraphs = extractParagraphs(content);
    // Sample every Nth paragraph to keep index small
    const step = Math.max(1, Math.floor(paragraphs.length / 20));
    for (let i = 0; i < paragraphs.length; i += step) {
      entries.push({
        t: title,
        x: paragraphs[i],
      });
    }
  }

  // Index extracted textbook texts
  const textbookFiles = readTextFiles(path.join(SOURCES_DIR, "textbooks", "extracted"));
  for (const { file, content } of textbookFiles) {
    const title = "교재: " + file.replace(".txt", "");
    const paragraphs = extractParagraphs(content);
    const step = Math.max(1, Math.floor(paragraphs.length / 30));
    for (let i = 0; i < paragraphs.length; i += step) {
      entries.push({
        t: title,
        x: paragraphs[i],
      });
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(entries));

  const sizeKB = (Buffer.byteLength(JSON.stringify(entries)) / 1024).toFixed(1);
  console.log(`Source index: ${entries.length} entries, ${sizeKB}KB`);
}

buildIndex();
