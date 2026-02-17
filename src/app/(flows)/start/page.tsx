import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StartPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Always create a new system — users can have multiple concurrent systems
  const { data: newSystem, error } = await supabase
    .from("user_systems")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !newSystem) {
    redirect("/dashboard?error=system_creation_failed");
  }

  redirect(`/start/${newSystem.id}`);
}
