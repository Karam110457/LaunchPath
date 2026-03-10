"use client";

import { useState, useEffect, useCallback } from "react";
import { usePortal, usePortalCan } from "@/contexts/PortalContext";
import { Save, UserPlus, Trash2, Mail } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
}

interface ClientInfo {
  name: string;
  email: string | null;
  website: string | null;
}

export default function PortalSettings() {
  const { clientId, role } = usePortal();
  const canEdit = usePortalCan("settings.edit");
  const canInvite = usePortalCan("settings.invite_member");
  const canRemove = usePortalCan("settings.remove_member");

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/portal/settings");
    if (res.ok) {
      const data = await res.json();
      setClient(data.client);
      setMembers(data.members);
      setEditName(data.client.name);
      setEditEmail(data.client.email ?? "");
      setEditWebsite(data.client.website ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    const res = await fetch("/api/portal/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        email: editEmail,
        website: editWebsite,
      }),
    });
    if (res.ok) {
      setSaveMessage("Settings saved");
      setTimeout(() => setSaveMessage(null), 3000);
    }
    setIsSaving(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteMessage(null);

    const res = await fetch("/api/portal/settings/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });

    const data = await res.json();
    if (res.ok) {
      setInviteMessage(data.message);
      setInviteEmail("");
      setShowInvite(false);
      fetchSettings();
    } else {
      setInviteMessage(data.error ?? "Failed to invite");
    }
    setIsInviting(false);
  }

  async function handleRemoveMember(memberId: string) {
    const res = await fetch("/api/portal/settings/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });
    if (res.ok) {
      fetchSettings();
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Business info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Name</label>
            {canEdit ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            ) : (
              <p className="text-sm font-medium">{client?.name ?? "-"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Email</label>
            {canEdit ? (
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            ) : (
              <p className="text-sm font-medium">{client?.email ?? "-"}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs text-muted-foreground font-medium">Website</label>
            {canEdit ? (
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            ) : (
              <p className="text-sm font-medium">{client?.website ?? "-"}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saveMessage && (
              <span className="text-xs text-emerald-600">{saveMessage}</span>
            )}
          </div>
        )}
      </div>

      {/* Team members */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Team Members</h2>
          {canInvite && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="size-3.5" />
              Invite
            </button>
          )}
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="flex items-end gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "viewer")}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-background"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isInviting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isInviting ? "Sending..." : "Send Invite"}
            </button>
          </form>
        )}

        {inviteMessage && (
          <p className="text-xs text-muted-foreground">{inviteMessage}</p>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found.</p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {member.email ?? `${member.user_id.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2.5 py-1 rounded-full capitalize font-medium">
                    {member.role}
                  </span>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
