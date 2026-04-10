# Code Conventions

**Analysis Date:** 2026-04-10

Conventions observed across the TypeScript/React code in `web/src/**`, the Node build scripts in `web/scripts/**`, and the markdown wiki in `wiki/**`. Every rule below is derived from actual files — not imported defaults.

> **Context:** Next.js 16 + React 19 + Tailwind v4 static export. No test framework. Single-developer project, Korean-language comments, exam-prep content domain.

---

## 1. Language & Compiler Settings

### TypeScript
- **strict: true** (`web/tsconfig.json`) — enforced across the app
- **noEmit: true** — Next.js handles emission
- **target: ES2017**, **module: esnext**, **moduleResolution: "bundler"**
- **jsx: "react-jsx"** — no explicit React import needed
- **Path alias `@/*` → `./src/*`** — used liberally: `import { useAuth } from "@/lib/useAuth"`
- **No `any`** observed in handwritten code; typed RPC response destructuring instead:
  ```ts
  // web/src/lib/wikiStorage.ts:65
  data.map((r: { page_slug: string; page_title: string; created_at: string }) => ({ ... }))
  ```
- **No `@ts-ignore` / `@ts-expect-error`** anywhere in `web/src/**` — verified via grep

### JavaScript (build scripts)
- `web/scripts/*.js` are **CommonJS** (`require()`), not ES modules — they run directly under Node with no bundler
- No TypeScript in scripts; they are small and pure file-I/O utilities

### ESLint
- **Flat config** (`web/eslint.config.mjs`) using `defineConfig` from `eslint/config`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Explicit `globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts'])` overrides the preset ignores
- **`lint` script exists** (`next lint` replacement: `eslint` directly) but is **NOT wired into CI** — linting is local-only

---

## 2. File & Directory Naming

| What | Convention | Example |
|---|---|---|
| Component files | PascalCase `.tsx` | `web/src/app/components/AuthModal.tsx` |
| Lib files | camelCase `.ts` | `web/src/lib/wikiStorage.ts`, `web/src/lib/useAuth.ts` |
| Hooks | `useXxx.ts` in `lib/` (not `hooks/`) | `web/src/lib/useAuth.ts` |
| Page routes | `page.tsx` under App Router dirs | `web/src/app/wiki/[slug]/page.tsx` |
| Wrapper/shim files | `XxxWrapper.tsx` | `web/src/app/components/SearchWrapper.tsx` wraps `SearchFilter.tsx` |
| Build scripts | kebab-case `.js` | `web/scripts/build-search-index.js`, `copy-wiki.js` |
| Wiki concept pages | Korean with underscore for hierarchy | `wiki/concepts/용익물권_전세권.md` (parent_child) |
| Wiki practice pages | Korean descriptive name | `wiki/practice/빈출키워드_색인.md` |

**No `index.ts` barrels** — every import names its file directly. Keeps the dependency graph flat and grep-friendly.

**Flat component directory:** all 10 client components sit in `web/src/app/components/`, no sub-folders. Small enough that depth isn't needed yet.

---

## 3. React / Next.js Patterns

### Client boundary convention
- `"use client"` is the **first line** of every interactive component file (see `ContentGate.tsx:1`, `AuthModal.tsx`, `SearchWrapper.tsx`, etc.)
- **Server components are the default** — only the per-slug wiki page renderer (`web/src/app/wiki/[slug]/page.tsx`) reads from the file system; everything interactive is a client island embedded inside it.

### The `dynamic({ ssr: false })` indirection pattern
**Rule:** when a client component must skip SSR, create a thin `"use client"` wrapper around it — never mark the server component as the dynamic import site.

Canonical example — `web/src/app/components/SearchWrapper.tsx` (9 lines):
```tsx
"use client";
import dynamic from "next/dynamic";
const SearchFilter = dynamic(() => import("./SearchFilter"), { ssr: false });
export default function SearchWrapper({ basePath }: { basePath: string }) {
  return <SearchFilter basePath={basePath} />;
}
```
The server component imports `SearchWrapper`, not `SearchFilter`. Why: `dynamic` cannot be used in server components, and directly importing a `"use client"` file that needs `ssr:false` (e.g., for Korean IME safety) causes hydration failures. Documented in `memory/feedback_lessons.md` §1.

### Props typing
- **Inline object types** for simple props (no separate `Props` interface unless complex):
  ```tsx
  // ContentGate.tsx:21
  export default function ContentGate({ html, children }: { html: string; children?: React.ReactNode }) {
  ```
- **Default exports** for route files and components; **named exports** for utilities in `lib/`

### Hook usage
- `useEffect` guards are written defensively — see `ContentGate.tsx:29`:
  ```tsx
  useEffect(() => {
    if (!checking && !isAuthenticated) {
      setCutoffHeight(window.innerHeight * 0.85);
    }
  }, [checking, isAuthenticated]);
  ```
- `useAuth` accepts an `initialAuthenticated` flag so SSR output can optimistically render full content (bots see everything, humans are gated after hydration)

---

## 4. Styling Conventions

### Tailwind v4
- **Utility-first, inline classes** — no `cn()` helper, no `clsx`, no styled-components
- **Large class strings** extracted to module-scope constants when reused across branches:
  ```ts
  // ContentGate.tsx:7
  const PROSE_CLASSES = `prose prose-lg max-w-none
    prose-headings:text-[#1e293b] prose-headings:tracking-tight
    prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-bold
    ...`;
  ```
- **Arbitrary values** used for brand colors: `text-[#1e293b]`, `max-h-[400px]`
- **Inline `style=` for dynamic values** (maxHeight based on state): `style={{ maxHeight: cutoffHeight || 400 }}`
- **`prose` plugin** (`@tailwindcss/typography`) is the primary typography system — heavy use of `prose-*` modifiers to style rendered markdown HTML
- **Responsive prefixes** used sparingly; mobile-first breakpoints only where necessary (`sm:prose-h1:text-3xl`)
- **No `tailwind.config.*` file** — relies on defaults + v4 CSS-first config

### Color palette (observed)
- Text: `#1e293b` (slate-800), `text-slate-600`, `text-slate-400`
- Primary CTA: gradient `from-blue-600 to-indigo-600`
- Accent: `text-amber-500` (warnings), `border-l-indigo-300` (blockquotes)
- Backgrounds: `bg-white`, `bg-slate-50`, `bg-indigo-50/50`

---

## 5. Error Handling Patterns

### Fallback chains (not exceptions)
The dominant error-handling style is **try-primary, fall back to secondary, silently ignore on failure**. Example — `web/src/lib/wikiStorage.ts:57`:

```ts
export async function getBookmarks(): Promise<Bookmark[]> {
  const token = getSessionToken();

  if (token) {
    const { data, error } = await supabase.rpc("wiki_list_bookmarks", { p_token: token });
    if (!error && Array.isArray(data)) {
      return data.map(...);
    }
    // 에러 시 localStorage fallback
  }

  try {
    const slugs: string[] = JSON.parse(localStorage.getItem(LOCAL_BM_KEY) || "[]");
    // ...
    return slugs.map(...);
  } catch {
    return [];
  }
}
```

**Rules in use:**
- **Never `throw`** from data-access functions. Return sensible defaults (`[]`, `false`, `null`).
- **Never `console.error`** in production paths — errors are silenced or `/* ignore */` commented.
- **Supabase RPCs always checked** via `{ data, error }` destructuring; `error` presence triggers fallback, not a throw.
- **`typeof window === "undefined"` guard** at the top of any function touching `localStorage` (SSR safety):
  ```ts
  // wikiStorage.ts:26
  function getEdulandMember(): EdulandMember | null {
    if (typeof window === "undefined") return null;
    ...
  }
  ```

### JSON parsing
- Always wrapped in `try/catch` with default values (`|| "[]"`, `|| "{}"` before parse)
- Empty `catch {}` or `catch { return [] }` — deliberately swallowing malformed localStorage

### Async
- `async/await` everywhere, no raw `.then()` chains
- **No `Promise.all` observed** — sequential awaits are the norm (fallback chains make this natural)

---

## 6. State & Data Patterns

### No state-management library
- No Redux, Zustand, Jotai, Valtio, or TanStack Query
- Local state: React `useState` / `useRef`
- Cross-component state: direct `localStorage` reads (bookmarks, visits, auth) — acceptable because the dynamic surface is small

### Direct Supabase RPC calls
- **No abstraction layer** between components and Supabase beyond `web/src/lib/wikiStorage.ts` and `web/src/lib/useAuth.ts`
- Function-per-RPC convention: `getBookmarks`, `toggleBookmark`, `isBookmarked`, `recordVisit`
- RPC names follow Postgres naming: `wiki_list_bookmarks`, `wiki_toggle_bookmark`, `verify_member`

### Content loading
- Markdown files read **synchronously** with `fs.readFileSync` at build/render time (`web/src/lib/wiki.ts:50`)
- No streaming, no lazy loading — the entire wiki fits comfortably in memory during build

---

## 7. Korean-Language Conventions

### Comments
- **JSDoc-lite in Korean** is the norm in `lib/` files:
  ```ts
  // wikiStorage.ts:56
  /** 북마크 목록 조회 */
  export async function getBookmarks(): Promise<Bookmark[]> {
  ```
- Longer explanatory blocks are plain Korean comments with box drawings `// ─── 세션 토큰 조회 ───`
- Inline comments also Korean: `// 30일 이내 로그인만 유효`, `// 에러 시 localStorage fallback`

### UI copy
- All user-facing strings are **Korean literals inline** — no i18n framework, no translation file
- Example: `"나머지 콘텐츠는 회원 전용입니다"`, `"에듀랜드 회원가입(무료)으로 전체 학습 자료를 이용하세요"`
- **No English fallback** — the product is Korean-only

### Identifier naming
- Variables and functions: **English camelCase** (`pageSlug`, `getBookmarks`, `EdulandMember`)
- Localized domain nouns kept in Korean in comments and UI, English in code:
  - `eduland_member` (localStorage key) / `EdulandMember` (type)
  - `개업공인중개사의의무` (wiki page slug) but English types

### Wiki markdown
- **YAML frontmatter in English keys**, Korean values:
  ```yaml
  title: 부동산 이중매매
  category: concepts
  subject: 민법및민사특별법
  tags: [법률행위, 반사회적법률행위, 이중매매, 판례]
  ```
- **Body content entirely in Korean** with occasional English technical terms (e.g., `NPV`, `LTV`, `MBS`)
- **Cross-references** use Obsidian `[[wikilink]]` syntax with Korean targets

---

## 8. Wiki Content Conventions (from `CLAUDE.md`)

These are **enforced by the wiki schema**, not just convention:

### Required frontmatter fields
```yaml
---
title: [Korean title]
category: subjects | concepts | laws | practice
subject: [one of 6 subjects]
parent: [optional hub page name]
tags: [array of Korean keywords]
sources: [array, e.g. "에듀랜드 2026 공법 기본서"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
importance: high | medium | low
---
```

### Required body sections (every concept page)
1. **핵심 암기 포인트** — bullet list of numbers, deadlines, requirements
2. **OX 퀴즈** — 5–10 O/X questions with explanations
3. **비교 정리** — comparison table where applicable
4. **함정 노트** — common traps with ⚠️ markers

### Hierarchy rule
- Maximum 2 levels: hub page + child pages
- Child filename convention: `{parent}_{child}.md`
- Child pages declare `parent: {hub-name}` in frontmatter
- Example: `용익물권.md` (hub) + `용익물권_지상권.md`, `용익물권_지역권.md`, `용익물권_전세권.md`

### Append-only log
- Every significant ingest or refactor writes an entry to `wiki/log.md`
- Format: `## [YYYY-MM-DD] {tag} | {title}` with bulleted notes
- Newest entries at the top

---

## 9. Git & Commit Conventions

Observed from `git log --oneline`:

- **Korean commit messages** with em-dash subject lines:
  - `로그인 모달 간소화 — 에듀랜드 로그인만, 회원가입은 외부 링크 안내`
  - `OX 퀴즈 로그인 게이트 수정 — 동기 인증 재확인으로 확실한 차단`
  - `콘텐츠 게이트 높이를 뷰포트 기준 1스크롤로 통일`
- **Subject format:** `{area} {action} — {reason}`
- **No Conventional Commits prefixes** (`feat:`, `fix:`) — free-form Korean
- **Direct commits to `master`** — no PR workflow visible; single-developer repository
- **Co-author trailer** used for LLM-generated commits: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

---

## 10. Build Script Conventions (`web/scripts/*.js`)

- **CommonJS** (`const fs = require("fs")`), no TypeScript
- **Relative paths from `__dirname`** — never `process.cwd()` for source paths:
  ```js
  // web/scripts/copy-wiki.js:4
  const src = path.join(__dirname, "..", "..", "wiki");
  const dest = path.join(__dirname, "..", "wiki-data");
  ```
- **Fail-fast on missing input** with `console.error` + `process.exit(1)` (the only place where `console.error` is used)
- **Small, single-purpose scripts** — no shared utility module; each script is self-contained
- **Synchronous file I/O** — scripts are short enough that async overhead isn't worth it

---

## 11. What's NOT Here (negative space)

Absence-is-the-convention facts that agents should not try to add:
- **No `cn()` / `clsx` / `classnames`** — paste class strings inline
- **No `axios` / `ky` / `swr` / `react-query`** — only direct `supabase.rpc(...)` calls
- **No `zod` / `yup` / runtime schema validation** — TypeScript types + trust the server
- **No error-boundary components** — errors are swallowed, not caught and displayed
- **No logging library** — `console.error` only in build scripts
- **No internationalization** — Korean only
- **No `.env` files** — Supabase anon key hard-coded in `web/src/lib/supabase.ts` (acceptable for static export with RLS + SECURITY DEFINER; see `INTEGRATIONS.md`)
- **No tests** — see `TESTING.md`
- **No Storybook** — no component catalog
- **No CSS modules / styled-components** — Tailwind only

---

*Conventions snapshot: 2026-04-10*
