import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

export type MotionNodeData = {
  label: string;
  index: number;
  direction?: 'LR' | 'TB';
};

export function MotionNode({ data }: NodeProps) {
  const nodeData = data as MotionNodeData;
  const isVertical = nodeData.direction === 'TB';

  return (
    <div className="motion-node">
      <Handle type="target" position={isVertical ? Position.Top : Position.Left} className="motion-handle" />
      <div className="motion-node-label">{nodeData.label}</div>
      <div className="motion-node-index">{String(nodeData.index + 1).padStart(2, '0')}</div>
      <Handle type="source" position={isVertical ? Position.Bottom : Position.Right} className="motion-handle" />
    </div>
  );
}
