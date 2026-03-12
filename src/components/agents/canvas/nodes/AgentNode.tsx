"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Bot, MousePointerClick } from "lucide-react";
import type { AgentNodeData } from "../canvas-types";
import { NodeHelperTip } from "./NodeHelperTip";
import { ShineBorder } from "@/components/ui/shine-border";
import { NODE_ENTER, NODE_DRAG, NODE_EXIT } from "../animation-constants";

const NODE_W = 280;
const NODE_H = 128;

export const AgentNode = memo(function AgentNode({ data, dragging }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const isExiting = (data as Record<string, unknown>)._exiting === true;

  return (
    <motion.div
      className="group relative flex flex-col items-center"
      initial={NODE_ENTER.initial}
      animate={
        isExiting
          ? NODE_EXIT
          : {
              opacity: 1,
              scale: dragging ? NODE_DRAG.scale : 1,
              filter: dragging ? NODE_DRAG.filter : "drop-shadow(0 0 0 transparent)",
            }
      }
      transition={NODE_ENTER.transition}
    >
      <ShineBorder
        borderRadius={48}
        borderWidth={3}
        duration={8}
        color={["#FF8C00", "#9D50BB"]}
        className="relative !p-[3px] !bg-transparent cursor-pointer overflow-visible z-10"
        style={{ width: NODE_W, minHeight: NODE_H }}
      >
        <div className="w-full h-full liquid-glass-node flex items-center gap-3 justify-center !border-none px-4" style={{ borderRadius: 45 }}>
          <div className="flex items-center justify-center shrink-0 text-4xl">
            <Bot strokeWidth={1.5} className="w-9 h-9 text-neutral-700 canvas-dark:text-neutral-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-neutral-800 canvas-dark:text-neutral-200 text-left leading-tight line-clamp-2">
              {d.name}
            </h3>
            <span className="inline-block text-[10px] font-medium text-neutral-500 canvas-dark:text-neutral-400 mt-0.5">
              Agent
            </span>
          </div>

          {/* Bottom-left → Knowledge */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-left"
            style={{ left: "25%", bottom: "-8px" }}
            className="!bg-neutral-200 canvas-dark:!bg-neutral-600 !w-3 !h-3 !border-[2px] !border-white canvas-dark:!border-neutral-800 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />
          {/* Bottom-right → Tools */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-right"
            style={{ left: "75%", bottom: "-8px" }}
            className="!bg-neutral-200 canvas-dark:!bg-neutral-600 !w-3 !h-3 !border-[2px] !border-white canvas-dark:!border-neutral-800 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          />

          <NodeHelperTip
            tipId="agent"
            icon={<MousePointerClick className="w-3.5 h-3.5 text-white" />}
            text="Double-click to edit personality, tone, and behavior"
            position="left-[calc(100%+28px)] top-[50%] -translate-y-1/2"
          />
        </div>
      </ShineBorder>

      {/* Handle labels on hover */}
      <div className="relative mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: NODE_W }}>
        <span className="absolute text-[11px] font-medium text-neutral-500 canvas-dark:text-neutral-400" style={{ left: "25%", transform: "translateX(-50%)" }}>
          Knowledge
        </span>
        <span className="absolute text-[11px] font-medium text-neutral-500 canvas-dark:text-neutral-400" style={{ left: "75%", transform: "translateX(-50%)" }}>
          Tools
        </span>
      </div>
    </motion.div>
  );
});
