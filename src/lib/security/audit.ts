/**
 * Audit trail for security-relevant events in LaunchPath.
 *
 * All events are logged to console (via the secure logger) AND optionally
 * to a Supabase audit_events table for persistence and querying.
 *
 * Events to audit:
 * - Auth: login, logout, failed login, password reset, role change
 * - Credits: spend, purchase, refill, insufficient_credits block
 * - Generations: AI generation started, completed, failed
 * - Security: injection attempt detected, rate limit hit, CSRF blocked
 * - Data: blueprint created, cloned, deleted
 */

import { logger } from "./logger";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.failed_login"
  | "auth.password_reset"
  | "auth.role_change"
  | "credits.spend"
  | "credits.purchase"
  | "credits.refill"
  | "credits.insufficient"
  | "generation.started"
  | "generation.completed"
  | "generation.failed"
  | "security.injection_attempt"
  | "security.rate_limit"
  | "security.csrf_blocked"
  | "security.bot_detected"
  | "data.blueprint_created"
  | "data.blueprint_cloned"
  | "data.blueprint_deleted";

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event. Always logs to console; optionally persists to Supabase.
 * Never throws — audit failures must not break the app.
 */
export async function auditLog(
  event: AuditEvent,
  supabase?: SupabaseClient
): Promise<void> {
  // Always log to structured console
  logger.info(`[AUDIT] ${event.type}`, {
    userId: event.userId,
    ip: event.ip,
    ...event.metadata,
  });

  // Optionally persist to database
  if (supabase && event.userId) {
    try {
      await supabase.from("audit_events").insert({
        user_id: event.userId,
        event_type: event.type,
        ip_address: event.ip,
        metadata: event.metadata ?? {},
      });
    } catch {
      // Never let audit logging break the app
      logger.warn("[AUDIT] Failed to persist audit event to database", {
        type: event.type,
      });
    }
  }
}
