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
    // strict: true strips non-required parameters from tool schemas.
    // This dramatically reduces token usage and prevents the LLM from
    // hallucinating values for optional fields it doesn't need.
    provider: new VercelProvider({ strict: true }),
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
