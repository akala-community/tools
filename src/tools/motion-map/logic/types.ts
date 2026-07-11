export type MotionGraphNode = {
  id: string;
  label: string;
};

export type MotionGraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type MotionGraph = {
  nodes: MotionGraphNode[];
  edges: MotionGraphEdge[];
};

export type LayoutDirection = 'LR' | 'TB';
