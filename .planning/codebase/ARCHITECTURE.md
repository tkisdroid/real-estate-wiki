# Architecture

**Analysis Date:** 2026-04-10

This project is a **content-first wiki** with a thin Next.js presentation layer. The critical architectural fact is the **three-layer content pipeline**: raw materials → curated markdown → build-time copy consumed by the web app. Understanding this pipeline is more important than understanding the Next.js app itself.

> ⚠️ **Next.js 16 caveat:** `web/AGENTS.md` explicitly warns that this version of Next.js has breaking API changes from public documentation. Every Next.js detail below was observed in-repo; none was inferred from general Next.js knowledge.

---

## 1. Three-Layer Content Pipeline

```
┌─────────────┐    LLM curation    ┌─────────┐   copy-wiki.js   ┌────────────────┐
│  sources/   │  ───────────────►  │  wiki/  │ ───────────────► │ web/wiki-data/ │
│  (immutable │                    │ (source │   (prebuild)     │  (generated,   │
│   raw data) │                    │  of     │                  │   read by      │
│             │                    │  truth) │                  │   Next.js)     │
└─────────────┘                    └─────────┘                  └────────────────┘
```

### Layer 1 — `sources/` (immutable raw materials)
- Textbook PDFs + Docling/PyMuPDF extractions (`sources/textbooks/`)
- Law originals + extractions (`sources/laws/`)
- 22 years of past exam papers (`sources/exams/2005년 15회…` through `2025년 36회…`)
- Court case collections (`sources/cases/`), terminology (`sources/terms/`)
- Keyword study lists (`sources/빈출키워드.txt`, `sources/핵심키워드.txt`)
- **Invariant:** never modified by the web app or build pipeline. Only touched by human or by `tools/` Python conversion scripts.

### Layer 2 — `wiki/` (LLM-curated markdown, source of truth)
- Hand-curated by the LLM (Claude) following rules defined in the root `CLAUDE.md` schema.
- Structure: `subjects/`, `concepts/`, `laws/`, `practice/`, plus `index.md` and `log.md`.
- Every content page has YAML frontmatter (title, category, subject, parent, tags, importance, etc.) — parsed by `gray-matter` at build time.
- Obsidian-style `[[wikilinks]]` cross-reference concepts; the build pipeline rewrites these to Next.js URL slugs via `slugMap`.
- **Invariant:** `wiki/` is the canonical source. `web/wiki-data/` is derived.

### Layer 3 — `web/wiki-data/` (generated; read by Next.js)
- Produced by `web/scripts/copy-wiki.js` during `prebuild`: a plain recursive file copy from `wiki/` → `web/wiki-data/`.
- **Trap documented in memory:** if an agent edits only `web/wiki-data/`, the next build overwrites those changes from `wiki/`. Always edit `wiki/`; re-run `copy-wiki.js` if you need the web layer updated before a full build.
- Read by `web/src/lib/wiki.ts` — if `web/wiki-data/` exists, it is used; otherwise the library falls back to `../wiki` (dev mode without prebuild).

---

## 2. Build Pipeline

Defined in `web/package.json` scripts; `prebuild` runs automatically before `build`.

```
npm run build
  └─ prebuild:
      ├─ copy-wiki.js           wiki/        →  web/wiki-data/
      ├─ build-search-index.js  wiki-data/   →  public/search-index.json
      ├─ build-quiz-data.js     wiki-data/   →  public/quiz-data.json   (OX quiz blocks)
      └─ build-source-index.js  sources/…/extracted/*.txt → public/source-index.json
  └─ next build  (static export → web/out/)
```

**Key behaviors:**
- `build-search-index.js` produces a compact, Korean-text-friendly index (fields `u/t/s/c/i/tags/p/x`) consumed by `SearchWrapper` on the client.
- `build-quiz-data.js` parses the **OX quiz sections** out of every wiki page (per the required-section rule in `CLAUDE.md`) into a single JSON payload the quiz page hydrates.
- `build-source-index.js` samples paragraphs from the `*.txt` extractions under `sources/laws/extracted/` and `sources/textbooks/extracted/` so the search UI can fall back to raw textbook excerpts when no wiki hit is found.
- **CI duplicates the copy step:** `.github/workflows/deploy.yml` runs `node scripts/copy-wiki.js` explicitly, then `npm run build` runs it again via prebuild. Harmless (idempotent), but worth knowing if you trace the pipeline.

---

## 3. Web Application Architecture

### Rendering strategy
- **Static export** (`output: "export"` in `next.config.ts`).
- **Next.js App Router**, React 19 server components by default.
- All dynamic routes pre-rendered at build time via the standard App Router static-params convention (exact Next.js 16 API surface is unverified — see caveat).
- `basePath: "/real-estate-wiki"` for GitHub Pages sub-path deployment.
- `trailingSlash: true` (all URLs end in `/`), `images.unoptimized: true` (required for static export).

### Routes (under `web/src/app/`)
| Route | File | Purpose |
|---|---|---|
| `/` | `page.tsx` | Homepage — navigation hub, search entry, Eduland banner |
| `/wiki/[slug]/` | `wiki/[slug]/page.tsx` | Per-page wiki reader, rendered from `wiki-data/` via `wiki.ts` |
| `/quiz/` | `quiz/page.tsx` | OX quiz practice (member-gated) |

### Key libraries (`web/src/lib/`)
| File | Responsibility |
|---|---|
| `wiki.ts` | Read markdown from `wiki-data/` (or `../wiki` fallback), parse frontmatter, render to HTML via `remark` + `remark-gfm` + `remark-html` (`sanitize: false`) + direct KaTeX invocation for `$…$` / `$$…$$` math. |
| `slugMap.ts` | Map wiki file paths ↔ URL slugs; used by `renderMarkdown` to rewrite `[[wikilinks]]` into real `<a>` tags with the correct basePath. |
| `koreanSearch.ts` | Korean-aware search utilities (Hangul decomposition for matching). Consumed by `SearchFilter` / `SearchWrapper`. |
| `tocStructure.ts` | Table-of-contents tree construction from frontmatter `category` / `subject` / `parent`. |
| `subjects.ts` | Static 과목(subject) metadata for the six exam subjects. |
| `supabase.ts` | Supabase client (hard-coded URL + anon key — see `INTEGRATIONS.md`). |
| `useAuth.ts` | React hook bridging two auth paths: Eduland `localStorage` token + Supabase auth fallback. |
| `wikiStorage.ts` | Bookmarks + page-visit tracking. Supabase RPC primary, `localStorage` fallback when offline or un-authenticated. |

### Components (`web/src/app/components/`)
| File | Responsibility |
|---|---|
| `SearchWrapper.tsx` + `SearchFilter.tsx` | Client-side search UI fed by `public/search-index.json`. `SearchWrapper` is the `"use client"` boundary loaded with `dynamic({ ssr: false })` to avoid hydration issues with Korean IME input. |
| `AuthModal.tsx` | Eduland member login modal (`verify_member` RPC); outbound link to `eduland.or.kr` for signup. |
| `ContentGate.tsx` | Membership gate — hides wiki body until login verified, one-viewport tall per memory note. |
| `MobileSidebar.tsx` | Mobile-only navigation drawer. |
| `MyBookmarks.tsx` / `BookmarkButton.tsx` | Bookmark UI wired to `wikiStorage.ts`. |
| `OXQuizInteractive.tsx` | Quiz runtime consuming `public/quiz-data.json`. |
| `PageTracker.tsx` | Fires `wiki_record_visit` RPC (and localStorage fallback) on page view. |
| `ProgressDashboard.tsx` | Shows per-subject progress; not currently wired into the primary landing per memory note ("학습 현황 대시보드는 제거"). |

### Client/server boundary
- Server components (default) handle markdown reading and rendering in `/wiki/[slug]/page.tsx`.
- Any interactive component is marked `"use client"` and — critically — wrapped with `dynamic(() => import(…), { ssr: false })` from inside another `"use client"` wrapper file (e.g., `SearchWrapper.tsx`). This pattern is required because mixing `dynamic({ ssr: false })` directly in server components breaks hydration in this codebase (see `feedback_lessons.md`).

---

## 4. Data Flow at Runtime

### Reading a wiki page
```
User hits /wiki/foo/
  → Next.js serves pre-rendered static HTML from web/out/wiki/foo/index.html
  → HTML contains:
      • body markdown → HTML (remark + KaTeX, done at build time)
      • embedded <link> to katex.min.css and Korean webfonts
      • client islands: BookmarkButton, PageTracker, SearchWrapper, ContentGate
  → On hydration:
      • useAuth reads localStorage.eduland_member (+ Supabase fallback)
      • ContentGate either reveals or blocks the body
      • PageTracker fires wiki_record_visit (if authed)
      • BookmarkButton checks wiki_is_bookmarked
```

### Searching
```
SearchFilter input
  → koreanSearch over public/search-index.json (loaded once)
  → on miss: show raw hits from public/source-index.json (textbook paragraphs)
  → click result → standard Next.js Link → basePath-prefixed wiki URL
```

### Authenticated write operations
```
Eduland login (AuthModal)
  → supabase.rpc("verify_member", {...})
  → success: store session_token in localStorage (30-day TTL)
  → subsequent RPCs pass p_token for wiki_toggle_bookmark / wiki_record_visit
  → on RPC failure or no token: silent fallback to localStorage keys
    (wiki-bookmarks, wiki-bookmark-titles, wiki-page-visits)
```

---

## 5. Deployment Architecture

```
git push origin master
  └─ GitHub Actions (.github/workflows/deploy.yml)
      ├─ build job (ubuntu, node 22)
      │   ├─ checkout
      │   ├─ setup-node (cache: web/package-lock.json)
      │   ├─ npm ci              (cwd: web)
      │   ├─ node scripts/copy-wiki.js   (explicit — duplicates prebuild)
      │   ├─ npm run build       (cwd: web; runs prebuild + next build)
      │   └─ upload-pages-artifact (web/out)
      └─ deploy job (needs: build)
          └─ actions/deploy-pages@v4
  → https://<owner>.github.io/real-estate-wiki/
```

**No server runtime.** There is no Node process in production — only static files served from GitHub Pages. The only live backend is Supabase, called directly from the browser.

**No CI lint/test/type-check.** `npm run lint` exists but is not wired into the workflow, and there is no test framework installed. Quality gates are entirely pre-commit / human review.

---

## 6. Key Architectural Decisions & Trade-offs

| Decision | Benefit | Trade-off |
|---|---|---|
| Three-layer content pipeline (`sources/` → `wiki/` → `web/wiki-data/`) | Keeps raw materials immutable and curated content separately reviewable; allows LLM curation without touching the web app | Agents must remember `wiki/` is the source of truth — editing `web/wiki-data/` directly causes silent regressions |
| Static export over server rendering | Zero hosting cost (GitHub Pages), deterministic builds, fast page loads | Dynamic features (bookmarks, visits, auth) must run as client islands against Supabase |
| Hard-coded Supabase anon key + basePath | Simpler static-export story (no runtime env injection) | Environment-specific redeployments require source edits, not env-var flips |
| Two-path auth (Eduland primary, Supabase fallback) | Reuses existing Eduland membership without migrating users | `useAuth.ts` has to reconcile two sources on every change — fragile to hydration timing |
| `dynamic({ ssr: false })` inside `"use client"` wrappers | Avoids hydration failures for Korean IME inputs and client-only code | Extra indirection layer (e.g., `SearchWrapper → Search`); easy to forget and regress |
| OX quiz data extracted at build time | Runtime only loads one compact JSON; quiz page is fully offline after first load | Quiz parser must keep in sync with the markdown OX-section format — any schema drift silently drops questions |
| No test framework | Minimal tooling surface; LLM curation is validated by read-review | No regression safety net for rendering or search; CI cannot catch broken builds of the content pipeline itself |

---

## 7. Known Fragile Points

(Cross-referenced from `memory/feedback_lessons.md` and observed code.)

1. **`wiki/` vs `web/wiki-data/` drift** — always edit `wiki/`, then run `copy-wiki.js`. Incident 2026-04-08: law-text correction was lost because only `web/wiki-data/` was touched.
2. **Korean IME in controlled inputs** — requires `onCompositionStart`/`onCompositionEnd` handlers and an `isComposing` flag; regressions produce silently dropped characters.
3. **basePath duplication** — `Link` auto-prepends `basePath`, but `fetch()` does not; several call sites hard-code `"/real-estate-wiki"`, making basePath changes multi-file.
4. **Event handlers in server components** — Next.js 16 forbids `onError`/`onClick` in server components; must be moved into `"use client"` islands.
5. **Tailwind v4 form-element reset** — v4 preflight resets form colors to `inherit`; explicit `color` must be set on inputs/selects.
6. **OX-quiz parser fragility** — the parser in `build-quiz-data.js` uses regex over the markdown OX sections; three distinct OX formats exist (per feedback memory), and nested parentheses in Korean (e.g., `정(+)의`) require non-greedy handling.

---

*Architecture snapshot: 2026-04-10*
