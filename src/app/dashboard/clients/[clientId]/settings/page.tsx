"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Trash2, Palette, Upload, Users, Coins } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Branding {
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150";

export default function ClientSettingsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("active");

  // Credit cap
  const [capEnabled, setCapEnabled] = useState(false);
  const [capMonthly, setCapMonthly] = useState("");
  const [capUsed, setCapUsed] = useState(0);
  const [savingCap, setSavingCap] = useState(false);
  const [capMsg, setCapMsg] = useState<string | null>(null);

  // Branding
  const [brandingLogoUrl, setBrandingLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#FF8C00");
  const [useGradient, setUseGradient] = useState(true);
  const [gradientEndColor, setGradientEndColor] = useState("#9D50BB");
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState<string | null>(null);

  // Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}`);
    if (!res.ok) return;
    const data = await res.json();
    setClient(data.client);
    setMembers(data.members);
    setName(data.client.name);
    setEmail(data.client.email ?? "");
    setWebsite(data.client.website ?? "");
    setStatus(data.client.status);
    if (data.client.credit_cap_monthly != null) {
      setCapEnabled(true);
      setCapMonthly(String(data.client.credit_cap_monthly));
    } else {
      setCapEnabled(false);
      setCapMonthly("");
    }
    setCapUsed(Number(data.client.credit_cap_used ?? 0));
    if (data.branding) {
      setBrandingLogoUrl(data.branding.logo_url ?? "");
      setAccentColor(data.branding.primary_color ?? "#FF8C00");
      if (data.branding.accent_color) {
        setUseGradient(true);
        setGradientEndColor(data.branding.accent_color);
      } else {
        setUseGradient(false);
      }
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim() || null,
        website: website.trim() || null,
        status,
      }),
    });
    if (res.ok) {
      setSaveMsg("Saved");
      router.refresh();
    } else {
      setSaveMsg("Failed to save");
    }
    setSaving(false);
  }

  async function handleSaveBranding() {
    setSavingBranding(true);
    setBrandingMsg(null);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branding: {
          primary_color: accentColor,
          accent_color: useGradient ? gradientEndColor : null,
          logo_url: brandingLogoUrl.trim() || null,
        },
      }),
    });
    setBrandingMsg(res.ok ? "Branding saved" : "Failed to save branding");
    setSavingBranding(false);
  }

  const accentBg = useGradient
    ? `linear-gradient(135deg, ${accentColor}, ${gradientEndColor})`
    : accentColor;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg(data.message);
        setInviteEmail("");
        load();
      } else {
        setInviteMsg(data.error ?? "Failed to invite");
      }
    } catch {
      setInviteMsg("Network error");
    } finally {
      setInviting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this client? All campaigns, channels, and conversations will be permanently deleted.")) return;
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/dashboard/clients");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="h-52 bg-muted rounded-[32px]" />
          <div className="h-52 bg-muted rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto text-center text-muted-foreground py-20">
        Client not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Client Info */}
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 space-y-5">
        <h2 className="text-sm font-semibold">Client Information</h2>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2.5 text-sm font-medium rounded-full shadow-sm gradient-accent-bg text-white hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saveMsg && (
            <span className="text-xs text-muted-foreground">{saveMsg}</span>
          )}
        </div>
      </div>

      {/* Credit Cap */}
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Monthly Credit Cap</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Set a monthly credit limit for this client. When the cap is reached, AI responses will be blocked until the next billing cycle.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCapEnabled(!capEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              capEnabled ? "bg-foreground" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block size-3.5 transform rounded-full bg-background transition-transform duration-200 ${
                capEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
          <div>
            <label className="text-sm font-medium">
              {capEnabled ? "Cap enabled" : "Unlimited (no cap)"}
            </label>
          </div>
        </div>

        {capEnabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monthly Limit (credits)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={capMonthly}
                onChange={(e) => setCapMonthly(e.target.value)}
                placeholder="e.g. 500"
                className={INPUT_CLASS}
              />
            </div>

            {/* Progress bar */}
            {capMonthly && Number(capMonthly) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Used this month
                  </span>
                  <span className="font-medium tabular-nums">
                    {capUsed.toFixed(2)} / {Number(capMonthly).toFixed(2)} credits
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capUsed / Number(capMonthly) >= 0.95
                        ? "bg-red-500"
                        : capUsed / Number(capMonthly) >= 0.8
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-[#FF8C00] to-[#9D50BB]"
                    }`}
                    style={{
                      width: `${Math.min(100, (capUsed / Number(capMonthly)) * 100)}%`,
                    }}
                  />
                </div>
                {capUsed / Number(capMonthly) >= 0.8 && (
                  <p className={`text-xs font-medium ${
                    capUsed / Number(capMonthly) >= 0.95
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}>
                    {capUsed / Number(capMonthly) >= 0.95
                      ? "Credit cap nearly exhausted"
                      : "Approaching credit cap limit"}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setSavingCap(true);
              setCapMsg(null);
              const value = capEnabled && capMonthly ? Number(capMonthly) : null;
              const res = await fetch(`/api/clients/${clientId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credit_cap_monthly: value }),
              });
              setCapMsg(res.ok ? "Cap saved" : "Failed to save");
              setSavingCap(false);
            }}
            disabled={savingCap}
            className="px-5 py-2.5 text-sm font-medium rounded-full shadow-sm gradient-accent-bg text-white hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50"
          >
            {savingCap ? "Saving..." : "Save Cap"}
          </button>
          {capMsg && (
            <span className="text-xs text-muted-foreground">{capMsg}</span>
          )}
        </div>
      </div>

      {/* Portal Branding */}
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Portal Branding</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Customize the accent color and logo for this client&apos;s portal. The base theme (light/dark) is handled automatically.
        </p>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Logo URL</label>
            <div className="flex items-center gap-3">
              {brandingLogoUrl ? (
                <img
                  src={brandingLogoUrl}
                  alt="Logo preview"
                  className="size-10 rounded-xl object-cover border border-black/5 dark:border-[#333333] shadow-sm"
                />
              ) : (
                <div className="size-10 rounded-xl bg-gradient-to-br from-[#FF8C00]/15 to-[#9D50BB]/10 border border-black/5 dark:border-[#333333] flex items-center justify-center shadow-sm">
                  <Upload className="size-4 text-muted-foreground" />
                </div>
              )}
              <input
                type="url"
                value={brandingLogoUrl}
                onChange={(e) => setBrandingLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className={`flex-1 ${INPUT_CLASS.replace("w-full ", "")}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Accent Color</label>
            <p className="text-xs text-muted-foreground">
              Used for buttons, active states, and highlights across the portal.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="size-10 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] cursor-pointer shadow-sm"
              />
              <span className="text-sm text-muted-foreground font-mono">{accentColor}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUseGradient(!useGradient)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                  useGradient ? "bg-foreground" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-background transition-transform duration-200 ${
                    useGradient ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
              <div>
                <label className="text-sm font-medium">Gradient Mode</label>
                <p className="text-xs text-muted-foreground">
                  Blend accent into a second color for buttons and highlights.
                </p>
              </div>
            </div>
            {useGradient && (
              <div className="flex items-center gap-3 pl-12 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="color"
                  value={gradientEndColor}
                  onChange={(e) => setGradientEndColor(e.target.value)}
                  className="size-10 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] cursor-pointer shadow-sm"
                />
                <span className="text-sm text-muted-foreground font-mono">{gradientEndColor}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-white/50 dark:bg-[#151515]/50 p-4">
            <p className="text-xs font-medium mb-3">Preview</p>
            <div className="flex items-center gap-3">
              {brandingLogoUrl ? (
                <img src={brandingLogoUrl} alt="" className="size-8 rounded-xl object-cover" />
              ) : (
                <div
                  className="size-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: accentBg }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="h-8 px-4 rounded-full text-white text-xs font-medium flex items-center"
                style={{ background: accentBg }}
              >
                New Campaign
              </div>
              <div
                className="h-8 px-4 rounded-full text-xs font-medium flex items-center"
                style={{
                  background: useGradient
                    ? `linear-gradient(135deg, ${accentColor}15, ${gradientEndColor}10)`
                    : `${accentColor}15`,
                  color: accentColor,
                }}
              >
                Active
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveBranding}
            disabled={savingBranding}
            className="px-5 py-2.5 text-sm font-medium rounded-full shadow-sm gradient-accent-bg text-white hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50"
          >
            {savingBranding ? "Saving..." : "Save Branding"}
          </button>
          {brandingMsg && (
            <span className="text-xs text-muted-foreground">{brandingMsg}</span>
          )}
        </div>
      </div>

      {/* Team */}
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            Team Members ({members.length})
          </h2>
        </div>
        {members.length > 0 && (
          <div className="divide-y divide-border/30">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm">{m.user_id.slice(0, 8)}...</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium capitalize">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-2 pt-1">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite by email..."
            className={`flex-1 ${INPUT_CLASS.replace("w-full ", "")}`}
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-full shadow-sm gradient-accent-bg text-white hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {inviting ? "..." : "Invite"}
          </button>
        </form>
        {inviteMsg && (
          <p className="text-xs text-muted-foreground">{inviteMsg}</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-[32px] border border-destructive/20 bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6">
        <h2 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Deleting this client will permanently remove all campaigns, channels, and conversations.
        </p>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors duration-150"
        >
          <Trash2 className="size-4" />
          Delete Client
        </button>
      </div>
    </div>
  );
}
