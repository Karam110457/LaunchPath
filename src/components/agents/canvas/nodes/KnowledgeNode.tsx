"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain } from "lucide-react";
import type { KnowledgeNodeData } from "../canvas-types";

export const KnowledgeNode = memo(function KnowledgeNode({ data }: NodeProps) {
  const d = data as unknown as KnowledgeNodeData;
  const label =
    d.documentCount === 0
      ? "No sources yet"
      : `${d.documentCount} source${d.documentCount !== 1 ? "s" : ""}`;

  return (
    <div className="group relative">
      {/* Glow ring on hover */}
      <div className="absolute -inset-1.5 rounded-2xl bg-violet-500/20 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />

      <div className="relative w-[185px] bg-card border border-border/60 rounded-xl p-4 shadow-md cursor-pointer transition-all hover:border-violet-500/50 hover:shadow-[0_4px_24px_rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm font-medium text-foreground">Knowledge</span>
        </div>

        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/50 mt-2.5 transition-colors duration-200">
          click to manage
        </p>

        {/* Right-side target handle — edge comes from agent's left handle */}
        <Handle
          type="target"
          position={Position.Right}
          className="!bg-violet-400 !w-2 !h-2 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
