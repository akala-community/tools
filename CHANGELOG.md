# Changelog

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
