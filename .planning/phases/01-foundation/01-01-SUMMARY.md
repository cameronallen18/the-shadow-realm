---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwind, typescript, vercel, github, ci-cd]

# Dependency graph
requires: []
provides:
  - "Next.js 15.3.9 App Router scaffold at repo root (TypeScript + Tailwind v4)"
  - "GitHub repo push to cameronallen18/the-shadow-realm main"
  - "Vercel CI/CD pipeline wired (pending user confirmation of Tasks 3-4)"
affects: [02-landing-page, 03-catalog]

# Tech tracking
tech-stack:
  added:
    - "Next.js 15.3.9 (App Router)"
    - "React 19.0.0"
    - "TypeScript 5.x"
    - "Tailwind CSS 4.2.2"
    - "@tailwindcss/postcss 4.x"
    - "Geist font (via next/font/google)"
  patterns:
    - "App Router layout pattern: app/layout.tsx as root with Geist font"
    - "Tailwind v4 CSS-first: @import 'tailwindcss' in globals.css, no tailwind.config.js"
    - "Vercel-native deployment: no output:'export' in next.config.ts"

key-files:
  created:
    - "app/layout.tsx"
    - "app/page.tsx"
    - "app/globals.css"
    - "app/favicon.ico"
    - "next.config.ts"
    - "postcss.config.mjs"
    - "package.json"
    - "package-lock.json"
    - "tsconfig.json"
    - "eslint.config.mjs"
    - ".gitignore"
    - "public/file.svg"
    - "public/globe.svg"
    - "public/next.svg"
    - "public/vercel.svg"
    - "public/window.svg"
  modified:
    - "README.md (overwritten by create-next-app — expected, was empty placeholder)"

key-decisions:
  - "Used create-next-app@next-15-3 (15.3.9) instead of @latest (which is 16.2.3) — CLAUDE.md specifies 15.x"
  - "Used --turbopack flag to skip interactive Turbopack prompt; turbopack is dev-only (Vercel uses webpack for prod builds)"
  - "Temporarily moved all existing files out of repo root (not just .git) to avoid create-next-app conflict detection"
  - "Added .claude/worktrees/ to .gitignore to prevent GSD agent infrastructure from being committed to public repo"
  - "No output:'export' in next.config.ts — Vercel native adapter handles SSG without it"
  - "Hardcode dark theme via className='dark' on <html> (Phase 2) — no next-themes, per CLAUDE.md"

patterns-established:
  - "Phase 2 note: app/layout.tsx will need className='dark' added to <html> for dark mode"
  - "Phase 2 note: app/globals.css will need @custom-variant dark directive for Tailwind v4 dark mode"
  - "Project embedding: public/projects/ for static HTML/JS projects (math flash cards, etc.)"

requirements-completed: [INFRA-01]

# Metrics
duration: ~15min
completed: 2026-04-13
---

# Phase 01 Plan 01: Foundation - CI/CD Pipeline Setup Summary

**Next.js 15.3.9 App Router scaffolded with Tailwind CSS 4.2.2 and TypeScript, pushed to GitHub main; Vercel connection pending user dashboard action**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-13T09:10:00Z
- **Completed:** 2026-04-13T09:25:00Z (Tasks 1-2; Tasks 3-4 at checkpoint)
- **Tasks:** 2 of 4 complete (Tasks 3-4 require human action)
- **Files modified:** 17

## Accomplishments
- Next.js 15.3.9 scaffold generated via `create-next-app@next-15-3` with TypeScript, Tailwind v4, ESLint, App Router
- Pre-existing git history preserved (docs(01), roadmap, requirements, research commits all intact)
- `npm run build` passes locally (static pages generated, 0 TypeScript errors)
- Scaffold commit pushed to `cameronallen18/the-shadow-realm` main branch on GitHub

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15** - `ec4116f` (feat)
2. **Task 2: Push to GitHub** - `ec4116f` (same commit — Tasks 1+2 combined per plan spec)

**Note:** Tasks 3 (Vercel dashboard connect) and 4 (verify auto-deploy + 200 response) are blocked at human-action checkpoint.

## Files Created/Modified
- `app/layout.tsx` - Root App Router layout with Geist font (Sans + Mono) and html/body shell
- `app/page.tsx` - Default Next.js welcome page (unmodified scaffold output)
- `app/globals.css` - Tailwind v4 CSS-first with `@import "tailwindcss"`, CSS variables for light/dark colors
- `app/favicon.ico` - Default Next.js favicon
- `next.config.ts` - Empty config (no output:export, no image config)
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin (`@tailwindcss/postcss`)
- `package.json` - next@15.3.9, react@19.0.0, tailwindcss@^4, typescript@^5
- `package-lock.json` - Locked dependency tree (329 packages)
- `tsconfig.json` - TypeScript strict config with @/* path alias
- `eslint.config.mjs` - Next.js ESLint config
- `.gitignore` - Standard Next.js ignores + .claude/worktrees/ (GSD agent exclusion)
- `public/*.svg` - Default Next.js SVG assets (file, globe, next, vercel, window)
- `README.md` - Overwritten by create-next-app (expected; was empty)

## Decisions Made
- **Next.js 15 vs 16:** Used `create-next-app@next-15-3` (15.3.9) because CLAUDE.md specifies 15.x; npm `@latest` now resolves to 16.2.3
- **Turbopack flag:** Added `--turbopack` to avoid interactive CLI prompt; Vercel production builds use webpack regardless
- **File relocation approach:** create-next-app detected `.claude/`, `.planning/`, `CLAUDE.md`, `README.md` as conflicts — temporarily moved all out, ran scaffold on empty dir, restored everything
- **GSD agent .gitignore:** Added `.claude/worktrees/` to `.gitignore` to prevent agent infrastructure from being committed to the public GitHub repo

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `.claude/worktrees/` to .gitignore**
- **Found during:** Task 2 (staging files before commit)
- **Issue:** The `.claude/worktrees/agent-a2e67b25` directory (the GSD agent worktree) was an untracked embedded git repo that would have been committed to the public GitHub repo if not excluded
- **Fix:** Added `.claude/worktrees/` pattern to `.gitignore`
- **Files modified:** `.gitignore`
- **Verification:** `git status` shows `.claude/` as untracked (not staged); git add staging confirms the path is excluded
- **Committed in:** `ec4116f` (Task 1+2 commit)

**2. [Rule 3 - Blocking] File conflict workaround required full directory evacuation**
- **Found during:** Task 1 (running create-next-app)
- **Issue:** Research documented `.git` relocation workaround, but `create-next-app@next-15-3` also detects non-.git files as conflicts (`.claude/`, `.planning/`, `CLAUDE.md`, `README.md`) and refuses to scaffold
- **Fix:** Moved ALL existing files to `/tmp/shadow-realm-backup/` before scaffolding; restored them after; removed the new `.git` created by scaffold (despite `--no-git` flag) and restored original git history
- **Files modified:** None (procedural deviation only)
- **Verification:** `git log --oneline -5` shows all original commits intact; scaffold files all present
- **Committed in:** `ec4116f` (Task 1+2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- `--no-git` flag was passed to `create-next-app` but it still initialized a git repository (likely a bug in `next-15-3` version of the tool). Resolved by removing the new `.git` and restoring the original.
- `create-next-app@next-15-3` also prompted interactively for Turbopack even with flags — resolved by adding `--turbopack` to skip the prompt.

## User Setup Required

**Tasks 3-4 require manual Vercel dashboard configuration.** See checkpoint instructions below.

**CHECKPOINT — Connect GitHub repo to Vercel:**

Open this URL in your browser: **https://vercel.com/new**

1. Sign in to Vercel (use GitHub login).
2. Under "Import Git Repository", find `cameronallen18/the-shadow-realm` and click **Import**.
3. Verify the "Configure Project" screen shows:
   - **Framework Preset:** `Next.js` (must auto-detect)
   - **Build Command:** `next build` (default)
   - **Output Directory:** leave blank
4. Click **Deploy**.
5. Wait for build to complete (~30-90 seconds).
6. When done, Vercel shows a `*.vercel.app` URL. Click it to verify the page loads.

**Reply with:**
- The live Vercel URL (e.g. `https://the-shadow-realm-abc123.vercel.app`)
- Confirmation the page loads without errors (default Next.js welcome page)
- "approved"

## Next Phase Readiness
- Next.js 15.3.9 scaffold is ready at repo root with clean build
- GitHub push is live — Vercel will auto-detect on import
- Phase 2 (landing page) will modify `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Phase 2 notes: add `className="dark"` to `<html>` in layout.tsx; add `@custom-variant dark` to globals.css
- **Blocker:** Tasks 3-4 (Vercel connection + live URL verification) must complete before Phase 2 begins

## Known Stubs
- `app/page.tsx` — Default Next.js welcome page; will be replaced in Phase 2 (landing page plan)
- `app/layout.tsx` — Default title/description metadata; will be updated in Phase 2
- `app/globals.css` — System-preference dark mode (CSS media query); intentional for Phase 1, Phase 2 will convert to class-based dark mode

---
*Phase: 01-foundation*
*Completed: 2026-04-13 (Tasks 1-2; awaiting human checkpoint for Tasks 3-4)*

## Self-Check: PASSED

- `app/layout.tsx` exists: FOUND
- `app/page.tsx` exists: FOUND
- `next.config.ts` exists: FOUND
- `postcss.config.mjs` exists: FOUND
- Commit `ec4116f` exists: FOUND
- `git log origin/main` shows `ec4116f`: FOUND
- `.planning/` preserved: FOUND
- `CLAUDE.md` preserved: FOUND
