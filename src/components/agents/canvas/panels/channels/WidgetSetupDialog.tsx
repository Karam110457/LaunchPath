"use client";

import { useState } from "react";
import { Copy, Check, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelResponse, WidgetConfig } from "@/lib/channels/types";

interface WidgetSetupDialogProps {
  agentId: string;
  existing?: ChannelResponse;
  onSaved: () => void;
  onClose: () => void;
}

export function WidgetSetupDialog({
  agentId,
  existing,
  onSaved,
  onClose,
}: WidgetSetupDialogProps) {
  const isEdit = !!existing;
  const existingConfig = (existing?.config ?? {}) as WidgetConfig;

  const [name, setName] = useState(existing?.name ?? "Website Widget");
  const [primaryColor, setPrimaryColor] = useState(
    existingConfig.primaryColor ?? "#6366f1"
  );
  const [agentName, setAgentName] = useState(existingConfig.agentName ?? "");
  const [agentAvatar, setAgentAvatar] = useState(
    existingConfig.agentAvatar ?? ""
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    existingConfig.welcomeMessage ?? "Hi! How can I help you today?"
  );
  const [starters, setStarters] = useState<string[]>(
    existingConfig.conversationStarters ?? []
  );
  const [position, setPosition] = useState<"right" | "left">(
    existingConfig.position ?? "right"
  );
  const [headerText, setHeaderText] = useState(
    existingConfig.headerText ?? ""
  );
  const [allowedOrigins, setAllowedOrigins] = useState(
    (existing?.allowed_origins ?? []).join("\n")
  );
  const [rateLimitRpm, setRateLimitRpm] = useState(
    existing?.rate_limit_rpm?.toString() ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // After create, we store the returned channel to show embed code
  const [createdChannel, setCreatedChannel] = useState<ChannelResponse | null>(
    null
  );

  const showChannel = existing ?? createdChannel;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const config: WidgetConfig = {
      primaryColor,
      agentName: agentName || undefined,
      agentAvatar: agentAvatar || undefined,
      welcomeMessage,
      conversationStarters: starters.filter(Boolean),
      position,
      headerText: headerText || undefined,
    };

    const origins = allowedOrigins
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);

    const rpm = rateLimitRpm ? parseInt(rateLimitRpm, 10) : undefined;

    try {
      if (isEdit) {
        const res = await fetch(
          `/api/agents/${agentId}/channels/${existing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              config,
              allowed_origins: origins,
              rate_limit_rpm: rpm ?? null,
            }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update channel");
        }
        onSaved();
      } else {
        const res = await fetch(`/api/agents/${agentId}/channels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel_type: "widget",
            name,
            config,
            allowed_origins: origins,
            rate_limit_rpm: rpm,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create channel");
        }
        const data = await res.json();
        setCreatedChannel(data.channel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function addStarter() {
    if (starters.length < 4) {
      setStarters([...starters, ""]);
    }
  }

  function removeStarter(index: number) {
    setStarters(starters.filter((_, i) => i !== index));
  }

  function updateStarter(index: number, value: string) {
    const next = [...starters];
    next[index] = value;
    setStarters(next);
  }

  function getEmbedCode() {
    const channelId = showChannel?.id;
    if (!channelId) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://app.launchpath.io";
    return `<script src="${origin}/widget.js" data-channel="${channelId}" async></script>`;
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // If we just created a channel, show the success + embed code view
  if (createdChannel) {
    return (
      <Dialog open onOpenChange={() => { onSaved(); onClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Widget Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Your widget is ready. Paste this code on any website to embed the
              chat widget.
            </p>

            <div className="relative">
              <pre className="p-3 rounded-lg bg-muted text-xs font-mono break-all whitespace-pre-wrap border">
                {getEmbedCode()}
              </pre>
              <button
                type="button"
                onClick={copyEmbed}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-background border hover:bg-muted transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>

            <Button onClick={() => { onSaved(); onClose(); }} className="w-full rounded-full gradient-accent-bg text-white border-0 hover:opacity-90">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Widget" : "Add Website Widget"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website Widget"
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-1.5">
            <Label htmlFor="primary-color">Brand Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Agent Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="agent-name">Agent Display Name</Label>
            <Input
              id="agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="AI Assistant"
            />
            <p className="text-xs text-muted-foreground">
              Shown in the widget header. Leave blank to use the agent&apos;s name.
            </p>
          </div>

          {/* Avatar */}
          <div className="space-y-1.5">
            <Label htmlFor="agent-avatar">Avatar URL or Emoji</Label>
            <Input
              id="agent-avatar"
              value={agentAvatar}
              onChange={(e) => setAgentAvatar(e.target.value)}
              placeholder="https://... or an emoji"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-1.5">
            <Label htmlFor="welcome-msg">Welcome Message</Label>
            <Textarea
              id="welcome-msg"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Hi! How can I help you today?"
              rows={2}
            />
          </div>

          {/* Header Text */}
          <div className="space-y-1.5">
            <Label htmlFor="header-text">Header Text</Label>
            <Input
              id="header-text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Ask me anything"
            />
          </div>

          {/* Conversation Starters */}
          <div className="space-y-1.5">
            <Label>Conversation Starters</Label>
            <p className="text-xs text-muted-foreground">
              Clickable prompts shown before the user types (max 4).
            </p>
            <div className="space-y-2">
              {starters.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={s}
                    onChange={(e) => updateStarter(i, e.target.value)}
                    placeholder={`Starter ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeStarter(i)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {starters.length < 4 && (
                <button
                  type="button"
                  onClick={addStarter}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add starter
                </button>
              )}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label>Widget Position</Label>
            <div className="flex gap-2">
              {(["right", "left"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${
                    position === pos
                      ? "border-[#FF8C00]/40 bg-[#FF8C00]/10 text-[#FF8C00] font-medium"
                      : "border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  {pos === "right" ? "Bottom Right" : "Bottom Left"}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Origins */}
          <div className="space-y-1.5">
            <Label htmlFor="origins">Allowed Origins</Label>
            <Textarea
              id="origins"
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
              placeholder={"https://example.com\nhttps://www.example.com"}
              rows={2}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              One per line. Leave empty to allow all origins.
            </p>
          </div>

          {/* Rate Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="rate-limit">Rate Limit (RPM)</Label>
            <Input
              id="rate-limit"
              type="number"
              value={rateLimitRpm}
              onChange={(e) => setRateLimitRpm(e.target.value)}
              placeholder="20 (default)"
              min={1}
              max={1000}
            />
          </div>

          {/* Embed Code (edit mode only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label>Embed Code</Label>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-muted text-xs font-mono break-all whitespace-pre-wrap border">
                  {getEmbedCode()}
                </pre>
                <button
                  type="button"
                  onClick={copyEmbed}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-background border hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-full gradient-accent-bg text-white border-0 hover:opacity-90"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Widget"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
