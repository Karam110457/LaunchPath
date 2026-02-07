/**
 * File upload and external input safety.
 * - Validate MIME type, size, and extension.
 * - Reject dangerous types. For production, also scan content (e.g. magic bytes).
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB default

/** Allowed MIME types for generic uploads. Restrict further per feature. */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

/** Extensions that must never be accepted (executables, scripts). */
const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "ps1", "js", "ts", "mjs", "cjs",
  "php", "phtml", "asp", "aspx", "jsp", "jar", "wsf", "vbs",
]);

export type FileValidationResult =
  | { ok: true; mime: string }
  | { ok: false; reason: string };

export function validateFile(
  file: { name: string; size: number; type: string },
  options?: { maxSize?: number; allowedMime?: Set<string> }
): FileValidationResult {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE_BYTES;
  const allowed = options?.allowedMime ?? ALLOWED_MIME;

  if (file.size > maxSize) {
    return { ok: false, reason: "File too large" };
  }
  if (file.size === 0) {
    return { ok: false, reason: "Empty file" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: "File type not allowed" };
  }

  const mime = (file.type || "").toLowerCase();
  if (!allowed.has(mime)) {
    return { ok: false, reason: "MIME type not allowed" };
  }

  return { ok: true, mime };
}
