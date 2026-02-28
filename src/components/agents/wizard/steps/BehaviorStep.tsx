"use client";

import { useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/flows/OptionCard";
import { getTemplateById } from "@/lib/agents/templates";
import type {
  AppointmentBookerConfig,
  CustomerSupportConfig,
} from "@/types/agent-wizard";

interface BehaviorStepProps {
  templateId: "appointment-booker" | "customer-support";
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;
  onUpdateAppointmentBooker: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
  onUpdateCustomerSupport: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
}

export function BehaviorStep({
  templateId,
  appointmentBookerConfig,
  customerSupportConfig,
  onUpdateAppointmentBooker,
  onUpdateCustomerSupport,
}: BehaviorStepProps) {
  const template = getTemplateById(templateId);
  const hints = template?.wizard_hints;

  if (templateId === "appointment-booker") {
    return (
      <AppointmentBookerBehavior
        config={appointmentBookerConfig}
        onUpdate={onUpdateAppointmentBooker}
        hints={hints}
      />
    );
  }

  return (
    <CustomerSupportBehavior
      config={customerSupportConfig}
      onUpdate={onUpdateCustomerSupport}
      hints={hints}
    />
  );
}

// ---------------------------------------------------------------------------
// Appointment Booker Behavior
// ---------------------------------------------------------------------------

function AppointmentBookerBehavior({
  config,
  onUpdate,
  hints,
}: {
  config: AppointmentBookerConfig;
  onUpdate: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
  hints?: {
    services_placeholder?: string;
    qualifying_questions_examples?: string[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Configure your appointment booker
        </h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your services and how leads should be qualified.
        </p>
      </div>

      {/* Services */}
      <div className="space-y-2">
        <Label htmlFor="services">What services do you offer?</Label>
        <Textarea
          id="services"
          placeholder={
            hints?.services_placeholder ??
            "Describe the services or products you offer..."
          }
          value={config.services}
          onChange={(e) =>
            onUpdate((prev) => ({ ...prev, services: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Qualifying Questions */}
      <div className="space-y-2">
        <Label>Qualifying questions</Label>
        <p className="text-xs text-muted-foreground">
          Questions your agent asks to understand the lead&apos;s needs.
        </p>
        <DynamicListInput
          items={config.qualifying_questions}
          onChange={(items) =>
            onUpdate((prev) => ({ ...prev, qualifying_questions: items }))
          }
          placeholder={
            hints?.qualifying_questions_examples?.[0] ??
            "e.g., What type of service are you looking for?"
          }
          addLabel="Add question"
        />
      </div>

      {/* Lead Fields */}
      <div className="space-y-3">
        <Label>Lead capture fields</Label>
        <p className="text-xs text-muted-foreground">
          Name and email are always captured. Toggle additional fields below.
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
        {config.lead_fields.custom_fields.length > 0 && (
          <DynamicListInput
            items={config.lead_fields.custom_fields}
            onChange={(items) =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: { ...prev.lead_fields, custom_fields: items },
              }))
            }
            placeholder="e.g., Property address"
            addLabel="Add field"
          />
        )}
        {config.lead_fields.custom_fields.length === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onUpdate((prev) => ({
                ...prev,
                lead_fields: {
                  ...prev.lead_fields,
                  custom_fields: [""],
                },
              }))
            }
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add custom field
          </Button>
        )}
      </div>

      {/* Booking Behavior */}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer Support Behavior
// ---------------------------------------------------------------------------

function CustomerSupportBehavior({
  config,
  onUpdate,
  hints,
}: {
  config: CustomerSupportConfig;
  onUpdate: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
  hints?: {
    business_description_placeholder?: string;
    support_topics_examples?: string[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Configure your support agent
        </h2>
        <p className="text-sm text-muted-foreground">
          Define what your agent supports and how it handles issues.
        </p>
      </div>

      {/* Business Description */}
      <div className="space-y-2">
        <Label htmlFor="support-desc">What does your business do?</Label>
        <Textarea
          id="support-desc"
          placeholder={
            hints?.business_description_placeholder ??
            "Describe your business or product..."
          }
          value={config.business_description}
          onChange={(e) =>
            onUpdate((prev) => ({
              ...prev,
              business_description: e.target.value,
            }))
          }
          rows={3}
        />
      </div>

      {/* Support Topics */}
      <div className="space-y-2">
        <Label>Common support topics</Label>
        <p className="text-xs text-muted-foreground">
          Categories of questions your agent should handle.
        </p>
        <DynamicListInput
          items={config.support_topics}
          onChange={(items) =>
            onUpdate((prev) => ({ ...prev, support_topics: items }))
          }
          placeholder={
            hints?.support_topics_examples?.[0] ?? "e.g., Account & billing"
          }
          addLabel="Add topic"
        />
      </div>

      {/* Escalation */}
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

      {/* Response Style */}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic List Input (shared)
// ---------------------------------------------------------------------------

function DynamicListInput({
  items,
  onChange,
  placeholder,
  addLabel,
  maxItems = 10,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  maxItems?: number;
}) {
  const updateItem = useCallback(
    (index: number, value: string) => {
      const next = [...items];
      next[index] = value;
      onChange(next);
    },
    [items, onChange],
  );

  const removeItem = useCallback(
    (index: number) => {
      if (items.length <= 1) {
        onChange([""]);
        return;
      }
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange],
  );

  const addItem = useCallback(() => {
    if (items.length < maxItems) {
      onChange([...items, ""]);
    }
  }, [items, maxItems, onChange]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addItem}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Toggle (shared)
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
