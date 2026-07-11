# Changelog

## 2026-07-12

- Added FlowClip at `/tools/flowclip/`, a separate creator-focused animated diagram tool using simple arrow text, social ratio presets, clean/dark/sketch themes, local autosave, and PNG/SVG/WebM export.
- Added FlowClip to the homepage tool grid.
- Fixed FlowClip SVG node visibility by avoiding transform animations on positioned SVG groups.
- Switched FlowClip node placement to Dagre auto-layout with vertical layout for portrait/story ratios and horizontal layout for landscape/simple square diagrams.
- Fixed FlowClip Dagre import compatibility so the tool renders during Astro prerender and in the browser.
- Simplified FlowClip animation so all nodes are visible immediately while dashed connectors flow continuously with smaller arrowheads.
- Added content-based FlowClip node sizing and connector endpoints that attach to each node boundary so arrowheads follow the connector angle.
- Cleaned FlowClip canvas backgrounds by removing decorative orbs and rebuilt WebM export to draw directly to canvas instead of repeatedly snapshotting the DOM.
- Added word wrapping for FlowClip node labels in both SVG preview and canvas video export.
- Increased FlowClip node label size, reduced social canvas padding, and smoothed connectors with directional Bézier handles for more production-grade flow lines.
- Fixed FlowClip browser compatibility by restoring Dagre's default import shape and replacing canvas `roundRect()` with a manual rounded-rectangle path.
- Added FlowClip title and subtitle controls with local autosave and export support.
- Added FlowClip motion modes for flowing dashed arrows, draw path, pulse dot, and static/no motion, with matching SVG preview and WebM export behavior.
- Fixed FlowClip connector ports and arrowheads so lines start from node edge centers and arrows match connector tangent.
- Verified `npm run build` passes after FlowClip changes.
- Hardened FlowClip exports with duplicate-export locking, PNG/SVG failure handling, MediaRecorder/storage guards, clamped duration input, accessible status/warnings, and unique SVG filter ids.

## 2026-07-08

- Added `PLAN.md` with Astro + React refactor plan and MotionMap React Flow spike strategy.
- Added `TODO.md` with migration checklist for Astro baseline, Agent Persona rebuild, MotionMap spike, cleanup, and QA.
- Added `AGENTS.md` instruction requiring future work updates to be logged in `CHANGELOG.md`.
- Started Astro + React implementation with `package.json`, Astro config, TypeScript config, shared layouts, shared components, migrated homepage, and design system route.
- Added MotionMap v2 React Flow spike at `/tools/motion-map-v2/` with arrow syntax parsing, Dagre auto-layout, custom nodes, animated edges, examples, and PNG export via `html-to-image`.
- Added temporary `/tools/motion-map/` placeholder and `/tools/agent-persona/` redirect to the legacy app while rebuild work continues.
- Copied legacy assets/apps into `public/` for compatibility during migration.
- Updated `README.md` with Astro architecture, routes, and npm-based local development/build instructions.
- Verified `npm run build` passes.
- Added `.gitignore` for Astro/Node generated directories.
- Hid non-MotionMap tools from the Astro homepage for now.
- Added a custom React Flow animated connector edge with arrowheads, moving pulse dots, and flowing dash animation for MotionMap v2.
- Added WebM video export from the MotionMap v2 export frame.
- Fixed MotionMap v2 connector visibility by switching back to React Flow built-in smoothstep edges with explicit marker options and stronger global edge styling.
