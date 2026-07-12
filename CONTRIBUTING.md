# Contributing

Thanks for improving AKALA Tools.

## Project shape

AKALA Tools is an Astro site with React islands for interactive tools.

```txt
src/
  pages/                 # Astro routes
  layouts/               # shared site/tool shells
  components/            # shared UI components
  styles/                # shared CSS tokens and tool styles
  tools/                 # React tool apps and logic
public/
  apps/                  # temporary legacy app copies
  assets/                # static assets
```

Legacy static apps still live under `public/apps/` during migration. New or rebuilt interactive tools should usually live under `src/tools/[tool-id]/` and be mounted by an Astro page in `src/pages/tools/[tool-id].astro`.

## Tool requirements

New tools should be:

- browser-only by default
- useful with sample data immediately
- local-first: no hidden upload, no account wall
- export-friendly: copy, download, SVG, JSON, CSV, image, or video where relevant
- accessible by keyboard and screen readers for core actions
- resilient to invalid input and failed exports

## Adding or changing a tool

For an Astro/React tool:

```txt
src/pages/tools/new-tool.astro
src/tools/new-tool/NewToolApp.tsx
src/styles/new-tool.css
```

Then:

- add or update the homepage card in `src/pages/index.astro`
- import tool CSS from the tool page or layout as appropriate
- keep reusable logic near the tool, not inside page markup
- add useful examples or starter content
- update `README.md` if routes, setup, or deployment behavior changed
- update `CHANGELOG.md` for every code or documentation change

For legacy static compatibility work, keep files under `public/apps/[tool-id]/` and avoid mixing generated output with source files.

## UI standard

Use the shared light design language in `docs/design-system.md`.

Minimum requirements:

- Home/back link visible in the shell
- primary action visible above the fold
- useful default/example content
- clear export/copy path
- accessible labels for inputs
- visible keyboard focus
- status or error messages for long-running actions

## Code style

- prefer small, focused changes
- keep behavior stable outside the requested scope
- use TypeScript for React tool code
- keep React components focused on UI; extract parser/export/project logic when it grows
- keep shared CSS in `src/styles/` and tool-specific selectors namespaced
- avoid dependencies unless they remove significant complexity
- pin dependency versions in `package.json`
- keep generated output deterministic when possible

## Privacy standard

Do not send user content to a server unless the UI clearly says so and the user explicitly starts that action.

Local export/import, localStorage autosave, and browser-only rendering are preferred.

## Verification

Before opening a PR or pushing tool changes, run:

```bash
npm run check
npm run build
```

If you changed deployment config, also verify:

```bash
npm run deploy -- --help
```

Do not commit `dist/`, `.astro/`, `.netlify/`, or `node_modules/`.

## Deployment

Netlify config lives in `netlify.toml`.

- build command: `npm run build`
- publish directory: `dist`
- Node version: `22`

Manual production deploy:

```bash
npm run deploy:prod
```

Deploys require a logged-in Netlify CLI session or a valid Netlify token in the environment.

## Review checklist

Before opening a PR:

- [ ] route loads locally
- [ ] homepage links to the tool if it is user-facing
- [ ] example content works
- [ ] export/copy/import actions have status messages
- [ ] invalid input is handled without crashing
- [ ] mobile layout is usable
- [ ] keyboard focus is visible
- [ ] no hidden network upload of user content
- [ ] no personal/private URLs or tokens in committed files
- [ ] `npm run check` passes
- [ ] `npm run build` passes
- [ ] `README.md` or docs updated if behavior changed
- [ ] `CHANGELOG.md` updated
