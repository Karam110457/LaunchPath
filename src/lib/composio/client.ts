/**
 * Composio SDK singleton.
 *
 * Lazy-initialized — the client is only created when first requested.
 * Requires COMPOSIO_API_KEY in the environment.
 */

import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

let _client: Composio<VercelProvider> | null = null;

export function getComposioClient(): Composio<VercelProvider> {
  if (_client) return _client;

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COMPOSIO_API_KEY is not set. Add it to .env.local to enable app integrations."
    );
  }

  _client = new Composio<VercelProvider>({
    apiKey,
    // "latest" ensures users see all available actions — without this the SDK
    // defaults to the base version (00000000_00) which has fewer tools.
    toolkitVersions: "latest",
    // strict: false (default) keeps all parameters visible to the LLM.
    // Our modifySchema callback already strips hardcoded (pinned) params —
    // using strict: true on top of that hides optional-but-important fields
    // like event_duration_hour, summary, timezone from the LLM, causing it
    // to guess values or skip them entirely.
    provider: new VercelProvider(),
  });

  return _client;
}

/**
 * Flush Composio telemetry. Important in serverless/edge environments
 * where the process may terminate between requests.
 * Non-blocking — errors are silently ignored.
 */
export async function flushComposio(): Promise<void> {
  if (!_client) return;
  try {
    await _client.flush();
  } catch {
    // Non-critical — telemetry loss is acceptable
  }
}
