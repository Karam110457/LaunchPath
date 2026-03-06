/**
 * Shared result trimming utility for tool execution results.
 *
 * Strips metadata noise and caps data size to prevent context window bloat.
 * Used by HTTP, Composio, and Subagent tool integrations.
 */

// Fields to strip from tool results — metadata noise that wastes tokens
const STRIP_FIELDS = new Set([
  "response_headers",
  "raw_response",
  "request_id",
  "status_code",
  "responseHeaders",
  "rawResponse",
  "requestId",
  "statusCode",
]);

/** Max chars for JSON-serialized tool result data before truncation. */
export const MAX_RESULT_CHARS = 4000;

/**
 * Trims a tool execution result to prevent context window bloat.
 * Strips metadata fields and caps data size.
 */
export function trimToolResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;

  const r = { ...(result as Record<string, unknown>) };

  // Strip metadata noise
  for (const field of STRIP_FIELDS) {
    delete r[field];
  }

  // Trim nested data if present
  if (r.data && typeof r.data === "object") {
    const data = { ...(r.data as Record<string, unknown>) };
    for (const field of STRIP_FIELDS) {
      delete data[field];
    }
    r.data = data;
  }

  // Cap total data size
  try {
    const dataStr = JSON.stringify(r.data ?? r);
    if (dataStr.length > MAX_RESULT_CHARS) {
      // For arrays, include count; for objects, include truncated preview
      const dataVal = r.data;
      if (Array.isArray(dataVal)) {
        r.data = {
          _truncated: true,
          _totalItems: dataVal.length,
          _showing: "first items",
          items: dataVal.slice(0, 5),
          _message: `Result contained ${dataVal.length} items. Showing first 5.`,
        };
      } else {
        r.data = {
          _truncated: true,
          _preview: dataStr.slice(0, MAX_RESULT_CHARS),
          _message:
            "Result was too large and has been truncated. Ask the user to be more specific if needed.",
        };
      }
    }
  } catch {
    // JSON.stringify failed — leave as-is
  }

  return r;
}
