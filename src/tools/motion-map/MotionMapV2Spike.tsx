import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, type Edge, type Node, useEdgesState, useNodesState } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { parseFlowText } from './logic/parseFlowText';
import { autoLayout } from './logic/autoLayout';
import { MotionNode } from './nodes/MotionNode';

const initialText = `Lead -> WhatsApp -> AI Agent -> CRM
AI Agent -> Knowledge Base
CRM -> Sales Team`;

const examples = {
  sales: initialText,
  support: `Customer -> WhatsApp -> AI Agent
AI Agent -> Knowledge Base
AI Agent -> Support Ticket -> Human Team
Human Team -> Knowledge Base`,
  rag: `User Question -> Chat Interface -> AI Agent
AI Agent -> Retriever -> Vector Database
Vector Database -> Relevant Docs -> AI Agent
AI Agent -> Final Answer -> User`
};

const nodeTypes = { motionNode: MotionNode };

function buildFlow(text: string, direction: 'LR' | 'TB') {
  const graph = parseFlowText(text);
  const nodes: Node[] = graph.nodes.map((node, index) => ({
    id: node.id,
    type: 'motionNode',
    position: { x: 0, y: 0 },
    data: { label: node.label, index }
  }));
  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
    type: 'smoothstep',
    style: { stroke: '#17130d', strokeWidth: 2.4 }
  }));
  return { nodes: autoLayout(nodes, edges, direction), edges };
}

export default function MotionMapV2Spike() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialText);
  const [title, setTitle] = useState('Lead to Loyalty');
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [error, setError] = useState('');
  const initial = useMemo(() => buildFlow(initialText, 'LR'), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const renderDiagram = useCallback((nextText = text, nextDirection = direction) => {
    try {
      const flow = buildFlow(nextText, nextDirection);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to render flow.');
    }
  }, [direction, setEdges, setNodes, text]);

  const setExample = (key: keyof typeof examples) => {
    setText(examples[key]);
    renderDiagram(examples[key], direction);
  };

  const exportPng = async () => {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: '#f7f4ee' });
    const link = document.createElement('a');
    link.download = 'motionmap-v2-spike.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="motion-v2">
      <section className="motion-v2-hero">
        <div>
          <div className="tool-eyebrow">React Flow Spike</div>
          <h1>MotionMap v2 canvas test.</h1>
          <p>Testing React Flow for diagram rendering, auto-layout, animated edges, and PNG export before the full rebuild.</p>
        </div>
        <div className="motion-v2-actions">
          <button className="btn btn-secondary" type="button" onClick={() => setExample('sales')}>Sales</button>
          <button className="btn btn-secondary" type="button" onClick={() => setExample('support')}>Support</button>
          <button className="btn btn-secondary" type="button" onClick={() => setExample('rag')}>RAG</button>
          <button className="btn btn-primary" type="button" onClick={exportPng}>PNG export</button>
        </div>
      </section>

      <section className="motion-v2-layout">
        <aside className="motion-v2-sidebar">
          <div className="motion-v2-card">
            <label htmlFor="titleInput">Diagram title</label>
            <input id="titleInput" value={title} onChange={(event) => setTitle(event.target.value)} />
            <label htmlFor="flowInput">Flow text</label>
            <textarea id="flowInput" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
            <div className="motion-v2-row">
              <select value={direction} onChange={(event) => {
                const next = event.target.value as 'LR' | 'TB';
                setDirection(next);
                renderDiagram(text, next);
              }}>
                <option value="LR">Horizontal</option>
                <option value="TB">Vertical</option>
              </select>
              <button className="btn btn-primary" type="button" onClick={() => renderDiagram()}>Render</button>
            </div>
            {error ? <div className="motion-v2-error">{error}</div> : null}
          </div>
        </aside>

        <div className="motion-v2-stage" ref={exportRef}>
          <div className="motion-v2-title">{title}</div>
          <div className="motion-v2-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              minZoom={0.25}
              maxZoom={1.8}
            >
              <Background color="#d5cab9" gap={20} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
          <div className="motion-v2-footer">AKALA Tools. React Flow MotionMap spike.</div>
        </div>
      </section>
    </div>
  );
}
