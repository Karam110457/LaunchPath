"use client";

import {
  Pencil,
  Calendar,
  LifeBuoy,
  Target,
  Globe,
  MessageSquare,
  FileText,
  Bot,
  Plug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import type { AgentWizardState, WizardStepId } from "@/types/agent-wizard";
import { getTemplateById } from "@/lib/agents/templates";

const TEMPLATE_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  "appointment-booker": {
    label: "Appointment Booker",
    icon: <Calendar className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />,
  },
  "customer-support": {
    label: "Customer Support",
    icon: <LifeBuoy className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />,
  },
  "lead-capture": {
    label: "Lead Capture",
    icon: <Target className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />,
  },
  "lead-qualification": {
    label: "Lead Capture",
    icon: <Target className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />,
  },
};

interface ReviewStepProps {
  state: AgentWizardState;
  onGoToStep: (stepId: WizardStepId) => void;
}

export function ReviewStep({
  state,
  onGoToStep,
}: ReviewStepProps) {
  const scannedPages = state.discoveredPages.filter(
    (p) => p.selected && p.status === "done",
  );
  const questions = state.qualifyingQuestions.filter((q) => q.trim());
  const template = state.templateId ? getTemplateById(state.templateId) : null;
  const toolkits = state.selectedToolkits ?? [];
  const selectedTools = (template?.suggestedTools ?? []).filter((t) =>
    toolkits.includes(t.toolkit),
  );
  const meta = state.templateId ? TEMPLATE_META[state.templateId] : null;

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Review your agent"
        description="Confirm the details below, then generate your agent."
      />

      <div className="space-y-4">
        {/* Agent Type */}
        <ReviewCard title="Agent Type" stepId="choose-type" onEdit={onGoToStep}>
          <div className="flex items-center gap-2">
            {meta?.icon ?? <Bot className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />}
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {meta?.label ?? "Custom Agent"}
            </span>
          </div>
        </ReviewCard>

        {/* Agent Name */}
        <ReviewCard title="Agent" stepId="agent-name" onEdit={onGoToStep}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {state.agentName || "Unnamed agent"}
              </span>
            </div>
            {state.agentDescription && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {state.agentDescription}
              </p>
            )}
          </div>
        </ReviewCard>

        {/* Personality */}
        <ReviewCard title="Personality" stepId="agent-personality" onEdit={onGoToStep}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                Tone
              </span>
              <p className="text-sm mt-0.5 text-neutral-700 dark:text-neutral-300">
                {state.tone || "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                Greeting
              </span>
              <p className="text-sm mt-0.5 italic line-clamp-2 text-neutral-700 dark:text-neutral-300">
                &ldquo;{state.greetingMessage || "—"}&rdquo;
              </p>
            </div>
          </div>
        </ReviewCard>

        {/* Business Context */}
        <ReviewCard title="Business" stepId="business-context" onEdit={onGoToStep}>
          {state.businessDescription ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">
              {state.businessDescription}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">
              No business context provided
            </p>
          )}
        </ReviewCard>

        {/* Website & Knowledge */}
        <ReviewCard title="Knowledge" stepId="website" onEdit={onGoToStep}>
          <div className="flex flex-wrap gap-3 text-sm">
            {state.websiteUrl && (
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <Globe className="w-3.5 h-3.5" />
                {scannedPages.length > 0
                  ? `${scannedPages.length} pages from ${state.websiteUrl}`
                  : state.websiteUrl}
              </div>
            )}
            {state.files.length > 0 && (
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <FileText className="w-3.5 h-3.5" />
                {state.files.length} files
              </div>
            )}
            {state.faqs.length > 0 && (
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <MessageSquare className="w-3.5 h-3.5" />
                {state.faqs.length} FAQs
              </div>
            )}
            {!state.websiteUrl &&
              state.faqs.length === 0 &&
              state.files.length === 0 &&
              scannedPages.length === 0 && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">
                  No knowledge base content added
                </p>
              )}
          </div>
        </ReviewCard>

        {/* Conversation Flow — varies by template */}
        {state.templateId && (
          <ReviewCard
            title="Behavior"
            stepId={
              state.templateId === "customer-support" ? "response-behavior" : "lead-qualification"
            }
            onEdit={onGoToStep}
          >
            <div className="space-y-3 text-sm">
              {questions.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                    {state.templateId === "customer-support"
                      ? "Triage Questions"
                      : "Qualifying Questions"}
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {questions.map((q, i) => (
                      <li key={i} className="text-neutral-500 dark:text-neutral-400">
                        {i + 1}. {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {state.templateId === "appointment-booker" ? (
                <AppointmentReview config={state.appointmentBookerConfig} />
              ) : state.templateId === "lead-capture" || state.templateId === "lead-qualification" ? (
                <LeadCaptureReview config={state.leadCaptureConfig} />
              ) : (
                <SupportReview config={state.customerSupportConfig} />
              )}
            </div>
          </ReviewCard>
        )}

        {/* Integrations */}
        {state.templateId && (
          <ReviewCard title="Integrations" stepId="integrations" onEdit={onGoToStep}>
            {selectedTools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTools.map((t) => (
                  <div
                    key={t.toolkit}
                    className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
                  >
                    <Plug className="w-3.5 h-3.5" />
                    {t.toolkitName}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">
                No integrations selected
              </p>
            )}
          </ReviewCard>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card
// ---------------------------------------------------------------------------

function ReviewCard({
  title,
  stepId,
  onEdit,
  children,
}: {
  title: string;
  stepId: WizardStepId;
  onEdit: (stepId: WizardStepId) => void;
  children: React.ReactNode;
}) {
  return (
    <WizardCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">
            {title}
          </p>
          {children}
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors shrink-0 mt-0.5"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
    </WizardCard>
  );
}

// ---------------------------------------------------------------------------
// Template-specific review sub-components
// ---------------------------------------------------------------------------

function AppointmentReview({
  config,
}: {
  config: AgentWizardState["appointmentBookerConfig"];
}) {
  const fields = ["Name", "Email"];
  if (config.lead_fields.phone) fields.push("Phone");
  if (config.lead_fields.company) fields.push("Company");
  config.lead_fields.custom_fields
    .filter((f) => f.trim())
    .forEach((f) => fields.push(f));

  return (
    <>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Lead Fields
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {fields.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs rounded-full">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          After Qualification
        </span>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
          {config.booking_behavior === "book_directly"
            ? "Book directly on calendar"
            : "Collect info for manual follow-up"}
        </p>
      </div>
    </>
  );
}

function LeadCaptureReview({
  config,
}: {
  config: AgentWizardState["leadCaptureConfig"];
}) {
  const fields = ["Name", "Email"];
  if (config.lead_fields.phone) fields.push("Phone");
  if (config.lead_fields.company) fields.push("Company");
  config.lead_fields.custom_fields
    .filter((f) => f.trim())
    .forEach((f) => fields.push(f));

  return (
    <>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Lead Fields
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {fields.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs rounded-full">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Where Leads Go
        </span>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
          {config.notification_behavior === "email_team"
            ? "Email team + save to spreadsheet"
            : "Save to spreadsheet only"}
        </p>
      </div>
    </>
  );
}

function SupportReview({
  config,
}: {
  config: AgentWizardState["customerSupportConfig"];
}) {
  return (
    <>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Escalation
        </span>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
          {config.escalation_mode === "always_available"
            ? "Handle everything, never escalate"
            : "Escalate complex issues to human"}
        </p>
      </div>
      <div>
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Response Style
        </span>
        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
          {config.response_style === "concise"
            ? "Concise answers"
            : "Detailed explanations"}
        </p>
      </div>
    </>
  );
}
