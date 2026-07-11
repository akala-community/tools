import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import type { LayoutDirection } from './types';

const NODE_WIDTH = 190;
const NODE_HEIGHT = 92;

export function autoLayout(nodes: Node[], edges: Edge[], direction: LayoutDirection) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 72, ranksep: 110, marginx: 48, marginy: 48 });

  nodes.forEach((node) => graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    return {
      ...node,
      position: {
        x: positioned.x - NODE_WIDTH / 2,
        y: positioned.y - NODE_HEIGHT / 2
      }
    };
  });
}
