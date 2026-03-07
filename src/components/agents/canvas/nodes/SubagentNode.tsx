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
      <div className="relative w-[88px] h-[88px] liquid-glass-node rounded-3xl cursor-pointer overflow-visible z-10 flex items-center justify-center">
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

        {/* "+" button — opens tool catalog scoped to this sub-agent */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openCatalogForAgent(d.subagentId);
          }}
          className="nopan nodrag absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-all z-30 opacity-0 group-hover:opacity-100"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-600" />
        </button>

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
