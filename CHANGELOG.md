# Changelog

## 2026-07-13

- Reworked FlowClip into a desktop 3-column workspace with flow text, centered preview, and a dedicated customize/export sidebar.
- Simplified FlowClip mobile UX by moving customization and export controls into a bottom-sheet panel opened from the preview or hero.
- Verified `npm run build` passes after FlowClip UI changes.
- Fixed FlowClip hydration by exporting/importing the React island as a named component so Astro resolves a concrete component export.
- Added an explicit FlowClip Export panel label, changed WebM to a neutral button, and split project JSON import/export into its own panel.
- Upgraded FlowClip's production UX with editor health stats, grouped Text/Canvas/Motion inspector panels, outcome-based export cards, and a mobile sticky action bar.
- Added FlowClip production polish with toast status feedback, mobile sheet focus management, Escape-to-close, focus restoration, and body-scroll locking.
- Removed FlowClip replay controls because the preview animations already loop continuously.
- Aligned the FlowClip preview stage to the top of its container instead of vertically centering it.
- Simplified the FlowClip right inspector by removing nested card styling from setting sections and using line separators instead.
- Removed MotionMap from the homepage, pointed the hero CTA to FlowClip, and added a custom FlowClip thumbnail preview for the tool card.
- Removed the homepage hero so the homepage focuses directly on the tools list.
- Removed the Design system button from the homepage navigation.
- Updated the AKALA Tools tagline to “Open-source browser utilities” across home and tool layouts.
- Removed the homepage tools section title and subtitle so the page focuses directly on the tool list.
- Replaced the FlowClip homepage thumbnail with the supplied SVG artwork asset.
- Changed homepage tool cards to a vertical layout with the thumbnail on top.
- Hid the FlowClip customize panel Close button on pointer-based desktop layouts while keeping it available for touch bottom sheets.

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
- Updated FlowClip PNG, SVG, and WebM exports to use exact selected social dimensions in filenames and status labels.
- Fixed FlowClip PNG export by using a hidden fixed-size render target and added project JSON export/import controls.
- Fixed blank FlowClip PNG/SVG exports by capturing the visible preview again and scaling PNG output to the selected social width.
- Replaced FlowClip PNG export with the shared canvas renderer, added blank-image detection, reused the renderer for WebM frames, pinned package versions, and added `@astrojs/check` so `npm run check` runs non-interactively.
- Hardened FlowClip project imports with file-size and field-length limits, added export size guards for very large diagrams, and added GitHub Actions CI for check/build.
- Replaced FlowClip SVG export with direct SVG serialization and embedded styles instead of DOM screenshot conversion.
- Added Netlify deployment configuration, site-specific deploy scripts, and ignored local Netlify state.
- Added MotionMap v2 animated edge styling and a custom edge component for the React Flow spike.
- Updated README and contributing docs for the Astro/React structure, FlowClip route, Netlify deployment, CI, and current verification workflow.
- Added Vitest coverage for FlowClip parsing, project normalization, field limits, duration clamping, and filename sanitization; included tests in CI.
- Ignored local agent skill files so `.agents/` and `skills-lock.json` do not appear as project changes.
- Split FlowClip canvas/SVG export rendering and download helpers into a dedicated export module.
- Smoothed FlowClip edge loops by aligning preview/export animation timing and making draw/flow endpoints loop cleanly.
- Added WebM duration metadata finalization so social platforms do not misread FlowClip exports as overly long videos.
- Fixed Story/Short preview sizing so the FlowClip stage and SVG background stay aligned.
- Fixed primary tool button hover contrast so text stays readable.

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
