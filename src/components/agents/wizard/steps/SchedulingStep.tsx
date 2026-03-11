"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import { CustomFieldsList } from "../shared/CustomFieldsList";
import type { AppointmentBookerConfig } from "@/types/agent-wizard";

interface SchedulingStepProps {
  config: AppointmentBookerConfig;
  onUpdate: (
    updater: (prev: AppointmentBookerConfig) => AppointmentBookerConfig,
  ) => void;
}

export function SchedulingStep({ config, onUpdate }: SchedulingStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Set your availability"
        description="When can visitors book? Your agent will only offer times within these windows."
      />

      {/* Availability */}
      <WizardCard>
        <div className="space-y-5">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Timezone</Label>
            <select
              value={config.availability.timezone}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  availability: { ...prev.availability, timezone: e.target.value },
                }))
              }
              className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
            >
              <option value="">Select timezone...</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Working days */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Working days</Label>
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    config.availability.working_days.includes(d.value)
                      ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 border-[#FF8C00]/30 text-[#FF8C00] dark:text-[#FFa333]"
                      : "bg-[#f8f9fa] dark:bg-[#252525] border-black/5 dark:border-[#333333] text-neutral-500 dark:text-neutral-400 hover:border-[#FF8C00]/30"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Start time</Label>
              <select
                value={config.availability.start_time}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, start_time: e.target.value },
                  }))
                }
                className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {formatTime(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">End time</Label>
              <select
                value={config.availability.end_time}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, end_time: e.target.value },
                  }))
                }
                className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
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
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Duration</Label>
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
                className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
              >
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Buffer</Label>
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
                className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
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
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Max advance booking</Label>
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
                className="h-9 text-sm w-24 rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
              />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">days in advance</span>
            </div>
          </div>
        </div>
      </WizardCard>

      {/* Service types */}
      <WizardCard>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Appointment types
              <span className="text-destructive ml-1">*</span>
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
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
      </WizardCard>

      {/* Cancellation policy */}
      <WizardCard>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Cancellation policy
            <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
          </Label>
          <Textarea
            value={config.cancellation_policy}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, cancellation_policy: e.target.value }))
            }
            placeholder="e.g., Free cancellation up to 24 hours before the appointment."
            rows={2}
            className="text-sm resize-none rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Your agent will communicate this to visitors after booking.
          </p>
        </div>
      </WizardCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}
