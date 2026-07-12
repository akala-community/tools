import { Position, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export function AnimatedMotionEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position.Right,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position.Left,
    borderRadius: 28
  });
  const markerId = `motion-arrow-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <g className="motion-edge">
      <defs>
        <marker id={markerId} markerWidth="18" markerHeight="18" refX="16" refY="9" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M2,3 L16,9 L2,15 Z" fill="#17130d" />
        </marker>
      </defs>
      <path d={edgePath} fill="none" stroke="rgba(23,19,13,.24)" strokeWidth={9} strokeLinecap="round" className="motion-edge-bg" />
      <path id={id} d={edgePath} fill="none" stroke="#17130d" strokeWidth={3.4} strokeLinecap="round" markerEnd={`url(#${markerId})`} className="motion-edge-dash" />
      <circle r="5.5" fill="#17130d" className="motion-edge-dot">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="10" fill="none" stroke="#17130d" strokeWidth="2" opacity=".24" className="motion-edge-ring">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}
