"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import { FieldToggle } from "../shared/FieldToggle";
import { CustomFieldsList } from "../shared/CustomFieldsList";
import type { LeadCaptureConfig } from "@/types/agent-wizard";

interface LeadCollectionStepProps {
  config: LeadCaptureConfig;
  onUpdate: (
    updater: (prev: LeadCaptureConfig) => LeadCaptureConfig,
  ) => void;
}

export function LeadCollectionStep({ config, onUpdate }: LeadCollectionStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Collect and deliver leads"
        description="Choose what info your agent collects and where qualified leads are sent."
      />

      {/* Lead capture fields */}
      <WizardCard>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Lead capture fields
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Name and email are always collected. Toggle on anything else you need.
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
            />
          </div>
        </div>
      </WizardCard>

      {/* Where to send leads */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 px-1">
          Where to send qualified leads
        </Label>
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, notification_behavior: "email_team" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.notification_behavior === "email_team"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.notification_behavior === "email_team" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Email notification + spreadsheet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Saves lead to Google Sheets and emails your team with a summary.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, notification_behavior: "sheet_only" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.notification_behavior === "sheet_only"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.notification_behavior === "sheet_only" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Spreadsheet only
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Saves leads to Google Sheets without sending email notifications.
          </p>
        </button>
      </div>

      {/* Notification email */}
      {config.notification_behavior === "email_team" && (
        <WizardCard>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Notification email
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your agent will email this address with a lead summary via Gmail.
            </p>
            <Input
              type="email"
              value={config.notification_email}
              onChange={(e) =>
                onUpdate((prev) => ({ ...prev, notification_email: e.target.value }))
              }
              placeholder="e.g., sales@company.com"
              className="text-sm rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
          </div>
        </WizardCard>
      )}
    </div>
  );
}
