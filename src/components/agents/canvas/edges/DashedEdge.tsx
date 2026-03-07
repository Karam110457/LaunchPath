"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";

export function DashedEdge(props: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  // Don't show delete on auto-generated knowledge edges
  const isKnowledgeEdge = props.id.includes("knowledge");
  const showDelete = !isKnowledgeEdge && (hovered || props.selected);

  return (
    <>
      {/* Invisible wider hit area for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      />
      <BaseEdge
        path={edgePath}
        style={{
          stroke: hovered || props.selected ? "rgba(0, 0, 0, 0.35)" : "rgba(0, 0, 0, 0.15)",
          strokeWidth: hovered || props.selected ? 2.5 : 2,
          strokeDasharray: "6 4",
          transition: "stroke 0.15s, stroke-width 0.15s",
          ...props.style,
        }}
        className="canvas-edge-animated"
      />
      {showDelete && (
        <EdgeLabelRenderer>
          <button
            className="nodrag nopan pointer-events-auto absolute flex items-center justify-center w-5 h-5 rounded-full bg-white border border-zinc-300 shadow-sm text-zinc-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            title="Delete connection"
            onMouseEnter={() => setHovered(true)}
            onClick={(e) => {
              e.stopPropagation();
              setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
