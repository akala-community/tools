# TODO

## 0. Prep

- [x] Confirm final framework direction: Astro + React islands
- [x] Confirm MotionMap v2 spike will use React Flow
- [x] Decide whether old `/apps/...` URLs need redirect compatibility
- [ ] Create branch for refactor
- [ ] Capture screenshots of current homepage and both tools for parity checks

## 1. Astro Baseline

- [x] Add `package.json`
- [x] Install Astro
- [x] Install React integration
- [x] Add `astro.config.mjs`
- [x] Add `tsconfig.json`
- [x] Add scripts: `dev`, `build`, `preview`, `check`
- [x] Move shared CSS into `src/styles/`
- [x] Move static assets into `public/assets/`
- [x] Create `src/pages/index.astro`
- [x] Port current homepage markup
- [ ] Verify homepage matches current static `index.html`
- [x] Run `npm run build`

## 2. Shared Layouts and Components

- [x] Create `src/layouts/SiteLayout.astro`
- [x] Create `src/layouts/ToolLayout.astro`
- [x] Create `src/components/Brand.astro`
- [x] Create `src/components/Button.astro`
- [x] Create `src/components/ToolCard.astro`
- [x] Move repeated logo/header markup into shared components
- [x] Move footer into layout/component
- [x] Replace homepage duplicated card markup with `ToolCard`
- [ ] Verify styles still match

## 3. Agent Persona Rebuild

- [x] Create `src/pages/tools/agent-persona.astro`
- [ ] Create `src/tools/agent-persona/AgentPersonaApp.tsx`
- [ ] Create `src/tools/agent-persona/types.ts`
- [ ] Move i18n data into `data.ts`
- [ ] Move question data into `data.ts`
- [ ] Move scoring logic into `scoring.ts`
- [ ] Move prompt generation into `prompt.ts`
- [ ] Build setup screen in React
- [ ] Build quiz screen in React
- [ ] Build result screen in React
- [ ] Add EN/ID language switching
- [ ] Add adaptive agent type questions
- [ ] Add copy prompt behavior
- [ ] Add download prompt behavior
- [ ] Compare generated prompt with current version
- [ ] Test empty-name validation
- [ ] Test custom agent type validation
- [ ] Test mobile layout
- [ ] Run build

## 4. MotionMap React Flow Spike

- [x] Install `@xyflow/react`
- [x] Install `dagre`
- [x] Install `html-to-image`
- [x] Create temporary route `src/pages/tools/motion-map-v2.astro`
- [x] Create `src/tools/motion-map/MotionMapV2Spike.tsx`
- [x] Create `parseFlowText.ts`
- [x] Parse simple chain: `A -> B -> C`
- [x] Parse branches from multiple lines
- [x] Deduplicate nodes
- [x] Deduplicate edges
- [x] Add error state for invalid flows
- [x] Create Dagre auto-layout helper
- [x] Map internal graph to React Flow nodes/edges
- [x] Render React Flow canvas
- [x] Add animated edges
- [x] Add fit view
- [x] Add controls
- [x] Add basic custom MotionMap node
- [x] Add light theme styling
- [x] Add PNG export test with `html-to-image`
- [ ] Test branch-heavy examples
- [ ] Test tall/portrait examples
- [ ] Test pan/zoom interaction
- [ ] Decide: React Flow full rebuild or custom SVG renderer

## 5. MotionMap Full Rebuild, if Spike Passes

- [x] Create `src/pages/tools/motion-map.astro`
- [ ] Create `MotionMapApp.tsx`
- [ ] Create `MotionMapCanvas.tsx`
- [ ] Create `MotionMapSidebar.tsx`
- [x] Create `nodes/MotionNode.tsx`
- [ ] Create `edges/AnimatedMotionEdge.tsx`
- [x] Create `logic/types.ts`
- [ ] Create `logic/presets.ts`
- [ ] Create `logic/themes.ts`
- [ ] Create `logic/storage.ts`
- [ ] Create `logic/exportImage.ts`
- [ ] Create `logic/exportVideo.ts`
- [ ] Port examples from current MotionMap
- [ ] Add title input
- [ ] Add subtitle input
- [ ] Add footer input
- [x] Add diagram text input
- [ ] Add preset selector
- [ ] Add theme selector
- [ ] Add layout mode selector
- [ ] Add animation speed control
- [ ] Add circle/pulse count control if custom edge supports it
- [ ] Add show node numbers toggle
- [ ] Add color customization
- [ ] Add localStorage save/load
- [x] Add PNG export
- [ ] Evaluate SVG export feasibility
- [ ] Defer video export unless straightforward
- [ ] Match AKALA visual style, not default React Flow look
- [ ] Test current examples
- [ ] Test mobile usability
- [ ] Run build

## 6. MotionMap Alternative, if Spike Fails

- [ ] Keep React app shell
- [ ] Build custom SVG renderer in React
- [ ] Port current parser
- [ ] Port current layout algorithm
- [ ] Port current SVG export
- [ ] Port current PNG export
- [ ] Port current video export only after parity
- [ ] Keep React state/components around pure SVG logic

## 7. Docs and Cleanup

- [x] Convert or route `docs/design-system.md`
- [x] Update README architecture section
- [x] Update README local development instructions
- [x] Update README tool list/routes
- [ ] Update CONTRIBUTING checks
- [ ] Replace or remove `scripts/check-site.mjs`
- [x] Add notes about browser-only/local-first behavior
- [ ] Add deploy instructions for static Astro build

## 8. Legacy Removal

Only after replacement routes pass parity.

- [ ] Remove root `index.html`
- [ ] Remove `apps/agent-persona/`
- [ ] Remove `apps/motion-map/`
- [ ] Remove unused `assets/js/core/`
- [ ] Remove unused legacy CSS files
- [ ] Keep redirect stubs if old URLs matter
- [ ] Verify no broken links
- [ ] Run final build

## 9. Final QA

- [ ] Homepage loads
- [ ] Agent Persona loads
- [ ] MotionMap loads
- [ ] Navigation works
- [ ] Design system page works
- [ ] Copy actions work
- [ ] Download actions work
- [ ] PNG export works
- [ ] localStorage restore works
- [ ] Mobile layout acceptable
- [ ] No console errors
- [ ] `npm run build` passes
- [ ] `npm run preview` smoke test passes
