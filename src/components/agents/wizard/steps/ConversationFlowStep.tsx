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
import { Textarea } from "@/components/ui/textarea";
import { OptionCard } from "@/components/flows/OptionCard";
import type {
  AppointmentBookerConfig,
  CustomerSupportConfig,
  LeadCaptureConfig,
} from "@/types/agent-wizard";

interface ConversationFlowStepProps {
  templateId: string;
  qualifyingQuestions: string[];
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;
  leadCaptureConfig: LeadCaptureConfig;
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
  onUpdateLeadCapture: (
    updater: (prev: LeadCaptureConfig) => LeadCaptureConfig,
  ) => void;
}

export function ConversationFlowStep({
  templateId,
  qualifyingQuestions,
  appointmentBookerConfig,
  customerSupportConfig,
  leadCaptureConfig,
  businessDescription,
  scrapedContent,
  faqs,
  onQuestionsChange,
  onUpdateAppointmentBooker,
  onUpdateCustomerSupport,
  onUpdateLeadCapture,
}: ConversationFlowStepProps) {
  const isLeadCapture = templateId === "lead-capture" || templateId === "lead-qualification";
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
            : isLeadCapture
              ? "Configure lead capture"
              : "Configure support behavior"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {templateId === "appointment-booker"
            ? "Set up the fields your agent collects and how it handles bookings."
            : isLeadCapture
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
      ) : isLeadCapture ? (
        <LeadCaptureOptions
          config={leadCaptureConfig}
          onUpdate={onUpdateLeadCapture}
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

      {/* Qualification settings — shared for appointment-booker + lead-capture */}
      {(templateId === "appointment-booker" || isLeadCapture) && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label className="text-sm font-medium">
              Ideal customer profile
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Describe your ideal customer so the agent can prioritize the right leads.
            </p>
            <Textarea
              value={
                templateId === "appointment-booker"
                  ? appointmentBookerConfig.icp_description
                  : leadCaptureConfig.icp_description
              }
              onChange={(e) => {
                if (templateId === "appointment-booker") {
                  onUpdateAppointmentBooker((prev) => ({ ...prev, icp_description: e.target.value }));
                } else {
                  onUpdateLeadCapture((prev) => ({ ...prev, icp_description: e.target.value }));
                }
              }}
              placeholder="e.g., B2B SaaS companies with 10–200 employees looking for project management tools"
              rows={2}
              className="mt-2 text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Disqualification criteria
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              When should the agent politely decline? These help the agent know when someone isn&apos;t a fit.
            </p>
            <div className="mt-2">
              <CustomFieldsList
                fields={
                  templateId === "appointment-booker"
                    ? appointmentBookerConfig.disqualification_criteria
                    : leadCaptureConfig.disqualification_criteria
                }
                onChange={(v) => {
                  if (templateId === "appointment-booker") {
                    onUpdateAppointmentBooker((prev) => ({ ...prev, disqualification_criteria: v }));
                  } else {
                    onUpdateLeadCapture((prev) => ({ ...prev, disqualification_criteria: v }));
                  }
                }}
                placeholder="e.g., No budget, just browsing"
              />
            </div>
          </div>
        </div>
      )}
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
  placeholder = "e.g., Address, Project Size",
}: {
  fields: string[];
  onChange: (fields: string[]) => void;
  placeholder?: string;
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
          placeholder={placeholder}
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

      {/* booking_behavior is always "book_directly" for appointment-booker */}

      {/* Availability */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Availability</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            When can visitors book appointments? Your agent will only offer
            times within these windows.
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="text-xs">Timezone</Label>
          <select
            value={config.availability.timezone}
            onChange={(e) =>
              onUpdate((prev) => ({
                ...prev,
                availability: { ...prev.availability, timezone: e.target.value },
              }))
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select timezone…</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Working days */}
        <div className="space-y-1.5">
          <Label className="text-xs">Working days</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  onUpdate((prev) => {
                    const days = prev.availability.working_days;
                    const next = days.includes(d.value)
                      ? days.filter((x) => x !== d.value)
                      : [...days, d.value];
                    return {
                      ...prev,
                      availability: { ...prev.availability, working_days: next },
                    };
                  })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  config.availability.working_days.includes(d.value)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start / End time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Start time</Label>
            <select
              value={config.availability.start_time}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: { ...prev.availability, start_time: e.target.value },
                }))
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End time</Label>
            <select
              value={config.availability.end_time}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: { ...prev.availability, end_time: e.target.value },
                }))
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration + Buffer */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Appointment duration</Label>
            <select
              value={config.availability.appointment_duration}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: {
                    ...prev.availability,
                    appointment_duration: Number(e.target.value),
                  },
                }))
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Buffer between appointments</Label>
            <select
              value={config.availability.buffer_minutes}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: {
                    ...prev.availability,
                    buffer_minutes: Number(e.target.value),
                  },
                }))
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "No buffer" : `${m} min`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Max advance days */}
        <div className="space-y-1.5">
          <Label className="text-xs">Max advance booking</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={config.availability.max_advance_days}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: {
                    ...prev.availability,
                    max_advance_days: Number(e.target.value) || 30,
                  },
                }))
              }
              className="h-8 text-sm w-24"
            />
            <span className="text-xs text-muted-foreground">days in advance</span>
          </div>
        </div>
      </div>

      {/* Service types */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">
            Appointment types
            <span className="text-destructive ml-1">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            What kinds of appointments can visitors book? Add at least one.
          </p>
        </div>
        <CustomFieldsList
          fields={config.service_types}
          onChange={(service_types) =>
            onUpdate((prev) => ({ ...prev, service_types }))
          }
          placeholder="e.g., Consultation, Follow-up, Demo"
        />
      </div>

      {/* Cancellation policy */}
      <div className="space-y-1.5">
        <Label className="text-sm">
          Cancellation policy
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </Label>
        <Textarea
          value={config.cancellation_policy}
          onChange={(e) =>
            onUpdate((prev) => ({ ...prev, cancellation_policy: e.target.value }))
          }
          placeholder="e.g., Free cancellation up to 24 hours before the appointment."
          rows={2}
          className="text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Your agent will communicate this to visitors after booking.
        </p>
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

      {/* Escalation contact — only when escalation is enabled */}
      {config.escalation_mode === "escalate_complex" && (
        <div className="space-y-1.5">
          <Label className="text-sm">Escalation contact</Label>
          <Input
            value={config.escalation_contact}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, escalation_contact: e.target.value }))
            }
            placeholder="e.g., support@company.com or 'live chat transfer'"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Where should your agent direct visitors when escalating?
          </p>
        </div>
      )}

      {/* Business hours */}
      <div className="space-y-1.5">
        <Label className="text-sm">
          Business hours
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </Label>
        <Input
          value={config.business_hours}
          onChange={(e) =>
            onUpdate((prev) => ({ ...prev, business_hours: e.target.value }))
          }
          placeholder="e.g., Mon–Fri 9am–5pm EST"
          className="text-sm"
        />
      </div>

      {/* After-hours message */}
      {config.business_hours && (
        <div className="space-y-1.5">
          <Label className="text-sm">
            After-hours message
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <Textarea
            value={config.after_hours_message}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, after_hours_message: e.target.value }))
            }
            placeholder="e.g., Thanks for reaching out! We'll get back to you next business day."
            rows={2}
            className="text-sm resize-none"
          />
        </div>
      )}

      {/* Forbidden topics */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">
            Forbidden topics
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Topics your agent must never discuss. It will politely redirect if asked.
          </p>
        </div>
        <CustomFieldsList
          fields={config.forbidden_topics}
          onChange={(forbidden_topics) =>
            onUpdate((prev) => ({ ...prev, forbidden_topics }))
          }
          placeholder="e.g., Competitor pricing, Internal processes"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead Capture Options
// ---------------------------------------------------------------------------

function LeadCaptureOptions({
  config,
  onUpdate,
}: {
  config: LeadCaptureConfig;
  onUpdate: (
    updater: (prev: LeadCaptureConfig) => LeadCaptureConfig,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Lead Capture Fields */}
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Lead capture fields</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contact information your agent collects. Name and email are always required.
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

      {/* Where to Send Leads */}
      <div className="space-y-2">
        <Label>Where to send qualified leads</Label>
        <p className="text-xs text-muted-foreground">
          How should your team be notified when a lead is captured?
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

      {/* Notification email — only when email_team is selected */}
      {config.notification_behavior === "email_team" && (
        <div className="space-y-1.5">
          <Label className="text-sm">Notification email</Label>
          <Input
            type="email"
            value={config.notification_email}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, notification_email: e.target.value }))
            }
            placeholder="e.g., sales@company.com"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your team will receive lead summaries at this address.
          </p>
        </div>
      )}
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

// ---------------------------------------------------------------------------
// Constants for Availability section
// ---------------------------------------------------------------------------

const ALL_DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

/** Generate 30-min increment time options from 00:00 to 23:30 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

/** Format "HH:mm" to "h:mm AM/PM" */
function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}
