import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingProfileCard } from "@/components/settings/OnboardingProfileCard";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";

export default async function SettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences.</p>
          </div>

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
        </div>
      </div>
    </div>
  );
}
