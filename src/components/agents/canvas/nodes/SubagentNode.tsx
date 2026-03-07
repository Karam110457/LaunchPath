"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { SubagentNodeData } from "../canvas-types";
import { ShineBorder } from "@/components/ui/shine-border";

const NODE_W = 280;
const NODE_H = 128;

export const SubagentNode = memo(function SubagentNode({ data }: NodeProps) {
  const d = data as unknown as SubagentNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      <ShineBorder
        borderRadius={48}
        borderWidth={3}
        duration={8}
        color={["#FF8C00", "#9D50BB"]}
        className="relative !p-[3px] !bg-transparent cursor-pointer overflow-visible z-10"
        style={{ width: NODE_W, height: NODE_H }}
      >
        <div className="w-full h-full liquid-glass-node flex items-center gap-3 justify-center !border-none px-4" style={{ borderRadius: 45 }}>
          <Handle
            type="target"
            position={Position.Top}
            className="!bg-zinc-200 canvas-dark:!bg-zinc-600 !w-3 !h-3 !border-[2px] !border-white canvas-dark:!border-zinc-800 !rounded-full !top-[-8px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />

          <div className="flex items-center justify-center shrink-0 text-4xl">
            {d.avatarEmoji && d.avatarEmoji !== "🤖" ? (
              <span className="text-3xl">{d.avatarEmoji}</span>
            ) : (
              <Bot strokeWidth={1.5} className="w-9 h-9 text-zinc-700 canvas-dark:text-zinc-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-zinc-800 canvas-dark:text-zinc-200 text-left truncate leading-tight">
              {d.name}
            </h3>
            <span className="inline-block text-[10px] font-medium text-zinc-500 canvas-dark:text-zinc-400 mt-0.5">
              Sub-Agent
            </span>
          </div>

          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-left"
            style={{ left: "25%", bottom: "-8px" }}
            className="!bg-zinc-200 canvas-dark:!bg-zinc-600 !w-3 !h-3 !border-[2px] !border-white canvas-dark:!border-zinc-800 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-right"
            style={{ left: "75%", bottom: "-8px" }}
            className="!bg-zinc-200 canvas-dark:!bg-zinc-600 !w-3 !h-3 !border-[2px] !border-white canvas-dark:!border-zinc-800 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />
        </div>
      </ShineBorder>

      {/* Handle labels on hover */}
      <div className="relative mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: NODE_W }}>
        <span className="absolute text-[11px] font-medium text-zinc-500 canvas-dark:text-zinc-400" style={{ left: "25%", transform: "translateX(-50%)" }}>
          Knowledge
        </span>
        <span className="absolute text-[11px] font-medium text-zinc-500 canvas-dark:text-zinc-400" style={{ left: "75%", transform: "translateX(-50%)" }}>
          Tools
        </span>
      </div>
    </div>
  );
});
