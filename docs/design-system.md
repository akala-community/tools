# AKALA Tools Design System

AKALA Tools uses a warm light UI system for small, browser-only utilities.

## Product feel

- light, calm, and production-grade
- premium without looking like a heavy SaaS dashboard
- clear hierarchy over decoration
- useful in under ten seconds
- export/copy actions always obvious

## Tokens

Sources:

- `assets/css/tokens.css` for global design tokens
- `assets/css/base.css` for reset, page background, and site shell
- `assets/css/components.css` for shared cards, buttons, topbar, pills, and footer
- `assets/css/tools.css` for the shared single-tool shell
- `apps/agent-persona/styles.css` and `apps/motion-map/styles.css` for current app-specific UI
- `assets/css/tool.css` as a legacy compatibility shim for older single-file tools

Core colors:

```css
--bg: #f7f4ee;
--bg-2: #fffaf1;
--paper: #ffffff;
--paper-warm: #fffdf8;
--ink: #17130d;
--muted: #756d62;
--line: #e4dccf;
--line-strong: #d5cab9;
--gold: #d99b29;
```

Use `--ink` for primary actions and main headings. Use `--gold` sparingly for accents, glows, and emphasis.

## Components

### Tool shell

Every new single-file tool should load shared styles in this order:

```html
<link rel="stylesheet" href="../../assets/css/tokens.css" />
<link rel="stylesheet" href="../../assets/css/base.css" />
<link rel="stylesheet" href="../../assets/css/components.css" />
<link rel="stylesheet" href="../../assets/css/tools.css" />
<link rel="stylesheet" href="./styles.css" />
```

Legacy tools may still load `../../assets/css/tool.css`; it imports the shared shell.

Use these body classes:

```html
<body class="tool-page tool-persona">
<body class="tool-page tool-motion">
```

Use the shared shell pieces:

```html
<main class="tool-shell">
<header class="tool-topbar">...</header>
<section class="tool-hero">...</section>
<section class="tool-layout">
  <aside class="tool-sidebar">...</aside>
  <section class="tool-workspace">...</section>
</section>
</main>
```

### Shell

Use a centered page shell:

```html
<div class="page-shell">...</div>
```

### Topbar

```html
<header class="topbar">
  <a class="brand" href="./index.html">
    <span class="brand-mark">A</span>
    <span class="brand-copy">
      <strong>AKALA Tools</strong>
      <span>Open-source agent utilities</span>
    </span>
  </a>
  <nav class="nav-links">...</nav>
</header>
```

### Buttons

```html
<a class="btn btn-primary">Primary</a>
<a class="btn btn-secondary">Secondary</a>
<a class="btn btn-ghost">Ghost</a>
```

Button rules:

- one primary action per view
- secondary actions visible but quieter
- avoid destructive actions unless clearly labelled

### Cards

```html
<article class="card">...</article>
```

Cards should use clear headings, short copy, and direct actions.

### Tags and status pills

Use `tag-pill` for non-clickable metadata inside tools.

```html
<span class="tag-pill">Local only</span>
<span class="tag-pill"><strong>3</strong> nodes</span>
```

Use `status-pill` for gallery availability badges.

```html
<span class="status-pill available">Available</span>
<span class="status-pill soon">Coming soon</span>
```

Legacy aliases such as `chip`, `pill`, and `mini-pill` are compatibility-only.

## Tool layout patterns

### Builder tools

For prompt/persona/eval tools:

```txt
Hero → setup card → step card → result panel
```

### Studio tools

For diagram/schema/diff tools:

```txt
Topbar → sidebar controls → main preview/output → status row
```

### Split tools

For diff/lint/review tools:

```txt
Input pane → output pane → action bar
```

## UX rules

- tool should work with defaults immediately
- examples should be one click
- output should be copyable or downloadable
- no login, no backend, no hidden state
- localStorage is allowed for convenience
- keyboard focus must be visible
- mobile layout must degrade cleanly

## Copy tone

Short, specific, and practical.

Good:

```txt
Create system prompts from response preferences.
```

Avoid:

```txt
Unlock the power of next-generation AI workflows.
```

## Production checklist

Before shipping a tool:

- [ ] links back to `index.html`
- [ ] has useful default content
- [ ] has examples or presets
- [ ] copy/export action works
- [ ] empty/error state is readable
- [ ] metadata uses AKALA Tools
- [ ] no private/personal links remain
- [ ] mobile layout checked
- [ ] no console errors on load
