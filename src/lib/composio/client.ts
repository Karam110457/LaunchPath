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
    provider: new VercelProvider(),
  });

  return _client;
}
