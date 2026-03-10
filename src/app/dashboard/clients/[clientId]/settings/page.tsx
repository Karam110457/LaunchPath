"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Trash2, Palette, Upload } from "lucide-react";

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
    if (!confirm("Delete this client? Campaigns will be unlinked but not deleted.")) return;
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/dashboard/clients");
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center text-muted-foreground">
        Client not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Client Info */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Client Information</h2>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
            className="px-4 py-2 text-sm font-medium rounded-lg shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saveMsg && (
            <span className="text-xs text-muted-foreground">{saveMsg}</span>
          )}
        </div>
      </div>

      {/* Portal Branding */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
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
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
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
                className="size-10 rounded-lg border cursor-pointer"
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
                  className="size-10 rounded-lg border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground font-mono">{gradientEndColor}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-medium mb-3">Preview</p>
            <div className="flex items-center gap-3">
              {brandingLogoUrl ? (
                <img src={brandingLogoUrl} alt="" className="size-8 rounded-lg object-cover" />
              ) : (
                <div
                  className="size-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
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
            className="px-4 py-2 text-sm font-medium rounded-lg shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0 disabled:opacity-50"
          >
            {savingBranding ? "Saving..." : "Save Branding"}
          </button>
          {brandingMsg && (
            <span className="text-xs text-muted-foreground">{brandingMsg}</span>
          )}
        </div>
      </div>

      {/* Team */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">
          Team Members ({members.length})
        </h2>
        {members.length > 0 && (
          <div className="divide-y">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{m.user_id.slice(0, 8)}...</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-2 pt-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite by email..."
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0 disabled:opacity-50"
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
      <div className="rounded-lg border border-destructive/20 bg-card p-5">
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 className="size-4" />
          Delete Client
        </button>
      </div>
    </div>
  );
}
