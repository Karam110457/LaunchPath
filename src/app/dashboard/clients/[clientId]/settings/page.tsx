"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Trash2 } from "lucide-react";

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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
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
