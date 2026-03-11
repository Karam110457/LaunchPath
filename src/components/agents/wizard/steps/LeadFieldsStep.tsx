"use client";

import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import { FieldToggle } from "../shared/FieldToggle";
import { CustomFieldsList } from "../shared/CustomFieldsList";
import type { AppointmentBookerConfig } from "@/types/agent-wizard";

interface LeadFieldsStepProps {
  config: AppointmentBookerConfig;
  onUpdate: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
}

export function LeadFieldsStep({ config, onUpdate }: LeadFieldsStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="What info should your agent collect?"
        description="Name and email are always collected. Toggle on anything else you need before booking."
      />

      <WizardCard>
        <div className="space-y-4">
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

          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-[#2A2A2A]">
            <Label className="text-xs text-neutral-500 dark:text-neutral-400">
              Custom fields
            </Label>
            <CustomFieldsList
              fields={config.lead_fields.custom_fields}
              onChange={(custom_fields) =>
                onUpdate((prev) => ({
                  ...prev,
                  lead_fields: { ...prev.lead_fields, custom_fields },
                }))
              }
              placeholder="e.g., Address, Budget, Project type"
            />
          </div>
        </div>
      </WizardCard>
    </div>
  );
}
