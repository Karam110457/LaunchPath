"use client";

import { useState } from "react";
import { Pencil, Trash2, Globe, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChannelResponse } from "@/lib/channels/types";

const CHANNEL_ICONS: Record<string, typeof Globe> = {
  widget: Globe,
  api: Code,
};

const CHANNEL_COLORS: Record<string, string> = {
  widget: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  api: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const CHANNEL_LABELS: Record<string, string> = {
  widget: "Widget",
  api: "API",
};

interface ChannelsListProps {
  channels: ChannelResponse[];
  onEdit: (channel: ChannelResponse) => void;
  onDelete: (channelId: string) => void;
  onToggle: (channelId: string, enabled: boolean) => void;
}

export function ChannelsList({
  channels,
  onEdit,
  onDelete,
  onToggle,
}: ChannelsListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.channel_type] ?? Globe;
        const colorClass =
          CHANNEL_COLORS[channel.channel_type] ?? CHANNEL_COLORS.widget;
        const typeLabel =
          CHANNEL_LABELS[channel.channel_type] ?? channel.channel_type;

        return (
          <div
            key={channel.id}
            className={cn(
              "rounded-xl border p-3 flex items-center gap-3 transition-colors",
              channel.is_enabled
                ? "border-border/60 bg-background"
                : "border-border/30 bg-muted/20 opacity-60"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                channel.is_enabled ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  channel.is_enabled
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {channel.name}
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
                onClick={() => onToggle(channel.id, !channel.is_enabled)}
                className={cn(
                  "relative w-8 h-4.5 rounded-full transition-colors",
                  channel.is_enabled ? "bg-primary" : "bg-muted"
                )}
                title={channel.is_enabled ? "Disable channel" : "Enable channel"}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white canvas-dark:bg-neutral-200 transition-transform shadow-sm",
                    channel.is_enabled
                      ? "translate-x-[18px]"
                      : "translate-x-0.5"
                  )}
                />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(channel)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>

              {/* Delete */}
              {confirmDelete === channel.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(channel.id);
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
                  onClick={() => setConfirmDelete(channel.id)}
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
