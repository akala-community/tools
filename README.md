# AKALA Tools

Open-source, browser-only tools for people building agents, prompts, and product flows.

Live site: <https://akatools.netlify.app>

## Tools

| Tool | Route | Status | Description |
| --- | --- | --- | --- |
| FlowClip | `/tools/flowclip/` | Available | Turn simple arrow text into social-ready animated flow diagrams with PNG, SVG, WebM, and project JSON export/import. |
| Agent Persona Builder | `/tools/agent-persona/` | Available | Create system prompts from response preferences, agent type, and target language. Redirects to the legacy static app during migration. |
| MotionMap | `/tools/motion-map/` | Migrating | Placeholder for the rebuilt MotionMap experience. |
| MotionMap v2 Spike | `/tools/motion-map-v2/` | Experimental | React Flow spike for auto-layout, custom animated edges, PNG export, and WebM export. |
| Prompt Diff | TBD | Planned | Compare prompt versions and review behavior changes. |
| Tool Schema Builder | TBD | Planned | Draft JSON schemas and function tool definitions from a guided form. |

## Design direction

The collection uses a shared light UI system:

- warm off-white canvas
- light card-based builder flows
- studio shell for workspaces
- large rounded cards
- clear primary actions
- local-first save/export behavior
- no login or backend requirement

See [`docs/design-system.md`](./docs/design-system.md).

## Architecture

The site uses Astro with React islands for interactive tools.

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

Current routes:

```txt
/                         Homepage
/tools/flowclip/          FlowClip creator tool
/tools/agent-persona/     Redirects to legacy Persona Builder during migration
/tools/motion-map/        Placeholder for rebuilt MotionMap
/tools/motion-map-v2/     React Flow spike for MotionMap
/docs/design-system/      Design system page
```

Legacy static apps remain available under `public/apps/` during migration.

## Local development

Install dependencies and run Astro:

```bash
npm install
npm run dev
```

Then visit:

```txt
http://localhost:4321
```

## Checks

Run before committing:

```bash
npm run check
npm run build
```

`npm run check` uses Astro's checker. `npm run build` writes the static site to `dist/`.

## Deployment

Netlify is configured in [`netlify.toml`](./netlify.toml).

- build command: `npm run build`
- publish directory: `dist`
- Node version: `22`
- production site: <https://akatools.netlify.app>

Manual deploy scripts:

```bash
npm run deploy       # draft deploy from existing dist/
npm run deploy:prod  # build and publish production
```

The scripts target Netlify site id `8c07e0e1-dbdf-4a4e-83a8-da8272b352d8`.

## CI

GitHub Actions runs on pushes and pull requests to `master`:

```bash
npm ci
npm run check
npm run build
```

See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Contribution principles

- keep tools browser-only when possible
- keep dependencies minimal and pinned
- make copy/export actions obvious
- include useful examples inside each tool
- avoid collecting user input on servers
- update `CHANGELOG.md` for code and documentation changes

## License

MIT
