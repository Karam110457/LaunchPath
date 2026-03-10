import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PreviewSettings({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  // Settings page is a client component that fetches its own data via /api/portal/settings
  // In preview mode, those APIs use requireClientAuth which won't work for agency users.
  // Show a read-only preview instead.
  const { data: clientInfo } = await supabase
    .from("clients")
    .select("name, email, website")
    .eq("id", clientId)
    .single();

  const { data: members } = await supabase
    .from("client_members")
    .select("id, user_id, role, created_at")
    .eq("client_id", clientId);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Name</label>
            <p className="text-sm font-medium">{clientInfo?.name ?? "-"}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Email</label>
            <p className="text-sm font-medium">{clientInfo?.email ?? "-"}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs text-muted-foreground font-medium">Website</label>
            <p className="text-sm font-medium">{clientInfo?.website ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Team Members</h2>
        {!members || members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found.</p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{member.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-muted px-2.5 py-1 rounded-full capitalize font-medium">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        This is a preview. Clients can edit their settings and manage members from their portal.
      </p>
    </div>
  );
}
