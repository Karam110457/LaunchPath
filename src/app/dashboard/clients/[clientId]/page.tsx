"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  ai_agents: { name: string; personality: Record<string, unknown> | null } | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}`);
    if (!res.ok) return;
    const data = await res.json();
    setClient(data.client);
    setCampaigns(data.campaigns);
    setMembers(data.members);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

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
        load(); // Refresh members
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
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{client.name}</h1>
          {client.website && (
            <p className="text-sm text-muted-foreground">{client.website}</p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            client.status === "active"
              ? "bg-emerald-500/10 text-emerald-600"
              : client.status === "paused"
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {client.status}
        </span>
      </div>

      {/* Overview */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Overview</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            {client.email ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            {new Date(client.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Campaigns */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">
          Campaigns ({campaigns.length})
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaigns linked. Link a campaign from the campaign builder.
          </p>
        ) : (
          <div className="divide-y">
            {campaigns.map((c) => {
              const emoji = (c.ai_agents?.personality as Record<string, unknown>)?.emoji as string | undefined;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/campaigns/${c.id}`}
                  className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {emoji && <span>{emoji}</span>}
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.ai_agents?.name && (
                      <span className="text-xs text-muted-foreground">
                        ({c.ai_agents.name})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
