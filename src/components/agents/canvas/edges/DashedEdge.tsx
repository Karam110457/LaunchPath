"use client";

import { BaseEdge, type EdgeProps, getSmoothStepPath } from "@xyflow/react";

export function DashedEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: "rgba(0, 0, 0, 0.15)",
        strokeWidth: 2,
        strokeDasharray: "6 4",
        ...props.style,
      }}
      className="canvas-edge-animated"
    />
  );
}
