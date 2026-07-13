import dagre from 'dagre';

export type RatioKey = 'portrait' | 'square' | 'short' | 'landscape';
export type ThemeKey = 'clean' | 'dark' | 'sketch';
export type AnimationKey = 'flow' | 'draw' | 'dot' | 'none';

export type FlowNode = {
  id: string;
  label: string;
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  lane: number;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  order: number;
};

export type ParsedFlow = {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  warnings: string[];
};

export type FlowNodePlacement = FlowNode & {
  px: number;
  py: number;
};

export type FlowRenderLayout = {
  viewBox: { width: number; height: number };
  isVertical: boolean;
  sizeScale: number;
  placed: FlowNodePlacement[];
};

export type FlowClipProject = {
  version: 1;
  text: string;
  customTitle: string;
  subtitle: string;
  ratio: RatioKey;
  theme: ThemeKey;
  animation: AnimationKey;
  duration: number;
};

export const RATIOS: Record<RatioKey, { label: string; size: string; width: number; height: number }> = {
  portrait: { label: 'Portrait post', size: '1080×1440', width: 1080, height: 1440 },
  square: { label: 'Square', size: '1080×1080', width: 1080, height: 1080 },
  short: { label: 'Story / Short', size: '1080×1920', width: 1080, height: 1920 },
  landscape: { label: 'Landscape', size: '1920×1080', width: 1920, height: 1080 },
};

export const THEMES: Record<ThemeKey, { label: string }> = {
  clean: { label: 'Clean' },
  dark: { label: 'Dark' },
  sketch: { label: 'Sketch' },
};

export const ANIMATIONS: Record<AnimationKey, { label: string }> = {
  flow: { label: 'Flowing dashed' },
  draw: { label: 'Draw path' },
  dot: { label: 'Pulse dot' },
  none: { label: 'No motion' },
};

export const MAX_PROJECT_JSON_BYTES = 256 * 1024;
export const MAX_FLOW_TEXT_LENGTH = 20_000;
export const MAX_TITLE_LENGTH = 120;
export const MAX_SUBTITLE_LENGTH = 200;
export const MAX_EXPORT_NODES = 80;
export const MAX_EXPORT_EDGES = 140;

export function getLayoutDirection(ratio: RatioKey, nodeCount: number): 'LR' | 'TB' {
  if (ratio === 'landscape') return 'LR';
  if (ratio === 'square') return nodeCount <= 4 ? 'LR' : 'TB';
  return 'TB';
}

export function getFlowViewBox(ratio: RatioKey) {
  if (ratio === 'landscape') return { width: 1600, height: 900 };
  if (ratio === 'square') return { width: 1080, height: 1080 };
  return { width: 1080, height: ratio === 'short' ? 1920 : 1440 };
}

export function getFlowRenderLayout(flow: ParsedFlow, ratio: RatioKey): FlowRenderLayout {
  const viewBox = getFlowViewBox(ratio);
  const isVertical = getLayoutDirection(ratio, flow.nodes.length) === 'TB';
  const padX = viewBox.width * (isVertical ? 0.12 : 0.08);
  const top = viewBox.height * 0.18;
  const bottom = viewBox.height * 0.10;
  const usableWidth = viewBox.width - padX * 2;
  const usableHeight = viewBox.height - top - bottom;
  const baseScale = isVertical
    ? Math.min(1.18, (viewBox.width * 0.78) / Math.max(1, ...flow.nodes.map((node) => node.width)))
    : Math.min(1.15, (viewBox.width * 0.34) / Math.max(1, ...flow.nodes.map((node) => node.width)));
  const centerPlaced = flow.nodes.map((node) => ({
    ...node,
    px: padX + node.x * usableWidth,
    py: top + node.y * usableHeight,
  }));
  let sizeScale = baseScale;
  const edgePad = 28;
  const nodeGap = isVertical ? 46 : 54;

  centerPlaced.forEach((node) => {
    const maxWidthScale = Math.max(0.2, (Math.min(node.px, viewBox.width - node.px) - edgePad) * 2 / Math.max(1, node.width));
    const maxHeightScale = Math.max(0.2, (Math.min(node.py, viewBox.height - node.py) - edgePad) * 2 / Math.max(1, node.height));
    sizeScale = Math.min(sizeScale, maxWidthScale, maxHeightScale);
  });

  for (let i = 0; i < centerPlaced.length; i += 1) {
    for (let j = i + 1; j < centerPlaced.length; j += 1) {
      const a = centerPlaced[i];
      const b = centerPlaced[j];
      const primaryDistance = Math.abs((isVertical ? b.py : b.px) - (isVertical ? a.py : a.px));
      const crossDistance = Math.abs((isVertical ? b.px : b.py) - (isVertical ? a.px : a.py));
      const primarySize = ((isVertical ? a.height : a.width) + (isVertical ? b.height : b.width)) / 2;
      const crossSize = ((isVertical ? a.width : a.height) + (isVertical ? b.width : b.height)) / 2;

      if (primaryDistance <= 1 || crossDistance > crossSize * baseScale + nodeGap) continue;
      sizeScale = Math.min(sizeScale, Math.max(0.2, (primaryDistance - nodeGap) / Math.max(1, primarySize)));
    }
  }

  sizeScale = Math.max(0.38, sizeScale);
  const placed = centerPlaced.map((node) => ({
    ...node,
    width: node.width * sizeScale,
    height: node.height * sizeScale,
  }));

  return { viewBox, isVertical, sizeScale, placed };
}

export function cleanToken(value: string) {
  return value.trim().replace(/^[']|[']$/g, '').replace(/^["]|["]$/g, '').replace(/\s+/g, ' ');
}

export function wrapLabel(label: string, maxChars = 18) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function getNodeSize(label: string) {
  const lines = wrapLabel(label, 16);
  const longestLine = Math.max(...lines.map((line) => line.length));
  const width = Math.max(170, Math.min(390, longestLine * 19 + 64));
  const height = Math.max(86, 38 + lines.length * 42);
  return { width, height, lines };
}

export function getEdgePorts(
  from: { px: number; py: number; width: number; height: number },
  to: { px: number; py: number; width: number; height: number },
  isVertical: boolean
) {
  const dx = to.px - from.px;
  const dy = to.py - from.py;
  const xSign = Math.sign(dx || 1);
  const ySign = Math.sign(dy || 1);

  if (isVertical) {
    return {
      start: { x: from.px, y: from.py + ySign * from.height / 2 },
      end: { x: to.px, y: to.py - ySign * to.height / 2 },
    };
  }

  return {
    start: { x: from.px + xSign * from.width / 2, y: from.py },
    end: { x: to.px - xSign * to.width / 2, y: to.py },
  };
}

export function getSmoothCurve(start: { x: number; y: number }, end: { x: number; y: number }, isVertical: boolean) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const bend = Math.max(48, Math.min(180, Math.abs(isVertical ? dy : dx) * 0.42));
  const c1 = isVertical
    ? { x: start.x, y: start.y + Math.sign(dy || 1) * bend }
    : { x: start.x + Math.sign(dx || 1) * bend, y: start.y };
  const c2 = isVertical
    ? { x: end.x, y: end.y - Math.sign(dy || 1) * bend }
    : { x: end.x - Math.sign(dx || 1) * bend, y: end.y };
  const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  const angle = Math.atan2(end.y - c2.y, end.x - c2.x);
  return { c1, c2, path, angle };
}

export function cubicPoint(
  start: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  end: { x: number; y: number },
  t: number
) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * start.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * end.x,
    y: mt ** 3 * start.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * end.y,
  };
}

export function drawCubicSegment(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  end: { x: number; y: number },
  progress: number
) {
  const steps = Math.max(2, Math.ceil(42 * Math.max(0.02, Math.min(1, progress))));
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  for (let i = 1; i <= steps; i += 1) {
    const point = cubicPoint(start, c1, c2, end, (i / steps) * progress);
    ctx.lineTo(point.x, point.y);
  }
}

export function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

export function parseFlowText(text: string, ratio: RatioKey): ParsedFlow {
  const nodeIds = new Map<string, string>();
  const edges: FlowEdge[] = [];
  const warnings: string[] = [];
  let title = 'FlowClip';

  const getNodeId = (label: string) => {
    const key = label.toLowerCase();
    if (!nodeIds.has(key)) nodeIds.set(key, `n${nodeIds.size + 1}`);
    return nodeIds.get(key)!;
  };

  text.split('\n').forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const titleMatch = line.match(/^title\s+(.+)$/i);
    if (titleMatch) {
      title = cleanToken(titleMatch[1]);
      return;
    }

    if (!line.includes('->')) {
      warnings.push(`Line ${lineIndex + 1}: use A -> B syntax.`);
      return;
    }

    const parts = line.split('->').map(cleanToken).filter(Boolean);
    if (parts.length < 2) {
      warnings.push(`Line ${lineIndex + 1}: add at least two nodes.`);
      return;
    }

    for (let i = 0; i < parts.length - 1; i += 1) {
      const fromLabel = parts[i];
      const rawTo = parts[i + 1];
      const [toLabelRaw, ...labelParts] = rawTo.split(':');
      const toLabel = cleanToken(toLabelRaw);
      const label = labelParts.length ? cleanToken(labelParts.join(':')) : undefined;

      if (!fromLabel || !toLabel) continue;

      edges.push({
        id: `e${edges.length + 1}`,
        from: getNodeId(fromLabel),
        to: getNodeId(toLabel),
        label,
        order: edges.length,
      });
    }
  });

  const labelsById = new Map<string, string>();
  for (const [labelKey, id] of nodeIds) {
    const original = text
      .split(/->|\n|:/)
      .map(cleanToken)
      .find((part) => part.toLowerCase() === labelKey);
    labelsById.set(id, original || labelKey);
  }

  const rawNodes = [...labelsById.entries()].map(([id, label]) => ({ id, label }));
  const nodes = layoutNodes(rawNodes, edges, ratio);
  if (!nodes.length) warnings.push('Add a flow like Idea -> Script -> Publish.');
  return { title, nodes, edges, warnings };
}

export function layoutNodes(rawNodes: Array<{ id: string; label: string }>, edges: FlowEdge[], ratio: RatioKey): FlowNode[] {
  if (!rawNodes.length) return [];

  const direction = getLayoutDirection(ratio, rawNodes.length);
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 80 : 54,
    ranksep: direction === 'LR' ? 150 : 110,
    marginx: 40,
    marginy: 40,
  });

  rawNodes.forEach((node) => {
    graph.setNode(node.id, getNodeSize(node.label));
  });

  edges.forEach((edge) => graph.setEdge(edge.from, edge.to));
  dagre.layout(graph);

  const graphNodes = rawNodes.map((node) => {
    const laidOut = graph.node(node.id) as { x: number; y: number; width: number; height: number } | undefined;
    const fallback = getNodeSize(node.label);
    return {
      ...node,
      lines: fallback.lines,
      gx: laidOut?.x || 0,
      gy: laidOut?.y || 0,
      width: laidOut?.width || fallback.width,
      height: laidOut?.height || fallback.height,
    };
  });

  const minX = Math.min(...graphNodes.map((node) => node.gx - node.width / 2));
  const maxX = Math.max(...graphNodes.map((node) => node.gx + node.width / 2));
  const minY = Math.min(...graphNodes.map((node) => node.gy - node.height / 2));
  const maxY = Math.max(...graphNodes.map((node) => node.gy + node.height / 2));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  return graphNodes.map((node, index) => ({
    id: node.id,
    label: node.label,
    lines: node.lines,
    x: graphNodes.length === 1 ? 0.5 : (node.gx - minX) / spanX,
    y: graphNodes.length === 1 ? 0.5 : (node.gy - minY) / spanY,
    width: node.width,
    height: node.height,
    level: direction === 'LR' ? Math.round((node.gx - minX) / spanX * 10) : Math.round((node.gy - minY) / spanY * 10),
    lane: index,
  }));
}

export function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'flowclip';
}

export function clampDuration(value: number) {
  if (!Number.isFinite(value)) return 6;
  return Math.min(20, Math.max(3, value));
}

export function limitText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, maxLength);
}

export function getProjectState({ text, customTitle, subtitle, ratio, theme, animation, duration }: Omit<FlowClipProject, 'version'>): FlowClipProject {
  return { version: 1, text, customTitle, subtitle, ratio, theme, animation, duration: clampDuration(duration) };
}

export function isProjectState(value: unknown): value is Partial<FlowClipProject> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeProjectState(data: unknown): Partial<FlowClipProject> {
  if (!isProjectState(data)) {
    throw new Error('Invalid FlowClip project.');
  }
  if ('version' in data && data.version !== 1) {
    throw new Error('Unsupported FlowClip project version.');
  }

  const next: Partial<FlowClipProject> = {};
  if (typeof data.text === 'string') next.text = limitText(data.text, MAX_FLOW_TEXT_LENGTH);
  if (typeof data.customTitle === 'string') next.customTitle = limitText(data.customTitle, MAX_TITLE_LENGTH);
  if (typeof data.subtitle === 'string') next.subtitle = limitText(data.subtitle, MAX_SUBTITLE_LENGTH);
  if (data.ratio && RATIOS[data.ratio as RatioKey]) next.ratio = data.ratio as RatioKey;
  if (data.theme && THEMES[data.theme as ThemeKey]) next.theme = data.theme as ThemeKey;

  const importedAnimation = (data as { animation?: unknown }).animation;
  if (typeof importedAnimation === 'string' && ANIMATIONS[importedAnimation as AnimationKey]) next.animation = importedAnimation as AnimationKey;
  else if (importedAnimation === 'reveal' || importedAnimation === 'pulse') next.animation = 'flow';

  if (typeof data.duration === 'number') next.duration = clampDuration(data.duration);
  return next;
}
