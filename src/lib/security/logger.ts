/**
 * Centralized logger with redaction of sensitive fields.
 * Never log: tokens, passwords, full session objects, or PII in plain form.
 * Use this instead of console.log in server/API code for audit trail and safety.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "authorization",
  "cookie",
  "api_key",
  "apikey",
  "email", // redact in structured logs if you want; here we redact when key name suggests secret
]);

const REDACT_PLACEHOLDER = "[REDACTED]";

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes("token") || lower.includes("secret")) {
      out[key] = REDACT_PLACEHOLDER;
    } else {
      out[key] = redact(value);
    }
  }
  return out;
}

type LogLevel = "info" | "warn" | "error" | "debug";

function serialize(message: string, meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) {
    return message;
  }
  const safe = redact(meta) as Record<string, unknown>;
  return `${message} ${JSON.stringify(safe)}`;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(serialize(message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(serialize(message, meta));
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(serialize(message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    console.debug(serialize(message, meta));
  },
};
