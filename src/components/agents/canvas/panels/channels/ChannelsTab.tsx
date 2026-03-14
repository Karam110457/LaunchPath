"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Globe, Loader2 } from "lucide-react";
import { ChannelsList } from "./ChannelsList";
import { WidgetSetupDialog } from "./WidgetSetupDialog";
import type { ChannelResponse } from "@/lib/channels/types";

interface ChannelsTabProps {
  agentId: string;
}

export function ChannelsTab({ agentId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupChannel, setSetupChannel] = useState<{
    existing?: ChannelResponse;
  } | null>(null);

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
        // Rollback on failure
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId ? { ...ch, is_enabled: !enabled } : ch
          )
        );
      }
    } catch {
      // Rollback
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
        <button
          type="button"
          onClick={() => setSetupChannel({})}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Widget
        </button>
      </div>

      {/* List or Empty State */}
      {channels.length === 0 ? (
        <button
          type="button"
          onClick={() => setSetupChannel({})}
          className="w-full rounded-xl border-2 border-dashed border-border/60 p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Globe className="w-6 h-6" />
          <span className="text-sm font-medium">Add Website Widget</span>
          <span className="text-xs">
            Embed a chat widget on any website
          </span>
        </button>
      ) : (
        <ChannelsList
          channels={channels}
          onEdit={(ch) => setSetupChannel({ existing: ch })}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}

      {/* Setup Dialog */}
      {setupChannel && (
        <WidgetSetupDialog
          agentId={agentId}
          existing={setupChannel.existing}
          onSaved={() => {
            setSetupChannel(null);
            fetchChannels();
          }}
          onClose={() => setSetupChannel(null)}
        />
      )}
    </div>
  );
}
