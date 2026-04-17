---
phase: 04
slug: game-shell
status: verified
threats_open: 0
asvs_level: L1
created: 2026-04-17
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client-only rendering | All game code runs client-side via `ssr: false` — no server-side code execution | None — no network calls, no user data, no auth |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | gameReducer state | accept | Game state is client-only, single-player, no server validation needed. Score manipulation has no security impact — no leaderboard, no auth, localStorage high score is Phase 7. | closed |
| T-04-02 | Information Disclosure | page.tsx SSR guard | accept | No sensitive data in game shell. All content is public static HTML/CSS. SSR guard is for API compatibility, not data protection. | closed |
| T-04-03 | Denial of Service | SamusRunGame component | accept | Client-side only; no server resources consumed. Component is pure React rendering with no network calls. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-01 | Single-player client game with no server state, leaderboard, or auth. Score manipulation has zero security impact in this context. localStorage persistence is deferred to Phase 7 (SCORE-03). | Cameron | 2026-04-17 |
| AR-04-02 | T-04-02 | Game shell contains no sensitive data. All rendered content is public static HTML. SSR guard exists for Next.js API compatibility with browser-only APIs (canvas, rAF), not for data protection. | Cameron | 2026-04-17 |
| AR-04-03 | T-04-03 | Pure client-side React component with no network calls and no server resource consumption. No DoS vector exists at the server level. Browser-level resource exhaustion is out of scope for a static game shell. | Cameron | 2026-04-17 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 3 | 3 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
