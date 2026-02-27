"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { useAgentGeneration } from "@/hooks/useAgentGeneration";
import { AgentGenerating } from "./AgentGenerating";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
};

interface NewAgentFormProps {
  businesses: Array<{ id: string; name: string }>;
}

export function NewAgentForm({ businesses }: NewAgentFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const { isLoading, currentLabel, agent, error, startGeneration } =
    useAgentGeneration();

  // Redirect on generation complete
  useEffect(() => {
    if (agent?.id) {
      router.push(`/dashboard/agents/${agent.id}`);
    }
  }, [agent, router]);

  // Show generating state
  if (isLoading || error) {
    return <AgentGenerating currentLabel={currentLabel} error={error} />;
  }

  function handleGenerate() {
    const template = AGENT_TEMPLATES.find((t) => t.id === selectedTemplate);
    startGeneration({
      prompt: prompt || template?.default_system_prompt_hint || "",
      templateId: selectedTemplate ?? undefined,
      systemId: selectedBusiness ?? undefined,
    });
  }

  const canGenerate = prompt.trim().length > 0 || selectedTemplate != null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Template Selection */}
      <div>
        <h2 className="text-sm font-medium mb-3">Start from a template</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.icon] ?? Sparkles;
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                onClick={() =>
                  setSelectedTemplate(isSelected ? null : template.id)
                }
                className="text-left"
              >
                <Card
                  className={cn(
                    "transition-all cursor-pointer h-full",
                    isSelected
                      ? "border-primary ring-1 ring-primary/20"
                      : "hover:border-primary/30",
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          {template.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          or describe your agent
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Free-text Prompt */}
      <div>
        <Textarea
          placeholder="Describe the agent you want to build... e.g., 'An agent that qualifies roofing leads, asks about roof size and timeline, and books appointments.'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      {/* Optional: Link to Business */}
      {businesses.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Link to a business{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <select
            value={selectedBusiness ?? ""}
            onChange={(e) => setSelectedBusiness(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Standalone agent</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          size="lg"
        >
          Build Agent
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
