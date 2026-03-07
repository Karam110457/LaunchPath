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

  // We use bezier or smoothstep?
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
  const animationDuration = "3s";

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isKnowledgeEdge ? "#A07CFE" : "#FF8C00"} />
          <stop offset="100%" stopColor={isKnowledgeEdge ? "#A07CFE" : "#9D50BB"} />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id={`glow-${props.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Invisible wider hit area for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
        className="react-flow__edge-interaction"
      />
      
      {/* Outer blurred glow path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: hovered || props.selected ? 10 : 8,
          strokeOpacity: hovered || props.selected ? 0.5 : 0.25,
          filter: `url(#glow-${props.id})`,
          transition: "stroke-width 0.2s, stroke-opacity 0.2s",
        }}
      />

      {/* Inner solid path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: hovered || props.selected ? 4 : 3,
          strokeDasharray: isKnowledgeEdge ? "none" : "8 6",
          transition: "stroke-width 0.2s",
        }}
        className={isKnowledgeEdge ? "" : "animated-connection-path"}
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
          {showDelete && (
            <button
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white backdrop-blur-md border-[2px] border-red-100 shadow-xl text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all z-50 scale-in-center"
              title="Delete connection"
              onClick={(e) => {
                e.stopPropagation();
                setEdges((edges) => edges.filter((edge) => edge.id !== props.id));
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
