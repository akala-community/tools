const tools = [
  {
    id: 'agent-persona',
    name: 'Agent Persona Builder',
    icon: 'AP',
    description: 'Create system prompts from response preferences, agent type, and target language.',
    href: './agent-persona.html',
    status: 'available',
    tags: ['prompt', 'agent', 'persona']
  },
  {
    id: 'motion-map',
    name: 'MotionMap',
    icon: 'MM',
    description: 'Turn simple arrow syntax into animated flow diagrams with PNG, SVG, and video export.',
    href: './motion-map.html',
    status: 'available',
    tags: ['diagram', 'svg', 'export']
  },
  {
    id: 'prompt-diff',
    name: 'Prompt Diff',
    icon: 'PD',
    description: 'Compare two prompts and surface behavior changes before shipping.',
    href: '#roadmap',
    status: 'soon',
    tags: ['diff', 'review', 'prompt']
  },
  {
    id: 'schema-builder',
    name: 'Tool Schema Builder',
    icon: 'TS',
    description: 'Draft JSON schemas and function tool definitions from a guided form.',
    href: '#roadmap',
    status: 'soon',
    tags: ['schema', 'tools', 'json']
  }
];

const grid = document.querySelector('[data-tool-grid]');

if (grid) {
  grid.innerHTML = tools.map((tool) => `
    <article class="card tool-card ${tool.status}">
      <div class="tool-top">
        <div class="tool-icon">${tool.icon}</div>
        <span class="status-pill ${tool.status === 'available' ? 'available' : 'soon'}">
          ${tool.status === 'available' ? 'Available' : 'Coming soon'}
        </span>
      </div>
      <h3>${tool.name}</h3>
      <p>${tool.description}</p>
      <div class="tool-tags">
        ${tool.tags.map((tag) => `<span class="tag-pill">${tag}</span>`).join('')}
      </div>
      <div class="tool-actions">
        <a class="btn ${tool.status === 'available' ? 'btn-primary' : 'btn-secondary'}" href="${tool.href}">
          ${tool.status === 'available' ? 'Open tool' : 'View roadmap'}
        </a>
      </div>
    </article>
  `).join('');
}
