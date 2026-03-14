# forge.thisminute.org

Portal site for the forge ecosystem. Landing page and shared CSS theme for three sub-sites:

| Sub-site | Path | Source project | What it is |
|----------|------|---------------|------------|
| Rhizome | `/rhizome/` | `~/projects/rhizome` | Agent orchestration pattern catalog (200 patterns) |
| Toolshed | `/toolshed/` | `~/projects/mainmenu` | Software directory (15K+ entries) |
| Forge | `/forge/` | `~/projects/agent-forge` (gh-pages) | Agent system manager landing page |

If told to go, start, or begin — you are the **orchestrator**. See `agents/orchestrator.md`.

## What This Project Owns

- `index.html` — portal landing page
- `theme.css` — shared CSS theme referenced by all three sub-sites
- Visual identity and consistency across the suite

## What This Project Does NOT Own

- Rhizome content, build pipeline, or API — managed by rhizome's steward
- Toolshed entries, scraping, or categorization — managed by toolshed's agents
- Forge landing page content — managed on agent-forge's gh-pages branch
- Deploys — submit requests to `~/projects/ops/DEPLOY_QUEUE.md`

## Stack

Vanilla HTML/CSS/JS. No frameworks, no build step. Dark/light mode. Mobile-responsive.

## Shared CSS

`theme.css` defines CSS custom properties that all three sub-sites reference via `<link>`. Covers:

- Color palette (dark/light mode via `body.light-mode`)
- Typography (font stack, size scale)
- Spacing, radius, shadows, transitions
- Component patterns (cards, buttons)

Sub-sites add their own styles on top and can override variables as needed.

## Agents

| Agent | Scope |
|-------|-------|
| orchestrator | Coordinates work, checkpoint-based state |
| builder | Portal page + theme.css implementation |
| skeptic | Review, accessibility, cross-site consistency |

## Key Files

```
index.html          # Portal landing page
theme.css           # Shared CSS
agents/             # Agent role files
memory/             # Persistent agent learnings
```
