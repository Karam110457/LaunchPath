/**
 * HTTP/REST API tool builder.
 *
 * Unlike the webhook tool (fire-and-forget POST), this tool sends a request
 * to an external API and reads the response back into the agent's context.
 * Supports GET/POST/PUT/PATCH/DELETE, multiple auth schemes, URL templates,
 * and optional response path extraction.
 */

import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import { trimToolResult } from "../result-trim";
import type { HttpToolConfig, HttpAuthType, HttpAuthConfig } from "../types";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 25_000;

// Block internal network patterns to prevent SSRF
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/169\.254\./, // AWS/cloud metadata endpoint
];

/**
 * Derive a stable Claude tool name from the display name.
 */
export function makeHttpToolKey(displayName: string): string {
  return (
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "http_request"
  );
}

/**
 * Check if a URL targets an internal/private network address.
 */
function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((p) => p.test(url));
}

/**
 * Apply authentication to the request headers (and possibly URL for query-based API keys).
 * Returns the potentially modified URL.
 */
function applyAuth(
  headers: Record<string, string>,
  url: string,
  authType: HttpAuthType,
  authConfig?: HttpAuthConfig
): string {
  if (authType === "none" || !authConfig) return url;

  switch (authType) {
    case "bearer": {
      if (authConfig.token) {
        headers["Authorization"] = `Bearer ${authConfig.token}`;
      }
      break;
    }
    case "api_key": {
      if (authConfig.api_key_name && authConfig.api_key_value) {
        if (authConfig.api_key_in === "query") {
          const separator = url.includes("?") ? "&" : "?";
          url += `${separator}${encodeURIComponent(authConfig.api_key_name)}=${encodeURIComponent(authConfig.api_key_value)}`;
        } else {
          headers[authConfig.api_key_name] = authConfig.api_key_value;
        }
      }
      break;
    }
    case "basic": {
      if (authConfig.username && authConfig.password) {
        const encoded = Buffer.from(
          `${authConfig.username}:${authConfig.password}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }
      break;
    }
  }

  return url;
}

/**
 * Extract a nested value from an object using dot-notation path.
 * e.g. extractPath({ data: { results: [1,2] } }, "data.results") → [1,2]
 */
function extractPath(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const segment of path.split(".")) {
    if (current == null || typeof current !== "object") return current;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function buildHttpTool(
  config: HttpToolConfig,
  displayName: string,
  description: string
) {
  const toolName = makeHttpToolKey(displayName);
  const method = config.method;

  // Extract URL template parameters: {param} → ["param"]
  const urlParams = (config.url.match(/\{(\w+)\}/g) || []).map((p) =>
    p.slice(1, -1)
  );

  // Build input schema dynamically
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // URL path parameters
  for (const param of urlParams) {
    schemaFields[`path_${param}`] = z
      .string()
      .describe(`URL path parameter: ${param}`);
  }

  // Query parameters for GET requests
  if (method === "GET") {
    schemaFields.query_params = z
      .record(z.string(), z.string())
      .optional()
      .describe("Query parameters to append to the URL");
  }

  // Body for non-GET methods
  if (method !== "GET") {
    schemaFields.body = z
      .record(z.string(), z.unknown())
      .optional()
      .describe(config.body_description || "Request body data");
  }

  return {
    toolName,
    toolDef: tool({
      description,
      inputSchema: z.object(schemaFields),
      execute: async (params) => {
        // Build URL with path parameters
        let url = config.url;
        for (const param of urlParams) {
          const value = (params as Record<string, unknown>)[`path_${param}`];
          if (value != null) url = url.replace(`{${param}}`, String(value));
        }

        // Security: block internal network requests
        if (isBlockedUrl(url)) {
          return {
            success: false,
            message: "Requests to internal network addresses are not allowed.",
          };
        }

        // Append query params for GET
        const queryParams = (params as Record<string, unknown>).query_params as
          | Record<string, string>
          | undefined;
        if (queryParams && Object.keys(queryParams).length > 0) {
          const searchParams = new URLSearchParams(queryParams);
          url += (url.includes("?") ? "&" : "?") + searchParams.toString();
        }

        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(config.headers || {}),
        };

        // Apply auth (may modify URL for query-based API keys)
        url = applyAuth(headers, url, config.auth_type, config.auth_config);

        // Build request body
        const timeout = Math.min(
          config.timeout_ms ?? DEFAULT_TIMEOUT_MS,
          MAX_TIMEOUT_MS
        );
        const body =
          method !== "GET"
            ? JSON.stringify(
                (params as Record<string, unknown>).body ?? {}
              )
            : undefined;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeout);

          const res = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
          });
          clearTimeout(timer);

          const contentType = res.headers.get("content-type") ?? "";
          let responseData: unknown;

          if (contentType.includes("application/json")) {
            responseData = await res.json();
          } else {
            responseData = await res.text();
          }

          // Extract via response_path if configured
          if (
            config.response_path &&
            typeof responseData === "object" &&
            responseData !== null
          ) {
            responseData = extractPath(responseData, config.response_path);
          }

          // Trim result to prevent context bloat
          const trimmed = trimToolResult({ data: responseData });

          if (res.ok) {
            return { success: true, status: res.status, ...(trimmed as object) };
          }
          return {
            success: false,
            status: res.status,
            message: `HTTP ${res.status}: ${res.statusText}`,
            ...(trimmed as object),
          };
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return {
              success: false,
              message: `Request timed out after ${timeout}ms`,
            };
          }
          logger.error("HTTP tool execution error", {
            err,
            url: config.url,
          });
          return {
            success: false,
            message: "Could not reach the endpoint.",
          };
        }
      },
    }),
  };
}
