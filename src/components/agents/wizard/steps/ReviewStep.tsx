"use client";

import { Pencil, Calendar, LifeBuoy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentWizardState } from "@/types/agent-wizard";

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
  const isAppointment = state.templateId === "appointment-booker";

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
        <ReviewCard
          title="Agent Type"
          stepIndex={0}
          onEdit={onGoToStep}
        >
          <div className="flex items-center gap-2">
            {isAppointment ? (
              <Calendar className="w-4 h-4 text-primary" />
            ) : (
              <LifeBuoy className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm font-medium">
              {isAppointment ? "Appointment Booker" : "Customer Support"}
            </span>
          </div>
        </ReviewCard>

        {/* Business Context */}
        <ReviewCard
          title="Business"
          stepIndex={1}
          onEdit={onGoToStep}
        >
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
        </ReviewCard>

        {/* Behavior */}
        <ReviewCard
          title="Behavior"
          stepIndex={2}
          onEdit={onGoToStep}
        >
          {isAppointment ? (
            <AppointmentReview config={state.appointmentBookerConfig} />
          ) : (
            <SupportReview config={state.customerSupportConfig} />
          )}
        </ReviewCard>

        {/* Personality */}
        <ReviewCard
          title="Personality"
          stepIndex={3}
          onEdit={onGoToStep}
        >
          <div className="space-y-2">
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
              <p className="text-sm mt-0.5 italic">
                &ldquo;{state.greetingMessage || "—"}&rdquo;
              </p>
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
  const questions = config.qualifying_questions.filter((q) => q.trim());
  const fields = ["Name", "Email"];
  if (config.lead_fields.phone) fields.push("Phone");
  if (config.lead_fields.company) fields.push("Company");
  config.lead_fields.custom_fields
    .filter((f) => f.trim())
    .forEach((f) => fields.push(f));

  return (
    <div className="space-y-3 text-sm">
      {config.services && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Services
          </span>
          <p className="text-muted-foreground mt-0.5 line-clamp-2">
            {config.services}
          </p>
        </div>
      )}
      {questions.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Qualifying Questions
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
    </div>
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
  const topics = config.support_topics.filter((t) => t.trim());

  return (
    <div className="space-y-3 text-sm">
      {config.business_description && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Business
          </span>
          <p className="text-muted-foreground mt-0.5 line-clamp-2">
            {config.business_description}
          </p>
        </div>
      )}
      {topics.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Topics
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {topics.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}
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
    </div>
  );
}
