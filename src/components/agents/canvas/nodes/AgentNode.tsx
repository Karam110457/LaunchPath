"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, MousePointerClick } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";
import { NodeHelperTip } from "./NodeHelperTip";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[88px] h-[88px] liquid-glass-node rounded-3xl cursor-pointer overflow-visible z-10 flex items-center justify-center">

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

        {/* Helper tip — anchored to the right side of the node */}
        <NodeHelperTip
          tipId="agent"
          icon={<MousePointerClick className="w-3.5 h-3.5 text-zinc-700" />}
          text="Double-click to edit personality, tone, and behavior"
          position="left-[calc(100%+28px)] top-[35%] -translate-y-1/2"
        />
      </div>

      {/* Labels below node */}
      <h3 className="mt-3 text-[13px] font-medium text-zinc-800 text-center max-w-[120px] leading-tight flex-wrap">
        {d.name}
      </h3>
      <div className="w-[120px] relative mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="absolute text-[9px] font-medium text-zinc-400"
          style={{ left: "25%", transform: "translateX(-50%)" }}
        >
          Knowledge
        </span>
        <span
          className="absolute text-[9px] font-medium text-zinc-400"
          style={{ left: "75%", transform: "translateX(-50%)" }}
        >
          Tools
        </span>
      </div>
    </div>
  );
});
