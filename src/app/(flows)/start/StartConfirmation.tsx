"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { createSystem } from "./actions";

export function StartConfirmation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      const result = await createSystem();
      if (result.error) {
        setError(result.error);
      }
      // On success, the server action redirects via redirect()
    });
  };

  return (
    <FlowShell currentStep={1} totalSteps={1} showProgress={false}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-serif italic">Start a new business system</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We&apos;ll guide you through niche selection, offer building, and launch.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Start"}
            {!isPending && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/dashboard")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </FlowShell>
  );
}
