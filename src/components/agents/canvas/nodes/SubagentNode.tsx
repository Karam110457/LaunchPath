"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { SubagentNodeData } from "../canvas-types";

export const SubagentNode = memo(function SubagentNode({ data }: NodeProps) {
  const d = data as unknown as SubagentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[96px] h-[96px] liquid-glass-node !rounded-full cursor-pointer overflow-visible z-10 flex items-center justify-center ring-2 ring-white/50">
        {/* Target handle — receives edge from parent agent */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full !top-[-5px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />

        {/* Avatar */}
        <div className="flex items-center justify-center text-4xl">
          {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
            d.avatarEmoji
          ) : (
            <Bot strokeWidth={1.5} className="w-10 h-10 text-zinc-700" />
          )}
        </div>

        {/* Bottom-left → Knowledge */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-left"
          style={{ left: "25%", bottom: "-5px" }}
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />
        {/* Bottom-right → Tools */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-right"
          style={{ left: "75%", bottom: "-5px" }}
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />
      </div>

      {/* Labels below node */}
      <h3 className="mt-3 text-[13px] font-medium text-zinc-800 text-center max-w-[120px] leading-tight flex-wrap">
        {d.name}
      </h3>
      <div className="w-[120px] relative mt-1 flex justify-center pointer-events-none">
        <span className="inline-block text-[9px] font-medium px-1.5 py-[1px] rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
          Sub-Agent
        </span>
      </div>
    </div>
  );
});
