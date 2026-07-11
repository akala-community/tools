import type { MotionGraph, MotionGraphEdge, MotionGraphNode } from './types';

function cleanStep(step: string) {
  return step.replace(/^\s*[-*•]?\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim();
}

function normalizeId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `node_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseFlowText(text: string): MotionGraph {
  const nodesByLabel = new Map<string, MotionGraphNode>();
  const edges: MotionGraphEdge[] = [];
  const sequential: string[] = [];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  function getNode(raw: string) {
    const label = cleanStep(raw);
    if (!label) return null;
    const key = label.toLowerCase();
    if (!nodesByLabel.has(key)) nodesByLabel.set(key, { id: normalizeId(label), label });
    return nodesByLabel.get(key)!;
  }

  for (const line of lines) {
    if (line.includes('->')) {
      const parts = line.split('->').map(cleanStep).filter(Boolean);
      for (let i = 0; i < parts.length - 1; i += 1) {
        const source = getNode(parts[i]);
        const target = getNode(parts[i + 1]);
        if (source && target) edges.push({ id: `${source.id}-${target.id}`, source: source.id, target: target.id });
      }
    } else {
      const item = cleanStep(line);
      if (item) sequential.push(item);
    }
  }

  if (edges.length === 0 && sequential.length > 1) {
    for (let i = 0; i < sequential.length - 1; i += 1) {
      const source = getNode(sequential[i]);
      const target = getNode(sequential[i + 1]);
      if (source && target) edges.push({ id: `${source.id}-${target.id}`, source: source.id, target: target.id });
    }
  } else {
    sequential.forEach(getNode);
  }

  const seen = new Set<string>();
  const uniqueEdges = edges.filter((edge) => {
    const key = `${edge.source}->${edge.target}`;
    if (seen.has(key) || edge.source === edge.target) return false;
    seen.add(key);
    return true;
  });

  const nodes = [...nodesByLabel.values()];
  if (nodes.length < 2 || uniqueEdges.length < 1) {
    throw new Error('Add at least one valid flow, for example: Lead -> WhatsApp -> AI Agent');
  }

  return { nodes, edges: uniqueEdges };
}
