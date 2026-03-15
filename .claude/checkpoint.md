# Checkpoint — 2026-03-15

## Architecture change

The top-level orchestrator now coordinates the entire repo. Sub-site agent files stay in place but the orchestrator spawns them directly. See `agents/orchestrator.md`.

Files updated: `AGENTS.md`, `agents/orchestrator.md`, `agents/builder.md`, `agents/skeptic.md`.

## What was done

### Session 4 (current)
- 3 new executable tools: contrast_checker, cron_parser, license_checker (277 tests passing)
  - Skeptic review caught: hardcoded test paths, missing `__future__` import, undocumented AND semantics — all fixed
- Cross-site og: meta tags added (portal, forge, toolshed)
- CSS variable alignment: portal now has same base set as forge/toolshed (--bg-card, --accent, --radius-sm, etc.)
- Forge: --shadow CSS variable replaces hardcoded rgba hover shadows
- Forge: quick start warning now explains security pipeline, links to #security section
- Forge: version bump v0.3 → v0.4 (clone command + CLAUDE.md link + security_review.md)
- Forge: merged duplicate .header CSS rule
- Rhizome: overlay focus management (shortcuts + field notes — saves trigger, restores on close)
- Rhizome: popstate race fixed with async/await + finally block
- Toolshed: semantic `<header>` + `<main>` landmarks
- Toolshed: localStorage guarded in try/catch, detail panel gets role="dialog"
- Evolution.html: respects prefers-color-scheme when no saved theme
- Skeptic DRY pass: 2 security, 3 critical, 7 warning, 7 note — critical items fixed

### Session 3 (prior)
- Cross-site consistency: standardized breakpoint to 600px, `--radius` to 10px
- Forge: hover shadows for dark-mode visibility
- Rhizome: evolution cross-site nav, keyboard-accessible filters, sticky mobile search, popstate, theme-aware mermaid
- Skeptic review: 0 critical, 3 warnings fixed

### Session 2 (prior)
- Orchestrator authority expansion, builder/skeptic boundary fixes
- Forge page: 7 fixes (semantic header, nav, focus-visible, heading hierarchy, theme toggle)

### Session 1 (prior)
- Portal hub page, DRY pass, toolshed rename, domain fixes
- Forge role grid, pattern library links
- Rhizome evolution case link, field notes trigger
- Balatro scorer tool

## Uncommitted changes

None — all committed. Deploy queued.

## In progress

- S38 miscategorization: curator agent was investigating catalog data quality (50% miscat in discovered entries). Agent was running at session end — results not yet merged. Next session should check the worktree branch `worktree-agent-a9345a0f` for results.

## Deferred

### Security (from skeptic review)
- External scripts without SRI: mermaid CDN (`@10` — should pin version + add integrity), Plausible analytics
- Toolshed detail panel: no focus trap (rhizome has one, toolshed doesn't)

### DRY / code cleanliness (from skeptic review)
- Toolshed: Fisher-Yates shuffle duplicated 3x — extract to helper
- Toolshed: getFilteredEntries/getSearchResults duplicate sort logic — extract shared sortResults()
- Toolshed: many interactive elements lack :focus-visible styles
- Rhizome: highlightText regex matches raw query against HTML-escaped text (functional bug for & < > searches)
- Cross-site: CSS variable naming — rhizome uses --bg-primary/--text-primary convention vs --bg/--text everywhere else
- Cross-site: theme icon SVGs verified identical (acceptable duplication for self-contained files)

### Catalog
- S38 miscategorization (pending — see "In progress" above)
- Thin categories: Mobile IDE (11), Flashcards (14), Desktop App (15), HR & People (16)
