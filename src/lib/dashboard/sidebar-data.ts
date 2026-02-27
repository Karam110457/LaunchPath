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

  const rawSystems = (systems ?? []).map((s) => {
    const offer = s.offer as { segment?: string } | null;
    const rec = s.chosen_recommendation as { niche?: string } | null;

    return {
      id: s.id,
      status: s.status ?? "in_progress",
      name: rec?.niche ?? offer?.segment ?? "",
      currentStep: s.current_step ?? 1,
    };
  });

  // Number unnamed businesses so they're distinguishable
  // Systems are newest-first, so reverse to number oldest as 1
  let unnamedCount = 0;
  const reversed = [...rawSystems].reverse();
  const nameMap = new Map<string, string>();
  for (const s of reversed) {
    if (!s.name) {
      unnamedCount++;
      nameMap.set(s.id, `Business ${unnamedCount}`);
    }
  }

  const sidebarSystems: SidebarSystem[] = rawSystems.map((s) => ({
    ...s,
    name: s.name || nameMap.get(s.id) || "New Business",
  }));

  const displayName = email ? email.split("@")[0] : "User";

  return {
    systems: sidebarSystems,
    user: {
      email: email ?? "",
      displayName,
    } satisfies SidebarUser,
  };
}
