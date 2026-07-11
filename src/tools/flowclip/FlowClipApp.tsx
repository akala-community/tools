import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { toSvg } from 'html-to-image';
import dagre from 'dagre';

type RatioKey = 'portrait' | 'square' | 'short' | 'landscape';
type ThemeKey = 'clean' | 'dark' | 'sketch';
type AnimationKey = 'flow' | 'draw' | 'dot' | 'none';

type Node = {
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

type Edge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  order: number;
};

type ParsedFlow = {
  title: string;
  nodes: Node[];
  edges: Edge[];
  warnings: string[];
};

const STARTER_TEXT = `title Creator Workflow
Idea -> Script -> Record -> Edit -> Publish`;

const EXAMPLES = [
  {
    name: 'Creator workflow',
    value: `title Creator Workflow
Idea -> Script -> Record -> Edit -> Publish`,
  },
  {
    name: 'Product launch',
    value: `title Launch Plan
Teaser -> Waitlist -> Demo
Waitlist -> Email Drop -> Launch
Demo -> Launch -> Feedback`,
  },
  {
    name: 'App request',
    value: `title How A Request Works
User -> App: clicks
App -> API: sends request
API -> Database: reads
Database -> API: returns data
API -> App: shows result`,
  },
];

const RATIOS: Record<RatioKey, { label: string; size: string; width: number; height: number }> = {
  portrait: { label: 'Portrait post', size: '1080×1440', width: 1080, height: 1440 },
  square: { label: 'Square', size: '1080×1080', width: 1080, height: 1080 },
  short: { label: 'Story / Short', size: '1080×1920', width: 1080, height: 1920 },
  landscape: { label: 'Landscape', size: '1920×1080', width: 1920, height: 1080 },
};

function getLayoutDirection(ratio: RatioKey, nodeCount: number): 'LR' | 'TB' {
  if (ratio === 'landscape') return 'LR';
  if (ratio === 'square') return nodeCount <= 4 ? 'LR' : 'TB';
  return 'TB';
}

const THEMES: Record<ThemeKey, { label: string }> = {
  clean: { label: 'Clean' },
  dark: { label: 'Dark' },
  sketch: { label: 'Sketch' },
};

const ANIMATIONS: Record<AnimationKey, { label: string }> = {
  flow: { label: 'Flowing dashed' },
  draw: { label: 'Draw path' },
  dot: { label: 'Pulse dot' },
  none: { label: 'No motion' },
};

const MAX_PROJECT_JSON_BYTES = 256 * 1024;
const MAX_FLOW_TEXT_LENGTH = 20_000;
const MAX_TITLE_LENGTH = 120;
const MAX_SUBTITLE_LENGTH = 200;
const MAX_EXPORT_NODES = 80;
const MAX_EXPORT_EDGES = 140;

function cleanToken(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, ' ');
}

function wrapLabel(label: string, maxChars = 18) {
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

function getNodeSize(label: string) {
  const lines = wrapLabel(label, 16);
  const longestLine = Math.max(...lines.map((line) => line.length));
  const width = Math.max(170, Math.min(390, longestLine * 19 + 64));
  const height = Math.max(86, 38 + lines.length * 42);
  return { width, height, lines };
}

function getEdgePorts(
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

function getSmoothCurve(start: { x: number; y: number }, end: { x: number; y: number }, isVertical: boolean) {
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

function cubicPoint(
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

function drawCubicSegment(
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

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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

function parseFlowText(text: string, ratio: RatioKey): ParsedFlow {
  const nodeIds = new Map<string, string>();
  const edges: Edge[] = [];
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

function layoutNodes(rawNodes: Array<{ id: string; label: string }>, edges: Edge[], ratio: RatioKey): Node[] {
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'flowclip';
}

function clampDuration(value: number) {
  if (!Number.isFinite(value)) return 6;
  return Math.min(20, Math.max(3, value));
}

function limitText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, maxLength);
}

type FlowClipProject = {
  version: 1;
  text: string;
  customTitle: string;
  subtitle: string;
  ratio: RatioKey;
  theme: ThemeKey;
  animation: AnimationKey;
  duration: number;
};

function getProjectState({ text, customTitle, subtitle, ratio, theme, animation, duration }: Omit<FlowClipProject, 'version'>): FlowClipProject {
  return { version: 1, text, customTitle, subtitle, ratio, theme, animation, duration: clampDuration(duration) };
}

function isProjectState(value: unknown): value is Partial<FlowClipProject> {
  return typeof value === 'object' && value !== null;
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function canvasHasNonBackgroundPixels(canvas: HTMLCanvasElement, backgroundHex: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const bg = hexToRgb(backgroundHex);
  const step = Math.max(12, Math.floor(Math.min(canvas.width, canvas.height) / 80));
  const tolerance = 10;
  try {
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
        if (a > 0 && (Math.abs(r - bg.r) > tolerance || Math.abs(g - bg.g) > tolerance || Math.abs(b - bg.b) > tolerance)) {
          return true;
        }
      }
    }
  } catch {
    return true;
  }
  return false;
}

export default function FlowClipApp() {
  const [text, setText] = useState(STARTER_TEXT);
  const [customTitle, setCustomTitle] = useState('');
  const [subtitle, setSubtitle] = useState('Made with FlowClip');
  const [ratio, setRatio] = useState<RatioKey>('portrait');
  const [theme, setTheme] = useState<ThemeKey>('clean');
  const [animation, setAnimation] = useState<AnimationKey>('flow');
  const [duration, setDuration] = useState(6);
  const [status, setStatus] = useState('Ready.');
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('flowclip:v1');
      if (!saved) return;
      const data = JSON.parse(saved);
      applyProjectState(data);
    } catch {
      // Ignore unavailable storage or corrupt local saves.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('flowclip:v1', JSON.stringify(getProjectState({ text, customTitle, subtitle, ratio, theme, animation, duration })));
    } catch {
      // Ignore unavailable storage or quota errors.
    }
  }, [text, customTitle, subtitle, ratio, theme, animation, duration]);

  const parsed = useMemo(() => parseFlowText(text, ratio), [text, ratio]);
  const displayTitle = customTitle.trim() || parsed.title;
  const displaySubtitle = subtitle.trim();
  const ratioInfo = RATIOS[ratio];
  const fileBase = safeFileName(displayTitle);

  function canExportDiagram(format: string) {
    if (parsed.nodes.length > MAX_EXPORT_NODES || parsed.edges.length > MAX_EXPORT_EDGES) {
      setStatus(`${format} export blocked. Keep flows under ${MAX_EXPORT_NODES} nodes and ${MAX_EXPORT_EDGES} edges.`);
      return false;
    }
    return true;
  }

  function applyProjectState(data: unknown) {
    if (!isProjectState(data) || Array.isArray(data)) {
      throw new Error('Invalid FlowClip project.');
    }
    if ('version' in data && data.version !== 1) {
      throw new Error('Unsupported FlowClip project version.');
    }
    if (typeof data.text === 'string') setText(limitText(data.text, MAX_FLOW_TEXT_LENGTH));
    if (typeof data.customTitle === 'string') setCustomTitle(limitText(data.customTitle, MAX_TITLE_LENGTH));
    if (typeof data.subtitle === 'string') setSubtitle(limitText(data.subtitle, MAX_SUBTITLE_LENGTH));
    if (data.ratio && RATIOS[data.ratio as RatioKey]) setRatio(data.ratio as RatioKey);
    if (data.theme && THEMES[data.theme as ThemeKey]) setTheme(data.theme as ThemeKey);
    const importedAnimation = (data as { animation?: unknown }).animation;
    if (typeof importedAnimation === 'string' && ANIMATIONS[importedAnimation as AnimationKey]) setAnimation(importedAnimation as AnimationKey);
    else if (importedAnimation === 'reveal' || importedAnimation === 'pulse') setAnimation('flow');
    if (typeof data.duration === 'number') setDuration(clampDuration(data.duration));
  }

  function exportProjectJson() {
    const project = getProjectState({ text, customTitle, subtitle, ratio, theme, animation, duration });
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${fileBase}.flowclip.json`);
    setStatus('Project JSON exported.');
  }

  async function importProjectJson(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > MAX_PROJECT_JSON_BYTES) {
        setStatus('Project JSON is too large. Maximum size is 256KB.');
        return;
      }
      const data = JSON.parse(await file.text());
      applyProjectState(data);
      setStatus('Project JSON loaded.');
    } catch (error) {
      console.error(error);
      setStatus('Could not load project JSON.');
    } finally {
      if (projectInputRef.current) projectInputRef.current.value = '';
    }
  }

  function drawCanvasFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) {
    const viewBox = ratio === 'landscape'
      ? { width: 1600, height: 900 }
      : ratio === 'square'
        ? { width: 1080, height: 1080 }
        : { width: 1080, height: ratio === 'short' ? 1920 : 1440 };
    const isVertical = getLayoutDirection(ratio, parsed.nodes.length) === 'TB';
    const padX = viewBox.width * (isVertical ? 0.12 : 0.08);
    const top = viewBox.height * 0.18;
    const bottom = viewBox.height * 0.10;
    const usableWidth = viewBox.width - padX * 2;
    const usableHeight = viewBox.height - top - bottom;
    const sizeScale = isVertical
      ? Math.min(1.18, (viewBox.width * 0.78) / Math.max(1, ...parsed.nodes.map((node) => node.width)))
      : Math.min(1.15, (viewBox.width * 0.34) / Math.max(1, ...parsed.nodes.map((node) => node.width)));
    const placed = parsed.nodes.map((node) => ({
      ...node,
      width: node.width * sizeScale,
      height: node.height * sizeScale,
      px: padX + node.x * usableWidth,
      py: top + node.y * usableHeight,
    }));
    const placedById = new Map(placed.map((node) => [node.id, node]));
    const colors = theme === 'dark'
      ? { bg: '#080b13', title: '#f8fafc', sub: '#93a4bc', node: '#0f172a', nodeStroke: '#64748b', text: '#f8fafc', base: 'rgba(148,163,184,.28)', edge: '#60a5fa' }
      : theme === 'sketch'
        ? { bg: '#fbf3df', title: '#17130d', sub: '#756d62', node: '#fffaf1', nodeStroke: '#17130d', text: '#17130d', base: 'rgba(23,19,13,.18)', edge: '#17130d' }
        : { bg: '#fffaf1', title: '#17130d', sub: '#756d62', node: '#ffffff', nodeStroke: '#d5cab9', text: '#17130d', base: 'rgba(23,19,13,.16)', edge: '#315f9f' };

    const drawArrow = (x: number, y: number, angle: number, color = colors.edge) => {
      const size = 15;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size * 0.45);
      ctx.lineTo(-size, size * 0.45);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    ctx.setTransform(canvas.width / viewBox.width, 0, 0, canvas.height / viewBox.height, 0, 0);
    ctx.clearRect(0, 0, viewBox.width, viewBox.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, viewBox.width, viewBox.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.title;
    ctx.font = '900 54px Inter, system-ui, sans-serif';
    ctx.fillText(displayTitle, viewBox.width / 2, viewBox.height * 0.11);
    if (displaySubtitle) {
      ctx.fillStyle = colors.sub;
      ctx.font = '800 19px Inter, system-ui, sans-serif';
      ctx.fillText(displaySubtitle, viewBox.width / 2, viewBox.height * 0.15);
    }

    parsed.edges.forEach((edge) => {
      const from = placedById.get(edge.from);
      const to = placedById.get(edge.to);
      if (!from || !to) return;
      const { start, end } = getEdgePorts(from, to, isVertical);
      const curve = getSmoothCurve(start, end, isVertical);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, end.x, end.y);
      ctx.setLineDash(animation === 'none' || animation === 'dot' ? [] : [14, 14]);
      ctx.lineDashOffset = 0;
      ctx.strokeStyle = colors.base;
      ctx.lineWidth = 5;
      ctx.stroke();

      if (animation === 'draw') {
        drawCubicSegment(ctx, start, curve.c1, curve.c2, end, Math.min(1, progress / Math.max(0.1, duration)));
        ctx.setLineDash([]);
        ctx.strokeStyle = colors.edge;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (animation === 'dot') {
        const dot = cubicPoint(start, curve.c1, curve.c2, end, (progress * 0.28 + edge.order * 0.18) % 1);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = colors.edge;
        ctx.fill();
      } else if (animation === 'flow') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, end.x, end.y);
        ctx.setLineDash([14, 14]);
        ctx.lineDashOffset = -progress * 84;
        ctx.strokeStyle = colors.edge;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.setLineDash([]);

      drawArrow(end.x, end.y, curve.angle, animation === 'none' ? colors.base : colors.edge);
    });

    placed.forEach((node) => {
      const x = node.px - node.width / 2;
      const y = node.py - node.height / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(42,31,16,.18)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = colors.node;
      ctx.strokeStyle = colors.nodeStroke;
      ctx.lineWidth = theme === 'sketch' ? 3 : 2;
      ctx.beginPath();
      roundedRectPath(ctx, x, y, node.width, node.height, Math.min(28, node.height / 3));
      ctx.fill();
      ctx.shadowColor = 'transparent';
      if (theme === 'sketch') ctx.setLineDash([9, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.text;
      ctx.font = `900 ${34 * sizeScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lineHeight = 42 * sizeScale;
      const firstY = node.py - ((node.lines.length - 1) * lineHeight) / 2 + 2 * sizeScale;
      node.lines.forEach((line, index) => ctx.fillText(line, node.px, firstY + index * lineHeight));
      ctx.restore();
    });
  }

  async function exportPng() {
    if (isExporting || !canExportDiagram('PNG')) return;
    setIsExporting(true);
    setStatus(`Exporting PNG ${ratioInfo.size}…`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = ratioInfo.width;
      canvas.height = ratioInfo.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setStatus('PNG export failed. Canvas is not available.');
        return;
      }
      drawCanvasFrame(ctx, canvas, animation === 'draw' ? duration : duration / 2);
      const background = theme === 'dark' ? '#080b13' : theme === 'sketch' ? '#fbf3df' : '#fffaf1';
      if (parsed.nodes.length > 0 && !canvasHasNonBackgroundPixels(canvas, background)) {
        setStatus('PNG export failed. Blank image detected.');
        return;
      }
      downloadDataUrl(canvas.toDataURL('image/png'), `${fileBase}-${ratioInfo.width}x${ratioInfo.height}.png`);
      setStatus(`PNG exported at ${ratioInfo.size}.`);
    } catch (error) {
      console.error(error);
      setStatus('PNG export failed. Try a smaller flow or another browser.');
    } finally {
      setIsExporting(false);
    }
  }

  async function exportSvg() {
    if (!exportRef.current || isExporting || !canExportDiagram('SVG')) return;
    setIsExporting(true);
    setStatus(`Exporting SVG ${ratioInfo.size}…`);
    try {
      const dataUrl = await toSvg(exportRef.current, { cacheBust: true });
      downloadDataUrl(dataUrl, `${fileBase}-${ratioInfo.width}x${ratioInfo.height}.svg`);
      setStatus(`SVG exported at ${ratioInfo.size}.`);
    } catch (error) {
      console.error(error);
      setStatus('SVG export failed. Try a smaller flow or another browser.');
    } finally {
      setIsExporting(false);
    }
  }

  async function exportWebm() {
    if (isExporting || !canExportDiagram('WebM')) return;
    setIsExporting(true);
    setStatus('Recording WebM…');

    try {
      if (typeof MediaRecorder === 'undefined') {
        setStatus('Video export is not supported in this browser. Try Chrome or Edge.');
        setIsExporting(false);
        return;
      }

      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        setStatus('Video export is not supported in this browser. Try Chrome or Edge.');
        setIsExporting(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = ratioInfo.width;
      canvas.height = ratioInfo.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setStatus('Video export failed. Canvas is not available.');
        setIsExporting(false);
        return;
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onerror = () => {
        setStatus('Video export failed while recording.');
        setIsExporting(false);
      };
      recorder.onstop = () => {
        setIsExporting(false);
        if (!chunks.length) {
          setStatus('Video export failed. No video data was recorded.');
          return;
        }
        downloadBlob(new Blob(chunks, { type: 'video/webm' }), `${fileBase}-${ratioInfo.width}x${ratioInfo.height}.webm`);
        setStatus(`WebM video exported at ${ratioInfo.size}.`);
      };

      const drawFrame = (progress: number) => drawCanvasFrame(ctx, canvas, progress);

      recorder.start(250);
      const start = performance.now();
      const totalMs = duration * 1000;
      const tick = (now: number) => {
        const elapsed = now - start;
        drawFrame(elapsed / 1000);
        if (elapsed < totalMs) requestAnimationFrame(tick);
        else {
          drawFrame(totalMs / 1000);
          recorder.stop();
        }
      };
      requestAnimationFrame(tick);
    } catch (error) {
      console.error(error);
      setStatus('Video export failed. Try Chrome or Edge.');
      setIsExporting(false);
    }
  }

  return (
    <div className="flowclip-app">
      <section className="tool-hero flowclip-hero">
        <div>
          <span className="tool-eyebrow">FlowClip</span>
          <h1>Type a flow. Export an animated social diagram.</h1>
          <p>Use simple arrow text like <code>A -&gt; B -&gt; C</code>. FlowClip makes the nodes, links, motion, and social canvas.</p>
        </div>
        <div className="flowclip-hero-actions">
          <button className="tool-btn" onClick={() => setText(EXAMPLES[0].value)}>Reset example</button>
          <button className="tool-btn tool-btn-primary" onClick={exportWebm} disabled={isExporting}>Export video</button>
        </div>
      </section>

      <section className="flowclip-layout">
        <aside className="flowclip-editor panel">
          <div className="panel-head">
            <div>
              <h2>Flow text</h2>
              <p>One path per line. Comments start with #.</p>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            aria-label="Flow text"
          />

          <div className="flowclip-examples">
            {EXAMPLES.map((example) => (
              <button key={example.name} className="tool-btn" onClick={() => setText(example.value)}>{example.name}</button>
            ))}
          </div>

          <div className="flowclip-help">
            <strong>Syntax</strong>
            <code>title My Flow</code>
            <code>A -&gt; B -&gt; C</code>
            <code>A -&gt; B: label</code>
          </div>

          {parsed.warnings.length > 0 && (
            <div className="flowclip-warnings" role="alert">
              {parsed.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
        </aside>

        <main className="flowclip-workspace">
          <div className="flowclip-controls panel">
            <label className="flowclip-control-wide">
              Title
              <input type="text" value={customTitle} placeholder={parsed.title} onChange={(event) => setCustomTitle(event.target.value)} />
            </label>
            <label className="flowclip-control-wide">
              Subtitle
              <input type="text" value={subtitle} placeholder="Optional subtitle" onChange={(event) => setSubtitle(event.target.value)} />
            </label>
            <label>
              Ratio
              <select value={ratio} onChange={(event) => setRatio(event.target.value as RatioKey)}>
                {Object.entries(RATIOS).map(([key, item]) => <option key={key} value={key}>{item.label} · {item.size}</option>)}
              </select>
            </label>
            <label>
              Theme
              <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeKey)}>
                {Object.entries(THEMES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Motion
              <select value={animation} onChange={(event) => setAnimation(event.target.value as AnimationKey)}>
                {Object.entries(ANIMATIONS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Seconds
              <input type="number" min="3" max="20" value={duration} onChange={(event) => setDuration(clampDuration(Number(event.target.value)))} />
            </label>
          </div>

          <div className="flowclip-stage-wrap panel">
            <div
              ref={exportRef}
              className={`flowclip-stage theme-${theme} animation-${animation}`}
              style={{ aspectRatio: `${ratioInfo.width} / ${ratioInfo.height}` }}
            >
              <DiagramCanvas flow={parsed} title={displayTitle} subtitle={displaySubtitle} ratio={ratio} animation={animation} duration={duration} />
            </div>
          </div>

          <div className="flowclip-export panel">
            <span aria-live="polite">{status}</span>
            <div>
              <button className="tool-btn" onClick={exportPng} disabled={isExporting}>PNG {ratioInfo.size}</button>
              <button className="tool-btn" onClick={exportSvg} disabled={isExporting}>SVG {ratioInfo.size}</button>
              <button className="tool-btn tool-btn-primary" onClick={exportWebm} disabled={isExporting}>WebM {ratioInfo.size}</button>
              <button className="tool-btn" onClick={exportProjectJson} disabled={isExporting}>Export JSON</button>
              <button className="tool-btn" onClick={() => projectInputRef.current?.click()} disabled={isExporting}>Import JSON</button>
              <input
                ref={projectInputRef}
                className="flowclip-file-input"
                type="file"
                accept="application/json,.json,.flowclip.json"
                onChange={(event) => importProjectJson(event.target.files?.[0])}
              />
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}

function DiagramCanvas({ flow, title, subtitle, ratio, animation, duration }: { flow: ParsedFlow; title: string; subtitle: string; ratio: RatioKey; animation: AnimationKey; duration: number }) {
  const shadowId = useId();
  const viewBox = ratio === 'landscape' ? { width: 1600, height: 900 } : ratio === 'square' ? { width: 1080, height: 1080 } : { width: 1080, height: ratio === 'short' ? 1920 : 1440 };
  const isVertical = getLayoutDirection(ratio, flow.nodes.length) === 'TB';
  const padX = viewBox.width * (isVertical ? 0.12 : 0.08);
  const top = viewBox.height * 0.18;
  const bottom = viewBox.height * 0.10;
  const usableWidth = viewBox.width - padX * 2;
  const usableHeight = viewBox.height - top - bottom;

  const sizeScale = isVertical
    ? Math.min(1.18, (viewBox.width * 0.78) / Math.max(1, ...flow.nodes.map((node) => node.width)))
    : Math.min(1.15, (viewBox.width * 0.34) / Math.max(1, ...flow.nodes.map((node) => node.width)));
  const placed = flow.nodes.map((node) => ({
    ...node,
    width: node.width * sizeScale,
    height: node.height * sizeScale,
    px: padX + node.x * usableWidth,
    py: top + node.y * usableHeight,
  }));
  const placedById = new Map(placed.map((node) => [node.id, node]));

  return (
    <svg viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} role="img" aria-label={title}>
      <title>{title}</title>
      <desc>{subtitle || 'Animated flow diagram made from arrow syntax.'}</desc>
      <defs>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect className="stage-bg" width="100%" height="100%" rx="0" />

      <text className="diagram-title" x={viewBox.width / 2} y={viewBox.height * 0.11} textAnchor="middle">{title}</text>
      {subtitle && <text className="diagram-subtitle" x={viewBox.width / 2} y={viewBox.height * 0.15} textAnchor="middle">{subtitle}</text>}

      <g className="edges">
        {flow.edges.map((edge) => {
          const from = placedById.get(edge.from);
          const to = placedById.get(edge.to);
          if (!from || !to) return null;
          const { start, end } = getEdgePorts(from, to, isVertical);
          const startX = start.x;
          const startY = start.y;
          const endX = end.x;
          const endY = end.y;
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const curve = getSmoothCurve(start, end, isVertical);
          const path = curve.path;
          return (
            <g key={edge.id} className="edge" style={{ ['--i' as string]: edge.order, ['--dur' as string]: `${duration}s` }}>
              <path className="edge-path edge-base" d={path} />
              {animation === 'draw' && <path className="edge-path edge-draw" d={path} />}
              {animation === 'flow' && <path className="edge-path edge-flow" d={path} />}
              {animation === 'dot' && (
                <>
                  <path className="edge-path edge-static" d={path} />
                  <circle className="edge-dot" r="13">
                    <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${edge.order * 0.35}s`} path={path} />
                  </circle>
                </>
              )}
              <path className={animation === 'none' ? 'edge-arrow edge-arrow-muted' : 'edge-arrow'} d="M 0 0 L -16 -7 L -16 7 Z" transform={`translate(${endX} ${endY}) rotate(${curve.angle * 180 / Math.PI})`} />
              {edge.label && <text className="edge-label" x={midX} y={midY - 18} textAnchor="middle">{edge.label}</text>}
            </g>
          );
        })}
      </g>

      <g className="nodes">
        {placed.map((node) => (
          <g key={node.id} className="node" transform={`translate(${node.px - node.width / 2} ${node.py - node.height / 2})`} style={{ ['--i' as string]: node.level }}>
            <rect className="node-card" width={node.width} height={node.height} rx={Math.min(28, node.height / 3)} filter={`url(#${shadowId})`} />
            <text className="node-label" x={node.width / 2} y={node.height / 2 - ((node.lines.length - 1) * 21 * sizeScale) + 10 * sizeScale} textAnchor="middle">
              {node.lines.map((line, index) => (
                <tspan key={`${node.id}-${index}`} x={node.width / 2} dy={index === 0 ? 0 : 42 * sizeScale}>{line}</tspan>
              ))}
            </text>
          </g>
        ))}
      </g>

      {flow.nodes.length === 0 && (
        <text className="empty-state" x={viewBox.width / 2} y={viewBox.height / 2} textAnchor="middle">Type A -&gt; B -&gt; C to start</text>
      )}
    </svg>
  );
}
