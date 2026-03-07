"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, MousePointerClick, Sparkles } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";
import { NodeHelperTip } from "./NodeHelperTip";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[112px] h-[112px] liquid-glass-node !rounded-full cursor-pointer overflow-visible z-10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.05)] ring-2 ring-white/50">

        {/* Outer animated halo for the main AI Agent */}
        <div className="absolute inset-[-6px] rounded-full border border-zinc-900/10 animate-[spin_10s_linear_infinite] [border-style:dashed]" />
        
        {/* Main AI Agent Badge */}
        <div className="absolute -top-3 bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white shadow-sm z-20 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          AI Agent
        </div>

        <div className="flex items-center justify-center text-5xl z-10">
          {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
            d.avatarEmoji
          ) : (
            <Bot strokeWidth={1.5} className="w-12 h-12 text-zinc-700" />
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
