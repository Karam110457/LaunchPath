"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const modelShort = d.model
    .replace("claude-", "")
    .replace("-20250929", "");

  return (
    <div className="group relative">
      {/* Glow ring on hover */}
      <div className="absolute -inset-1.5 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />

      <div className="relative w-[220px] bg-card border border-border/60 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:border-primary/50 hover:shadow-primary/10">
        {/* Top row: avatar + sparkle */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl">{d.avatarEmoji}</span>
          </div>
          <Sparkles className="w-4 h-4 text-primary/60" />
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-foreground truncate">
          {d.name}
        </h3>

        {/* Model + Status */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            {modelShort}
          </span>
          <Badge
            variant={d.status === "active" ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0"
          >
            {d.status}
          </Badge>
        </div>

        {/* Handles */}
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-card"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-card"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-card"
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
