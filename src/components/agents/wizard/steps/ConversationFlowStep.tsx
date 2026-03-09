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
            ? "Configure appointments"
            : templateId === "lead-qualification"
              ? "Configure lead capture"
              : "Configure support behavior"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {templateId === "appointment-booker"
            ? "Set up the fields your agent collects and how it handles bookings."
            : templateId === "lead-qualification"
              ? "Choose what information your agent collects and where leads are sent."
              : "Choose how your agent handles issues and responds to visitors."}
        </p>
      </div>

      {/* Template-specific config panels */}
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

      {/* Qualifying questions — for all template types */}
      <div className="border-t pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>
              {templateId === "customer-support"
                ? "Triage questions"
                : "Qualifying questions"}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {templateId === "customer-support"
                ? "Questions to understand the visitor's issue before helping."
                : "Questions your agent asks to qualify leads before proceeding."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateQuestions}
            disabled={generating}
            className="gap-1.5 shrink-0"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate
          </Button>
        </div>

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
          Add question
        </Button>
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
// Custom Fields List (add/remove inline)
// ---------------------------------------------------------------------------

function CustomFieldsList({
  fields,
  onChange,
}: {
  fields: string[];
  onChange: (fields: string[]) => void;
}) {
  const [newField, setNewField] = useState("");

  function addField() {
    const name = newField.trim();
    if (!name) return;
    if (fields.some((f) => f.toLowerCase() === name.toLowerCase())) return;
    onChange([...fields, name]);
    setNewField("");
  }

  return (
    <div className="space-y-2">
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 text-foreground"
            >
              {f}
              <button
                type="button"
                onClick={() => onChange(fields.filter((_, idx) => idx !== i))}
                className="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          placeholder="e.g., Address, Project Size"
          className="h-8 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addField();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={!newField.trim()}
          className="gap-1 h-8 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
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
    <div className="space-y-6">
      {/* Lead Capture Fields */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Lead capture fields</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Information your agent collects from visitors. Name and email are always required.
          </p>
        </div>
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Custom fields</Label>
          <CustomFieldsList
            fields={config.lead_fields.custom_fields}
            onChange={(custom_fields) =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: { ...prev.lead_fields, custom_fields },
              }))
            }
          />
        </div>
      </div>

      {/* After Qualification */}
      <div className="space-y-2">
        <Label>What happens after qualification?</Label>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="book_directly"
            label="Book directly on calendar"
            description="Your agent checks availability and books appointments automatically"
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
            label="Collect info for follow-up"
            description="Your agent captures lead details so you can reach out manually"
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
    </div>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Escalation behavior</Label>
        <p className="text-xs text-muted-foreground">
          What should your agent do when it can&apos;t resolve an issue?
        </p>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="always_available"
            label="Handle everything"
            description="The agent tries to resolve all issues using its knowledge base"
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
            description="The agent hands off to a human when it can't find an answer"
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
        <p className="text-xs text-muted-foreground">
          How detailed should your agent&apos;s answers be?
        </p>
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
            description="Thorough, step-by-step responses with extra context"
            selected={config.response_style === "detailed"}
            onSelect={() =>
              onUpdate((prev) => ({ ...prev, response_style: "detailed" }))
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* Lead Capture Fields */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Lead capture fields</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Information your agent collects through natural conversation. Name and email are always required.
          </p>
        </div>
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Custom fields</Label>
          <CustomFieldsList
            fields={config.lead_fields.custom_fields}
            onChange={(custom_fields) =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: { ...prev.lead_fields, custom_fields },
              }))
            }
          />
        </div>
      </div>

      {/* Where to Send Leads */}
      <div className="space-y-2">
        <Label>Where to send qualified leads</Label>
        <p className="text-xs text-muted-foreground">
          How should your team be notified when a lead is qualified?
        </p>
        <div className="space-y-2 pt-1">
          <OptionCard
            value="email_team"
            label="Email notification + spreadsheet"
            description="Saves lead to Google Sheets and emails your team with a summary"
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
            label="Spreadsheet only"
            description="Saves leads to Google Sheets without sending email notifications"
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
    </div>
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
