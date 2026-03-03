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
      <div className="relative w-[240px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl cursor-pointer transition-all duration-200 hover:border-[#555] overflow-visible z-10 flex items-center px-4 py-4">

        <div className="w-10 h-10 flex items-center justify-center text-zinc-100 mr-3">
          <Bot strokeWidth={2} className="w-8 h-8" />
        </div>

        <h3 className="text-[15px] font-semibold text-zinc-100 truncate leading-tight">
          {d.name}
        </h3>

        {/* Bottom-left → Knowledge */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-left"
          style={{ left: "25%", bottom: "-7px" }}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-[#555] !rounded-[2px] !rotate-45 z-20"
        />
        {/* Bottom-right → Tools */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-right"
          style={{ left: "75%", bottom: "-7px" }}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-[#555] !rounded-[2px] !rotate-45 z-20"
        />

        {/* Helper tip */}
        <NodeHelperTip
          tipId="agent"
          icon={<MousePointerClick className="w-3.5 h-3.5 text-primary" />}
          text="Double-click to edit personality, tone, and behavior"
          position="left-1/2 -translate-x-1/2 bottom-full mb-3"
        />
      </div>

      <div className="w-[240px] relative mt-2 pointer-events-none">
        <span
          className="absolute text-[11px] font-medium text-[#777]"
          style={{ left: "25%", transform: "translateX(-50%)" }}
        >
          Knowledge Base
        </span>
        <span
          className="absolute text-[11px] font-medium text-[#777]"
          style={{ left: "75%", transform: "translateX(-50%)" }}
        >
          Tools
        </span>
      </div>
    </div>
  );
});
