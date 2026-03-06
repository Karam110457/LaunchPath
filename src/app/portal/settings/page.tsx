"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PortalSettings() {
  const [client, setClient] = useState<{
    name: string;
    email: string | null;
    website: string | null;
  } | null>(null);
  const [members, setMembers] = useState<
    Array<{ id: string; user_id: string; role: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Get client membership
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("client_members")
        .select("client_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      const [clientRes, membersRes] = await Promise.all([
        supabase
          .from("clients")
          .select("name, email, website")
          .eq("id", membership.client_id)
          .single(),
        supabase
          .from("client_members")
          .select("id, user_id, role, created_at")
          .eq("client_id", membership.client_id),
      ]);

      setClient(clientRes.data);
      setMembers(membersRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

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

      {/* Business info (read-only for now) */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <p className="text-sm font-medium">{client?.name ?? "-"}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm font-medium">{client?.email ?? "-"}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Website</label>
            <p className="text-sm font-medium">{client?.website ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* Team members */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Team Members</h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found.</p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <p className="text-sm font-medium">
                  {member.user_id.slice(0, 8)}...
                </p>
                <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
