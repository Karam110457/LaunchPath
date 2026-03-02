"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[240px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl cursor-pointer transition-all duration-200 hover:border-[#555] overflow-visible z-10 flex items-center px-4 py-4">

        {/* Active status pulse */}
        {d.status === "active" && (
          <div className="absolute -top-1.5 -right-1.5 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
        )}

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
