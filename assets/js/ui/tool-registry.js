const tools = [
  {
    id: 'agent-persona',
    name: 'Agent Persona Builder',
    summary: 'Guided system prompt generation for AI agents.',
    description: 'Define an agent, answer preference questions, and export a copy-ready system prompt in English or Indonesian.',
    href: './apps/agent-persona/index.html',
    thumbnail: 'Persona setup → quiz → prompt',
    category: 'Prompt design',
    status: 'available',
    version: '1.3',
    updated: '2026-07-06',
    localOnly: true,
    exports: ['txt']
  },
  {
    id: 'motion-map',
    name: 'MotionMap',
    summary: 'Animated flow diagrams from simple arrow syntax.',
    description: 'Write a plain-text flow, render an animated diagram, then export PNG, SVG, or video assets.',
    href: './apps/motion-map/index.html',
    thumbnail: 'Flow text → diagram → export',
    category: 'Diagramming',
    status: 'available',
    version: '1.0',
    updated: '2026-07-06',
    localOnly: true,
    exports: ['png', 'svg', 'webm']
  },
  {
    id: 'prompt-diff',
    name: 'Prompt Diff',
    summary: 'Compare prompt versions before shipping.',
    description: 'Review behavior changes between two prompt drafts and flag risky instruction drift.',
    href: '#roadmap',
    thumbnail: 'Draft A ↔ Draft B',
    category: 'Prompt review',
    status: 'soon',
    version: null,
    updated: null,
    localOnly: true,
    exports: []
  },
  {
    id: 'schema-builder',
    name: 'Tool Schema Builder',
    summary: 'Draft JSON schemas and function tool definitions.',
    description: 'Use a guided form to build structured tool definitions without writing schema by hand.',
    href: '#roadmap',
    thumbnail: 'Form fields → JSON schema',
    category: 'Developer utility',
    status: 'soon',
    version: null,
    updated: null,
    localOnly: true,
    exports: ['json']
  }
];

const grid = document.querySelector('[data-tool-grid]');

const statusLabel = (status) => status === 'available' ? 'Available' : 'Coming soon';
const metaLine = (tool) => [
  tool.category,
  tool.localOnly ? 'Local-only' : null,
  tool.exports.length ? `Exports ${tool.exports.join(', ').toUpperCase()}` : null
].filter(Boolean).join(' / ');

if (grid) {
  grid.innerHTML = tools.map((tool) => `
    <article class="card tool-card ${tool.status}" data-tool-id="${tool.id}">
      <a class="tool-thumb" href="${tool.href}" aria-label="Open ${tool.name}">
        <span>${tool.thumbnail}</span>
      </a>
      <div class="tool-card-body">
        <div class="tool-meta-row">
          <span>${tool.category}</span>
          <span class="status-pill ${tool.status === 'available' ? 'available' : 'soon'}">${statusLabel(tool.status)}</span>
        </div>
        <h3>${tool.name}</h3>
        <p class="tool-summary">${tool.summary}</p>
        <p>${tool.description}</p>
        <div class="tool-meta">${metaLine(tool)}</div>
        <div class="tool-actions">
          <a class="btn ${tool.status === 'available' ? 'btn-primary' : 'btn-secondary'}" href="${tool.href}">
            ${tool.status === 'available' ? 'Open tool' : 'View roadmap'}
          </a>
        </div>
      </div>
    </article>
  `).join('');
}
