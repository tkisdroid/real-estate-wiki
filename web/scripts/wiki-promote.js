#!/usr/bin/env node
/**
 * wiki:promote — Source 발췌를 위키 마크다운 템플릿으로 승격
 *
 * Usage:
 *   npm run wiki:promote -- --topic "양도소득세 필요경비" --subject "부동산세법"
 *   npm run wiki:promote -- --topic "분묘기지권" --subject "민법및민사특별법" --parent "소유권"
 */

const fs = require("fs");
const path = require("path");

const WIKI_DIR = path.join(__dirname, "..", "..", "wiki");
const SOURCES_DIR = path.join(__dirname, "..", "..", "sources");
const LOG_FILE = path.join(WIKI_DIR, "log.md");

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

function searchSources(topic) {
  const results = [];
  const dirs = [
    path.join(SOURCES_DIR, "laws", "extracted"),
    path.join(SOURCES_DIR, "textbooks", "extracted"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".txt")) continue;
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const lines = content.split("\n");
      const topicLower = topic.toLowerCase();

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(topicLower)) {
          // Extract surrounding context (5 lines before, 10 after)
          const start = Math.max(0, i - 5);
          const end = Math.min(lines.length, i + 10);
          const excerpt = lines.slice(start, end).join("\n").trim();
          if (excerpt.length > 30) {
            results.push({
              source: file.replace(".txt", ""),
              excerpt: excerpt.slice(0, 500),
            });
          }
          i = end; // skip ahead to avoid duplicates
        }
      }
    }
  }
  return results.slice(0, 5); // top 5 matches
}

function generateTemplate(topic, subject, parent, sourceExcerpts) {
  const today = new Date().toISOString().split("T")[0];
  const filename = topic.replace(/\s/g, "").replace(/[^\uAC00-\uD7A3a-zA-Z0-9_]/g, "");
  const parentPrefix = parent ? `${parent.replace(/\s/g, "")}_` : "";

  let content = `---
title: ${topic}
category: concepts
subject: ${subject}
${parent ? `parent: ${parent}\n` : ""}tags: [${topic}]
sources: [에듀랜드 2026 기본서]
created: ${today}
updated: ${today}
importance: medium
---

# ${topic}

> TODO: 이 페이지는 사용자 검색 갭에서 자동 생성된 템플릿입니다.
> 아래 원본 자료 발췌를 참고하여 내용을 보강해주세요.

## 개요

(내용 작성 필요)

`;

  if (sourceExcerpts.length > 0) {
    content += `## 원본 자료 발췌\n\n`;
    for (const s of sourceExcerpts) {
      content += `### ${s.source}\n\`\`\`\n${s.excerpt}\n\`\`\`\n\n`;
    }
  }

  content += `---

## 핵심 암기 포인트

- (작성 필요)

## OX 퀴즈

**Q1.** (작성 필요) → **O**

## 함정 노트

(작성 필요)
`;

  return {
    filename: `${parentPrefix}${filename}.md`,
    content,
  };
}

function appendLog(topic) {
  const today = new Date().toISOString().split("T")[0];
  const entry = `\n## [${today}] promote | ${topic} 위키 페이지 생성\n- 사용자 검색 갭에서 위키 페이지 템플릿 자동 생성\n`;
  fs.appendFileSync(LOG_FILE, entry);
}

function main() {
  const args = parseArgs();

  if (!args.topic) {
    console.error("Usage: npm run wiki:promote -- --topic \"주제\" --subject \"과목명\" [--parent \"상위개념\"]");
    console.error("Example: npm run wiki:promote -- --topic \"분묘기지권\" --subject \"민법및민사특별법\" --parent \"소유권\"");
    process.exit(1);
  }

  const topic = args.topic;
  const subject = args.subject || "기타";
  const parent = args.parent || "";

  console.log(`\nSearching sources for: "${topic}"...`);
  const excerpts = searchSources(topic);
  console.log(`Found ${excerpts.length} source excerpts.`);

  const { filename, content } = generateTemplate(topic, subject, parent, excerpts);
  const outPath = path.join(WIKI_DIR, "concepts", filename);

  if (fs.existsSync(outPath)) {
    console.error(`\nERROR: ${outPath} already exists. Aborting.`);
    process.exit(1);
  }

  fs.writeFileSync(outPath, content);
  appendLog(topic);

  console.log(`\nCreated: wiki/concepts/${filename}`);
  console.log(`Log updated: wiki/log.md`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review and edit the generated template`);
  console.log(`  2. Run: npm run prebuild`);
  console.log(`  3. Commit: git add wiki/ && git commit -m "wiki: add ${topic}"`);
}

main();
