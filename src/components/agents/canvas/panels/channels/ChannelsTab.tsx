"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Globe, Loader2, MessageCircle } from "lucide-react";
import { ChannelsList } from "./ChannelsList";
import { WidgetSetupDialog } from "./WidgetSetupDialog";
import { WhatsAppSetupDialog } from "./WhatsAppSetupDialog";
import type { ChannelResponse } from "@/lib/channels/types";

interface ChannelsTabProps {
  agentId: string;
}

type SetupState = {
  type: "widget" | "whatsapp";
  existing?: ChannelResponse;
} | null;

export function ChannelsTab({ agentId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupState, setSetupState] = useState<SetupState>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/channels`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels ?? []);
      }
    } catch {
      // Silently fail — empty list
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  async function handleToggle(channelId: string, enabled: boolean) {
    // Optimistic update
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, is_enabled: enabled } : ch
      )
    );

    try {
      const res = await fetch(
        `/api/agents/${agentId}/channels/${channelId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_enabled: enabled }),
        }
      );
      if (!res.ok) {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId ? { ...ch, is_enabled: !enabled } : ch
          )
        );
      }
    } catch {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, is_enabled: !enabled } : ch
        )
      );
    }
  }

  async function handleDelete(channelId: string) {
    try {
      const res = await fetch(
        `/api/agents/${agentId}/channels/${channelId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setChannels((prev) => prev.filter((ch) => ch.id !== channelId));
      }
    } catch {
      // Silently fail
    }
  }

  function handleEdit(channel: ChannelResponse) {
    const type = channel.channel_type === "whatsapp" ? "whatsapp" : "widget";
    setSetupState({ type, existing: channel });
  }

  function handleDialogClose() {
    setSetupState(null);
    fetchChannels();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Deployed Channels
        </h3>
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Channel
          </button>

          {/* Channel type picker dropdown */}
          {showPicker && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border/60 bg-background shadow-lg z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setSetupState({ type: "widget" });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Website Widget
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Embed on any website
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setSetupState({ type: "whatsapp" });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-t border-border/40"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10">
                  <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    WhatsApp
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Connect a business number
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List or Empty State */}
      {channels.length === 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSetupState({ type: "widget" })}
            className="w-full rounded-xl border-2 border-dashed border-border/60 p-4 flex items-center gap-3 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 shrink-0">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium block">Website Widget</span>
              <span className="text-xs">
                Embed a chat widget on any website
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSetupState({ type: "whatsapp" })}
            className="w-full rounded-xl border-2 border-dashed border-border/60 p-4 flex items-center gap-3 text-muted-foreground hover:border-green-500/40 hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10 shrink-0">
              <MessageCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium block">WhatsApp</span>
              <span className="text-xs">
                Connect a WhatsApp Business number
              </span>
            </div>
          </button>
        </div>
      ) : (
        <ChannelsList
          channels={channels}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}

      {/* Setup Dialogs */}
      {setupState?.type === "widget" && (
        <WidgetSetupDialog
          agentId={agentId}
          existing={setupState.existing}
          onSaved={handleDialogClose}
          onClose={() => setSetupState(null)}
        />
      )}
      {setupState?.type === "whatsapp" && (
        <WhatsAppSetupDialog
          agentId={agentId}
          existing={setupState.existing}
          onSaved={handleDialogClose}
          onClose={() => setSetupState(null)}
        />
      )}
    </div>
  );
}
