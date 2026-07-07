import fs from 'node:fs';
import path from 'node:path';

const htmlFiles = [
  'index.html',
  'apps/agent-persona/index.html',
  'apps/motion-map/index.html',
];

const toolPages = [
  {
    file: 'apps/agent-persona/index.html',
    appCss: './styles.css',
  },
  {
    file: 'apps/motion-map/index.html',
    appCss: './styles.css',
  },
];

const expectedToolCssPrefix = [
  '../../assets/css/tokens.css',
  '../../assets/css/base.css',
  '../../assets/css/components.css',
  '../../assets/css/tools.css',
];

const legacyToolClasses = [
  'app',
  'nav',
  'layout',
  'sidebar',
  'hero',
  'result',
  'brand-mini',
  'top-actions',
  'eyebrow',
  'app-shell',
  'topbar',
  'app-row',
  'main',
  'workspace',
  'canvas-wrap',
  'brand',
  'mark',
  'actions',
];

const cssFiles = [
  ...fs.readdirSync('assets/css')
    .filter((file) => file.endsWith('.css'))
    .map((file) => path.join('assets/css', file)),
  ...toolPages.map(({ file }) => path.join(path.dirname(file), 'styles.css')),
];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`✗ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function cssLinks(html) {
  return [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((match) => match[1]);
}

function classList(html) {
  return [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
}

for (const file of htmlFiles) {
  const html = read(file);

  if (/<style\b/i.test(html)) fail(`${file}: contains <style> block`);
  else pass(`${file}: no <style> block`);

  const styleAttrs = [...html.matchAll(/\sstyle=/gi)];
  if (styleAttrs.length) fail(`${file}: contains ${styleAttrs.length} inline style attribute(s)`);
  else pass(`${file}: no inline style attributes`);

  const buttonsWithoutType = [...html.matchAll(/<button\b[^>]*>/gi)].filter((match) => !/\stype=/.test(match[0]));
  if (buttonsWithoutType.length) fail(`${file}: ${buttonsWithoutType.length} button(s) missing type`);
  else pass(`${file}: all buttons have type`);
}

for (const { file, appCss } of toolPages) {
  const html = read(file);
  const links = cssLinks(html);
  const expected = [...expectedToolCssPrefix, appCss];
  const actual = links.slice(0, expected.length);

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${file}: unexpected tool CSS order: ${actual.join(' -> ')}`);
  } else {
    pass(`${file}: tool CSS order ok`);
  }

  const classes = new Set(classList(html));
  const legacy = legacyToolClasses.filter((className) => classes.has(className));
  if (legacy.length) fail(`${file}: legacy tool classes remain: ${legacy.join(', ')}`);
  else pass(`${file}: no legacy tool shell classes`);
}

for (const file of cssFiles) {
  const css = read(file);
  let balance = 0;
  let minBalance = 0;
  for (const char of css) {
    if (char === '{') balance += 1;
    if (char === '}') balance -= 1;
    minBalance = Math.min(minBalance, balance);
  }

  if (balance !== 0 || minBalance < 0) fail(`${file}: unbalanced braces`);
  else pass(`${file}: brace balance ok`);
}

for (const file of toolPages.map(({ file }) => path.join(path.dirname(file), 'styles.css'))) {
  const css = read(file);
  if (/:root/.test(css)) fail(`${file}: app CSS contains :root`);
  else pass(`${file}: no :root`);

  if (/(^|\n)\s*body\b/.test(css)) fail(`${file}: app CSS contains global body selector`);
  else pass(`${file}: no global body selector`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('\nSite checks passed.');
}
