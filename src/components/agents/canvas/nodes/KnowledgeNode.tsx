"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain, Loader2 } from "lucide-react";
import type { KnowledgeNodeData } from "../canvas-types";

export const KnowledgeNode = memo(function KnowledgeNode({ data }: NodeProps) {
  const d = data as unknown as KnowledgeNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      {/* Circle node */}
      <div className="relative w-[130px] h-[130px] rounded-full bg-violet-950/70 border-2 border-violet-500/40 flex flex-col items-center justify-center cursor-pointer shadow-xl transition-all duration-200 hover:border-violet-400/65 hover:bg-violet-950/85">
        {/* Glow — inside circle so it stays circular */}
        <div className="absolute -inset-4 rounded-full bg-violet-500/15 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none" />

        {/* Processing spinner */}
        {d.processingCount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-violet-500/30 flex items-center justify-center mb-2 z-10">
          <Brain className="w-5 h-5 text-violet-300" />
        </div>

        {/* Count */}
        <p className="text-2xl font-bold text-violet-300 leading-none tabular-nums z-10">
          {d.documentCount}
        </p>
        <p className="text-[10px] text-violet-300/50 mt-0.5 z-10">
          {d.documentCount === 1 ? "source" : "sources"}
        </p>

        {/* Handle at top of circle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-violet-400 !w-2.5 !h-2.5 !border-2 !border-card"
        />
      </div>

      {/* Label below circle */}
      <p className="mt-2.5 text-[11px] font-medium text-violet-300/50 tracking-wide select-none">
        Knowledge Base
      </p>
    </div>
  );
});
