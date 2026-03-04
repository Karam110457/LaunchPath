/**
 * POST /api/composio/connect
 *
 * Initiates an OAuth connection for a Composio toolkit.
 * Returns a redirect URL for the OAuth flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient, flushComposio } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";
/**
 * Ensures an auth config exists for a toolkit, creating one if needed.
 *
 * The SDK's authorize() only tries "use_composio_managed_auth", which fails
 * for API key / bearer token tools (returns 400). This helper:
 * 1. Checks for an existing auth config
 * 2. If none, tries Composio-managed auth (works for most OAuth tools)
 * 3. If that fails, fetches toolkit metadata and creates a custom auth config
 *    with the correct auth scheme (API_KEY, BEARER_TOKEN, etc.)
 */
async function ensureAuthConfig(
  composio: ReturnType<typeof getComposioClient>,
  toolkit: string,
  toolkitName: string
): Promise<string | undefined> {
  type ConfigItem = { id: string };
  const existing = await composio.authConfigs.list({ toolkit });
  const existingId = ((existing as unknown as { items: ConfigItem[] }).items ?? [])[0]?.id;
  if (existingId) return existingId;

  // No auth config exists — try managed auth first (works for OAuth tools)
  try {
    const config = await composio.authConfigs.create(toolkit, {
      type: "use_composio_managed_auth" as const,
      name: `${toolkitName} Auth Config`,
    });
    return config.id;
  } catch {
    // Managed auth not available — fall through to custom
  }

  // Fetch toolkit metadata to determine the correct auth scheme
  type ToolkitInfo = { authConfigDetails?: { mode: string }[] };
  const toolkitInfo = (await composio.toolkits.get(toolkit)) as unknown as ToolkitInfo;
  const authScheme = toolkitInfo.authConfigDetails?.[0]?.mode ?? "API_KEY";

  const config = await composio.authConfigs.create(toolkit, {
    type: "use_custom_auth" as const,
    // Cast to the SDK's expected union — runtime value is the actual scheme string
    authScheme: authScheme as "API_KEY" | "BEARER_TOKEN" | "BASIC" | "OAUTH2",
    credentials: {},
    name: `${toolkitName} Auth Config`,
  });
  return config.id;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    toolkit: string;
    toolkitName: string;
    toolkitIcon?: string;
  };

  const { toolkit, toolkitName, toolkitIcon } = body;

  if (!toolkit || !toolkitName) {
    return NextResponse.json(
      { error: "toolkit and toolkitName are required" },
      { status: 400 }
    );
  }

  try {
    const composio = getComposioClient();

    // Check if user already has an active connection for this toolkit.
    // Avoids creating duplicate connected accounts (Composio warns about this).
    type AccountItem = { id: string; toolkit: { slug: string }; status: string };
    const existing = await composio.connectedAccounts.list({
      userIds: [user.id],
      toolkitSlugs: [toolkit],
    });
    const items = (existing as unknown as { items: AccountItem[] }).items ?? [];
    const active = items.find(
      (a) => a.toolkit?.slug === toolkit && a.status === "ACTIVE"
    );

    if (active) {
      // Already connected — update our DB and return immediately
      await supabase.from("user_composio_connections").upsert(
        {
          user_id: user.id,
          toolkit,
          toolkit_name: toolkitName,
          toolkit_icon: toolkitIcon ?? null,
          status: "active",
          composio_account_id: active.id,
        },
        { onConflict: "user_id,toolkit" }
      );
      return NextResponse.json({ redirectUrl: null, status: "active" });
    }

    // Ensure an auth config exists for the toolkit before authorizing.
    // The SDK's authorize() only tries "use_composio_managed_auth" by default,
    // which fails for API key / bearer token tools. We handle that here.
    const authConfigId = await ensureAuthConfig(composio, toolkit, toolkitName);

    // Authorize the user for this toolkit via Composio SDK.
    // Composio returns a hosted auth page URL for both OAuth and API key flows.
    const connection = await composio.toolkits.authorize(user.id, toolkit, authConfigId);

    // The SDK may return `id` or `connected_account_id` depending on version
    const connResult = connection as unknown as {
      id?: string;
      connected_account_id?: string;
      redirectUrl?: string;
    };
    const composioAccountId = connResult.id ?? connResult.connected_account_id ?? null;

    // Upsert the connection record in our DB
    await supabase.from("user_composio_connections").upsert(
      {
        user_id: user.id,
        toolkit,
        toolkit_name: toolkitName,
        toolkit_icon: toolkitIcon ?? null,
        status: "pending",
        composio_account_id: composioAccountId,
      },
      { onConflict: "user_id,toolkit" }
    );

    // For no-auth apps, redirectUrl may be null — mark active immediately
    if (!connResult.redirectUrl) {
      await supabase
        .from("user_composio_connections")
        .update({ status: "active" })
        .eq("user_id", user.id)
        .eq("toolkit", toolkit);

      void flushComposio();
      return NextResponse.json({ redirectUrl: null, status: "active" });
    }

    void flushComposio();
    return NextResponse.json({
      redirectUrl: connResult.redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    logger.error("Composio connect failed", {
      userId: user.id,
      toolkit,
      error: message,
    });

    void flushComposio();
    return NextResponse.json(
      { error: "Failed to initiate connection. Please try again." },
      { status: 500 }
    );
  }
}
