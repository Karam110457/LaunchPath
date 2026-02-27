import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ChatFlow } from "@/components/chat/ChatFlow";

interface Props {
  params: Promise<{ systemId: string }>;
}

export default async function SystemChatPage({ params }: Props) {
  const user = await requireAuth();
  const { systemId } = await params;
  const supabase = await createClient();

  const { data: system } = await supabase
    .from("user_systems")
    .select("*")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (!system) notFound();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <ChatFlow system={system} profile={profile} />
    </div>
  );
}
