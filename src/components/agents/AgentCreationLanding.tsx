"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentGeneration } from "@/hooks/useAgentGeneration";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { AgentGenerating } from "./AgentGenerating";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Paperclip,
  Settings2,
  SquarePen,
  Loader2,
  Calendar,
  Headphones,
  LifeBuoy,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Target,
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

interface AgentCreationLandingProps {
  businesses: Array<{ id: string; name: string }>;
}

export function AgentCreationLanding({
  businesses,
}: AgentCreationLandingProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { isLoading, currentLabel, agent, error, startGeneration } =
    useAgentGeneration();

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
    const template = AGENT_TEMPLATES.find((t) => t.id === selectedTemplate);
    startGeneration({
      prompt: prompt || template?.default_system_prompt_hint || "",
      templateId: selectedTemplate ?? undefined,
      systemId: selectedBusiness ?? undefined,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  function handleTemplateSelect(templateId: string) {
    const isAlreadySelected = selectedTemplate === templateId;
    setSelectedTemplate(isAlreadySelected ? null : templateId);
    if (!isAlreadySelected) {
      const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
      if (template && !prompt) {
        setPrompt(template.default_system_prompt_hint);
      }
    }
    setShowTemplates(false);
    textareaRef.current?.focus();
  }

  const canGenerate =
    !isLoading && (prompt.trim().length > 0 || selectedTemplate != null);

  // Show generating state
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AgentGenerating currentLabel={currentLabel} error={error} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FF8C00]/[0.03] to-[#9D50BB]/[0.03] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#9D50BB]/[0.02] to-transparent blur-3xl" />
      </div>

      {/* Top-right actions */}
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50"
        >
          Templates
        </button>
        <button
          onClick={handleBlankCreate}
          disabled={creatingBlank}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50 disabled:opacity-50"
        >
          {creatingBlank ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <SquarePen className="h-3 w-3" />
          )}
          Start from scratch
        </button>
      </div>

      {/* Hero text */}
      <div className="relative text-center mb-10 mt-8">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground/80">
          <span className="italic font-light text-foreground/50">Describe</span>{" "}
          your agent
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Tell us what you need and we&apos;ll build it. Add files, give details,
          and watch your agent come to life.
        </p>
      </div>

      {/* Template chips (expandable) */}
      {showTemplates && (
        <div className="relative w-full max-w-2xl mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid gap-2 sm:grid-cols-3">
            {AGENT_TEMPLATES.map((template) => {
              const Icon = ICON_MAP[template.icon] ?? Sparkles;
              const isSelected = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-[#FF8C00]/50 bg-[#FF8C00]/5 shadow-sm"
                      : "border-border/50 bg-background/60 hover:border-[#FF8C00]/30 hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-[#FF8C00]/10"
                        : "bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isSelected
                          ? "text-[#FF8C00]"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {template.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected template badge */}
      {selectedTemplate && !showTemplates && (
        <div className="mb-4 animate-in fade-in duration-150">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20">
            {AGENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
            <button
              onClick={() => setSelectedTemplate(null)}
              className="hover:bg-[#FF8C00]/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

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
            <div className="flex items-center gap-1">
              {/* Settings button (business link) */}
              {businesses.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showSettings || selectedBusiness
                        ? "text-[#FF8C00] bg-[#FF8C00]/10"
                        : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
                    )}
                    title="Link to a business"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>

                  {/* Business dropdown */}
                  {showSettings && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border bg-popover p-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 z-10">
                      <p className="text-xs font-medium text-muted-foreground px-2 pb-1.5">
                        Link to business
                      </p>
                      <button
                        onClick={() => {
                          setSelectedBusiness(null);
                          setShowSettings(false);
                        }}
                        className={cn(
                          "w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                          !selectedBusiness
                            ? "bg-muted font-medium"
                            : "hover:bg-muted/50"
                        )}
                      >
                        Standalone agent
                      </button>
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBusiness(b.id);
                            setShowSettings(false);
                          }}
                          className={cn(
                            "w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                            selectedBusiness === b.id
                              ? "bg-muted font-medium"
                              : "hover:bg-muted/50"
                          )}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments placeholder */}
              <button
                className="p-2 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                title="Attach files (coming soon)"
                disabled
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>

            {/* Submit button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                canGenerate
                  ? "bg-foreground text-background hover:scale-105 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtext */}
      <p className="mt-6 text-xs text-muted-foreground/50 text-center max-w-md">
        Describe what your agent should do, who it&apos;s for, and how it should behave.
        Press Enter to generate.
      </p>
    </div>
  );
}
