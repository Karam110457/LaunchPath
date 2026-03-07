"use client";

import { type ConnectionLineComponentProps, getSmoothStepPath } from "@xyflow/react";

export function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    borderRadius: 24,
  });

  const gradientId = "drawing-gradient";

  return (
    <g>
      {/* Outer blurred glow path */}
      <path
        d={edgePath}
        fill="none"
        stroke="#9D50BB"
        strokeWidth={6}
        strokeOpacity={0.3}
        className="canvas-edge-glow"
      />

      {/* Inner solid path */}
      <path
        d={edgePath}
        fill="none"
        stroke="#FF8C00"
        strokeWidth={2}
        strokeOpacity={0.8}
      />

      {/* Animated dash path overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2}
        strokeDasharray="6 12"
        className="canvas-edge-animated"
      />
      
      {/* Endpoint circle/target indicator */}
      <circle cx={toX} cy={toY} r={6} fill="#fff" stroke="#FF8C00" strokeWidth={2.5} className="canvas-edge-glow" />
    </g>
  );
}
