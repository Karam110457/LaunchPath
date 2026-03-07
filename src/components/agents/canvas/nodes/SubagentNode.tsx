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
        borderRadius={48}
        borderWidth={3}
        duration={8}
        color={["#FF8C00", "#9D50BB"]}
        className="relative w-[280px] h-[96px] !p-[3px] !bg-transparent cursor-pointer overflow-visible z-10"
      >
        <div className="w-full h-full liquid-glass-node flex items-center justify-center !border-none" style={{ borderRadius: 45 }}>
          {/* Target handle — receives edge from parent agent */}
          <Handle
            type="target"
            position={Position.Top}
            className="!bg-zinc-200 !w-3 !h-3 !border-[2px] !border-white !rounded-full !top-[-8px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />

          {/* Avatar */}
          <div className="flex items-center justify-center text-5xl">
            {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
              <span className="text-4xl">{d.avatarEmoji}</span>
            ) : (
              <Bot strokeWidth={1.5} className="w-10 h-10 text-zinc-700" />
            )}
          </div>

          {/* Bottom-left → Knowledge */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-left"
            style={{ left: "25%", bottom: "-8px" }}
            className="!bg-zinc-200 !w-3 !h-3 !border-[2px] !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />
          {/* Bottom-right → Tools */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-right"
            style={{ left: "75%", bottom: "-8px" }}
            className="!bg-zinc-200 !w-3 !h-3 !border-[2px] !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />
        </div>
      </ShineBorder>

      {/* Labels below node */}
      <h3 className="mt-5 text-[15px] font-semibold text-zinc-800 text-center max-w-[240px] leading-tight flex-wrap">
        {d.name}
      </h3>
      <div className="w-[280px] relative mt-1.5 flex justify-center pointer-events-none">
        <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
          Sub-Agent
        </span>
      </div>
    </div>
  );
});
