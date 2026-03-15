/**
 * Business hours check — timezone-aware using Intl.DateTimeFormat.
 */

import type { WhatsAppConfig } from "./types";

type BusinessHoursConfig = NonNullable<WhatsAppConfig["businessHours"]>;

// Numeric day index (getDay()) → schedule key mapping.
// Avoids locale-dependent weekday string matching.
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

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

    // Get current time parts in the configured timezone using locale-independent numeric format
    const now = new Date();
    const hourStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now);
    const minuteStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, minute: "numeric" }).format(now);
    // Use weekday numeric via formatToParts for day-of-week (0=Sunday in getDay())
    // We need the day in the target timezone, not local. Use a date formatter to extract it.
    const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
    const dayShort = dayFormatter.format(now); // "Sun", "Mon", etc.
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayIndex = dayMap[dayShort] ?? 0;

    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const weekday = DAY_KEYS[dayIndex];

    const daySchedule = config.schedule[weekday];

    // null or undefined means closed for the day
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
