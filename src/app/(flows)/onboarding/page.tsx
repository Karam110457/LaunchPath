import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./OnboardingFlow";

export default async function OnboardingPage() {
  const user = await requireAuth();

  if (user.user_metadata?.onboarding_completed) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <OnboardingFlow existingProfile={profile} />;
}
