import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingComplete } from "./OnboardingComplete";

export default async function OnboardingCompletePage() {
  const user = await requireAuth();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return <OnboardingComplete profile={profile} />;
}
