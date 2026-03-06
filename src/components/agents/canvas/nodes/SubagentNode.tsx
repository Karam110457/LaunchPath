"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { SubagentNodeData } from "../canvas-types";

export const SubagentNode = memo(function SubagentNode({ data }: NodeProps) {
  const d = data as unknown as SubagentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[200px] bg-[#1a1a1a] border border-amber-500/30 rounded-xl shadow-xl cursor-pointer transition-all duration-200 hover:border-amber-500/50 overflow-visible z-10 flex items-center px-3.5 py-3.5">
        {/* Target handle — receives edge from parent agent */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-amber-500/50 !rounded-[2px] !rotate-45 z-20"
        />

        {/* Avatar */}
        <div className="w-9 h-9 flex items-center justify-center text-zinc-100 mr-2.5 shrink-0">
          {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
            <span className="text-2xl leading-none">{d.avatarEmoji}</span>
          ) : (
            <Bot strokeWidth={2} className="w-7 h-7" />
          )}
        </div>

        {/* Name + badge */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-zinc-100 truncate leading-tight">
            {d.name}
          </h3>
          <span className="inline-block mt-0.5 text-[9px] font-medium px-1.5 py-[1px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Sub-Agent
          </span>
        </div>
      </div>

      {/* Label below node */}
      <span className="mt-1.5 text-[10px] text-[#666] truncate max-w-[200px] text-center pointer-events-none">
        {d.description || "Double-click to configure"}
      </span>
    </div>
  );
});
