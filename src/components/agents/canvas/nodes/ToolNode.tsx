"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  CalendarCheck,
  Users,
  UserCheck,
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
  "human-handoff": UserCheck,
  webhook: Webhook,
  mcp: Plug,
};

// Each tool type gets its own accent color — applied as a left border stripe
const STYLE_MAP: Record<
  string,
  { accent: string; iconBg: string; iconColor: string; glow: string; badge: string }
> = {
  calendly: {
    accent: "bg-violet-400",
    iconBg: "bg-violet-500/15", iconColor: "text-violet-400",
    glow: "bg-violet-500/15",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  ghl: {
    accent: "bg-orange-400",
    iconBg: "bg-orange-500/15", iconColor: "text-orange-400",
    glow: "bg-orange-500/15",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  hubspot: {
    accent: "bg-red-400",
    iconBg: "bg-red-500/15", iconColor: "text-red-400",
    glow: "bg-red-500/15",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  "human-handoff": {
    accent: "bg-blue-400",
    iconBg: "bg-blue-500/15", iconColor: "text-blue-400",
    glow: "bg-blue-500/15",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  webhook: {
    accent: "bg-emerald-400",
    iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400",
    glow: "bg-emerald-500/15",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  mcp: {
    accent: "bg-zinc-400",
    iconBg: "bg-zinc-500/15", iconColor: "text-zinc-400",
    glow: "bg-zinc-500/15",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

const TYPE_LABELS: Record<string, string> = {
  calendly: "Booking",
  ghl: "CRM",
  hubspot: "CRM",
  "human-handoff": "Handoff",
  webhook: "Webhook",
  mcp: "MCP",
};

const DEFAULT_STYLE = {
  accent: "bg-primary",
  iconBg: "bg-primary/10", iconColor: "text-primary",
  glow: "bg-primary/15",
  badge: "bg-primary/10 text-primary border-primary/20",
};

export const ToolNode = memo(function ToolNode({ data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const Icon = ICON_MAP[d.toolType] ?? Plug;
  const style = STYLE_MAP[d.toolType] ?? DEFAULT_STYLE;
  const typeLabel = TYPE_LABELS[d.toolType] ?? d.toolType;

  return (
    <div className="group relative">
      <div
        className={cn(
          "absolute -inset-1.5 rounded-xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300",
          style.glow
        )}
      />

      {/* Tool nodes: standard card + colored left accent stripe to look like "integrations" */}
      <div
        className={cn(
          "relative w-[195px] bg-card border border-border/60 rounded-xl shadow-md cursor-pointer transition-all hover:border-border/80 overflow-hidden",
          !d.isEnabled && "opacity-50"
        )}
      >
        {/* Colored left accent bar — key visual differentiator from KnowledgeNode */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", style.accent)} />

        <div className="pl-4 pr-3 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                style.iconBg
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", style.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {d.displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full border leading-none",
                    style.badge
                  )}
                >
                  {typeLabel}
                </span>
                {!d.isEnabled && (
                  <span className="text-[10px] text-muted-foreground/50">off</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/50 mt-2 transition-colors duration-200">
            click to configure
          </p>
        </div>

        {/* Top target handle — edge comes from agent's bottom-right */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-border !w-2 !h-2 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
