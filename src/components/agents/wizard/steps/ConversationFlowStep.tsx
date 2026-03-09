"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Plus,
  X,
  GripVertical,
  AlertCircle,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "@/components/flows/OptionCard";
import type {
  AppointmentBookerConfig,
  CustomerSupportConfig,
  LeadQualificationConfig,
} from "@/types/agent-wizard";

interface ConversationFlowStepProps {
  templateId: "appointment-booker" | "customer-support" | "lead-qualification";
  qualifyingQuestions: string[];
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;
  leadQualificationConfig: LeadQualificationConfig;
  businessDescription: string;
  scrapedContent: string;
  faqs: Array<{ question: string; answer: string }>;
  onQuestionsChange: (questions: string[]) => void;
  onUpdateAppointmentBooker: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
  onUpdateCustomerSupport: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
  onUpdateLeadQualification: (
    updater: (prev: LeadQualificationConfig) => LeadQualificationConfig,
  ) => void;
}

export function ConversationFlowStep({
  templateId,
  qualifyingQuestions,
  appointmentBookerConfig,
  customerSupportConfig,
  leadQualificationConfig,
  businessDescription,
  scrapedContent,
  faqs,
  onQuestionsChange,
  onUpdateAppointmentBooker,
  onUpdateCustomerSupport,
  onUpdateLeadQualification,
}: ConversationFlowStepProps) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerateQuestions() {
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/agents/wizard/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          businessDescription: businessDescription || undefined,
          scrapedContent: scrapedContent || undefined,
          faqs: faqs.length > 0 ? faqs : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Failed to generate questions");
        return;
      }

      onQuestionsChange(data.questions);
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {templateId === "appointment-booker"
            ? "Customize your conversation flow"
            : templateId === "lead-qualification"
              ? "Configure lead qualification"
              : "Configure support behavior"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {templateId === "appointment-booker"
            ? "Define the questions your agent asks to qualify leads and how it handles bookings."
            : templateId === "lead-qualification"
              ? "Define the information your agent collects and how it notifies your team."
              : "Choose how your agent handles issues and responds to visitors."}
        </p>
      </div>

      {/* Questions — for appointment-booker and lead-qualification */}
      {(templateId === "appointment-booker" || templateId === "lead-qualification") && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Qualifying questions</Label>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateQuestions}
            disabled={generating}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate questions
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Questions your agent asks to qualify leads before booking.
        </p>

        {genError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{genError}</p>
          </div>
        )}

        {qualifyingQuestions.length === 0 ? (
          <div className="py-4 text-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              No questions yet. Generate them with AI or add your own.
            </p>
          </div>
        ) : (
          <QuestionList
            questions={qualifyingQuestions}
            onChange={onQuestionsChange}
          />
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onQuestionsChange([...qualifyingQuestions, ""])}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add custom question
        </Button>
      </div>
      )}

      {/* Template-specific config */}
      <div className="border-t pt-6 space-y-4">
        {templateId === "appointment-booker" ? (
          <AppointmentBookerOptions
            config={appointmentBookerConfig}
            onUpdate={onUpdateAppointmentBooker}
          />
        ) : templateId === "lead-qualification" ? (
          <LeadQualificationOptions
            config={leadQualificationConfig}
            onUpdate={onUpdateLeadQualification}
          />
        ) : (
          <CustomerSupportOptions
            config={customerSupportConfig}
            onUpdate={onUpdateCustomerSupport}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question List with inline editing
// ---------------------------------------------------------------------------

function QuestionList({
  questions,
  onChange,
}: {
  questions: string[];
  onChange: (questions: string[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(questions[index]);
    },
    [questions],
  );

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...questions];
    updated[editingIndex] = editValue;
    onChange(updated);
    setEditingIndex(null);
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-lg border px-3 py-2.5 group"
        >
          <div className="shrink-0 mt-0.5 text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="shrink-0 text-xs font-mono text-muted-foreground mt-0.5 w-5">
            {i + 1}.
          </span>

          {editingIndex === i ? (
            <div className="flex-1 flex gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditingIndex(null);
                }}
              />
              <button
                type="button"
                onClick={saveEdit}
                className="shrink-0 p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="flex-1 text-sm mt-0.5">
                {q || (
                  <span className="text-muted-foreground italic">
                    Empty — click edit to add text
                  </span>
                )}
              </p>
              <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment Booker Options
// ---------------------------------------------------------------------------

function AppointmentBookerOptions({
  config,
  onUpdate,
}: {
  config: AppointmentBookerConfig;
  onUpdate: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
}) {
  return (
    <>
      <div className="space-y-3">
        <Label>Lead capture fields</Label>
        <p className="text-xs text-muted-foreground">
          Name and email are always captured. Toggle additional fields.
        </p>
        <div className="flex flex-wrap gap-2">
          <FieldToggle label="Name" enabled disabled />
          <FieldToggle label="Email" enabled disabled />
          <FieldToggle
            label="Phone"
            enabled={config.lead_fields.phone}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  phone: !prev.lead_fields.phone,
                },
              }))
            }
          />
          <FieldToggle
            label="Company"
            enabled={config.lead_fields.company}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  company: !prev.lead_fields.company,
                },
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>What happens after qualification?</Label>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="book_directly"
            label="Book directly"
            description="The agent books an appointment on the calendar"
            selected={config.booking_behavior === "book_directly"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                booking_behavior: "book_directly",
              }))
            }
          />
          <OptionCard
            value="collect_and_follow_up"
            label="Collect info and follow up"
            description="The agent captures lead details for you to follow up manually"
            selected={config.booking_behavior === "collect_and_follow_up"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                booking_behavior: "collect_and_follow_up",
              }))
            }
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Customer Support Options
// ---------------------------------------------------------------------------

function CustomerSupportOptions({
  config,
  onUpdate,
}: {
  config: CustomerSupportConfig;
  onUpdate: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Escalation behavior</Label>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="always_available"
            label="Handle everything"
            description="The agent tries to resolve all issues without escalating"
            selected={config.escalation_mode === "always_available"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                escalation_mode: "always_available",
              }))
            }
          />
          <OptionCard
            value="escalate_complex"
            label="Escalate complex issues"
            description="The agent hands off to a human when it can't resolve an issue"
            selected={config.escalation_mode === "escalate_complex"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                escalation_mode: "escalate_complex",
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Response style</Label>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="concise"
            label="Concise answers"
            description="Short, direct responses that get to the point quickly"
            selected={config.response_style === "concise"}
            onSelect={() =>
              onUpdate((prev) => ({ ...prev, response_style: "concise" }))
            }
          />
          <OptionCard
            value="detailed"
            label="Detailed explanations"
            description="Thorough, step-by-step responses with context"
            selected={config.response_style === "detailed"}
            onSelect={() =>
              onUpdate((prev) => ({ ...prev, response_style: "detailed" }))
            }
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Lead Qualification Options
// ---------------------------------------------------------------------------

function LeadQualificationOptions({
  config,
  onUpdate,
}: {
  config: LeadQualificationConfig;
  onUpdate: (
    updater: (prev: LeadQualificationConfig) => LeadQualificationConfig,
  ) => void;
}) {
  return (
    <>
      <div className="space-y-3">
        <Label>Lead capture fields</Label>
        <p className="text-xs text-muted-foreground">
          Name and email are always captured. Toggle additional fields.
        </p>
        <div className="flex flex-wrap gap-2">
          <FieldToggle label="Name" enabled disabled />
          <FieldToggle label="Email" enabled disabled />
          <FieldToggle
            label="Phone"
            enabled={config.lead_fields.phone}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  phone: !prev.lead_fields.phone,
                },
              }))
            }
          />
          <FieldToggle
            label="Company"
            enabled={config.lead_fields.company}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  company: !prev.lead_fields.company,
                },
              }))
            }
          />
          <FieldToggle
            label="Budget"
            enabled={config.lead_fields.budget}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  budget: !prev.lead_fields.budget,
                },
              }))
            }
          />
          <FieldToggle
            label="Timeline"
            enabled={config.lead_fields.timeline}
            onToggle={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  timeline: !prev.lead_fields.timeline,
                },
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>When a lead is qualified</Label>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="email_team"
            label="Email team with lead summary"
            description="Sends an internal notification with the lead details to your team"
            selected={config.notification_behavior === "email_team"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                notification_behavior: "email_team",
              }))
            }
          />
          <OptionCard
            value="sheet_only"
            label="Save to spreadsheet only"
            description="Leads are saved to Google Sheets without email notifications"
            selected={config.notification_behavior === "sheet_only"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                notification_behavior: "sheet_only",
              }))
            }
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Field Toggle
// ---------------------------------------------------------------------------

function FieldToggle({
  label,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium border transition-all
        ${disabled ? "cursor-default" : "cursor-pointer"}
        ${
          enabled
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
        }
      `}
    >
      {label}
    </button>
  );
}
