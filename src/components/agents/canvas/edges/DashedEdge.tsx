"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useState } from "react";

export function DashedEdge(props: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  // Smooth step for clean, minimalistic routing
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 24,
  });

  // Don't show delete on auto-generated knowledge edges
  const isKnowledgeEdge = props.id.includes("knowledge");
  const showDelete = !isKnowledgeEdge && (hovered || props.selected);

  // Grey — in between subtle and prominent (zinc-400 idle, zinc-500 hover)
  const strokeColor = hovered || props.selected ? "#71717a" : "#a1a1aa"; // zinc-500 on hover, zinc-400 idle

  return (
    <>
      {/* Invisible wider hit area for easier hover and UX */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      />
      
      {/* Visible path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: hovered || props.selected ? 2.5 : 1.75,
          strokeDasharray: "8 6",
          transition: "stroke 0.2s ease, stroke-width 0.2s ease",
        }}
        className="canvas-edge-animated"
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute pointer-events-auto transition-opacity duration-200"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity: showDelete ? 1 : 0,
            pointerEvents: showDelete ? "all" : "none",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all z-50"
            title="Delete connection"
            onClick={(e) => {
              e.stopPropagation();
              setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
