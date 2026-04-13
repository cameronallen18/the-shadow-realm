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
  - "Vercel CI/CD pipeline wired — auto-deploy on push to main confirmed end-to-end"
  - "Live URL: https://the-shadow-realm.vercel.app/ (returns HTTP 200, server: Vercel)"
affects: [02-landing-page, 03-catalog]

# Tech tracking
tech-stack:
  added:
    - "Next.js 15.3.9 (App Router)"
    - "React 19.0.0"
    - "TypeScript 5.x"
    - "Tailwind CSS 4.x (^4 — Tailwind v4 CSS-first)"
    - "@tailwindcss/postcss 4.x"
    - "Geist font (via next/font/google)"
  patterns:
    - "App Router layout pattern: app/layout.tsx as root with Geist font"
    - "Tailwind v4 CSS-first: @import 'tailwindcss' in globals.css, no tailwind.config.js"
    - "Vercel-native deployment: no output:'export' in next.config.ts"
    - "GitHub main branch push triggers Vercel production deploy via webhook"

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
    - "README.md (overwritten by create-next-app — expected, was empty placeholder; also +1 trailing newline for trigger commit)"

key-decisions:
  - "Used create-next-app@next-15-3 (15.3.9) instead of @latest (which is 16.2.3) — CLAUDE.md specifies 15.x"
  - "Used --turbopack flag to skip interactive Turbopack prompt; turbopack is dev-only (Vercel uses webpack for prod builds)"
  - "Temporarily moved all existing files out of repo root (not just .git) to avoid create-next-app conflict detection"
  - "Added .claude/worktrees/ to .gitignore to prevent GSD agent infrastructure from being committed to public repo"
  - "No output:'export' in next.config.ts — Vercel native adapter handles SSG without it"
  - "Hardcode dark theme via className='dark' on <html> (Phase 2) — no next-themes, per CLAUDE.md"
  - "Live Vercel URL is https://the-shadow-realm.vercel.app/ — confirmed by user and curl"

patterns-established:
  - "Phase 2 note: app/layout.tsx will need className='dark' added to <html> for dark mode"
  - "Phase 2 note: app/globals.css will need @custom-variant dark directive for Tailwind v4 dark mode"
  - "Project embedding: public/projects/ for static HTML/JS projects (math flash cards, etc.)"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03]

# Metrics
duration: ~45min
completed: 2026-04-13
---

# Phase 01 Plan 01: Foundation - CI/CD Pipeline Setup Summary

**Next.js 15.3.9 App Router scaffolded with Tailwind CSS v4 and TypeScript, wired to Vercel via GitHub auto-deploy, live at https://the-shadow-realm.vercel.app/ returning HTTP 200**

## Performance

- **Duration:** ~45 min (Tasks 1-2 ~15 min; Tasks 3-4 including user Vercel dashboard action ~30 min)
- **Started:** 2026-04-13T09:10:00Z
- **Completed:** 2026-04-13T09:37:00Z
- **Tasks:** 4 of 4 complete
- **Files modified:** 18

## Accomplishments
- Next.js 15.3.9 scaffold generated via `create-next-app@next-15-3` with TypeScript, Tailwind v4, ESLint, App Router
- Pre-existing git history preserved across create-next-app run (.planning/, CLAUDE.md, all prior commits intact)
- `npm run build` passes locally (static pages generated, 0 TypeScript errors)
- Scaffold commit (ec4116f) and trigger commit (d561418) both pushed to origin/main
- Vercel project connected to cameronallen18/the-shadow-realm via GitHub App webhook
- Auto-deploy verified: push of d561418 triggered new production deploy in Vercel Deployments tab (user confirmed)
- Live URL https://the-shadow-realm.vercel.app/ returns HTTP 200 with `server: Vercel` header (curl-verified)

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Scaffold Next.js 15 and push to GitHub** - `ec4116f` (feat)
2. **Task 3: Vercel dashboard connect** - human action (no commit — external dashboard config)
3. **Task 4: Verify auto-deploy + live URL** - `d561418` (chore — trigger commit)

**Plan metadata:** (docs commit to follow — includes SUMMARY.md)

## Version Inventory (from package.json)

| Package | Version |
|---------|---------|
| next | 15.3.9 |
| react | ^19.0.0 |
| react-dom | ^19.0.0 |
| tailwindcss | ^4 |
| @tailwindcss/postcss | ^4 |
| typescript | ^5 |

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
- `.gitignore` - Standard Next.js ignores + .claude/worktrees/ (GSD agent exclusion) + .live-url.txt scratch file
- `public/*.svg` - Default Next.js SVG assets (file, globe, next, vercel, window)
- `README.md` - Overwritten by create-next-app (expected; was empty); +trailing newline in trigger commit

## Decisions Made
- **Next.js 15 vs 16:** Used `create-next-app@next-15-3` (15.3.9) because CLAUDE.md specifies 15.x; npm `@latest` now resolves to 16.2.3
- **Turbopack flag:** Added `--turbopack` to avoid interactive CLI prompt; Vercel production builds use webpack regardless
- **File relocation approach:** create-next-app detected `.claude/`, `.planning/`, `CLAUDE.md`, `README.md` as conflicts — temporarily moved all out, ran scaffold on empty dir, restored everything
- **GSD agent .gitignore:** Added `.claude/worktrees/` to `.gitignore` to prevent agent infrastructure from being committed to the public GitHub repo
- **Live URL:** https://the-shadow-realm.vercel.app/ — Vercel assigned this canonical URL (not a preview slug); confirmed by user and curl

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `.claude/worktrees/` to .gitignore**
- **Found during:** Task 2 (staging files before commit)
- **Issue:** The `.claude/worktrees/agent-a2e67b25` directory (the GSD agent worktree) was an untracked embedded git repo that would have been committed to the public GitHub repo if not excluded
- **Fix:** Added `.claude/worktrees/` pattern to `.gitignore`
- **Files modified:** `.gitignore`
- **Verification:** `git status` shows `.claude/` as untracked (not staged)
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

None for remaining steps — Vercel dashboard connection was completed by user in Task 3.

**Summary of what user did:**
1. Opened https://vercel.com/new
2. Imported cameronallen18/the-shadow-realm (Framework auto-detected as Next.js)
3. Clicked Deploy, build succeeded
4. Confirmed live URL loads the default Next.js welcome page
5. User confirmed Vercel Deployments tab showed a new production deploy for the d561418 trigger commit

## Next Phase Readiness

**All Phase 1 success criteria green:**
- Next.js 15.3.9 App Router scaffold at repo root
- `npm run build` passes locally
- Scaffold commit (ec4116f) + trigger commit (d561418) on origin/main
- Vercel linked to GitHub; webhook delivers pushes to production
- Live URL https://the-shadow-realm.vercel.app/ returning HTTP 200
- Pre-existing .planning/, CLAUDE.md, and git history preserved

**Phase 2 (landing page) starting conditions:**
- Dark theme work starts from unmodified scaffold — no custom UI has been applied yet
- `app/layout.tsx` will need `className="dark"` on the `<html>` element to enable Tailwind v4 dark mode
- `app/globals.css` will need the `@custom-variant dark (.dark &);` directive for Tailwind v4 dark mode class-based activation
- `app/page.tsx` will be completely replaced with the landing page content
- CLAUDE.md constraint: dark theme, cool tones only; no next-themes library (hardcode dark)

## Known Stubs
- `app/page.tsx` — Default Next.js welcome page; will be replaced in Phase 2 (landing page plan)
- `app/layout.tsx` — Default title/description metadata and no dark class; will be updated in Phase 2
- `app/globals.css` — System-preference dark mode (CSS media query); intentional for Phase 1, Phase 2 will convert to class-based dark mode via `@custom-variant dark`

---
*Phase: 01-foundation*
*Completed: 2026-04-13*

## Self-Check: PASSED

- `app/layout.tsx` exists: FOUND
- `app/page.tsx` exists: FOUND
- `next.config.ts` exists: FOUND
- `postcss.config.mjs` exists: FOUND
- Commit `ec4116f` (scaffold): FOUND
- Commit `d561418` (trigger): FOUND
- `git log origin/main` shows both commits: FOUND
- `.planning/` preserved: FOUND
- `CLAUDE.md` preserved: FOUND
- `curl https://the-shadow-realm.vercel.app/` returns 200 with `server: Vercel`: CONFIRMED
- User confirmed Vercel auto-deploy for d561418: CONFIRMED
