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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentWizardState } from "@/types/agent-wizard";
import { getTemplateById } from "@/lib/agents/templates";

const TEMPLATE_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  "appointment-booker": {
    label: "Appointment Booker",
    icon: <Calendar className="w-4 h-4 text-primary" />,
  },
  "customer-support": {
    label: "Customer Support",
    icon: <LifeBuoy className="w-4 h-4 text-primary" />,
  },
  "lead-capture": {
    label: "Lead Capture",
    icon: <Target className="w-4 h-4 text-primary" />,
  },
  "lead-qualification": {
    label: "Lead Capture",
    icon: <Target className="w-4 h-4 text-primary" />,
  },
};

interface ReviewStepProps {
  state: AgentWizardState;
  businessName?: string;
  onGoToStep: (index: number) => void;
}

export function ReviewStep({
  state,
  businessName,
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
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Review your agent
        </h2>
        <p className="text-sm text-muted-foreground">
          Confirm the details below, then generate your agent.
        </p>
      </div>

      <div className="space-y-4">
        {/* Agent Type */}
        <ReviewCard title="Agent Type" stepIndex={0} onEdit={onGoToStep}>
          <div className="flex items-center gap-2">
            {meta?.icon}
            <span className="text-sm font-medium">
              {meta?.label ?? "Unknown"}
            </span>
          </div>
        </ReviewCard>

        {/* Business Context */}
        <ReviewCard title="Business" stepIndex={1} onEdit={onGoToStep}>
          {state.businessContextMode === "link_system" && businessName ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Linked</Badge>
              <span className="text-sm">{businessName}</span>
            </div>
          ) : state.businessDescription ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {state.businessDescription}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No business context provided
            </p>
          )}
          {state.websiteUrl && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              {state.websiteUrl}
            </div>
          )}
        </ReviewCard>

        {/* Knowledge Base */}
        <ReviewCard title="Knowledge Base" stepIndex={2} onEdit={onGoToStep}>
          <div className="flex flex-wrap gap-3 text-sm">
            {scannedPages.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                {scannedPages.length} pages scanned
              </div>
            )}
            {state.faqs.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                {state.faqs.length} FAQs
              </div>
            )}
            {state.files.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                {state.files.length} files
              </div>
            )}
            {scannedPages.length === 0 &&
              state.faqs.length === 0 &&
              state.files.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No knowledge base content added
                </p>
              )}
          </div>
        </ReviewCard>

        {/* Conversation Flow */}
        <ReviewCard
          title="Conversation Flow"
          stepIndex={3}
          onEdit={onGoToStep}
        >
          <div className="space-y-3 text-sm">
            {questions.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {state.templateId === "customer-support"
                    ? "Triage Questions"
                    : "Qualifying Questions"}
                </span>
                <ul className="mt-1 space-y-0.5">
                  {questions.map((q, i) => (
                    <li key={i} className="text-muted-foreground">
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

        {/* Integrations */}
        <ReviewCard title="Integrations" stepIndex={4} onEdit={onGoToStep}>
          {selectedTools.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTools.map((t) => (
                <div
                  key={t.toolkit}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Plug className="w-3.5 h-3.5" />
                  {t.toolkitName}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No integrations selected
            </p>
          )}
        </ReviewCard>

        {/* Agent Identity */}
        <ReviewCard title="Agent Identity" stepIndex={5} onEdit={onGoToStep}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {state.agentName || "Unnamed agent"}
              </span>
            </div>
            {state.agentDescription && (
              <p className="text-xs text-muted-foreground">
                {state.agentDescription}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tone
                </span>
                <p className="text-sm mt-0.5">{state.tone || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Greeting
                </span>
                <p className="text-sm mt-0.5 italic line-clamp-2">
                  &ldquo;{state.greetingMessage || "—"}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </ReviewCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card
// ---------------------------------------------------------------------------

function ReviewCard({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (index: number) => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Appointment Booker Review
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
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Lead Fields
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {fields.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          After Qualification
        </span>
        <p className="text-muted-foreground mt-0.5">
          {config.booking_behavior === "book_directly"
            ? "Book directly on calendar"
            : "Collect info for manual follow-up"}
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Lead Capture Review
// ---------------------------------------------------------------------------

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
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Lead Fields
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {fields.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Where Leads Go
        </span>
        <p className="text-muted-foreground mt-0.5">
          {config.notification_behavior === "email_team"
            ? "Email team + save to spreadsheet"
            : "Save to spreadsheet only"}
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Customer Support Review
// ---------------------------------------------------------------------------

function SupportReview({
  config,
}: {
  config: AgentWizardState["customerSupportConfig"];
}) {
  return (
    <>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Escalation
        </span>
        <p className="text-muted-foreground mt-0.5">
          {config.escalation_mode === "always_available"
            ? "Handle everything, never escalate"
            : "Escalate complex issues to human"}
        </p>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Response Style
        </span>
        <p className="text-muted-foreground mt-0.5">
          {config.response_style === "concise"
            ? "Concise answers"
            : "Detailed explanations"}
        </p>
      </div>
    </>
  );
}
