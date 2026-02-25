"use client";

/**
 * Scope components injected into the agent's JSX code at runtime.
 * The agent can use these as `<InteractiveDemo />`, `<ScrollReveal>`, etc.
 * without importing them — they're provided via the renderer's scope object.
 */

import React, { useState } from "react";
import type { DemoConfig, DemoResult, PostResultCta } from "@/lib/ai/schemas";
import { useDemoSubmission } from "@/hooks/useDemoSubmission";
import { DemoForm } from "@/components/demo/DemoForm";
import { DemoResults } from "@/components/demo/DemoResults";
import { AnalysisProgress } from "@/components/demo/AnalysisProgress";
import { DemoFooter } from "@/components/demo/DemoFooter";
import { ScrollReveal } from "@/components/demo/ScrollReveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Shield,
  Zap,
  Target,
  BarChart3,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Star,
  Heart,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Building2,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/**
 * Context needed to build the full scope for the JSX renderer.
 */
export interface ScopeContext {
  systemId: string;
  demoConfig: DemoConfig;
  isPreview?: boolean;
}

/**
 * Build the full scope object for the JSX renderer.
 * Every key here becomes a variable available in the agent's code.
 */
export function buildFullScope(ctx: ScopeContext): Record<string, unknown> {
  // Build InteractiveDemo with context baked in
  function InteractiveDemo() {
    return (
      <InteractiveDemoInner
        systemId={ctx.systemId}
        demoConfig={ctx.demoConfig}
        isPreview={ctx.isPreview ?? false}
      />
    );
  }

  return {
    // Core interactive component — required in every page
    InteractiveDemo,

    // Layout / animation components
    ScrollReveal,
    DemoFooter,

    // UI primitives
    Button,

    // Utility
    cn,

    // Icon library — agent uses as Icons.Sparkles, Icons.Shield, etc.
    Icons: ICON_MAP,
  };
}

// ─── InteractiveDemo (internal) ────────────────────────────────────────

interface InteractiveDemoInnerProps {
  systemId: string;
  demoConfig: DemoConfig;
  isPreview: boolean;
}

function InteractiveDemoInner({
  systemId,
  demoConfig,
  isPreview,
}: InteractiveDemoInnerProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { isSubmitting, analysisSteps, result, error, submit, reset } =
    useDemoSubmission();

  const formFields = demoConfig.form_fields.map((f) => ({
    key: f.name,
    label: f.label,
    type: f.type,
    placeholder: f.placeholder,
    required: f.required,
    options: f.options?.map((opt) => ({ value: opt, label: opt })),
    helpText: f.helpText,
  }));

  const ctaText = demoConfig.cta_button_text ?? "Get Your Analysis";
  const headlineStyle = demoConfig.theme?.headline_style ?? "serif-italic";
  const postResultCta: PostResultCta | undefined = demoConfig.post_result_cta;

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function isFormValid(): boolean {
    return formFields
      .filter((f) => f.required)
      .every((f) => formData[f.key]?.trim());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid() || isPreview) return;
    submit(systemId, formData);
  }

  function handleReset() {
    reset();
    setFormData({});
  }

  const showResults = result !== null;
  const showAnalysis = isSubmitting && !showResults;
  const showForm = !showResults && !showAnalysis;

  return (
    <>
      {showResults && (
        <DemoResults
          result={result as DemoResult}
          onReset={handleReset}
          postResultCta={postResultCta}
        />
      )}
      {showAnalysis && <AnalysisProgress steps={analysisSteps} />}
      {showForm && (
        <DemoForm
          formFields={formFields}
          formData={formData}
          onUpdateField={updateField}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isFormValid={isFormValid()}
          ctaText={ctaText}
          error={error}
          headlineStyle={headlineStyle}
        />
      )}
    </>
  );
}

// ─── Icon Map ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Shield,
  Zap,
  Target,
  BarChart3,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Star,
  Heart,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Building2,
  Lightbulb,
  Rocket,
};
