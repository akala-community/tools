import { useEffect, useId, useMemo, useRef, useState } from 'react';
import fixWebmDuration from 'fix-webm-duration';
import {
  ANIMATIONS,
  MAX_EXPORT_EDGES,
  MAX_EXPORT_NODES,
  MAX_PROJECT_JSON_BYTES,
  RATIOS,
  THEMES,
  clampDuration,
  getEdgePorts,
  getLayoutDirection,
  getProjectState,
  getSmoothCurve,
  normalizeProjectState,
  parseFlowText,
  safeFileName,
  type AnimationKey,
  type ParsedFlow,
  type RatioKey,
  type ThemeKey,
} from './flowclipCore';
import {
  canvasHasNonBackgroundPixels,
  downloadBlob,
  downloadDataUrl,
  drawFlowFrame,
  getThemeBackground,
  serializeFlowSvg,
} from './flowclipExport';

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
    const project = normalizeProjectState(data);
    if (typeof project.text === 'string') setText(project.text);
    if (typeof project.customTitle === 'string') setCustomTitle(project.customTitle);
    if (typeof project.subtitle === 'string') setSubtitle(project.subtitle);
    if (project.ratio) setRatio(project.ratio);
    if (project.theme) setTheme(project.theme);
    if (project.animation) setAnimation(project.animation);
    if (typeof project.duration === 'number') setDuration(project.duration);
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
      drawFlowFrame(ctx, canvas, { flow: parsed, title: displayTitle, subtitle: displaySubtitle, ratio, theme, animation, duration }, animation === 'draw' ? duration : duration / 2);
      const background = getThemeBackground(theme);
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
      const svg = exportRef.current.querySelector('svg');
      if (!svg) {
        setStatus('SVG export failed. Preview is not available.');
        return;
      }
      const source = serializeFlowSvg(svg, ratioInfo.width, ratioInfo.height, theme, animation);
      downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), `${fileBase}-${ratioInfo.width}x${ratioInfo.height}.svg`);
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
      recorder.onstop = async () => {
        try {
          if (!chunks.length) {
            setStatus('Video export failed. No video data was recorded.');
            return;
          }
          const recordedBlob = new Blob(chunks, { type: mimeType });
          const fixedBlob = await fixWebmDuration(recordedBlob, duration * 1000, { logger: false });
          downloadBlob(fixedBlob, `${fileBase}-${ratioInfo.width}x${ratioInfo.height}.webm`);
          setStatus(`WebM video exported at ${ratioInfo.size}.`);
        } catch (error) {
          console.error(error);
          setStatus('Video export failed while finalizing duration metadata.');
        } finally {
          setIsExporting(false);
        }
      };

      const drawFrame = (progress: number) => drawFlowFrame(ctx, canvas, { flow: parsed, title: displayTitle, subtitle: displaySubtitle, ratio, theme, animation, duration }, progress);

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
                    <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`-${edge.order * 0.35}s`} path={path} />
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
