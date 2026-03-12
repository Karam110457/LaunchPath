"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentGeneration } from "@/hooks/useAgentGeneration";
import { AGENT_TEMPLATES, getTemplateById } from "@/lib/agents/templates";
import { AgentGenerating } from "./AgentGenerating";
import { AgentWizard, hasWizardDraft, clearWizardDraft } from "./wizard/AgentWizard";
import { getWizardSteps } from "@/types/agent-wizard";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  SquarePen,
  Loader2,
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Target,
  PlayCircle,
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
  Target,
};

export function AgentCreationLanding() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [wizardTemplateId, setWizardTemplateId] = useState<string | null>(null);
  const [draftInfo, setDraftInfo] = useState<{
    exists: boolean;
    templateId?: string;
    stepIndex?: number;
    agentName?: string;
  }>({ exists: false });

  const { isLoading, currentLabel, agent, error, startGeneration } =
    useAgentGeneration();

  // Check for existing wizard draft on mount
  useEffect(() => {
    setDraftInfo(hasWizardDraft());
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [prompt]);

  // Redirect on generation complete
  useEffect(() => {
    if (agent?.id) {
      router.push(`/dashboard/agents/${agent.id}`);
    }
  }, [agent, router]);

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

  function handleGenerate() {
    if (!canGenerate) return;
    startGeneration({ prompt });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  function handleResumeDraft() {
    // Set a sentinel value so the wizard mounts and picks up the draft from localStorage
    setWizardTemplateId("__resume__");
  }

  function handleDiscardDraft() {
    clearWizardDraft();
    setDraftInfo({ exists: false });
  }

  const canGenerate = !isLoading && prompt.trim().length > 0;

  // Show generating state (from chat prompt, not wizard — wizard handles its own)
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AgentGenerating currentLabel={currentLabel} error={error} />
      </div>
    );
  }

  // Show guided wizard when a template was selected or resuming draft
  if (wizardTemplateId) {
    return (
      <AgentWizard
        initialTemplateId={wizardTemplateId === "__resume__" ? undefined : wizardTemplateId}
        onBack={() => {
          setWizardTemplateId(null);
          setDraftInfo(hasWizardDraft());
        }}
      />
    );
  }

  // Build draft resume banner info
  const draftTemplate = draftInfo.templateId
    ? getTemplateById(draftInfo.templateId)
    : null;
  const draftTotalSteps = draftInfo.templateId
    ? getWizardSteps(draftInfo.templateId).length
    : 0;
  const draftStepLabel =
    draftInfo.stepIndex != null && draftTotalSteps > 0
      ? `Step ${draftInfo.stepIndex + 1} of ${draftTotalSteps}`
      : null;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Draft resume banner */}
      {draftInfo.exists && (
        <div className="w-full max-w-2xl mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/[0.03] p-5">
            {/* Dismiss button */}
            <button
              onClick={handleDiscardDraft}
              className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Discard draft"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#FF8C00]/10 to-[#9D50BB]/10 flex items-center justify-center shrink-0">
                {draftTemplate ? (
                  (() => {
                    const Icon = ICON_MAP[draftTemplate.icon] ?? Sparkles;
                    return <Icon className="h-5 w-5 text-[#FF8C00]" />;
                  })()
                ) : (
                  <Sparkles className="h-5 w-5 text-[#FF8C00]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {draftInfo.agentName || draftTemplate?.name || "Agent"} in progress
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {draftStepLabel && (
                    <span>{draftStepLabel}</span>
                  )}
                  {draftStepLabel && draftTemplate && (
                    <span className="mx-1.5 text-border">·</span>
                  )}
                  {draftTemplate && (
                    <span>{draftTemplate.name} template</span>
                  )}
                  {!draftStepLabel && !draftTemplate && (
                    <span>You have unsaved progress</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDiscardDraft}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleResumeDraft}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-4 py-2 rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] shadow-sm hover:scale-[1.02] transition-transform"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Resume
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {draftInfo.stepIndex != null && draftTotalSteps > 0 && (
              <div className="mt-4 h-1 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((draftInfo.stepIndex + 1) / draftTotalSteps) * 100}%`,
                    background: "linear-gradient(90deg, #FF8C00, #9D50BB)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero text */}
      <div className="relative text-center mb-10 mt-8">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground/80">
          <span className="italic font-light bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] bg-clip-text text-transparent pr-1">Describe</span>{" "}
          your agent
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Tell us what you need and we&apos;ll build it. Add details
          and watch your agent come to life.
        </p>
      </div>

      {/* Chat input */}
      <div className="relative w-full max-w-2xl">
        <div className="relative rounded-2xl border border-border/60 bg-background shadow-lg shadow-black/[0.03] transition-shadow focus-within:shadow-xl focus-within:shadow-black/[0.06] focus-within:border-border">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the agent you want to build..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm placeholder:text-muted-foreground/60 focus:outline-none min-h-[56px] max-h-[200px]"
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
            <div />

            {/* Submit button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                canGenerate
                  ? "bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] text-white hover:scale-105 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Template chips — always visible below input */}
      <div className="w-full max-w-2xl mt-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {AGENT_TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.icon] ?? Sparkles;
            return (
              <button
                key={template.id}
                onClick={() => setWizardTemplateId(template.id)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/50 bg-background/60 text-muted-foreground text-sm transition-all hover:border-[#FF8C00]/30 hover:text-foreground hover:bg-muted/30"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {template.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start from scratch */}
      <button
        onClick={handleBlankCreate}
        disabled={creatingBlank}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-50"
      >
        {creatingBlank ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <SquarePen className="h-3 w-3" />
        )}
        or start from scratch
      </button>
    </div>
  );
}
