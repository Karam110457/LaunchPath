"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Zap, SquarePen, ArrowLeft, Loader2 } from "lucide-react";
import { NewAgentForm } from "./NewAgentForm";
import { AgentWizard } from "./wizard/AgentWizard";

interface AgentCreationLandingProps {
  businesses: Array<{ id: string; name: string }>;
}

type CreationMode = "landing" | "quick-prompt" | "wizard";

export function AgentCreationLanding({
  businesses,
}: AgentCreationLandingProps) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("landing");
  const [creatingBlank, setCreatingBlank] = useState(false);

  async function handleBlankCreate() {
    setCreatingBlank(true);
    try {
      const res = await fetch("/api/agents/create-blank", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create agent");
      const { agentId } = await res.json();
      router.push(`/dashboard/agents/${agentId}`);
    } catch (err) {
      console.error("Blank create failed:", err);
      setCreatingBlank(false);
    }
  }

  if (mode === "quick-prompt") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode("landing")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <NewAgentForm businesses={businesses} />
      </div>
    );
  }

  if (mode === "wizard") {
    return (
      <AgentWizard
        onBack={() => setMode("landing")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-sm font-medium mb-1">
          Choose how you want to create your agent
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick the approach that works best for you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Guided Setup */}
        <button
          type="button"
          onClick={() => setMode("wizard")}
          className="text-left"
        >
          <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Guided Setup</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Step-by-step wizard that walks you through every detail.
                  Best for first-time users.
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Quick Prompt */}
        <button
          type="button"
          onClick={() => setMode("quick-prompt")}
          className="text-left"
        >
          <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Quick Prompt</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Describe what you want in a few sentences and let AI build
                  it for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Start from Scratch */}
        <button
          type="button"
          onClick={handleBlankCreate}
          disabled={creatingBlank}
          className="text-left disabled:opacity-60"
        >
          <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                {creatingBlank ? (
                  <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                ) : (
                  <SquarePen className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">Start from Scratch</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a blank agent and configure everything yourself.
                  Best for experienced users.
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

      </div>
    </div>
  );
}
