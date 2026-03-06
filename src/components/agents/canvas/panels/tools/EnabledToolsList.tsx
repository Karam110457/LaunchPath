"use client";

import { useState } from "react";
import { Pencil, Trash2, Webhook, Plug, Globe, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentToolResponse } from "@/lib/tools/types";

const ICON_MAP: Record<string, LucideIcon> = {
  webhook: Webhook,
  mcp: Plug,
  http: Globe,
  subagent: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  webhook: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  mcp: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  composio: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  http: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  subagent: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  webhook: "Webhook",
  mcp: "MCP",
  http: "HTTP",
  subagent: "Sub-Agent",
  // composio: label comes from config.toolkit_name
};

interface EnabledToolsListProps {
  tools: AgentToolResponse[];
  onEdit: (tool: AgentToolResponse) => void;
  onDelete: (toolId: string) => void;
  onToggle: (toolId: string, enabled: boolean) => void;
}

export function EnabledToolsList({
  tools,
  onEdit,
  onDelete,
  onToggle,
}: EnabledToolsListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {tools.map((tool) => {
        const isComposio = tool.tool_type === "composio";
        const Icon = ICON_MAP[tool.tool_type] ?? Plug;
        const colorClass = CATEGORY_COLORS[tool.tool_type] ?? CATEGORY_COLORS.composio;
        const composioConfig = isComposio
          ? (tool.config as { toolkit_name?: string })
          : null;
        const typeLabel = isComposio
          ? (composioConfig?.toolkit_name ?? "App")
          : (TYPE_LABELS[tool.tool_type] ?? tool.tool_type);

        return (
          <div
            key={tool.id}
            className={cn(
              "rounded-xl border p-3 flex items-center gap-3 transition-colors",
              tool.is_enabled
                ? "border-border/60 bg-background"
                : "border-border/30 bg-muted/20 opacity-60"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                tool.is_enabled ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              {(() => {
                if (!isComposio) {
                  return <Icon className={cn("w-4 h-4", tool.is_enabled ? "text-primary" : "text-muted-foreground")} />;
                }
                const icon = (tool.config as { toolkit_icon?: string })?.toolkit_icon;
                if (icon?.startsWith("http")) {
                  return (
                    <img
                      src={icon}
                      alt={tool.display_name}
                      className="w-4.5 h-4.5 object-contain"
                    />
                  );
                }
                return (
                  <span className="text-base leading-none">
                    {icon ?? tool.display_name.charAt(0)}
                  </span>
                );
              })()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {tool.display_name}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0",
                    colorClass
                  )}
                >
                  {typeLabel}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => onToggle(tool.id, !tool.is_enabled)}
                className={cn(
                  "relative w-8 h-4.5 rounded-full transition-colors",
                  tool.is_enabled ? "bg-primary" : "bg-muted"
                )}
                title={tool.is_enabled ? "Disable tool" : "Enable tool"}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm",
                    tool.is_enabled ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(tool)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>

              {/* Delete */}
              {confirmDelete === tool.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(tool.id);
                      setConfirmDelete(null);
                    }}
                    className="px-2 py-0.5 rounded-md text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-0.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(tool.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
