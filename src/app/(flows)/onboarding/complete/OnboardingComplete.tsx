"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function OnboardingComplete() {
  const router = useRouter();

  // Auto-redirect to /start after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => router.push("/start"), 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <FlowShell
      currentStep={3}
      totalSteps={3}
      showProgress={false}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-serif italic">Profile saved. Let&apos;s build.</h2>
          <p className="text-sm text-muted-foreground">
            Taking you to your first business...
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push("/start")}
        >
          Start Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </FlowShell>
  );
}
