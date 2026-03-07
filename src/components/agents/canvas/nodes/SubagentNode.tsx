"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { SubagentNodeData } from "../canvas-types";
import { ShineBorder } from "@/components/ui/shine-border";

export const SubagentNode = memo(function SubagentNode({ data }: NodeProps) {
  const d = data as unknown as SubagentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <ShineBorder
        borderRadius={32}
        borderWidth={2}
        duration={12}
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        className="relative w-[140px] h-[64px] !p-0 !bg-transparent cursor-pointer overflow-visible z-10 flex items-center justify-center liquid-glass-node"
      >
        {/* Target handle — receives edge from parent agent */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full !top-[-5px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />

        {/* Avatar */}
        <div className="flex items-center justify-center text-4xl">
          {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
            <span className="text-3xl">{d.avatarEmoji}</span>
          ) : (
            <Bot strokeWidth={1.5} className="w-8 h-8 text-zinc-700" />
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
      </ShineBorder>

      {/* Labels below node */}
      <h3 className="mt-4 text-[14px] font-semibold text-zinc-800 text-center max-w-[140px] leading-tight flex-wrap">
        {d.name}
      </h3>
      <div className="w-[140px] relative mt-1 flex justify-center pointer-events-none">
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
          Sub-Agent
        </span>
      </div>
    </div>
  );
});
