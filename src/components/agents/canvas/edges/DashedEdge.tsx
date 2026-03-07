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

  // We use bezier or smoothstep? The image uses a very smooth bezier or step.
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
  
  // Custom orange/purple gradient ID for this edge
  const gradientId = `gradient-${props.id}`;
  const animationDuration = "2s";

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
      
      {/* Outer blurred glow path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: "#9D50BB",
          strokeWidth: hovered || props.selected ? 6 : 4,
          strokeOpacity: 0.3,
          transition: "stroke-width 0.2s, stroke-opacity 0.2s",
        }}
        className="canvas-edge-glow"
      />

      {/* Inner solid path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: "#FF8C00",
          strokeWidth: hovered || props.selected ? 3 : 2,
          strokeOpacity: 0.8,
          transition: "stroke-width 0.2s",
        }}
      />

      {/* Animated dash path overlay */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: "#ffffff",
          strokeWidth: hovered || props.selected ? 3 : 2,
          strokeDasharray: "6 12",
          opacity: 0.9,
        }}
        className="canvas-edge-animated"
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {showDelete ? (
            <button
              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm border border-red-200 shadow-sm text-red-500 hover:text-white hover:bg-red-500 transition-all z-50"
              title="Delete connection"
              onClick={(e) => {
                e.stopPropagation();
                setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center justify-center px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm text-[10px] font-semibold text-zinc-600 z-50 transition-all">
              <span className="bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] text-transparent bg-clip-text tracking-wider uppercase text-[9px]">Linked</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
