import { createClient } from "@/lib/supabase/server";

export interface SidebarSystem {
  id: string;
  status: string;
  name: string;
  currentStep: number;
}

export interface SidebarUser {
  email: string;
  displayName: string;
}

export async function getSidebarData(userId: string, email?: string) {
  const supabase = await createClient();

  const { data: systems } = await supabase
    .from("user_systems")
    .select("id, status, current_step, offer, chosen_recommendation")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const sidebarSystems: SidebarSystem[] = (systems ?? []).map((s) => {
    const offer = s.offer as { segment?: string } | null;
    const rec = s.chosen_recommendation as { niche?: string } | null;

    return {
      id: s.id,
      status: s.status ?? "in_progress",
      name:
        rec?.niche ??
        offer?.segment ??
        "New Business",
      currentStep: s.current_step ?? 1,
    };
  });

  const displayName = email ? email.split("@")[0] : "User";

  return {
    systems: sidebarSystems,
    user: {
      email: email ?? "",
      displayName,
    } satisfies SidebarUser,
  };
}
