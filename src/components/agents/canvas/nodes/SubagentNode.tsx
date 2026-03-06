"use client";

import { memo, useContext } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Plus } from "lucide-react";
import type { SubagentNodeData } from "../canvas-types";
import { CanvasActionsContext } from "../canvas-context";

export const SubagentNode = memo(function SubagentNode({ data }: NodeProps) {
  const d = data as unknown as SubagentNodeData;
  const { openCatalogForAgent } = useContext(CanvasActionsContext);

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative w-[240px] bg-[#1a1a1a] border border-amber-500/30 rounded-xl shadow-xl cursor-pointer transition-all duration-200 hover:border-amber-500/50 overflow-visible z-10 flex items-center px-4 py-4">
        {/* Target handle — receives edge from parent agent */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-amber-500/50 !rounded-[2px] !rotate-45 z-20"
        />

        {/* Avatar */}
        <div className="w-10 h-10 flex items-center justify-center text-zinc-100 mr-3 shrink-0">
          {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
            <span className="text-2xl leading-none">{d.avatarEmoji}</span>
          ) : (
            <Bot strokeWidth={2} className="w-8 h-8" />
          )}
        </div>

        {/* Name + badge */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-zinc-100 truncate leading-tight">
            {d.name}
          </h3>
          <span className="inline-block mt-0.5 text-[9px] font-medium px-1.5 py-[1px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Sub-Agent
          </span>
        </div>

        {/* "+" button — opens tool catalog scoped to this sub-agent */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openCatalogForAgent(d.subagentId);
          }}
          className="nopan nodrag absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center hover:bg-amber-500/25 hover:border-amber-500/60 transition-all z-30 opacity-0 group-hover:opacity-100"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Bottom-left → Knowledge */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-left"
          style={{ left: "25%", bottom: "-7px" }}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-amber-500/30 !rounded-[2px] !rotate-45 z-20"
        />
        {/* Bottom-right → Tools */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-right"
          style={{ left: "75%", bottom: "-7px" }}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-amber-500/30 !rounded-[2px] !rotate-45 z-20"
        />
      </div>

      {/* Labels below node */}
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
