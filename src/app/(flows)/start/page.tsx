import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StartPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Resume an existing in-progress system if one exists
  const { data: existingSystem } = await supabase
    .from("user_systems")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingSystem) {
    redirect(`/start/${existingSystem.id}`);
  }

  // Create a new system
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
