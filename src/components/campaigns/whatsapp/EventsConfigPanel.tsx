"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Webhook } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const EVENT_TYPES = [
  { value: "whatsapp.message.received", label: "Message Received" },
  { value: "whatsapp.conversation.completed", label: "Conversation Completed" },
  { value: "whatsapp.contact.tagged", label: "Contact Tagged" },
  { value: "whatsapp.sequence.replied", label: "Sequence Replied" },
  { value: "whatsapp.sequence.completed", label: "Sequence Completed" },
];

interface Subscription {
  id: string;
  event_type: string;
  webhook_url: string;
  secret: string | null;
  is_enabled: boolean;
}

interface EventsConfigPanelProps {
  campaignId: string;
}

export function EventsConfigPanel({ campaignId }: EventsConfigPanelProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/events`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function handleAdd() {
    if (!newEventType || !newUrl) {
      setError("Event type and URL are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: newEventType,
          webhook_url: newUrl,
          secret: newSecret || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }

      setShowAdd(false);
      setNewEventType("");
      setNewUrl("");
      setNewSecret("");
      fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/campaigns/${campaignId}/events/${id}`, { method: "DELETE" });
      fetchSubscriptions();
    } catch {
      // Silently fail
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await fetch(`/api/campaigns/${campaignId}/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      });
      fetchSubscriptions();
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Event Webhooks</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-3 h-3" />
          Add Webhook
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Receive real-time notifications when events occur on this channel.
      </p>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-neutral-200/50 dark:border-neutral-700/30 bg-neutral-50/50 dark:bg-neutral-800/20 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Event Type</Label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select event...</option>
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Webhook URL</Label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className={INPUT_CLASS}
              placeholder="https://your-server.com/webhook"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Secret (optional)</Label>
            <input
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              className={INPUT_CLASS}
              placeholder="HMAC signing secret"
            />
            <p className="text-[10px] text-muted-foreground">
              If set, payloads are signed with HMAC-SHA256 in the X-Webhook-Signature header.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subscription list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : subscriptions.length === 0 && !showAdd ? (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-muted-foreground text-xs">
          No webhooks configured. Add one to receive real-time event notifications.
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200/40 dark:border-neutral-700/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                    {EVENT_TYPES.find((t) => t.value === sub.event_type)?.label ?? sub.event_type}
                  </span>
                  {!sub.is_enabled && (
                    <span className="text-[9px] font-medium text-red-500">Disabled</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                  {sub.webhook_url}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle(sub.id, !sub.is_enabled)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {sub.is_enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sub.id)}
                  className="p-1 text-red-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
