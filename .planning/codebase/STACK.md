# Technology Stack

**Analysis Date:** 2026-04-10

This is a Korean real-estate license exam wiki (공인중개사 시험 LLM Wiki). The runtime stack lives entirely under `web/` — a Next.js static-exported site. The root of the repo is a content repository (markdown + raw source materials) with Python utilities in `tools/`.

## Languages

**Primary:**
- **TypeScript** — strict mode. All app, component, and library code in `web/src/**`. Target `ES2017`, module `esnext`, `moduleResolution: "bundler"`, JSX `react-jsx`. Path alias `@/*` → `./src/*`. See `web/tsconfig.json`.
- **JavaScript (Node, CommonJS)** — build-time scripts in `web/scripts/*.js` (`copy-wiki.js`, `build-search-index.js`, `build-quiz-data.js`, `build-source-index.js`, `wiki-promote.js`). Use `require()` and run under Node directly (no bundling).
- **Markdown (with YAML frontmatter)** — the actual wiki content under `wiki/**` and generated output under `web/wiki-data/**`. Parsed with `gray-matter`.

**Secondary:**
- **Python 3** — offline document-conversion utilities in `tools/` (`docling_convert.py`, `rtf_extract.py`, `step1_doc_to_docx.py`, `step2_docling_docx.py`, `step3_docling_pdf.py`, `step3_pymupdf_pdf.py`). Not part of the web runtime or CI build.
- **CSS** — `web/src/app/globals.css` plus Tailwind v4 utilities.

## Runtime

**Node.js:** `22` (pinned in CI via `.github/workflows/deploy.yml` → `actions/setup-node@v4` with `node-version: "22"`). No `.nvmrc` at repo root.

**Browser target:** TS `target: ES2017`, Next.js 16 defaults. React 19.

**Package manager:** npm (lockfile `web/package-lock.json` present, 297 KB). CI uses `npm ci`.

## Frameworks

| Framework | Version | Role |
|---|---|---|
| **Next.js** | `16.2.2` | App Router, static export (`output: "export"`). See `web/next.config.ts`. **Note:** `web/AGENTS.md` explicitly warns "This is NOT the Next.js you know — APIs, conventions, and file structure may all differ from your training data." Treat Next.js 16 API details as unverified unless observed in-repo. |
| **React** | `19.2.4` | Paired with React DOM `19.2.4`. Server components by default; client components opt in with `"use client"`. |
| **Tailwind CSS** | `^4` | v4 via `@tailwindcss/postcss` plugin in `web/postcss.config.mjs`. No `tailwind.config.*` file observed — config is either in CSS or defaults only. `@tailwindcss/typography` `^0.5.19` for `prose` classes. |
| **ESLint** | `^9` with `eslint-config-next@16.2.2` | Flat config in `web/eslint.config.mjs` using `defineConfig` + `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. |
| **TypeScript** | `^5` | `strict: true`, `noEmit: true`, `incremental: true`. |

**Testing:** No test framework detected. No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `*.test.*` / `*.spec.*` files present.

**Build/Dev tooling:** Next.js CLI only (`next dev`, `next build`). No separate bundler config.

## Key Dependencies

All declared in `web/package.json`.

**Runtime dependencies:**
| Package | Version | Purpose |
|---|---|---|
| `next` | `16.2.2` | Framework |
| `react` / `react-dom` | `19.2.4` | UI runtime |
| `@supabase/supabase-js` | `^2.102.1` | Auth + RPC for bookmarks/visits (see INTEGRATIONS.md) |
| `gray-matter` | `^4.0.3` | Parse YAML frontmatter from wiki markdown |
| `remark` | `^15.0.1` | Markdown → MDAST pipeline |
| `remark-gfm` | `^4.0.1` | GitHub-flavored markdown (tables, strikethrough, etc.) |
| `remark-html` | `^16.0.1` | MDAST → HTML serializer, used with `sanitize: false` |
| `katex` | `^0.16.45` | LaTeX math rendering, invoked directly in `web/src/lib/wiki.ts`; CSS imported in `web/src/app/layout.tsx` (`katex/dist/katex.min.css`) |
| `@tailwindcss/typography` | `^0.5.19` | `prose` plugin |

**Dev dependencies:**
| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5` | Compiler |
| `@types/node` | `^20` | Node typings |
| `@types/react` / `@types/react-dom` | `^19` | React typings |
| `eslint` | `^9` | Linter |
| `eslint-config-next` | `16.2.2` | Next.js preset (flat config) |
| `tailwindcss` | `^4` | Tailwind core |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin |

No state-management library (Redux/Zustand/etc.), no HTTP client (`axios`/`ky`), no form library, no ORM — the app does not need them because it is a static markdown site with direct Supabase RPC calls for the small dynamic surface.

## Build Tools & Scripts

Defined in `web/package.json` scripts:

```
"dev":           "next dev"
"prebuild":      "node scripts/copy-wiki.js && node scripts/build-search-index.js && node scripts/build-quiz-data.js && node scripts/build-source-index.js"
"build":         "next build"
"start":         "next start"
"lint":          "eslint"
"wiki:promote":  "node scripts/wiki-promote.js"
```

`prebuild` runs automatically before `build` via npm's lifecycle hook. The four pre-build steps:
1. `copy-wiki.js` — copies `wiki/` → `web/wiki-data/` (source-of-truth sync).
2. `build-search-index.js` — walks `wiki-data/`, builds `public/search-index.json` (URL-slug-keyed, compact fields `u/t/s/c/i/tags/p/x`).
3. `build-quiz-data.js` — parses OX quiz blocks out of wiki markdown into `public/quiz-data.json`.
4. `build-source-index.js` — samples paragraphs from `sources/laws/extracted/` and `sources/textbooks/extracted/` `.txt` files into `public/source-index.json`.

Note: CI also runs `node scripts/copy-wiki.js` as a separate explicit step before `npm run build`, so the copy happens twice in CI (once manually, once via prebuild). See `.github/workflows/deploy.yml`.

## Configuration Files

| File | Purpose |
|---|---|
| `web/next.config.ts` | `output: "export"`, `trailingSlash: true`, `basePath: "/real-estate-wiki"`, `images.unoptimized: true` |
| `web/tsconfig.json` | TS compiler options, `@/*` path alias |
| `web/eslint.config.mjs` | Flat ESLint config |
| `web/postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `web/.gitignore` | Standard Next.js ignores, `.env*` |
| `.github/workflows/deploy.yml` | CI/CD (see INTEGRATIONS.md) |
| `.mcp.json` (repo root) | MCP server config — declares a local `docling` MCP server via `uvx --from=docling-mcp docling-mcp-server`. Developer tooling, not runtime. |

## Platform Requirements

**Development:** Node 22, npm. `npm run dev` serves from `http://localhost:3000`. Because `basePath: "/real-estate-wiki"` is set, local URLs are prefixed with `/real-estate-wiki`. `wiki.ts` falls back to `../wiki` when `wiki-data/` is absent, so dev works without running prebuild — but search/quiz/source JSON must be rebuilt when wiki content changes.

**Production:** Static HTML export (`web/out/`) served from GitHub Pages at basePath `/real-estate-wiki`. No server runtime. Images are unoptimized (required by static export).

---

*Stack analysis: 2026-04-10*
