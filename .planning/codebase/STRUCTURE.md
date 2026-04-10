# Directory Structure

**Analysis Date:** 2026-04-10

This repo is an unusual hybrid: the **root is a content repository** (sources + curated markdown + schema) and `web/` is a self-contained Next.js app that consumes that content at build time. Treat the root as the "book" and `web/` as the "bookstore".

---

## Top-Level Layout

```
real-estate-wiki/
├── CLAUDE.md          ← schema & rules for the LLM wiki (READ FIRST)
├── .mcp.json          ← local docling MCP server for PDF→markdown conversion
├── .github/
│   └── workflows/
│       └── deploy.yml ← GitHub Pages CI/CD pipeline
├── .planning/         ← GSD planning artifacts (this scan lives in .planning/codebase/)
├── .claude/           ← Claude Code project-local settings
├── .git/
├── docs/              ← misc developer docs (not user-facing)
│   └── superpowers/
├── sources/           ← LAYER 1: immutable raw materials (textbooks, laws, exams, cases)
├── wiki/              ← LAYER 2: LLM-curated markdown — SOURCE OF TRUTH
├── tools/             ← Python utilities for raw-material conversion (sources/ prep)
└── web/               ← LAYER 3: Next.js 16 static-exported site
```

### The 3-Layer Content Pattern

The defining architectural feature. **`CLAUDE.md` at the repo root defines the schema** for the wiki — page format, hierarchy rules, required sections, exam-optimization structure.

| Layer | Directory | Mutability | Consumed by |
|---|---|---|---|
| 1 — Raw materials | `sources/` | **Immutable** (only the LLM/human adds; nothing removes or rewrites) | `tools/` Python scripts → `sources/*/extracted/*.txt` |
| 2 — Curated markdown | `wiki/` | **LLM-curated source of truth** | `web/scripts/copy-wiki.js` (copied to layer 3 at build time) |
| 3 — Build artifact | `web/wiki-data/` | **Generated** (never edited directly — regenerated on every `prebuild`) | `web/src/lib/wiki.ts` → Next.js pages |

> ⚠️ **Critical rule:** never edit `web/wiki-data/` directly — the next build overwrites it from `wiki/`. See `memory/feedback_lessons.md` §5 for the 2026-04-08 incident.

---

## `sources/` — Immutable Raw Materials

```
sources/
├── textbooks/                                 ← 에듀랜드 2026 기본서 6권 (1차·2차 전 과목)
│   ├── 편집완료_부동산학개론 2026 기본서_내지(347p).pdf
│   ├── 편집완료_2026_민법기본서_내지(315p).pdf
│   ├── (재발주)편집완료_에듀랜드 기본서_2026중개법_내지(332p).pdf
│   ├── 편집완료_에듀랜드 기본서_2026공법_내지(314p).pdf
│   ├── 편집완료_에듀랜드 기본서_2026공시_내지(306p).pdf
│   ├── 편집완료_에듀랜드 기본서_2026세법_내지(298p).pdf
│   ├── docling/                               ← Docling JSON + markdown extractions
│   └── extracted/                             ← flat .txt extractions used by build-source-index.js
├── laws/                                      ← 법령 원문
│   └── extracted/
├── exams/                                     ← 22년치 기출문제 (2005 15회 → 2025 36회)
│   ├── 2005년 15회 문제 및 정답/
│   ├── ...
│   ├── 2025년 36회 문제 및 정답/
│   └── extracted/
├── cases/                                     ← 판례집 PDF
│   └── extracted/
├── terms/                                     ← 용어집
├── 빈출키워드.txt                              ← 시험 빈출 키워드 체크리스트 (2026-04-10 ingest)
└── 핵심키워드.txt                              ← 시험 핵심 키워드 체크리스트 (2026-04-10 ingest)
```

**Conventions:**
- Each subdirectory has an `extracted/` sibling containing flat `.txt` or `.md` files produced by `tools/` Python scripts.
- `build-source-index.js` samples paragraphs from `laws/extracted/` and `textbooks/extracted/` to populate `web/public/source-index.json`.
- PDFs and binary formats are never read at runtime — only the extractions are.

---

## `wiki/` — Curated Markdown (Source of Truth)

```
wiki/
├── index.md                 ← master index with links into every sub-area
├── log.md                   ← append-only work log (every ingest/refactor entry)
├── subjects/                ← 6 exam-subject overview pages (hubs for each 과목)
│   ├── 부동산학개론.md
│   ├── 민법및민사특별법.md
│   ├── 공인중개사법령및중개실무.md
│   ├── 부동산공법.md
│   ├── 부동산공시법.md
│   └── 부동산세법.md
├── concepts/                ← 190+ concept pages (hubs + child pages using parent frontmatter)
├── laws/                    ← 20 statute commentary pages
└── practice/                ← exam analysis: 기출, 출제빈도, 판례정리, 빈출키워드_색인 🆕
```

**Page contract (defined in `CLAUDE.md`):**
- YAML frontmatter: `title`, `category`, `subject`, `parent?`, `tags[]`, `sources[]`, `created`, `updated`, `importance`.
- Every concept page must include: **핵심 암기 포인트**, **OX 퀴즈**, **비교 정리** (where applicable), **함정 노트**.
- Hierarchy: max 2 levels. Hub file + child files named `상위개념_하위개념.md` with `parent:` frontmatter.
- Cross-references use Obsidian `[[wikilink]]` syntax; rewritten to URL slugs by `slugMap.ts` at render time.

**Counts (from `wiki/index.md`, 2026-04-10):** 227 total pages = 6 subjects + 190 concepts + 20 laws + 10 practice + `index.md` + `log.md`.

---

## `tools/` — Python Conversion Utilities

```
tools/
├── docling_convert.py       ← top-level orchestrator using Docling
├── rtf_extract.py           ← RTF → text
├── step1_doc_to_docx.py     ← legacy .doc → .docx
├── step2_docling_docx.py    ← .docx → markdown via Docling
├── step3_docling_pdf.py     ← PDF → markdown via Docling
└── step3_pymupdf_pdf.py     ← PDF → text via PyMuPDF (fallback/alt path)
```

Purpose: populate `sources/*/extracted/` and `sources/*/docling/` from the raw PDFs. **Not part of the web runtime** and **not invoked by CI** — these are human-run during content onboarding.

Complemented by the local `docling-mcp` MCP server declared in `.mcp.json` (also developer-side, not runtime).

---

## `web/` — Next.js 16 Static Site

```
web/
├── AGENTS.md                ← "This is NOT the Next.js you know" warning (READ FIRST)
├── CLAUDE.md                ← @AGENTS.md (just a pointer)
├── DESIGN.md                ← design-system notes
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json            ← strict TS, @/* path alias, ES2017 target
├── next.config.ts           ← output:export, basePath:/real-estate-wiki, trailingSlash, images.unoptimized
├── next-env.d.ts
├── eslint.config.mjs        ← flat config, eslint-config-next 16.2.2
├── postcss.config.mjs       ← Tailwind v4 PostCSS plugin
├── .gitignore
│
├── scripts/                 ← Node (CJS) build-time utilities
│   ├── copy-wiki.js         ← wiki/ → web/wiki-data/ (prebuild step 1)
│   ├── build-search-index.js ← wiki-data/ → public/search-index.json
│   ├── build-quiz-data.js   ← parse OX quiz blocks → public/quiz-data.json
│   ├── build-source-index.js ← sources/*/extracted/*.txt → public/source-index.json
│   └── wiki-promote.js      ← (manual) wiki maintenance helper (not in prebuild)
│
├── public/                  ← static assets + generated JSON indexes
│   ├── images/
│   ├── search-index.json    ← generated
│   ├── quiz-data.json       ← generated
│   ├── source-index.json    ← generated
│   └── *.svg                ← Next.js starter icons (unused, safe to remove)
│
├── wiki-data/               ← GENERATED — mirror of wiki/ created by copy-wiki.js
│   ├── concepts/
│   ├── laws/
│   ├── practice/
│   ├── subjects/
│   ├── index.md
│   └── log.md
│
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── layout.tsx       ← root layout; loads Noto Sans KR, Pretendard, katex.min.css
│   │   ├── page.tsx         ← homepage (search, navigation, Eduland banner)
│   │   ├── globals.css      ← Tailwind v4 imports + custom styles
│   │   ├── favicon.ico
│   │   ├── wiki/[slug]/
│   │   │   └── page.tsx     ← per-wiki-page reader; calls renderMarkdown
│   │   ├── quiz/
│   │   │   └── page.tsx     ← OX quiz player (membership-gated)
│   │   └── components/      ← page-level "use client" islands
│   │       ├── AuthModal.tsx
│   │       ├── BookmarkButton.tsx
│   │       ├── ContentGate.tsx
│   │       ├── MobileSidebar.tsx
│   │       ├── MyBookmarks.tsx
│   │       ├── OXQuizInteractive.tsx
│   │       ├── PageTracker.tsx
│   │       ├── ProgressDashboard.tsx
│   │       ├── SearchFilter.tsx
│   │       └── SearchWrapper.tsx
│   ├── components/          ← (present but appears unused by app routes — unclear, needs verification)
│   └── lib/
│       ├── wiki.ts          ← markdown reader + remark/remark-gfm/remark-html + KaTeX
│       ├── slugMap.ts       ← file path ↔ URL slug mapping; wikilink rewriter
│       ├── koreanSearch.ts  ← Hangul-decomposing search helpers
│       ├── tocStructure.ts  ← TOC tree construction from frontmatter
│       ├── subjects.ts      ← 6 exam-subject metadata
│       ├── supabase.ts      ← client (hard-coded URL + anon key)
│       ├── useAuth.ts       ← Eduland localStorage + Supabase auth reconciler
│       └── wikiStorage.ts   ← bookmarks + visit tracking (RPC + localStorage fallback)
│
├── out/                     ← STATIC EXPORT ARTIFACT (web/out/*) — uploaded by CI to GitHub Pages
├── node_modules/            ← gitignored
└── tsconfig.tsbuildinfo     ← gitignored incremental TS cache
```

---

## `.github/workflows/deploy.yml`

Single workflow: build + deploy to GitHub Pages on push to `master`. Uses Node 22, `npm ci` in `web/`, explicit `copy-wiki.js` step, then `npm run build`, then `actions/deploy-pages@v4`. See `INTEGRATIONS.md` for full pipeline details.

---

## `.planning/` — GSD Workflow Artifacts

```
.planning/
└── codebase/          ← produced by /gsd-scan (this directory)
    ├── STACK.md
    ├── INTEGRATIONS.md
    ├── ARCHITECTURE.md
    └── STRUCTURE.md
```

This directory is used by the Get-Shit-Done (GSD) planning workflows that live in `~/.claude/get-shit-done/`. It is project-local scratch space for scans, plans, and phase artifacts — **not** part of the web runtime or the content pipeline.

---

## Reading Order for New Contributors

1. `CLAUDE.md` (repo root) — **wiki schema and rules**. The single most important file.
2. `web/AGENTS.md` — Next.js 16 warning: don't trust general Next.js knowledge.
3. `.planning/codebase/ARCHITECTURE.md` — the three-layer pipeline and runtime flow.
4. `wiki/index.md` — what content exists and how it's organized.
5. `wiki/log.md` — chronological history of ingests and refactors.
6. `web/next.config.ts` — the 12 lines that pin every deployment assumption.
7. `web/src/lib/wiki.ts` — how markdown becomes HTML.
8. `web/scripts/copy-wiki.js` + `build-*.js` — how content becomes JSON indexes.

---

## Directories to Ignore

- `web/node_modules/`, `web/out/`, `web/.next/`, `web/tsconfig.tsbuildinfo` — generated / gitignored
- `.git/`, `.claude/` — tooling metadata
- Binary files inside `sources/**/*.pdf`, `sources/**/*.rtf` — never read at runtime; work off the `extracted/` siblings instead

---

*Directory snapshot: 2026-04-10*
