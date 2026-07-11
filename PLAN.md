# Refactor Plan

## Decision

Use **Astro + React islands** for the website.

Use **React Flow** for a MotionMap v2 spike before committing to the full MotionMap rewrite.

```txt
Astro      = static website, routing, layouts, SEO, docs
React      = interactive tools
React Flow = MotionMap diagram editor/canvas
TypeScript = tool logic safety
```

## Why Astro

Current project is mostly static:

- homepage/tool gallery
- docs/design system
- browser-only tools
- no backend
- no auth
- SEO-friendly public pages

Astro keeps the site fast and static while allowing React only where interaction is needed.

## Why React Flow for MotionMap

React Flow may replace much of the custom diagram layer:

- node rendering
- draggable nodes
- pan/zoom
- controls
- selection
- edge rendering
- animated edges
- custom nodes/edges

MotionMap still owns:

- arrow syntax parser
- auto-layout from text
- presets and themes
- export frame composition
- PNG/SVG/video export logic
- localStorage persistence

## Target Structure

```txt
package.json
astro.config.mjs
tsconfig.json
src/
  pages/
    index.astro
    tools/
      agent-persona.astro
      motion-map.astro
      motion-map-v2.astro
    docs/
      design-system.astro
  layouts/
    SiteLayout.astro
    ToolLayout.astro
  components/
    Brand.astro
    Button.astro
    ToolCard.astro
  tools/
    agent-persona/
      AgentPersonaApp.tsx
      data.ts
      prompt.ts
      scoring.ts
      types.ts
    motion-map/
      MotionMapApp.tsx
      MotionMapCanvas.tsx
      MotionMapSidebar.tsx
      nodes/
        MotionNode.tsx
      edges/
        AnimatedMotionEdge.tsx
      logic/
        parseFlowText.ts
        autoLayout.ts
        mapToReactFlow.ts
        themes.ts
        presets.ts
        storage.ts
        exportImage.ts
        exportVideo.ts
        types.ts
  styles/
    tokens.css
    base.css
    components.css
    tools.css
public/
  assets/
    brand/
```

## Migration Phases

### Phase 1 — Astro Baseline

Goal: current static site runs under Astro with matching look.

Tasks:

- add npm package setup
- install Astro and React integration
- move shared CSS into `src/styles`
- move static brand assets into `public/assets`
- recreate homepage as `src/pages/index.astro`
- add build/check/preview scripts

### Phase 2 — Shared Layouts

Goal: remove repeated page shell markup.

Tasks:

- create `SiteLayout.astro`
- create `ToolLayout.astro`
- create shared brand/header/footer components
- create reusable tool card component
- preserve current visual direction first

### Phase 3 — Agent Persona React Rebuild

Goal: rebuild smaller tool first to prove architecture.

Tasks:

- extract i18n/question data into typed modules
- extract scoring logic
- extract prompt generation
- build React state flow: setup → quiz → result
- preserve EN/ID behavior
- preserve copy/download behavior
- compare generated prompt with current app

### Phase 4 — MotionMap React Flow Spike

Goal: validate React Flow before full rewrite.

Create temporary route:

```txt
/tools/motion-map-v2/
```

Spike features:

- textarea input
- parse `A -> B -> C`
- render React Flow nodes/edges
- use Dagre auto-layout
- animated edges
- custom basic MotionMap node
- fit view
- PNG export test

Pass criteria:

- diagram quality equals or beats current version
- branching layouts work acceptably
- PNG export works reliably
- interaction feels useful
- bundle/performance acceptable

If spike fails, rebuild MotionMap as a custom React SVG renderer instead of React Flow.

### Phase 5 — MotionMap Full Rebuild

Goal: rebuild MotionMap as editor/exporter if spike passes.

Tasks:

- split parser/layout/export/theme logic into modules
- add React Flow custom nodes
- add custom animated edge if default edge feels generic
- support presets and themes
- support localStorage
- support title/subtitle/footer composition
- support PNG export first
- evaluate SVG export
- defer WEBM/video until core export is stable

### Phase 6 — Cleanup

Goal: remove legacy static implementation after parity.

Tasks:

- remove old `index.html`
- remove old `apps/` pages once replacement routes work
- remove unused `assets/js/core`
- remove legacy CSS shims only when unused
- update README architecture section
- update contributing docs
- update deploy instructions

## Route Plan

Preferred new routes:

```txt
/                         Homepage
/tools/agent-persona/     Agent Persona Builder
/tools/motion-map/        MotionMap
/docs/design-system/      Design system
```

Compatibility routes can be handled with small redirect HTML files if needed:

```txt
/apps/agent-persona/index.html -> /tools/agent-persona/
/apps/motion-map/index.html    -> /tools/motion-map/
```

## Tooling

Initial dependencies:

```bash
npm install astro @astrojs/react react react-dom
npm install @xyflow/react dagre html-to-image
npm install -D typescript eslint prettier
```

Scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint ."
  }
}
```

## Main Risks

### React Flow export risk

React Flow is excellent for interactive diagrams, but MotionMap also needs polished fixed-size exports. PNG should be tested early with `html-to-image`.

### Video export risk

Current video export is custom and browser-sensitive. Do not block v2 on video export. Ship PNG first, SVG second, video later.

### Design drift risk

React Flow default UI can look generic. Use custom nodes/edges and AKALA design tokens.

## Recommendation

Proceed with Astro + React.

Run MotionMap React Flow spike before deleting current MotionMap. If spike passes, rebuild MotionMap around React Flow. If it fails, keep React architecture but use a custom SVG renderer.
