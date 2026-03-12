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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
  Target,
};

interface AgentCreationLandingProps {
  initialWizardConfig?: import("@/types/agent-wizard").WizardGenerationPayload | null;
}

export function AgentCreationLanding({ initialWizardConfig }: AgentCreationLandingProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [wizardTemplateId, setWizardTemplateId] = useState<string | null>(
    initialWizardConfig ? initialWizardConfig.templateId : null,
  );
  const [draftInfo, setDraftInfo] = useState<{
    exists: boolean;
    templateId?: string;
    stepIndex?: number;
    agentName?: string;
  }>({ exists: false });
  const [draftDismissed, setDraftDismissed] = useState(false);

  const { isLoading, currentLabel, agent, error, startGeneration, cancel, reset } =
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
    setWizardTemplateId("__resume__");
  }

  function handleDiscardDraft() {
    setDraftDismissed(true);
    // Let the exit animation play, then actually remove
    setTimeout(() => {
      clearWizardDraft();
      setDraftInfo({ exists: false });
      setDraftDismissed(false);
    }, 250);
  }

  const canGenerate = !isLoading && prompt.trim().length > 0;

  // Show generating state (from chat prompt, not wizard — wizard handles its own)
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AgentGenerating
          currentLabel={currentLabel}
          error={error}
          onCancel={cancel}
          onRetry={() => {/* prompt-based retry not supported yet */}}
          onBack={reset}
        />
      </div>
    );
  }

  // Show guided wizard when a template was selected or resuming draft
  if (wizardTemplateId) {
    return (
      <div className="animate-in fade-in duration-300">
        <AgentWizard
          initialTemplateId={wizardTemplateId === "__resume__" ? undefined : wizardTemplateId}
          initialWizardConfig={initialWizardConfig ?? undefined}
          onBack={() => {
            setWizardTemplateId(null);
            setDraftInfo(hasWizardDraft());
          }}
        />
      </div>
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

  const showDraft = draftInfo.exists && !draftDismissed;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Shared SVG gradient for icons */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="wizard-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#9D50BB" />
          </linearGradient>
        </defs>
      </svg>

      {/* Draft resume banner (#6, #7) */}
      {draftInfo.exists && (
        <div
          className={cn(
            "w-full max-w-2xl mb-8 transition-all duration-250 ease-out",
            showDraft
              ? "animate-in fade-in slide-in-from-top-2 duration-300 opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
          )}
        >
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
                    return <Icon className="h-5 w-5" style={{ stroke: "url(#wizard-icon-gradient)" }} />;
                  })()
                ) : (
                  <Sparkles className="h-5 w-5" style={{ stroke: "url(#wizard-icon-gradient)" }} />
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
                    <span className="mx-1.5 text-border">&middot;</span>
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-4 py-2 rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Resume
                </button>
              </div>
            </div>

            {/* Progress bar — animates from 0 on mount */}
            {draftInfo.stepIndex != null && draftTotalSteps > 0 && (
              <DraftProgressBar
                progress={((draftInfo.stepIndex + 1) / draftTotalSteps) * 100}
              />
            )}
          </div>
        </div>
      )}

      {/* Staggered entrance for hero + input + chips + scratch (#1-4) */}
      <div className="stagger-enter contents-wrapper flex flex-col items-center w-full">
        {/* Hero text (#1) */}
        <div className="relative text-center mb-10 mt-8" style={{ "--stagger": 0 } as React.CSSProperties}>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground/80">
            <span className="italic font-light bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] bg-clip-text text-transparent pr-1">Describe</span>{" "}
            your agent
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Tell us what you need and we&apos;ll build it. Add details
            and watch your agent come to life.
          </p>
        </div>

        {/* Chat input (#2) */}
        <div className="relative w-full max-w-2xl" style={{ "--stagger": 1 } as React.CSSProperties}>
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
                  "h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200",
                  canGenerate
                    ? "bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] text-white hover:scale-105 active:scale-95 shadow-md"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Template chips (#3, #5) */}
        <div className="w-full max-w-2xl mt-5" style={{ "--stagger": 2 } as React.CSSProperties}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {AGENT_TEMPLATES.map((template, i) => {
              const Icon = ICON_MAP[template.icon] ?? Sparkles;
              return (
                <button
                  key={template.id}
                  onClick={() => setWizardTemplateId(template.id)}
                  style={{ "--stagger": 2 + i } as React.CSSProperties}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/50 bg-background/60 text-muted-foreground text-sm transition-all duration-200 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-foreground hover:bg-muted/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-95"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {template.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start from scratch (#4) */}
        <button
          onClick={handleBlankCreate}
          disabled={creatingBlank}
          style={{ "--stagger": 5 } as React.CSSProperties}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200 disabled:opacity-50"
        >
          {creatingBlank ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <SquarePen className="h-3 w-3" />
          )}
          or start from scratch
        </button>
      </div>
    </div>
  );
}

/** Progress bar that animates from 0% to target on mount (#6) */
function DraftProgressBar({ progress }: { progress: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Trigger after mount so the transition plays
    const raf = requestAnimationFrame(() => setWidth(progress));
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div className="mt-4 h-1 bg-muted/50 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, #FF8C00, #9D50BB)",
        }}
      />
    </div>
  );
}
