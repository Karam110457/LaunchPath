"use server";

import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createSystem() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch profile to copy location into the new system
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("location_city")
    .eq("id", user.id)
    .single();

  const { data: newSystem, error } = await supabase
    .from("user_systems")
    .insert({ user_id: user.id, location_city: profile?.location_city ?? null })
    .select("id")
    .single();

  if (error || !newSystem) {
    return { error: "Failed to create system. Please try again." };
  }

  redirect(`/start/${newSystem.id}`);
}
