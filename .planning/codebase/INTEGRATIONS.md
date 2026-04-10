# External Integrations

**Analysis Date:** 2026-04-10

This project is a static-exported Next.js site. Its external-service surface is intentionally tiny: one database/auth provider (Supabase), one hosting target (GitHub Pages), two CDN-hosted webfonts, and one optional developer-side MCP server.

## Summary Table

| Category | Service | Configured in | Purpose |
|---|---|---|---|
| Auth + database | Supabase | `web/src/lib/supabase.ts` | Eduland member login verification, wiki bookmarks, page-visit tracking |
| Hosting | GitHub Pages | `.github/workflows/deploy.yml`, `web/next.config.ts` | Static site hosting under basePath `/real-estate-wiki` |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` | Build + deploy on push to `master` |
| Webfonts | Google Fonts (Noto Sans KR) | `web/src/app/layout.tsx` | Korean UI typography |
| Webfonts | jsDelivr (Pretendard) | `web/src/app/layout.tsx` | Korean UI typography |
| Math rendering CSS | KaTeX (bundled, not CDN) | `web/src/app/layout.tsx` | `import "katex/dist/katex.min.css"` |
| Marketing link | `eduland.or.kr` | `web/src/app/page.tsx`, `AuthModal.tsx` | Outbound signup link only |
| Developer MCP | `docling-mcp` (local, via `uvx`) | `.mcp.json` | Document conversion tooling (not runtime) |

There is **no** Stripe, AWS, Sentry, PostHog, Vercel Analytics, Resend, OpenAI, or other third-party SDK. No webhooks (incoming or outgoing). No email service. No CDN beyond GitHub Pages + the two webfont CDNs above.

## Supabase (auth + database)

**Client:** `@supabase/supabase-js` `^2.102.1`.

**Instantiation:** `web/src/lib/supabase.ts`
- URL and anon key are **hard-coded** in source (`https://cbdtkygmtjtfuqzzpaep.supabase.co` + anon JWT). Not sourced from `process.env`. This is consistent with a purely static export that has no runtime env injection and only uses the anon key with Row-Level-Security / SECURITY DEFINER functions on the server side.
- No `.env` file present in `web/` (`.env*` is gitignored; only the hard-coded anon constants ship).

**Used in:**
- `web/src/lib/useAuth.ts` — `supabase.auth.getUser()` + `supabase.auth.onAuthStateChange()` as a fallback to the primary localStorage-based Eduland login.
- `web/src/lib/wikiStorage.ts` — calls to Supabase RPCs:
  - `wiki_list_bookmarks(p_token)`
  - `wiki_toggle_bookmark(p_token, p_page_slug, p_page_title)`
  - `wiki_is_bookmarked(p_token, p_page_slug)`
  - `wiki_record_visit(p_token, p_page_slug, p_page_title)`
- `web/src/app/components/AuthModal.tsx` — `supabase.rpc("verify_member", { p_mem_id, p_password })` for Eduland member login. On success, the server returns `{ ok, mem_id, mem_name, session_token, expires_at }` which is stored in `localStorage.eduland_member`.

**Authentication model (observed):**
- **Primary path:** Eduland member verification via the `verify_member` RPC. The issued `session_token` is stored in `localStorage` under key `eduland_member` with a 30-day TTL. `session_token` is passed as `p_token` to all `wiki_*` RPCs, which are evidently `SECURITY DEFINER` server-side (the client only holds the anon key).
- **Fallback path:** Native Supabase auth (`supabase.auth.getUser()`), though no UI path to create Supabase-auth users was observed. `useAuth` re-checks both paths whenever auth state changes to avoid `INITIAL_SESSION` null events clobbering an Eduland login.
- **Offline fallback:** If no token is present or RPCs error, `wikiStorage.ts` falls back to plain `localStorage` (`wiki-bookmarks`, `wiki-bookmark-titles`, `wiki-page-visits`).

**Schema (inferred from RPC signatures, not directly verified):**
- Some table of `(user/token) × (page_slug, page_title, created_at)` backs `wiki_list_bookmarks`.
- Some visit log backs `wiki_record_visit`.
- An Eduland members table + session-token table backs `verify_member`.
- **Unclear — needs verification:** the actual Postgres schema, RLS policies, and `SECURITY DEFINER` function bodies are not in this repo. They live in the Supabase project and must be inspected there.

## Hosting: GitHub Pages

**Deployment target:** GitHub Pages, branch-based.

**Configured in:**
- `web/next.config.ts` — `output: "export"`, `trailingSlash: true`, `basePath: "/real-estate-wiki"`, `images.unoptimized: true`. This pins the site to `https://<owner>.github.io/real-estate-wiki/`.
- `.github/workflows/deploy.yml` — build + deploy job.

**Pipeline (from `deploy.yml`):**

```
on: push to master
permissions: contents:read, pages:write, id-token:write
concurrency: group "pages", cancel-in-progress: false

jobs:
  build (ubuntu-latest):
    - actions/checkout@v4
    - actions/setup-node@v4 (node 22, cache npm from web/package-lock.json)
    - npm ci                          (working-directory: web)
    - node scripts/copy-wiki.js       (working-directory: web)    ← explicit sync step
    - npm run build                   (working-directory: web)    ← also triggers prebuild
    - actions/upload-pages-artifact@v3 with path: web/out
  deploy (ubuntu-latest, needs: build):
    - actions/deploy-pages@v4
```

Note the explicit `node scripts/copy-wiki.js` step duplicates work already done by `npm run prebuild`. Not harmful — the second run just overwrites `web/wiki-data/` with the same content — but it means the sync happens twice in CI.

**Base path handling:** `basePath: "/real-estate-wiki"` is also hard-coded in several client call sites (e.g. `web/src/app/wiki/[slug]/page.tsx` calls `renderMarkdown(page.content, "/real-estate-wiki")`, and `web/src/app/page.tsx` passes `basePath="/real-estate-wiki"` to `SearchWrapper`). Changing the basePath requires edits in multiple files, not only `next.config.ts`.

## CI/CD: GitHub Actions

**Workflows present:** only `.github/workflows/deploy.yml` (see above).

**Secrets / environment variables used by CI:** none that I can observe. No `${{ secrets.* }}` references — Supabase anon key is baked into source, and GitHub Pages deployment uses the GitHub-provided OIDC token (`id-token: write`).

**No other CI:** no lint step, no test step, no type-check step in CI. `npm run lint` exists as a script but is not wired into the workflow.

## Webfonts

Loaded via `<link rel="stylesheet">` in `web/src/app/layout.tsx`:
- **Google Fonts — Noto Sans KR** (weights 300/400/500/600/700). `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:...`
- **Pretendard** via jsDelivr. `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`

Both are loaded with `<link rel="preconnect">` hints to `fonts.googleapis.com` and `fonts.gstatic.com`.

## Markdown / Math

Not external services — these are build-time libraries — but noted here because they affect rendered output:
- **remark + remark-gfm + remark-html** — used in `web/src/lib/wiki.ts` with `html({ sanitize: false })` (content is trusted because it is author-controlled markdown in the same repo).
- **KaTeX** — invoked directly on HTML output in `wiki.ts` for `$...$` and `$$...$$` math; CSS imported via `import "katex/dist/katex.min.css"` in `layout.tsx`.

## Developer MCP Server

`.mcp.json` at the repo root declares a single MCP server:

```json
{
  "mcpServers": {
    "docling": {
      "command": "uvx",
      "args": ["--from=docling-mcp", "docling-mcp-server"]
    }
  }
}
```

This is a **developer-side** conversion helper (Docling MCP for parsing PDFs / DOCX into markdown). It is not used at runtime by the site and does not appear in the production bundle. It complements the Python scripts in `tools/` that convert raw textbook/law files in `sources/` into `.txt` and `.md` extractions.

## Outbound Links (informational)

`https://eduland.or.kr` (banner ad on homepage) and `https://eduland.or.kr/main/mypage/login.php` (signup CTA in `AuthModal.tsx`) are plain `<a>` tags — not API integrations.

## Environment Variables

**Runtime env vars:** none required. `.env*` is gitignored; the Supabase anon key is hard-coded in `web/src/lib/supabase.ts` and the GitHub Pages basePath is hard-coded in `web/next.config.ts`. A deploy to a different Supabase project would require editing source, not setting env vars.

**Unclear — needs verification:** whether server-side Supabase objects (tables, RPCs, policies) are version-controlled anywhere outside this repo. They are not in the repo.

---

*Integration audit: 2026-04-10*
