"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain, Loader2 } from "lucide-react";
import type { KnowledgeNodeData } from "../canvas-types";

export const KnowledgeNode = memo(function KnowledgeNode({ data }: NodeProps) {
  const d = data as unknown as KnowledgeNodeData;

  return (
    <div className="group relative">
      <div className="absolute -inset-1.5 rounded-2xl bg-violet-500/15 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />

      {/* Violet-tinted background distinguishes this as a "data store" node */}
      <div className="relative w-[195px] bg-violet-500/8 border border-violet-500/25 rounded-xl p-4 shadow-md cursor-pointer transition-all hover:border-violet-500/50 hover:bg-violet-500/12">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">Knowledge</span>
        </div>

        {/* Big count — the dominant visual element */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-violet-400 leading-none">
              {d.documentCount}
            </p>
            <p className="text-[11px] text-violet-300/70 mt-1">
              {d.documentCount === 1 ? "source" : "sources"}
            </p>
          </div>
          {d.processingCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 mb-0.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{d.processingCount} indexing</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-violet-300/0 group-hover:text-violet-300/50 mt-3 transition-colors duration-200">
          click to manage
        </p>

        {/* Top target handle — edge comes from agent's bottom-left */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-violet-400 !w-2 !h-2 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
