# Contributing

Thanks for improving AKALA Tools.

## Tool requirements

New tools should be:

- browser-only by default
- useful with sample data immediately
- readable without a build step when possible
- local-first: no hidden upload, no account wall
- export-friendly: copy, download, SVG, JSON, CSV, or image where relevant

## File structure

Current static structure:

```txt
index.html
agent-persona.html
motion-map.html
assets/
  css/
  js/
  brand/
docs/
```

For a new single-file tool, add:

```txt
new-tool.html
```

Then register it in:

```txt
assets/js/ui/tool-registry.js
```

## UI standard

Use the shared light design language in `docs/design-system.md`.

Minimum requirements:

- Home link back to `index.html`
- primary action visible above the fold
- useful default/example content
- clear export/copy path
- accessible labels for inputs
- visible keyboard focus

## Code style

- prefer vanilla JavaScript
- keep functions small and named by behavior
- avoid dependencies unless they remove significant complexity
- avoid framework-specific patterns for static tools
- keep generated output deterministic when possible

## Privacy standard

Do not send user content to a server unless the UI clearly says so and the user explicitly starts that action.

## Review checklist

Before opening a PR:

- [ ] tool opens directly as a static HTML file
- [ ] `index.html` links to the tool
- [ ] no console errors on load
- [ ] no personal/private URLs in metadata or footer
- [ ] mobile layout is usable
- [ ] README or docs updated if behavior changed
