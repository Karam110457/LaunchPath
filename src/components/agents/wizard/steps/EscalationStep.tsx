"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import type { CustomerSupportConfig } from "@/types/agent-wizard";

interface EscalationStepProps {
  config: CustomerSupportConfig;
  onUpdate: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
}

export function EscalationStep({ config, onUpdate }: EscalationStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="When should it escalate?"
        description="Decide what your agent does when it can't resolve an issue on its own."
      />

      {/* Escalation mode */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, escalation_mode: "always_available" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.escalation_mode === "always_available"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.escalation_mode === "always_available" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Handle everything
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            The agent tries to resolve all issues using its knowledge base.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, escalation_mode: "escalate_complex" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.escalation_mode === "escalate_complex"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.escalation_mode === "escalate_complex" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Escalate complex issues
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Hands off to a human when it can&apos;t find an answer.
          </p>
        </button>
      </div>

      {/* Escalation email — only when escalation is enabled */}
      {config.escalation_mode === "escalate_complex" && (
        <WizardCard>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Escalation email
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your agent will email this address with a summary when it can&apos;t resolve an issue.
            </p>
            <Input
              type="email"
              value={config.escalation_contact}
              onChange={(e) =>
                onUpdate((prev) => ({ ...prev, escalation_contact: e.target.value }))
              }
              placeholder="e.g., support@company.com"
              className="text-sm rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
          </div>
        </WizardCard>
      )}

      {/* Business hours */}
      <WizardCard>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Business hours
            <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
          </Label>
          <Input
            value={config.business_hours}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, business_hours: e.target.value }))
            }
            placeholder="e.g., Mon–Fri 9am–5pm EST"
            className="text-sm rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
          />

          {/* After-hours message — only if business hours set */}
          {config.business_hours && (
            <div className="space-y-2 pt-3 border-t border-black/5 dark:border-[#2A2A2A]">
              <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                After-hours message
                <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                value={config.after_hours_message}
                onChange={(e) =>
                  onUpdate((prev) => ({ ...prev, after_hours_message: e.target.value }))
                }
                placeholder="e.g., Thanks for reaching out! We'll get back to you next business day."
                rows={2}
                className="text-sm resize-none rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
              />
            </div>
          )}
        </div>
      </WizardCard>
    </div>
  );
}
