import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { StartBusinessFlow } from "./StartBusinessFlow";

interface Props {
  params: Promise<{ systemId: string }>;
}

export default async function StartBusinessPage({ params }: Props) {
  const user = await requireAuth();
  const { systemId } = await params;

  const supabase = await createClient();

  const { data: system } = await supabase
    .from("user_systems")
    .select("*")
    .eq("id", systemId)
    .single();

  if (!system) notFound();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return <StartBusinessFlow system={system} profile={profile} />;
}
