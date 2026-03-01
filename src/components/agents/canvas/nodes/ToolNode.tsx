"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Wrench,
  Calendar,
  Mail,
  Users,
  Globe,
  MessageSquare,
  ArrowRightLeft,
} from "lucide-react";
import type { ToolNodeData } from "../canvas-types";

const TOOL_ICONS: Record<string, React.ElementType> = {
  calendar: Calendar,
  email: Mail,
  "lead-capture": Users,
  "knowledge-base": Globe,
  "human-handoff": ArrowRightLeft,
  messaging: MessageSquare,
};

export const ToolNode = memo(function ToolNode({ data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const Icon = TOOL_ICONS[d.toolId] ?? Wrench;

  return (
    <div className="w-[160px] bg-card border border-border/60 rounded-xl p-4 shadow-md cursor-pointer transition-all hover:border-blue-500/40 hover:shadow-blue-500/5">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span className="text-xs font-medium text-foreground truncate">
          {d.label}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2">
        {d.description}
      </p>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-2 !h-2 !border-2 !border-card"
      />
    </div>
  );
});
