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
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF8C00">
            <animate attributeName="stop-color" values="#FF8C00;#9D50BB;#FF8C00" dur={animationDuration} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#9D50BB">
            <animate attributeName="stop-color" values="#9D50BB;#FF8C00;#9D50BB" dur={animationDuration} repeatCount="indefinite" />
          </stop>
        </linearGradient>
        
        {/* Glow filter */}
        <filter id={`glow-${props.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

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
          stroke: `url(#${gradientId})`,
          strokeWidth: hovered || props.selected ? 6 : 3,
          strokeOpacity: 0.4,
          filter: `url(#glow-${props.id})`,
          transition: "stroke-width 0.2s, stroke-opacity 0.2s",
        }}
        className="canvas-edge-glow"
      />

      {/* Inner solid path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: hovered || props.selected ? 3 : 1.5,
          strokeDasharray: "8 4",
          transition: "stroke-width 0.2s",
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
            <div className="flex items-center justify-center px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[10px] font-semibold text-zinc-600 z-50 transition-all">
              <span className="bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] text-transparent bg-clip-text">1 item</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
