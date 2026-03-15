"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChannelResponse, WhatsAppConfig } from "@/lib/channels/types";

interface WhatsAppSetupDialogProps {
  agentId: string;
  existing?: ChannelResponse;
  onSaved: () => void;
  onClose: () => void;
}

export function WhatsAppSetupDialog({
  agentId,
  existing,
  onSaved,
  onClose,
}: WhatsAppSetupDialogProps) {
  const isEdit = !!existing;
  const existingConfig = (existing?.config ?? {}) as Partial<WhatsAppConfig>;

  const [name, setName] = useState(existing?.name ?? "WhatsApp");
  const [phoneNumberId, setPhoneNumberId] = useState(
    existingConfig.phoneNumberId ?? ""
  );
  const [businessAccountId, setBusinessAccountId] = useState(
    existingConfig.businessAccountId ?? ""
  );
  const [accessToken, setAccessToken] = useState(
    existingConfig.accessToken ?? ""
  );
  const [verifyToken, setVerifyToken] = useState(
    existingConfig.verifyToken ?? ""
  );
  const [responseDelay, setResponseDelay] = useState(
    existingConfig.responseDelay?.toString() ?? "2000"
  );
  const [readReceipts, setReadReceipts] = useState(
    existingConfig.readReceipts !== false
  );
  const [rateLimitRpm, setRateLimitRpm] = useState(
    existing?.rate_limit_rpm?.toString() ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // After create, store the returned channel to show webhook URL
  const [createdChannel, setCreatedChannel] = useState<ChannelResponse | null>(
    null
  );

  const showChannel = existing ?? createdChannel;

  function getWebhookUrl() {
    const webhookPath = showChannel?.webhook_path;
    if (!webhookPath) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://app.launchpath.dev";
    return `${origin}/api/webhooks/whatsapp/${webhookPath}`;
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(getWebhookUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const config: Record<string, unknown> = {
      phoneNumberId,
      businessAccountId: businessAccountId || undefined,
      accessToken,
      verifyToken,
      responseDelay: responseDelay ? parseInt(responseDelay, 10) : 2000,
      readReceipts,
    };

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
            channel_type: "whatsapp",
            name,
            config,
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

  // Success view — show webhook URL + setup instructions
  if (createdChannel) {
    return (
      <Dialog
        open
        onOpenChange={() => {
          onSaved();
          onClose();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>WhatsApp Channel Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Your WhatsApp channel is ready. Configure the webhook in your Meta
              App Dashboard to start receiving messages.
            </p>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Webhook URL</Label>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-muted text-xs font-mono break-all whitespace-pre-wrap border">
                  {getWebhookUrl()}
                </pre>
                <button
                  type="button"
                  onClick={copyWebhookUrl}
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

            {/* Verify Token */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Verify Token</Label>
              <pre className="p-3 rounded-lg bg-muted text-xs font-mono border">
                {verifyToken}
              </pre>
            </div>

            {/* Setup instructions */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                Setup Instructions
              </p>
              <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal pl-4">
                <li>
                  Go to your{" "}
                  <span className="text-foreground font-medium">
                    Meta App Dashboard
                  </span>{" "}
                  → WhatsApp → Configuration
                </li>
                <li>Paste the Webhook URL above as the Callback URL</li>
                <li>Enter the Verify Token shown above</li>
                <li>
                  Subscribe to the{" "}
                  <span className="font-mono text-foreground">messages</span>{" "}
                  webhook field
                </li>
              </ol>
            </div>

            <Button
              onClick={() => {
                onSaved();
                onClose();
              }}
              className="w-full rounded-full gradient-accent-bg text-white border-0 hover:opacity-90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Form view — create or edit
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit WhatsApp Channel" : "Add WhatsApp Channel"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-channel-name">Channel Name</Label>
            <Input
              id="wa-channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="WhatsApp"
            />
          </div>

          {/* Phone Number ID */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-phone-id">Phone Number ID</Label>
            <Input
              id="wa-phone-id"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              From Meta Business Suite → WhatsApp → Phone Numbers
            </p>
          </div>

          {/* Business Account ID */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-waba-id">Business Account ID</Label>
            <Input
              id="wa-waba-id"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="e.g. 987654321098765"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Your WhatsApp Business Account (WABA) ID
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-access-token">Access Token</Label>
            <Input
              id="wa-access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={isEdit ? "••••••••" : "System user access token"}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Long-lived system user token from Meta Business Suite
            </p>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-verify-token">Verify Token</Label>
            <Input
              id="wa-verify-token"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Choose a secret string"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              A secret you choose — used for webhook verification with Meta
            </p>
          </div>

          <hr className="border-border" />

          {/* Response Delay */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-delay">Response Delay (ms)</Label>
            <Input
              id="wa-delay"
              type="number"
              value={responseDelay}
              onChange={(e) => setResponseDelay(e.target.value)}
              placeholder="2000"
              min={0}
              max={15000}
            />
            <p className="text-[11px] text-muted-foreground">
              Delay before sending a reply to feel more human-like (0 = instant)
            </p>
          </div>

          {/* Read Receipts */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Read Receipts</Label>
              <p className="text-[11px] text-muted-foreground">
                Mark incoming messages as read
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReadReceipts(!readReceipts)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                readReceipts ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm ${
                  readReceipts ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Rate Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-rate-limit">Rate Limit (RPM)</Label>
            <Input
              id="wa-rate-limit"
              type="number"
              value={rateLimitRpm}
              onChange={(e) => setRateLimitRpm(e.target.value)}
              placeholder="20 (default)"
              min={1}
              max={1000}
            />
          </div>

          {/* Webhook URL (edit mode only) */}
          {isEdit && showChannel?.webhook_path && (
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-muted text-xs font-mono break-all whitespace-pre-wrap border">
                  {getWebhookUrl()}
                </pre>
                <button
                  type="button"
                  onClick={copyWebhookUrl}
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
          {error && <p className="text-sm text-destructive">{error}</p>}

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
              disabled={
                saving ||
                !name.trim() ||
                !phoneNumberId.trim() ||
                !accessToken.trim() ||
                !verifyToken.trim()
              }
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Channel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
