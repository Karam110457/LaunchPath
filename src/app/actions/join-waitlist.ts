"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { logger } from "@/lib/security/logger";

export type State = {
  status: "idle" | "success" | "error";
  message: string;
  /** Set on success so the client can show step 2 even if form state resets */
  email?: string;
  /** True when email was already on list; do not show step 2 */
  alreadyOnList?: boolean;
};

// Basic in-memory rate limit (for demonstration - use Redis/KV in prod)
const RATE_LIMIT_MAP = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const limit = 5;

  const record = RATE_LIMIT_MAP.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > window) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  RATE_LIMIT_MAP.set(ip, record);

  return record.count <= limit;
}

export async function joinWaitlist(prevState: State, formData: FormData): Promise<State> {
  // 1. Honeypot check
  const honeypot = formData.get("confirm_email"); // Hidden field
  if (honeypot) {
    // Silent success for bots
    return { status: "success", message: "You're on the list!" };
  }
  // Note: rate limit and validation errors don't return email

  // 2. Rate Limit
  const ip = (await headers()).get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  // 3. Validation
  const email = formData.get("email") as string;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // 4. Database Insert
  const sourcePage = (formData.get("source_page") as string) || "homepage";
  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({
      email,
      source: "homepage_v1",
      source_page: sourcePage,
    });

  if (error) {
    if (error.code === "23505") {
      return { status: "success", message: "You're already on the list. We'll be in touch.", alreadyOnList: true };
    }
    logger.error("Waitlist signup failed", { code: error.code, message: error.message });
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "success", message: "You're on the list!", email };
}
