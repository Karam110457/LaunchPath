/**
 * Business hours check — timezone-aware using Intl.DateTimeFormat.
 */

import type { WhatsAppConfig } from "./types";

type BusinessHoursConfig = NonNullable<WhatsAppConfig["businessHours"]>;

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Check if the current time is within configured business hours.
 * Returns true if business hours are disabled or behavior is "always_on".
 */
export function isWithinBusinessHours(
  config: BusinessHoursConfig | undefined
): boolean {
  if (!config?.enabled) return true;
  if (config.outsideHoursBehavior === "always_on") return true;

  try {
    const tz = config.timezone || "UTC";

    // Get current time in the configured timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase() ?? "";
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

    const daySchedule = config.schedule[weekday];

    // null means closed for the day
    if (daySchedule === null || daySchedule === undefined) return false;

    const [openH, openM] = daySchedule.open.split(":").map(Number);
    const [closeH, closeM] = daySchedule.close.split(":").map(Number);

    const currentMinutes = hour * 60 + minute;
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch {
    // If timezone parsing fails, default to open
    return true;
  }
}
