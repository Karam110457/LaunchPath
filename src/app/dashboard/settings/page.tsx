import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingProfileCard } from "@/components/settings/OnboardingProfileCard";

export default async function SettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <PageShell
      title="Settings"
      description="Manage your account and preferences."
    >
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email ?? ""} disabled />
            </div>
          </CardContent>
        </Card>

        {profile && <OnboardingProfileCard profile={profile} />}

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your plan and billing.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Subscription management coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
