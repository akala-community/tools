import {
  cubicPoint,
  drawCubicSegment,
  getEdgePorts,
  getLayoutDirection,
  getSmoothCurve,
  roundedRectPath,
  type AnimationKey,
  type ParsedFlow,
  type RatioKey,
  type ThemeKey,
} from './flowclipCore';

export type FlowRenderOptions = {
  flow: ParsedFlow;
  title: string;
  subtitle: string;
  ratio: RatioKey;
  theme: ThemeKey;
  animation: AnimationKey;
  duration: number;
};

export const SVG_EXPORT_CSS = `
.stage-bg{fill:#fffaf1}.diagram-title{fill:#17130d;font:900 54px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-2px}.diagram-subtitle{fill:#756d62;font:800 19px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:2px;text-transform:uppercase}.node-card{fill:rgba(255,255,255,.92);stroke:#d5cab9;stroke-width:2}.node-label{fill:#17130d;font:900 34px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-1.2px}.edge-path{fill:none;stroke-linecap:round;stroke-linejoin:round}.edge-base{stroke:rgba(23,19,13,.14);stroke-width:5;stroke-dasharray:14 14}.edge-flow,.edge-draw,.edge-static{stroke:#315f9f;stroke-width:4}.edge-flow{stroke-dasharray:14 14;animation:flowclip-dash var(--dur,6s) linear infinite}.edge-draw{stroke-dasharray:1000;stroke-dashoffset:1000;animation:flowclip-draw var(--dur,6s) ease-in-out infinite}.edge-static{stroke-dasharray:none}.edge-dot{fill:#315f9f}.edge-arrow{fill:#315f9f}.edge-arrow-muted{fill:rgba(23,19,13,.30)}.edge-label-bg{fill:rgba(255,250,241,.9)}.edge-label{fill:#5f564c;font:900 24px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.empty-state{fill:#756d62;font:900 28px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.theme-dark .stage-bg{fill:#080b13}.theme-dark .diagram-title{fill:#f8fafc}.theme-dark .diagram-subtitle{fill:#93a4bc}.theme-dark .node-card{fill:rgba(15,23,42,.92);stroke:rgba(148,163,184,.45)}.theme-dark .node-label{fill:#f8fafc}.theme-dark .edge-base{stroke:rgba(148,163,184,.22)}.theme-dark .edge-flow,.theme-dark .edge-draw,.theme-dark .edge-static{stroke:#60a5fa}.theme-dark .edge-dot{fill:#60a5fa}.theme-dark .edge-arrow{fill:#60a5fa}.theme-dark .edge-arrow-muted{fill:rgba(148,163,184,.45)}.theme-dark .edge-label-bg{fill:rgba(8,11,19,.9)}.theme-dark .edge-label{fill:#dbeafe}.theme-sketch .stage-bg{fill:#fbf3df}.theme-sketch .diagram-title,.theme-sketch .node-label{font-family:"Comic Sans MS","Bradley Hand",system-ui,sans-serif}.theme-sketch .node-card{fill:rgba(255,252,242,.9);stroke:#17130d;stroke-width:3;stroke-dasharray:9 5}.theme-sketch .edge-base{stroke:rgba(23,19,13,.16)}.theme-sketch .edge-flow,.theme-sketch .edge-draw,.theme-sketch .edge-static{stroke:#17130d;stroke-width:6}.theme-sketch .edge-flow{stroke-dasharray:14 14}.theme-sketch .edge-draw{stroke-dasharray:1000}.theme-sketch .edge-static{stroke-dasharray:12 10}.theme-sketch .edge-dot{fill:#17130d}.theme-sketch .edge-arrow{fill:#17130d}.theme-sketch .edge-arrow-muted{fill:rgba(23,19,13,.34)}.theme-sketch .edge-label-bg{fill:rgba(251,243,223,.92)}.animation-none .edge-base{stroke-dasharray:none}@keyframes flowclip-dash{to{stroke-dashoffset:-84}}@keyframes flowclip-draw{0%{stroke-dashoffset:1000;opacity:.28}12%{opacity:1}58%,78%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:1000;opacity:.28}}
`;

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function canvasHasNonBackgroundPixels(canvas: HTMLCanvasElement, backgroundHex: string) {
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

export function getThemeBackground(theme: ThemeKey) {
  return theme === 'dark' ? '#080b13' : theme === 'sketch' ? '#fbf3df' : '#fffaf1';
}

export function drawFlowFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: FlowRenderOptions, progress: number) {
  const { flow, title, subtitle, ratio, theme, animation, duration } = options;
  const loopPhase = ((progress % duration) + duration) % duration / duration;
  const viewBox = ratio === 'landscape'
    ? { width: 1600, height: 900 }
    : ratio === 'square'
      ? { width: 1080, height: 1080 }
      : { width: 1080, height: ratio === 'short' ? 1920 : 1440 };
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
  const colors = theme === 'dark'
    ? { bg: '#080b13', title: '#f8fafc', sub: '#93a4bc', node: '#0f172a', nodeStroke: '#64748b', text: '#f8fafc', base: 'rgba(148,163,184,.28)', edge: '#60a5fa', labelBg: 'rgba(8,11,19,.9)', labelText: '#dbeafe' }
    : theme === 'sketch'
      ? { bg: '#fbf3df', title: '#17130d', sub: '#756d62', node: '#fffaf1', nodeStroke: '#17130d', text: '#17130d', base: 'rgba(23,19,13,.18)', edge: '#17130d', labelBg: 'rgba(251,243,223,.92)', labelText: '#17130d' }
      : { bg: '#fffaf1', title: '#17130d', sub: '#756d62', node: '#ffffff', nodeStroke: '#d5cab9', text: '#17130d', base: 'rgba(23,19,13,.16)', edge: '#315f9f', labelBg: 'rgba(255,250,241,.9)', labelText: '#5f564c' };

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
  ctx.fillText(title, viewBox.width / 2, viewBox.height * 0.11);
  if (subtitle) {
    ctx.fillStyle = colors.sub;
    ctx.font = '800 19px Inter, system-ui, sans-serif';
    ctx.fillText(subtitle, viewBox.width / 2, viewBox.height * 0.15);
  }

  flow.edges.forEach((edge) => {
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
      const reveal = loopPhase < 0.58 ? loopPhase / 0.58 : loopPhase < 0.78 ? 1 : 1 - ((loopPhase - 0.78) / 0.22);
      if (reveal > 0.02) {
        drawCubicSegment(ctx, start, curve.c1, curve.c2, end, reveal);
        ctx.setLineDash([]);
        ctx.strokeStyle = colors.edge;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    } else if (animation === 'dot') {
      const dot = cubicPoint(start, curve.c1, curve.c2, end, (loopPhase + edge.order * 0.18) % 1);
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
      ctx.lineDashOffset = -loopPhase * 84;
      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    drawArrow(end.x, end.y, curve.angle, animation === 'none' ? colors.base : colors.edge);

    const labelText = edge.label?.trim();
    if (labelText) {
      const labelX = (start.x + end.x) / 2;
      const labelY = (start.y + end.y) / 2 - 18;
      const labelWidth = Math.max(84, labelText.length * 13 + 38);
      const labelHeight = 38;
      ctx.save();
      ctx.fillStyle = colors.labelBg;
      ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight + 8, labelWidth, labelHeight);
      ctx.fillStyle = colors.labelText;
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(labelText, labelX, labelY);
      ctx.restore();
    }
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

export function serializeFlowSvg(svg: SVGSVGElement, width: number, height: number, theme: ThemeKey, animation: AnimationKey) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.classList.add(`theme-${theme}`, `animation-${animation}`);

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = SVG_EXPORT_CSS;
  clone.insertBefore(style, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}
