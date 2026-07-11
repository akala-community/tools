import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

export type MotionNodeData = {
  label: string;
  index: number;
};

export function MotionNode({ data }: NodeProps) {
  const nodeData = data as MotionNodeData;
  return (
    <div className="motion-node">
      <Handle type="target" position={Position.Left} className="motion-handle" />
      <div className="motion-node-label">{nodeData.label}</div>
      <div className="motion-node-index">{String(nodeData.index + 1).padStart(2, '0')}</div>
      <Handle type="source" position={Position.Right} className="motion-handle" />
    </div>
  );
}
