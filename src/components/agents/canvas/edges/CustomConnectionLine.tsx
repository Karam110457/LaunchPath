import React from "react";
import { getBezierPath, type ConnectionLineComponentProps } from "@xyflow/react";

export function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <defs>
        <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#9D50BB" />
        </linearGradient>
        <filter id="connection-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Glow */}
      <path
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth={8}
        strokeOpacity={0.3}
        className="animated-connection-path"
        d={edgePath}
        filter="url(#connection-glow)"
      />
      
      {/* Core line */}
      <path
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth={3}
        className="animated-connection-path"
        d={edgePath}
        strokeDasharray="8 6"
      />
      
      {/* Target pulsing dot */}
      <circle cx={toX} cy={toY} fill="#fff" r={5} stroke="#9D50BB" strokeWidth={2}>
        <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}
