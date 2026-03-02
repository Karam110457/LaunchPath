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

const STYLE_MAP: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    glow: string;
    badge: string;
    headerBg: string;
    handleColor: string;
  }
> = {
  calendly: {
    iconBg: "bg-violet-500/25",
    iconColor: "text-violet-400",
    glow: "bg-violet-500/20",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    headerBg: "bg-violet-500/10",
    handleColor: "!bg-violet-400",
  },
  ghl: {
    iconBg: "bg-orange-500/25",
    iconColor: "text-orange-400",
    glow: "bg-orange-500/15",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    headerBg: "bg-orange-500/10",
    handleColor: "!bg-orange-400",
  },
  hubspot: {
    iconBg: "bg-red-500/25",
    iconColor: "text-red-400",
    glow: "bg-red-500/15",
    badge: "bg-red-500/10 text-red-400 border-red-500/25",
    headerBg: "bg-red-500/10",
    handleColor: "!bg-red-400",
  },
  "human-handoff": {
    iconBg: "bg-blue-500/25",
    iconColor: "text-blue-400",
    glow: "bg-blue-500/15",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    headerBg: "bg-blue-500/10",
    handleColor: "!bg-blue-400",
  },
  webhook: {
    iconBg: "bg-emerald-500/25",
    iconColor: "text-emerald-400",
    glow: "bg-emerald-500/15",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    headerBg: "bg-emerald-500/10",
    handleColor: "!bg-emerald-400",
  },
  mcp: {
    iconBg: "bg-zinc-500/25",
    iconColor: "text-zinc-400",
    glow: "bg-zinc-500/15",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
    headerBg: "bg-zinc-500/10",
    handleColor: "!bg-zinc-400",
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
  iconBg: "bg-primary/20",
  iconColor: "text-primary",
  glow: "bg-primary/15",
  badge: "bg-primary/10 text-primary border-primary/25",
  headerBg: "bg-primary/8",
  handleColor: "!bg-primary",
};

export const ToolNode = memo(function ToolNode({ data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const Icon = ICON_MAP[d.toolType] ?? Plug;
  const style = STYLE_MAP[d.toolType] ?? DEFAULT_STYLE;
  const typeLabel = TYPE_LABELS[d.toolType] ?? d.toolType;

  return (
    <div className="group relative">
      {/* Glow */}
      <div
        className={cn(
          "absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none",
          style.glow
        )}
      />

      <div
        className={cn(
          "relative w-[140px] bg-card border border-border/60 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:border-border hover:shadow-xl overflow-hidden",
          !d.isEnabled && "opacity-40"
        )}
      >
        {/* Icon header area — colored top section like n8n */}
        <div className={cn("flex items-center justify-center pt-5 pb-4", style.headerBg)}>
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
              style.iconBg
            )}
          >
            <Icon className={cn("w-6 h-6", style.iconColor)} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Name + type badge */}
        <div className="px-3 py-3 text-center">
          <p className="text-[12px] font-semibold text-foreground truncate leading-tight mb-2">
            {d.displayName}
          </p>
          <span
            className={cn(
              "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border",
              style.badge
            )}
          >
            {typeLabel}
          </span>
          {!d.isEnabled && (
            <p className="text-[9px] text-muted-foreground/35 mt-1.5">disabled</p>
          )}
        </div>

        {/* Hover hint */}
        <p className="text-[9px] text-center text-muted-foreground/0 group-hover:text-muted-foreground/30 pb-2 -mt-1 transition-colors duration-200">
          click to configure
        </p>

        {/* Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className={cn("!w-2.5 !h-2.5 !border-2 !border-card", style.handleColor)}
        />
      </div>
    </div>
  );
});
