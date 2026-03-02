"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  CalendarCheck,
  Users,
  Webhook,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolNodeData } from "../canvas-types";

const ICON_MAP: Record<string, LucideIcon> = {
  calendly: CalendarCheck,
  ghl: Users,
  hubspot: Users,
  webhook: Webhook,
  mcp: Plug,
};

const COLOR_MAP: Record<string, string> = {
  calendly: "text-blue-400",
  ghl: "text-orange-400",
  hubspot: "text-red-400",
  webhook: "text-emerald-400",
  mcp: "text-zinc-400",
};

export const ToolNode = memo(function ToolNode({ data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const Icon = ICON_MAP[d.toolType] ?? Plug;
  const iconColor = COLOR_MAP[d.toolType] ?? "text-primary";

  return (
    <div className="group relative flex flex-col items-center">
      {/* Square container */}
      <div
        className={cn(
          "relative w-[84px] h-[84px] bg-[#1a1a1a] border border-[#333] rounded-[20px] flex items-center justify-center cursor-pointer shadow-xl transition-all duration-200 hover:border-[#555] z-10",
          !d.isEnabled && "opacity-40"
        )}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <Icon className={cn("w-10 h-10", iconColor)} strokeWidth={1.5} />
        </div>

        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-[#555] !rounded-[2px] !rotate-45 !top-[-7px] z-20"
        />
      </div>

      {/* Labels below */}
      <div className="mt-2.5 flex flex-col items-center pointer-events-none text-center">
        <h3 className="text-[14.5px] font-semibold text-[#EEEEEE] tracking-wide leading-tight">
          {d.displayName}
        </h3>
        <p className="text-[12px] text-[#777] mt-1">
          {d.toolType === "calendly" ? "create: event" :
            d.toolType === "ghl" ? "create: contact" :
              d.toolType === "hubspot" ? "create: deal" :
                d.toolType === "webhook" ? "trigger: post" :
                  `execute: ${d.toolType}`}
        </p>
      </div>
    </div>
  );
});
