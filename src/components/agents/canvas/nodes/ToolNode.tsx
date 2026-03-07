"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Webhook,
  Plug,
  Globe,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolNodeData } from "../canvas-types";

const ICON_MAP: Record<string, LucideIcon> = {
  webhook: Webhook,
  mcp: Plug,
  http: Globe,
  subagent: Users,
};

const COLOR_MAP: Record<string, string> = {
  webhook: "text-emerald-400",
  mcp: "text-zinc-400",
  http: "text-blue-400",
  subagent: "text-amber-400",
};

const ACTION_LABELS: Record<string, string> = {
  webhook: "trigger: post",
  mcp: "execute: mcp",
  http: "request: http",
  subagent: "delegate: agent",
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
          "relative w-[96px] h-[96px] liquid-glass-node !rounded-2xl flex items-center justify-center cursor-pointer z-10",
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
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full !top-[-5px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />
      </div>

      {/* Labels below node */}
      <div className="mt-3 flex flex-col items-center pointer-events-none text-center max-w-[120px]">
        <h3 className="text-[13px] font-medium text-zinc-800 leading-tight">
          {d.displayName}
        </h3>
        <p className="text-[10px] text-zinc-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionLabel}
        </p>
      </div>
    </div>
  );
});
