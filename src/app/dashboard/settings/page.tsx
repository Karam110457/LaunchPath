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
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account and preferences.</p>
          </div>
          
          <div className="w-full h-px bg-border/40" />

          <div className="grid gap-6 max-w-4xl stagger-enter">
            <Card style={{ '--stagger': 0 } as React.CSSProperties} className="rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] shadow-none">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xl font-semibold">Profile</CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">Your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Email</Label>
              <Input id="email" value={user.email ?? ""} disabled className="bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] rounded-xl h-12" />
            </div>
          </CardContent>
        </Card>

        {profile && <OnboardingProfileCard profile={profile} />}

        <Card style={{ '--stagger': 2 } as React.CSSProperties} className="rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] shadow-none">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xl font-semibold">Subscription</CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">Manage your plan and billing.</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
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
