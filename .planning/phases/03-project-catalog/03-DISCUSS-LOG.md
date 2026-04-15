# Phase 3: Project Catalog — Discussion Log

**Session:** 2026-04-15
**Status:** Complete

---

## Area A: Catalog Placement

**Q:** Where does the project catalog live relative to the landing page splash?
**Options:** Below the splash (scroll) / Teaser link on splash / Both
**Selected:** Both (catalog section on landing page + individual project pages)

---

## Area B: Project Entry Design

**Q:** What does each project entry show in the catalog?
**Options:** Name + link only / Name + one-line description / Name + description + tags
**Selected:** Name + one-line description

---

## Area C: Flash Cards Integration

**Q:** How should the math flash card game be served at /projects/math-flashcards?
**Options:** iframe wrapper / Direct static route
**Selected (freeform):** Convert to proper React — not iframe, not static asset. User will provide HTML/JS source. Wants full React conversion with extensibility for future auth/high scores.

**Follow-up Q:** Do you have the existing source, or build from scratch?
**Selected:** I have the source — I'll provide it

**Follow-up Q:** Scope for this phase?
**Selected:** Full game in React

---

## Area D: Data Structure

**Q:** Where should the project list data live?
**Options:** lib/projects.ts array / Inline in page.tsx
**Selected:** lib/projects.ts array

---

## Clarification: Project Routing

**Q (user-initiated):** Does every new small project get a folder under ./projects?
**Q:** How should projects without their own app work?
**Options:** External link only / Always a route
**Selected:** External link only — only projects with real UI get app/projects/[slug]/ folders

---

## Deferred

- Auth + leaderboard for flash cards → future phase
