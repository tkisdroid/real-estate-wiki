# Testing

**Analysis Date:** 2026-04-10

## TL;DR

**There are no automated tests in this repository.** No unit tests, no integration tests, no E2E tests, no snapshot tests, no contract tests. Quality assurance is entirely **manual review + content correctness verification**, which is an informed choice given the product shape (static content wiki with a tiny dynamic surface).

This document is therefore mostly a **gap analysis**: what exists in place of tests, what the risks are, and what a minimal test scaffold would cover if one were added.

---

## 1. Detected Test Infrastructure

| Item | Status |
|---|---|
| Test framework installed | **None** — verified via grep of `web/package.json` (no `jest`, `vitest`, `mocha`, `ava`, `tap`, `uvu`) |
| E2E framework installed | **None** (no `playwright`, `cypress`, `puppeteer`, `@testing-library/*`) |
| Test files | **None** — `find web/src -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__"` returns zero hits |
| Test config files | **None** — no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*` |
| Test script in `package.json` | **None** — `scripts` section has `dev`, `prebuild`, `build`, `start`, `lint`, `wiki:promote` only |
| CI test step | **None** — `.github/workflows/deploy.yml` has `npm ci` + `copy-wiki.js` + `npm run build`, no test or lint step |
| Coverage tooling | **None** |
| Type-check script | **None explicit** — `tsc --noEmit` is implicit via `next build` only |

---

## 2. What Fills the Gap

The project relies on four compensating practices, each visible in-repo:

### (a) TypeScript strict mode as first line of defense
`web/tsconfig.json` sets `strict: true`, and `next build` runs type-checking as part of the build. A type error fails CI because it fails the build, even though there is no dedicated type-check step. This catches most structural bugs before they ship.

### (b) The wiki content itself is the product
The majority of "bugs" in this codebase would be **content errors** (wrong dates, misquoted laws, incorrect quiz answers), not code errors. The project addresses this through:
- **Mandatory self-verification rule** in `CLAUDE.md`: *"내용이 틀린점이 있어서는 절대 안되므로, 내용이 생성될 때마다, 자체검증을 실시하고, 틀릴경우 web search를 이용해서 내용을 검증합니다."*
- **Source citations** in every concept page's `sources:` frontmatter field (usually `에듀랜드 2026 [과목] 기본서`)
- **Textbook cross-reference** during ingest — content is derived from `sources/textbooks/**/extracted/*.txt`, and the LLM is instructed not to invent content outside the textbook (`교재에 없는 내용을 임의로 추가하지 않는다`)
- **Per-page OX quiz sections** (5–10 questions each) that double as **self-checking unit tests for the content** — if an OX answer is wrong, that's a content regression

### (c) Build-time content validation
The prebuild scripts in `web/scripts/` are functional integration checks:
- `copy-wiki.js` fails loudly (`process.exit(1)`) if `wiki/` is missing
- `build-search-index.js` will throw on malformed frontmatter (implicit via `gray-matter`)
- `build-quiz-data.js` parses the OX blocks; schema drift will silently drop questions but won't crash the build (**fragility — see `CONCERNS.md` §4**)
- `build-source-index.js` walks `sources/**/extracted/*.txt`

A broken wiki page fails the build at one of these prebuild steps before Next.js ever sees it.

### (d) Manual QA via the deployed site
Changes are deployed to `https://<owner>.github.io/real-estate-wiki/` on every push to `master`. The operator verifies them by loading the live site. Because the site is small (a few dozen routes of actual runtime interest), spot-checking is tractable.

---

## 3. What Is NOT Being Tested (Risk Surface)

Because of the above gap, the following classes of regressions would ship silently until a human notices:

| Risk area | Why untested | Would be caught by |
|---|---|---|
| **Wikilink rewriting** in `web/src/lib/slugMap.ts` — broken `[[link]]` → `<a>` transformations | No test runner | Unit test of `renderMarkdown` with fixture markdown |
| **Korean IME handling** in `SearchFilter.tsx` — dropped characters during composition | Manual only | Playwright with IME composition events |
| **Auth reconciliation** in `useAuth.ts` — the two-path Eduland + Supabase reconciliation is documented as fragile (see `feedback_lessons.md`) | No test runner | React Testing Library hook test |
| **Bookmark fallback chain** in `wikiStorage.ts` — every function has a "Supabase primary, localStorage fallback" path; neither branch is exercised in CI | No test runner | Vitest with mocked `supabase` + `localStorage` |
| **OX quiz parser** in `build-quiz-data.js` — the regex-based parser has three documented OX formats and nested-parens edge cases (`feedback_lessons.md` §2); drift drops questions silently | No test runner | Snapshot test of parser output against fixture wiki pages |
| **basePath** correctness — `"/real-estate-wiki"` is hard-coded in multiple files; a missed site can produce broken links only when deployed | No link checker | Build-time link validator or Playwright smoke test |
| **Content correctness** (legal facts, numbers, dates) | No oracle — only the textbook | LLM self-verification + manual review; already the practice |
| **Hydration mismatches** from Tailwind v4 form-element resets and server/client divergence | No SSR/CSR snapshot comparison | Next.js `next-dev-overlay` warnings during manual QA |

---

## 4. What a Minimal Test Scaffold Would Look Like

If the project ever adds tests, the minimum-viable setup should match the project's existing philosophy (small surface, static export, single developer). A recommended shape:

### Tier 1 — Build-time invariant checks (no test framework required)
Add to `prebuild` pipeline, runs on every build + push:
1. **Wikilink validator** (`web/scripts/check-wikilinks.js`) — walks every `[[link]]` in `wiki/`, confirms target exists, fails the build on dangling links
2. **Frontmatter schema check** (`web/scripts/check-frontmatter.js`) — every concept page must have `title`, `category`, `subject`, `sources`, `created`, `updated`, `importance`
3. **OX block parse check** (`web/scripts/check-ox-parse.js`) — run the OX parser and assert ≥5 questions per concept page (per the CLAUDE.md rule)
4. **Required sections check** — every concept page must contain `## 핵심 암기 포인트`, `## OX 퀴즈`, `## 함정 노트`

These cost nothing in dependencies (plain Node + `gray-matter`) and directly protect the most common regression surface.

### Tier 2 — Unit tests for library code (Vitest)
If only one test framework is added, **Vitest** fits best: zero-config, ESM-native, fast on small projects, no new Babel/Jest plumbing in this Next.js 16 + TypeScript setup.

Targets in order of leverage:
1. `web/src/lib/slugMap.ts` — pure function, straightforward fixtures
2. `web/src/lib/wiki.ts` — `renderMarkdown` with a small fixture directory
3. `web/src/lib/koreanSearch.ts` — Hangul decomposition edge cases (trivial to fixture)
4. `web/src/lib/tocStructure.ts` — tree construction from frontmatter
5. `web/src/lib/wikiStorage.ts` — mock Supabase client + mock `localStorage`, exercise fallback chains

### Tier 3 — Smoke E2E (Playwright)
A single Playwright test that:
1. Builds the site with `npm run build`
2. Serves `web/out/` with `npx serve -l 4000`
3. Visits the homepage, then a representative wiki page, then the quiz page
4. Asserts: page title renders, no hydration warnings in console, one bookmark toggle round-trips through localStorage

This alone would catch ~80% of the fragile-area regressions listed in `CONCERNS.md`.

### Tier 4 — Supabase contract tests
The actual Postgres schema and `SECURITY DEFINER` functions live in the Supabase project, **not in this repo**. Meaningful testing of bookmarks/visits would require either:
- Committing SQL migrations to this repo and running them against a local Supabase container in CI
- Creating a Supabase preview environment per PR

Both are out of scope for the current one-dev / static-site setup, and neither is recommended until the dynamic surface grows.

---

## 5. Mocking Patterns (Hypothetical)

Since no tests exist, no mocking patterns are established. If tests are introduced, the natural shapes would be:

- **Supabase:** swap `web/src/lib/supabase.ts` via `vi.mock("@/lib/supabase")` returning a hand-rolled stub that implements only the `rpc` method
- **localStorage:** use `happy-dom` (Vitest default) — no explicit mock needed
- **File system for `wiki.ts`:** point `WIKI_DIR` at a `test/fixtures/wiki/` directory instead of mocking `fs`
- **Markdown fixtures:** commit 2–3 representative concept pages under `test/fixtures/wiki/concepts/` rather than generating them in-test

---

## 6. Coverage Philosophy (If Added)

Given the project shape, any coverage goal should be **library-code-only** (`web/src/lib/*.ts`) with perhaps a ≥80% line target. Testing React components in a static-export app with no dynamic data surface returns diminishing value fast — the ROI is all in `lib/` and in the prebuild scripts.

**Do not test:**
- Markdown content (that's the content review job, not CI)
- Tailwind class application
- Next.js routing (Next handles that)
- `web/src/app/*/page.tsx` internals (integration-testing static pages has near-zero information value)

---

## 7. Current Verification Workflow (Observed)

Derived from the git log and commit messages: the operator's actual QA loop is:

1. Make code/content change on `master`
2. `npm run build` locally (catches type errors and prebuild script failures)
3. `git push`
4. Wait for GitHub Actions deploy
5. Manually open the affected page(s) on the live site
6. If broken: revert or push a fix

For content changes, step 2 additionally triggers self-verification against the textbook per `CLAUDE.md`'s rule. This loop is acceptable at the current scale but has no safety net — a bug that manifests only on a page the operator doesn't visit will ship undetected until a user reports it.

---

## 8. Decision: Do Nothing (For Now)

The current state — **zero tests** — is documented not as a bug but as a **deliberate tradeoff**. Adding tests costs dependency surface, CI time, and maintenance; the project's actual failure modes (content correctness, wiki-to-web-data drift, Korean IME edge cases) are not well served by standard unit-test tooling.

**The single highest-leverage addition** would be Tier 1: a **build-time link + frontmatter + OX-block validator** written as plain Node scripts in `web/scripts/check-*.js` and added to `prebuild`. No new dependencies. No new CI step. Protects the specific regressions that have actually happened (`feedback_lessons.md`).

Everything beyond Tier 1 should wait until the project grows a second contributor or a complex dynamic feature.

---

*Testing snapshot: 2026-04-10*
