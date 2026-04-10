/**
 * check-wikilinks.js
 *
 * wiki/ 내의 모든 [[wikilink]]를 스캔하여 대응하는 페이지가 실제로 존재하는지 검증한다.
 *
 * 두 가지 모드로 동작한다:
 *   • 기본(경고) 모드: 깨진 링크를 출력하지만 exit 0 (빌드 통과).
 *     wiki.ts는 깨진 링크를 <span class="wiki-link-missing">로 우아하게 렌더링하므로
 *     배포 자체는 망가지지 않는다. 의도: "새로 늘어난 깨진 링크를 즉시 알아차리기".
 *   • 엄격(strict) 모드: 환경변수 CHECK_WIKILINKS_STRICT=1 설정 시 깨진 링크가
 *     하나라도 있으면 exit 1. CI에서 깨진 링크 0 상태를 유지하고 싶을 때 활성화.
 *
 * 해석 로직은 web/src/lib/wiki.ts의 renderMarkdown과 동일하게 맞췄다:
 *   1. 공백 제거 + 꼬리 백슬래시 제거로 정규화
 *   2. `target` 직접 매치 (e.g. "concepts/물권변동")
 *   3. 실패 시 concepts/laws/subjects/practice 접두사를 차례로 붙여 재시도
 *   4. `#` 앵커는 분리 후 base slug만 검사
 *   5. `[[target|label]]`의 label은 무시, target만 검사
 *
 * log.md는 append-only 로그로 과거 이름을 포함하므로 스캔 대상에서 제외한다.
 *
 * 관련 문서: .planning/codebase/CONCERNS.md §H3
 */

const fs = require("fs");
const path = require("path");

const wikiDir = path.join(__dirname, "..", "..", "wiki");
const CATEGORIES = ["concepts", "laws", "subjects", "practice"];

/**
 * 현재 wiki/ 내에 존재하는 모든 페이지 슬러그 집합을 수집한다.
 * 형식: "index", "concepts/물권변동", "practice/빈출키워드_색인" 등.
 */
function collectExistingSlugs() {
  const slugs = new Set();

  // 루트 레벨 파일 (index.md 등)
  for (const entry of fs.readdirSync(wikiDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "log.md") {
      slugs.add(entry.name.replace(/\.md$/, ""));
      continue;
    }
    if (entry.isDirectory() && CATEGORIES.includes(entry.name)) {
      const catDir = path.join(wikiDir, entry.name);
      for (const f of fs.readdirSync(catDir)) {
        if (f.endsWith(".md") && f !== "log.md") {
          slugs.add(`${entry.name}/${f.replace(/\.md$/, "")}`);
        }
      }
    }
  }

  return slugs;
}

/** wiki.ts의 renderMarkdown과 동일한 해석 순서로 링크 대상을 검증한다. */
function isResolvable(rawTarget, existingSlugs) {
  const normalized = rawTarget.replace(/\s/g, "").replace(/\\+$/, "");
  const baseSlug = normalized.includes("#") ? normalized.split("#")[0] : normalized;
  if (!baseSlug) return false;

  // 1. 직접 매치
  if (existingSlugs.has(baseSlug)) return true;

  // 2. 카테고리 접두사 매치
  for (const cat of CATEGORIES) {
    if (existingSlugs.has(`${cat}/${baseSlug}`)) return true;
  }

  return false;
}

/** 파일 하나를 스캔하여 깨진 링크 목록을 반환한다. */
function findBrokenLinksInFile(filePath, existingSlugs) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const broken = [];

  // wiki.ts와 동일한 정규식: [[target]] 또는 [[target|label]]
  // 각 줄마다 새 정규식 인스턴스를 만들어 state 오염 방지
  const makeRegex = () => /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const regex = makeRegex();
    let match;
    while ((match = regex.exec(line)) !== null) {
      const target = match[1];
      if (!isResolvable(target, existingSlugs)) {
        broken.push({ file: filePath, line: i + 1, target });
      }
    }
  }

  return broken;
}

/** wiki/ 하위의 모든 .md 파일을 재귀 수집 (log.md 제외). */
function walkAllMdFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkAllMdFiles(full));
    } else if (entry.name.endsWith(".md") && entry.name !== "log.md") {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(wikiDir)) {
    console.error(`[check-wikilinks] Wiki directory not found: ${wikiDir}`);
    process.exit(1);
  }

  const strict = process.env.CHECK_WIKILINKS_STRICT === "1";
  const existingSlugs = collectExistingSlugs();
  const mdFiles = walkAllMdFiles(wikiDir);

  const allBroken = [];
  for (const file of mdFiles) {
    allBroken.push(...findBrokenLinksInFile(file, existingSlugs));
  }

  if (allBroken.length === 0) {
    console.log(
      `[check-wikilinks] OK — scanned ${mdFiles.length} files, ${existingSlugs.size} pages, no broken wikilinks`
    );
    return;
  }

  const level = strict ? "FAIL" : "WARN";
  const stream = strict ? console.error : console.warn;

  stream(`\n[check-wikilinks] ${level} — ${allBroken.length} broken wikilink(s):\n`);
  for (const b of allBroken) {
    const rel = path.relative(wikiDir, b.file).replace(/\\/g, "/");
    stream(`  wiki/${rel}:${b.line}  [[${b.target}]]`);
  }

  if (strict) {
    console.error(
      `\nFix these before building. See .planning/codebase/CONCERNS.md §H3 for background.`
    );
    process.exit(1);
  }

  console.warn(
    `\n[check-wikilinks] WARN mode — build continues. Set CHECK_WIKILINKS_STRICT=1 to fail on broken links. See .planning/codebase/CONCERNS.md §H3.`
  );
}

main();
