"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, MousePointerClick } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";
import { NodeHelperTip } from "./NodeHelperTip";
import { ShineBorder } from "@/components/ui/shine-border";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <ShineBorder
        borderRadius={32}
        borderWidth={2}
        duration={12}
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        className="relative w-[140px] h-[64px] !p-0 !bg-transparent cursor-pointer overflow-visible z-10 flex items-center justify-center liquid-glass-node"
      >
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

        {/* Helper tip — anchored to the right side of the node */}
        <NodeHelperTip
          tipId="agent"
          icon={<MousePointerClick className="w-3.5 h-3.5 text-zinc-700" />}
          text="Double-click to edit personality, tone, and behavior"
          position="left-[calc(100%+28px)] top-[50%] -translate-y-1/2"
        />
      </ShineBorder>

      {/* Labels below node */}
      <h3 className="mt-4 text-[14px] font-semibold text-zinc-800 text-center max-w-[140px] leading-tight flex-wrap">
        {d.name}
      </h3>
      <div className="w-[140px] relative mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="absolute text-[10px] font-medium text-zinc-500"
          style={{ left: "25%", transform: "translateX(-50%)" }}
        >
          Knowledge
        </span>
        <span
          className="absolute text-[10px] font-medium text-zinc-500"
          style={{ left: "75%", transform: "translateX(-50%)" }}
        >
          Tools
        </span>
      </div>
    </div>
  );
});
