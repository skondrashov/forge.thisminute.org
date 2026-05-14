# Tester Memory

Persistent learnings across sessions. Update after each session.

## Coverage map

| Area | Tests exist? | Location | Notes |
|------|-------------|----------|-------|
| Orchestration backend | Yes | `orchestration/tests/` | 6 files: build, schema, classifier, API, HTML structural |
| Orchestration e2e | Yes | `orchestration/tests/e2e/` | 3 specs: smoke, filters, detail drawer |
| Tools backend | Yes | `tools/tests/` | 4 files: build, categorization, data quality, taxonomy |
| Tools individual | Yes | `tools/tools/*/test_*.py` | ~25 tool-specific unit tests |
| SPA router | Yes | `tests/e2e/router.spec.js` | Navigation, popstate, body classes, favicons, theme persistence |
| Flat pages | Yes | `tests/e2e/interactive.spec.js` | Home, context, forge page interactions; nav on every page |
| Cross-section | Yes | `tests/e2e/interactive.spec.js`, `tests/e2e/catalogs.spec.js` | Nav presence, theme toggle, catalog smoke tests |
| Mobile/responsive | Yes | `tests/e2e/interactive.spec.js`, `tests/e2e/regressions.spec.js` | Hamburger nav, filter overlays, viewport checks |
| Filter panels | Yes | `tests/e2e/filters.spec.js` | All 7 filter panels: Tools (OS, Pricing, Language, Category) and Orchestration (Domain, Structure, Category). Tests panel expand, tile presence, filter application, and clear/restore. |
| Regressions | Yes | `tests/e2e/regressions.spec.js` | 5 bugs: nav dropdown visibility, SPA double-init, mobile filter layout, text truncation, category FAB removal. Bug 5 workaround removed (init ordering fix landed). |
| Visual | Yes | `tests/e2e/visual.spec.js` | Desktop and mobile screenshots for all pages and catalogs |

## Infrastructure notes

- Playwright config at repo root (`playwright.config.js`) has two projects: `orchestration` (testDir: `orchestration/tests/e2e/`) and `site-wide` (testDir: `tests/e2e/`)
- Dev server: `npx serve -l 3939 --no-clipboard`
- Orchestration e2e tests need Escape press to clear default "core" lens filter before asserting card counts

## Lessons learned

1. **Check element visibility across viewports**: Mobile-only elements (hamburger nav dropdown, scrim) MUST be verified hidden at desktop. Always test that mobile-injected DOM elements don't leak into desktop view.
2. **SPA double-init detection**: After SPA navigation to catalog pages, verify that interactive elements (filter panels, dropdowns) work on FIRST click. Double-init bugs manifest as "click does nothing" because handlers fire twice (toggle on then off).
3. **Text truncation checks**: Filter panel titles and other short labels should be checked for truncation. Compare `scrollWidth` vs `clientWidth` -- if scrollWidth > clientWidth, text is being cut off.
4. **Filter panel consistency**: All filter panels should use the same interaction pattern across sections and viewports. No floating action buttons, no bottom sheets -- everything through the standard `.filter-panel` component.
5. **Visual regression coverage**: Screenshots alone don't catch subtle issues like truncated text, invisible elements at wrong viewport, or click handlers that fire and immediately undo. Need programmatic assertions alongside visual checks.
6. **Filter panel collapse after tile click**: On both Tools and Orchestration pages, clicking a filter tile inside an expanded panel triggers `renderAllFilters()` which rebuilds the tile DOM. The document-level `closePanels` click handler then closes the panel (the original click target's DOM ancestry is disrupted by the re-render). Tests must re-open the panel header before clicking the "All" tile to clear a filter.
7. **Tools taxonomy tiles vs filter effects**: OS, Pricing, and Language filters on the Tools page do NOT change the number of `.tile` elements (taxonomy tiles are always rendered for all children). They only change the count numbers within tiles and the stats bar. Use stats bar text (`#stat-entries`) to verify filter application, not `.tile` count. Category filter is the exception -- it navigates into a group, actually changing the tile set.
