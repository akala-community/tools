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

Current release uses static files only:

```txt
index.html
apps/
  agent-persona/
    index.html
    styles.css
    app.js
  motion-map/
    index.html
    styles.css
    app.js
assets/
  brand/
    akala-mark.svg
  css/
    tokens.css
    base.css
    components.css
    gallery.css
    tools.css
    tool.css              # legacy compatibility shim
  js/
    core/
docs/
  design-system.md
scripts/
  check-site.mjs
```

Each tool lives in its own app directory:

```txt
apps/[tool-id]/
  index.html
  styles.css
  app.js
```

Shared styles stay in `assets/css`. Keep app-only behavior and styles beside the app HTML.

## Local use

Open `index.html` in a browser, or serve the directory:

```bash
python -m http.server 8080
```

Then visit:

```txt
http://localhost:8080
```

## Checks

Run the static site checks before committing UI changes:

```bash
node scripts/check-site.mjs
```

The check verifies:

- no inline `<style>` blocks
- no inline `style=` attributes
- all buttons have explicit `type`
- tool CSS load order
- no legacy shell classes in tool pages
- CSS brace balance
- app CSS avoids `:root` and global `body` selectors

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
