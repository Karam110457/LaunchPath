"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain } from "lucide-react";
import type { KnowledgeNodeData } from "../canvas-types";

export const KnowledgeNode = memo(function KnowledgeNode({
  data,
}: NodeProps) {
  const d = data as unknown as KnowledgeNodeData;
  const label =
    d.documentCount === 0
      ? "No files yet"
      : `${d.documentCount} source${d.documentCount !== 1 ? "s" : ""}`;

  return (
    <div className="w-[180px] bg-card border border-border/60 rounded-xl p-4 shadow-md cursor-pointer transition-all hover:border-violet-500/40 hover:shadow-violet-500/5">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <Brain className="w-4.5 h-4.5 text-violet-400" />
        </div>
        <span className="text-sm font-medium text-foreground">
          Knowledge Base
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-violet-400 !w-2 !h-2 !border-2 !border-card"
      />
    </div>
  );
});
