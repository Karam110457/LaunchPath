"use client";

import { useState } from "react";
import type { DemoConfig } from "@/lib/ai/schemas";
import type { AgentConfig } from "@/lib/ai/agents/types";
import { useDemoSubmission } from "@/hooks/useDemoSubmission";
import { DemoHero } from "./DemoHero";
import { DemoValueProps } from "./DemoValueProps";
import { DemoTrustBlock } from "./DemoTrustBlock";
import { DemoForm } from "./DemoForm";
import { DemoResults } from "./DemoResults";
import { AnalysisProgress } from "./AnalysisProgress";
import { DemoFooter } from "./DemoFooter";

export interface DemoPageContentProps {
  systemId: string;
  demoConfig?: DemoConfig | null;
  agent?: AgentConfig | null;
  businessName: string;
  solution: string;
  segment: string;
  systemDescription?: string;
  transformationFrom?: string;
  transformationTo?: string;
  /** When true, disables form submission (used in builder preview) */
  isPreview?: boolean;
}

export function DemoPageContent({
  systemId,
  demoConfig,
  agent,
  businessName,
  solution,
  segment,
  systemDescription,
  transformationFrom,
  transformationTo,
  isPreview = false,
}: DemoPageContentProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const {
    isSubmitting,
    analysisSteps,
    result,
    error,
    submit,
    reset,
  } = useDemoSubmission();

  // Resolve display values from demoConfig or legacy agent
  const heroHeadline =
    demoConfig?.hero_headline ?? agent?.name ?? businessName;
  const heroSubheadline =
    demoConfig?.hero_subheadline ?? agent?.description ?? solution;
  const agentName =
    demoConfig?.agent_name ?? agent?.name ?? businessName;
  const ctaText = demoConfig?.cta_button_text ?? "Get Your Analysis";
  const transformationHeadline = demoConfig?.transformation_headline;
  const showGuarantee = demoConfig?.show_guarantee ?? false;
  const guaranteeText = demoConfig?.guarantee_text;
  const showPricing = demoConfig?.show_pricing ?? false;
  const pricingText = demoConfig?.pricing_text;
  const headlineStyle = demoConfig?.theme?.headline_style ?? "serif-italic";

  // Resolve form fields from demoConfig or agent
  const formFields = demoConfig
    ? demoConfig.form_fields.map((f) => ({
        key: f.name,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options?.map((opt) => ({ value: opt, label: opt })),
        helpText: f.helpText,
      }))
    : agent?.formFields ?? [];

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

  // Determine which section to show: form → analysis progress → results
  const showResults = result !== null;
  const showAnalysis = isSubmitting && !showResults;
  const showForm = !showResults && !showAnalysis;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      <DemoHero
        agentName={agentName}
        heroHeadline={heroHeadline}
        heroSubheadline={heroSubheadline}
        transformationHeadline={transformationHeadline}
        transformationFrom={transformationFrom}
        transformationTo={transformationTo}
        headlineStyle={headlineStyle}
      />

      <DemoValueProps benefits={demoConfig?.benefits} />

      <DemoTrustBlock
        showGuarantee={showGuarantee}
        guaranteeText={guaranteeText}
        showPricing={showPricing}
        pricingText={pricingText}
        segment={segment}
      />

      {showResults && (
        <DemoResults
          result={result}
          onReset={handleReset}
          postResultCta={demoConfig?.post_result_cta}
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

      <DemoFooter />
    </div>
  );
}
