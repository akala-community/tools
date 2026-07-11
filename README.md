# AKALA Tools

Open-source, browser-only tools for people building agents, prompts, and product flows.

## Tools

| Tool | Status | Description |
| --- | --- | --- |
| Agent Persona Builder | Available | Create system prompts from response preferences, agent type, and target language. |
| MotionMap | Available | Turn simple arrow syntax into animated flow diagrams with PNG, SVG, and video export. |
| Prompt Diff | Planned | Compare prompt versions and review behavior changes. |
| Tool Schema Builder | Planned | Draft JSON schemas and function tool definitions from a guided form. |

## Design direction

The collection uses a shared light UI system:

- warm off-white canvas
- light card-based builder flows
- light studio shell for workspaces
- large rounded cards
- clear primary actions
- local-first save/export behavior
- no login or backend requirement

See [`docs/design-system.md`](./docs/design-system.md).

## Architecture

The refactor target is Astro + React islands:

```txt
src/
  pages/                 # Astro routes
  layouts/               # shared site/tool shells
  components/            # shared UI components
  styles/                # shared CSS tokens and UI styles
  tools/                 # React tool apps and logic
public/
  assets/                # static assets and temporary legacy app copies
```

Current routes:

```txt
/                         Homepage
/tools/agent-persona/     Redirects to legacy Persona Builder during migration
/tools/motion-map/        Placeholder for rebuilt MotionMap
/tools/motion-map-v2/     React Flow spike for MotionMap
/docs/design-system/      Design system page
```

Legacy static apps remain available under `public/apps/` during migration.

## Local use

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

Run the Astro build before committing UI changes:

```bash
npm run build
```

Optional type/config check:

```bash
npm run check
```

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Contribution principles

- keep tools browser-only when possible
- keep dependencies minimal
- prefer readable vanilla JavaScript
- make copy/export actions obvious
- include useful examples inside each tool
- avoid collecting user input on servers

## License

MIT
