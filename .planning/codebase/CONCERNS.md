# Concerns: Tech Debt, Bugs, Security, Performance, Fragility

**Analysis Date:** 2026-04-10

This document catalogs what could go wrong. Items are grouped by severity, each with a concrete file path, an observed or hypothesized impact, and a suggested mitigation. Several items are already documented in `memory/feedback_lessons.md` as incidents that actually happened — those are marked **[RECURRING]**.

> **Scope note:** this is a content-first static-export site with a tiny dynamic surface. Many items that would be critical in a server-rendered SaaS are not critical here. Priority reflects *the actual product shape*, not a generic checklist.

---

## Severity Legend

- 🔴 **High** — likely to cause user-visible breakage or data loss
- 🟡 **Medium** — silent regressions, maintenance burden, or bounded exposure
- 🟢 **Low** — cosmetic, speculative, or easily recoverable

---

## 🔴 HIGH

### H1 · `wiki/` ↔ `web/wiki-data/` silent drift  **[RECURRING]**
- **Files:** `wiki/**/*.md`, `web/wiki-data/**/*.md`, `web/scripts/copy-wiki.js`
- **Observed:** 2026-04-08 — a law-text correction was edited only in `web/wiki-data/` and was overwritten by the next build from `wiki/`, silently losing the fix.
- **Root cause:** `web/wiki-data/` is a build-time mirror, not an independent source. There is no enforcement that prevents direct edits.
- **Mitigation in place:** documented in `memory/feedback_lessons.md` §5; agents (including me on the 2026-04-10 keyword ingest) now run `node web/scripts/copy-wiki.js` after every `wiki/` change.
- **Hard fix:** add a tripwire to `copy-wiki.js` that hashes the destination before writing and fails if the destination is newer than the source (indicates out-of-band edit). Or make `web/wiki-data/` a gitignored build artifact (currently committed, which is the root of the confusion — see M1).

### H2 · Hard-coded Supabase anon key in source
- **File:** `web/src/lib/supabase.ts` (lines 3–5)
- **Observed:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are string constants, not `process.env` reads. The anon JWT expires `2090-xx-xx` per its payload.
- **Why it's acceptable:** this is the **anonymous** key, and it is the correct key to ship in a static-export client. The actual security boundary is Row-Level-Security policies and `SECURITY DEFINER` functions on the Supabase side, gated by the `session_token` passed as `p_token` to every RPC.
- **Why it's still a concern:**
  - (a) Rotating the Supabase project requires a source edit + rebuild + redeploy — there is no env-based switch. A compromised JWT cannot be invalidated without a code change.
  - (b) A developer who doesn't understand RLS might accidentally grant the anon key a privileged role on the Supabase side, and this repo gives no hint that's dangerous.
  - (c) The Supabase schema and policies **are not in this repo**. If they change or are misconfigured, there is no local reproduction.
- **Mitigation:** add a `README` block in `supabase.ts` explaining that the key is safe *only because of RLS*, and that the Supabase schema/policies must be version-controlled separately.

### H3 · No E2E / link-check validation before deploy
- **Files:** `.github/workflows/deploy.yml`, `web/scripts/*.js`
- **Observed:** CI runs `npm ci` → `copy-wiki.js` → `npm run build` → deploy. No lint, no type-check-only, no link check, no smoke test. A broken wikilink, a malformed frontmatter, or a runtime error on an un-visited page will ship.
- **Concrete risk:** the keyword ingest on 2026-04-10 added `[[이중매매]]`, `[[점유취득시효]]`, `[[산지관리법]]` cross-references in the index. If any target file had been misnamed, the build would still succeed and the broken link would only surface when a user clicked it.
- **Mitigation:** add the Tier 1 validators from `TESTING.md` §4 to `prebuild`. Specifically, a `check-wikilinks.js` that walks every `[[...]]` in `wiki/` and asserts the target exists. Cost: ~50 lines of Node, zero new dependencies.

---

## 🟡 MEDIUM

### M1 · `web/wiki-data/` is committed to git
- **File:** entire `web/wiki-data/` tree (verified via `git status` in this session — edits there are tracked)
- **Observed:** every wiki content change produces a double commit (once in `wiki/`, once in `web/wiki-data/`). The 2026-04-10 keyword ingest touched 14 files for what was logically 8 file operations.
- **Why it exists:** historical — before `copy-wiki.js` ran reliably, committing the mirror ensured GitHub Pages had the content.
- **Impact:** inflates commit size, adds merge conflict surface, and is the root cause of H1 (agents see `web/wiki-data/` in `git status` and edit it directly).
- **Mitigation:** add `web/wiki-data/` to `.gitignore`, remove from history with `git rm -r --cached`, and trust the CI pipeline (which already runs `copy-wiki.js` before build). Low-effort, high-leverage cleanup.

### M2 · Korean IME character loss in search  **[RECURRING]**
- **File:** `web/src/app/components/SearchFilter.tsx`
- **Observed:** documented in `memory/feedback_lessons.md` §3 — React controlled inputs drop characters during Hangul composition if `onCompositionStart` / `onCompositionEnd` handlers are missing or if `isComposing` is not used to guard `onChange`.
- **Current state:** `SearchFilter.tsx` is 392 lines, loaded via the `dynamic({ ssr: false })` indirection through `SearchWrapper.tsx`, suggesting the pattern has been applied — but there is no test to prevent regression.
- **Mitigation:** a Playwright test that types Korean characters and asserts the query state matches the typed string. Non-trivial to set up, but a one-line regression in this file would ship silently without it.

### M3 · basePath is hard-coded in multiple call sites  **[RECURRING]**
- **Files:** `web/next.config.ts` (line 6), `web/src/app/page.tsx`, `web/src/app/wiki/[slug]/page.tsx` (passes `"/real-estate-wiki"` to `renderMarkdown`), `web/src/app/components/SearchWrapper.tsx` (accepts as prop)
- **Observed:** documented in `memory/feedback_lessons.md` §2 — `Link` auto-prepends basePath, but `fetch()` does not, so basePath must be passed manually to anything that loads JSON. Several callsites duplicate the string literal.
- **Concrete risk:** renaming the repository (and thus the basePath) requires grep+replace across multiple files. Easy to miss one and ship broken search or broken markdown links.
- **Mitigation:** export `BASE_PATH` as a constant from `web/src/lib/config.ts` (file does not currently exist) and import everywhere. Zero-risk refactor.

### M4 · OX-quiz parser fragility  **[RECURRING]**
- **File:** `web/scripts/build-quiz-data.js`
- **Observed:** documented in `memory/feedback_lessons.md` §7 — the parser handles three different OX-section formats with regex, and has to account for nested parentheses in Korean content (e.g., `정(+)의 레버리지`), trailing metadata like `- 감정평가사 2025 출제`, and both inline (`→ **X** (해설)`) and block (`> **X** — 해설`) answer formats.
- **Concrete risk:** every OX question in a wiki page is parsed into `public/quiz-data.json` at build time. A regex miss silently drops a question. The quiz page renders only what the parser emitted — there is no source-of-truth check.
- **Mitigation:** snapshot test the parser output against a fixture wiki page with all three formats. Part of Tier 1 in `TESTING.md`.

### M5 · `dangerouslySetInnerHTML` with `sanitize: false`
- **Files:** `web/src/lib/wiki.ts` (`.use(html, { sanitize: false })`), `web/src/app/components/ContentGate.tsx` (line 40, `dangerouslySetInnerHTML={{ __html: html }}`)
- **Observed:** markdown is rendered to HTML with sanitization explicitly disabled, then injected via `dangerouslySetInnerHTML` into the page.
- **Why the current state is defensible:** the markdown comes from `wiki/**/*.md`, which is author-controlled content in the same repo. There is no user-submitted content pipeline. An attacker would need write access to the repo to inject HTML — at which point they already have full control.
- **Why it's still a concern:**
  - (a) If the project ever adds user-generated content (comments, forum, user corrections, LLM-suggested edits), this becomes an XSS vector overnight with no diff to the render path.
  - (b) The `sanitize: false` decision is not commented in `wiki.ts`, so a future contributor removing it would break embedded `<details>` / `<summary>` tags, etc., and might not know why.
- **Mitigation:** add a comment in `wiki.ts` documenting *why* sanitization is off and under what conditions it must be re-enabled. If user-generated content is ever added, sanitize that specific path with `rehype-sanitize` or equivalent before merging.

### M6 · `useAuth` hydration reconciliation is fragile
- **File:** `web/src/lib/useAuth.ts`
- **Observed:** the hook reconciles two auth sources — `localStorage.eduland_member` and `supabase.auth.getUser()` — and has to avoid `INITIAL_SESSION` null events clobbering an Eduland login. Recent commits (`fe46d44 OX 퀴즈 로그인 게이트 수정 — 동기 인증 재확인`) suggest this has gone wrong at least once.
- **Impact:** incorrect auth state can reveal gated content to non-members, or hide content from paid members. Both are noticeable but not catastrophic.
- **Mitigation:** unit-test `useAuth` with React Testing Library + mock `supabase.auth` + mock `localStorage`. Tier 2 in `TESTING.md`.

### M7 · CI runs `copy-wiki.js` twice
- **File:** `.github/workflows/deploy.yml`
- **Observed:** the workflow runs `node scripts/copy-wiki.js` explicitly as its own step, then `npm run build`, which triggers `prebuild`, which also runs `copy-wiki.js`. The second run overwrites the first with identical content.
- **Impact:** harmless (idempotent) but confusing — a reader could reasonably assume the explicit step does something different.
- **Mitigation:** delete the explicit step (prebuild suffices) OR add a comment explaining it is a belt-and-braces safeguard. 30 seconds of work either way.

### M8 · No logging or error telemetry
- **Observation:** there is no Sentry, PostHog, LogRocket, or equivalent. Error-handling in `web/src/lib/wikiStorage.ts` silently swallows RPC failures and falls back to localStorage. If every bookmark RPC started failing tomorrow, no one would know until a user complained or the operator happened to test.
- **Impact:** unknown blast radius — you can't see what you can't measure.
- **Mitigation:** for a static-export hobby site, a full telemetry stack is overkill. A minimal fix: log Supabase RPC errors to a dedicated Supabase table (`client_errors`) via a separate RPC that the client can fail-and-forget. Cost: one Postgres table + one function + ~10 lines in `wikiStorage.ts`.

---

## 🟢 LOW

### L1 · Unused dependencies / config remnants
- **Files:** `web/public/file.svg`, `web/public/globe.svg`, `web/public/next.svg`, `web/public/vercel.svg`, `web/public/window.svg` — the standard Next.js starter placeholder icons, not referenced from any page.
- **Impact:** a few KB of dead assets in the static export. Confusing for a new reader.
- **Mitigation:** delete them.

### L2 · `ProgressDashboard.tsx` may be dead code
- **File:** `web/src/app/components/ProgressDashboard.tsx` (219 lines)
- **Observation:** `memory/feedback_lessons.md` §8 states *"학습 현황 대시보드: 사용자별 관리 불필요, 메인에서 제거"*. The component file still exists and is unreferenced by `page.tsx`.
- **Mitigation:** if confirmed unused via `grep -r "ProgressDashboard" web/src`, delete the file. Small but the directory listing currently lies about what's wired up.

### L3 · `web/src/components/` (capital) vs `web/src/app/components/` confusion
- **Observed:** directory listing shows both `web/src/components/` and `web/src/app/components/`. The second is actively used (`AuthModal`, `ContentGate`, etc.). The first was not inspected in this scan — **unclear whether it contains anything or is empty / stale**.
- **Mitigation:** verify and consolidate. If `web/src/components/` is empty, delete. If it has content, move it next to its siblings to avoid the two-directories-for-the-same-thing trap.

### L4 · Tailwind v4 form-element color reset  **[RECURRING]**
- **Observation:** documented in `memory/feedback_lessons.md` §4 — Tailwind v4 preflight resets form input colors to `inherit`, requiring explicit `color` on every `<input>`/`<select>`. Regressions would be low-visibility (text invisible against background).
- **Mitigation:** add a global rule in `web/src/app/globals.css` that forces `color: var(--foreground)` on form elements, documented with a `/* Tailwind v4 preflight override */` comment.

### L5 · No type for Eduland member response
- **File:** `web/src/app/components/AuthModal.tsx` (calls `verify_member` RPC)
- **Observation:** the response shape `{ ok, mem_id, mem_name, session_token, expires_at }` is inferred at call sites, not declared as a type. `wikiStorage.ts` has its own `EdulandMember` interface (line 16) that partially overlaps but does not match.
- **Impact:** type drift if the Supabase function signature changes. Not catastrophic because strict mode catches obvious misuses.
- **Mitigation:** define `types/eduland.ts` with a single authoritative interface, import in both files.

### L6 · `npm run lint` is unwired
- **File:** `web/package.json` (`"lint": "eslint"`)
- **Observation:** a lint script exists but nothing (CI, prebuild, git hook) invokes it. Lint warnings accumulate silently.
- **Mitigation:** add `npm run lint` to CI, or to `prebuild`, or both.

### L7 · Python tools and Node app share no version pinning
- **File:** `tools/*.py`
- **Observation:** no `requirements.txt`, no `pyproject.toml`, no `.python-version`. The Python tools that convert PDFs in `sources/` to text assume whatever `python3` is on `PATH` and whatever Docling + PyMuPDF versions happen to be installed.
- **Impact:** a future reinstall could produce different extractions than the ones currently in `sources/*/extracted/*.txt`, and we'd have no way to reproduce the originals.
- **Mitigation:** add a minimal `tools/requirements.txt` with loose version pins, even if only as documentation. The extraction step is run rarely enough that this is low urgency.

### L8 · `.mcp.json` depends on `uvx` being installed globally
- **File:** `.mcp.json`
- **Observation:** declares a `docling-mcp` server via `uvx --from=docling-mcp docling-mcp-server`. Developers without `uv` installed will silently miss this tool.
- **Mitigation:** document the `uv` prerequisite in the top-level README (which does not currently exist at the repo root — `web/README.md` is the Next.js default).

---

## Cross-Cutting Observations

### There is no root-level `README.md`
- `web/README.md` is the default Next.js starter file and describes only the Next.js app. The repo root has `CLAUDE.md` (the wiki schema) but nothing that explains to a human what the project is, how the three-layer content pipeline works, or how to onboard.
- **Mitigation:** write a short `README.md` at the repo root linking to `CLAUDE.md` (for the content schema) and `web/README.md` (for the web app).

### Single-developer workflow has no safety net
- No PR review, no pre-commit hooks, no test suite, no lint gate. The only thing standing between a bad commit and production is the developer's own build-and-eyeball loop.
- **Assessment:** this is probably the right tradeoff for the current team size. Worth revisiting the moment a second contributor joins, or the moment a regression ships to users.

### Content-correctness risk dwarfs code risk
- The most likely thing to break this product is **incorrect legal information in a wiki page**, not a code bug. The current mitigations (textbook-sourced content, LLM self-verification, OX quiz double-checking) are specifically designed for this risk. They are the right tools for the problem.
- **Assessment:** keep investing in content QA workflows over code test workflows until the balance of risk shifts.

---

## Prioritized Action List

If time is limited, address in this order:

1. **Add `check-wikilinks.js`** to `prebuild` (H3) — prevents the most likely class of silent deploy regression
2. **Add tripwire to `copy-wiki.js`** or gitignore `web/wiki-data/` (H1, M1) — eliminates the recurring drift incident
3. **Extract `BASE_PATH` constant** (M3) — trivial, pays back on first basePath change
4. **Delete unused starter assets** (L1, L2, L3) — low-effort cleanup that improves directory clarity
5. **Add `web/README.md` → root `README.md`** — onboarding
6. **Snapshot-test OX-quiz parser** (M4) — once a test framework is added
7. **Everything else** — wait for the triggering condition

---

*Concerns snapshot: 2026-04-10*
