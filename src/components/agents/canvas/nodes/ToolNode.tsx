"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Webhook,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolNodeData } from "../canvas-types";

const ICON_MAP: Record<string, LucideIcon> = {
  webhook: Webhook,
  mcp: Plug,
};

const COLOR_MAP: Record<string, string> = {
  webhook: "text-emerald-400",
  mcp: "text-zinc-400",
};

const ACTION_LABELS: Record<string, string> = {
  webhook: "trigger: post",
  mcp: "execute: mcp",
};

export const ToolNode = memo(function ToolNode({ data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const Icon = ICON_MAP[d.toolType] ?? Plug;
  const iconColor = COLOR_MAP[d.toolType] ?? "text-primary";
  const hasLogoUrl = d.toolkitIcon?.startsWith("http");

  // Action label — composio tools show toolkit name instead of "composio"
  const actionLabel = ACTION_LABELS[d.toolType]
    ?? (d.toolkitSlug ? `execute: ${d.toolkitSlug}` : `execute: ${d.toolType}`);

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
          {hasLogoUrl ? (
            <img
              src={d.toolkitIcon}
              alt={d.displayName}
              className="w-10 h-10 object-contain rounded-lg"
              onError={(e) => {
                // Fallback: hide image and show first letter
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
                const parent = img.parentElement;
                if (parent) {
                  const span = document.createElement("span");
                  span.className = "text-2xl font-semibold text-indigo-400";
                  span.textContent = d.displayName.charAt(0);
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <Icon className={cn("w-10 h-10", iconColor)} strokeWidth={1.5} />
          )}
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
          {actionLabel}
        </p>
      </div>
    </div>
  );
});
