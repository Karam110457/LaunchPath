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
 * Result from ensureAuthConfig — either an auth config ID or a description
 * of what credentials are needed so the frontend can inform the user.
 */
type AuthConfigResult =
  | { ok: true; authConfigId: string; authScheme?: string }
  | {
      ok: false;
      reason: string;
      requiredFields?: { name: string; displayName: string; description: string }[];
      availableSchemes?: { mode: string; needsDevSetup: boolean }[];
    };

/** Fields needed to create an auth config for a specific scheme. */
type AuthField = { name: string; displayName: string; description: string };
type AuthDetail = { mode: string; fields?: { authConfigCreation?: { required?: AuthField[] } } };
type ToolkitInfo = {
  authConfigDetails?: AuthDetail[];
  composioManagedAuthSchemes?: string[];
};

/** Schemes that don't require developer app registration — user enters credentials directly. */
const SIMPLE_AUTH_SCHEMES = new Set(["API_KEY", "BEARER_TOKEN", "BASIC"]);

/**
 * Ensures an auth config exists for a toolkit, creating one if needed.
 *
 * Tries multiple strategies in order:
 * 1. Reuse an existing auth config
 * 2. Create a Composio-managed auth config (works when Composio hosts
 *    the developer credentials, e.g. Google, GitHub)
 * 3. If a preferred scheme is specified, attempt that scheme directly
 * 4. For apps with multiple schemes (e.g. Shopify has OAuth2 + API_KEY),
 *    find a "simple" scheme (API_KEY, BEARER_TOKEN, BASIC) that works
 *    without developer app registration
 * 5. If all schemes require custom credentials, return an error with
 *    the required fields so the frontend can inform the user
 */
async function ensureAuthConfig(
  composio: ReturnType<typeof getComposioClient>,
  toolkit: string,
  toolkitName: string,
  preferredScheme?: string,
  customCredentials?: Record<string, string>
): Promise<AuthConfigResult> {
  // 1. Check for an existing auth config
  type ConfigItem = { id: string };
  const existing = await composio.authConfigs.list({ toolkit });
  const existingId = ((existing as unknown as { items: ConfigItem[] }).items ?? [])[0]?.id;
  if (existingId) return { ok: true, authConfigId: existingId };

  // 1b. If custom credentials were provided, create a custom auth config
  //     immediately — this handles the case where the user filled in a
  //     credentials form (e.g. Shopify OAuth client_id/secret).
  if (customCredentials && preferredScheme && Object.keys(customCredentials).length > 0) {
    const config = await composio.authConfigs.create(toolkit, {
      type: "use_custom_auth" as const,
      authScheme: preferredScheme as "OAUTH2" | "OAUTH1" | "API_KEY" | "BASIC" | "BEARER_TOKEN",
      name: `${toolkitName} Auth Config`,
      credentials: customCredentials as Record<string, string | number | boolean>,
    });
    return { ok: true, authConfigId: config.id, authScheme: preferredScheme };
  }

  // 2. Try Composio-managed auth (works for OAuth tools where Composio
  //    provides its own developer credentials)
  try {
    const config = await composio.authConfigs.create(toolkit, {
      type: "use_composio_managed_auth" as const,
      name: `${toolkitName} Auth Config`,
    });
    return { ok: true, authConfigId: config.id };
  } catch {
    // Managed auth not available for this toolkit
  }

  // 3. Fetch toolkit metadata to inspect all available auth schemes
  const toolkitInfo = (await composio.toolkits.get(toolkit)) as unknown as ToolkitInfo;
  const allSchemes = toolkitInfo.authConfigDetails ?? [];

  if (allSchemes.length === 0) {
    // No auth details at all — let authorize() figure it out
    return { ok: true, authConfigId: "" };
  }

  // 4. If a preferred scheme was specified, honor the user's choice
  if (preferredScheme) {
    const preferred = allSchemes.find(
      (s) => s.mode.toUpperCase() === preferredScheme.toUpperCase()
    );
    if (preferred) {
      const requiredFields = preferred.fields?.authConfigCreation?.required ?? [];
      if (requiredFields.length === 0 || SIMPLE_AUTH_SCHEMES.has(preferred.mode.toUpperCase())) {
        // Simple scheme (API_KEY, BEARER_TOKEN, BASIC) — create an explicit
        // auth config so authorize() knows which scheme to use. Without this,
        // authorize() defaults to OAuth2 which fails for apps like Shopify.
        try {
          const config = await composio.authConfigs.create(toolkit, {
            type: "use_custom_auth" as const,
            authScheme: preferred.mode as "OAUTH2" | "OAUTH1" | "API_KEY" | "BASIC" | "BEARER_TOKEN",
            name: `${toolkitName} ${preferred.mode} Auth Config`,
            credentials: {} as Record<string, string | number | boolean>,
          });
          return { ok: true, authConfigId: config.id, authScheme: preferred.mode };
        } catch {
          // If config creation fails, return empty — authorize() will try to resolve
          return { ok: true, authConfigId: "", authScheme: preferred.mode };
        }
      }

      // The user explicitly chose a scheme that requires custom credentials
      // (e.g. OAuth2 for Shopify). Return an error with the required fields
      // so the frontend can collect them via a form.
      const fieldNames = requiredFields.length > 0
        ? requiredFields.map((f) => f.displayName || f.name).join(", ")
        : "developer credentials (client ID, client secret)";

      return {
        ok: false,
        reason: `${toolkitName} OAuth requires custom ${fieldNames}. You'll need to register a developer application with ${toolkitName} and provide your own credentials.`,
        requiredFields: requiredFields.map((f) => ({
          name: f.name,
          displayName: f.displayName,
          description: f.description,
        })),
        availableSchemes: allSchemes.map((s) => ({
          mode: s.mode,
          needsDevSetup: !SIMPLE_AUTH_SCHEMES.has(s.mode.toUpperCase()) &&
            (s.fields?.authConfigCreation?.required ?? []).length > 0,
        })),
      };
    }
  }

  // 5. Look for any simple auth scheme that works without dev credentials.
  //    For API_KEY / BEARER_TOKEN / BASIC, authorize() shows a hosted page
  //    where the user enters their credentials directly — no developer app
  //    registration needed.
  const simpleScheme = allSchemes.find((s) => {
    const mode = s.mode.toUpperCase();
    if (!SIMPLE_AUTH_SCHEMES.has(mode)) return false;
    // Double-check it doesn't have unusual required fields for config creation
    const required = s.fields?.authConfigCreation?.required ?? [];
    return required.length === 0;
  });

  if (simpleScheme) {
    // Create an explicit auth config for the simple scheme so authorize()
    // doesn't default to OAuth2. See step 4 comment for details.
    try {
      const config = await composio.authConfigs.create(toolkit, {
        type: "use_custom_auth" as const,
        authScheme: simpleScheme.mode as "API_KEY" | "BASIC" | "BEARER_TOKEN",
        name: `${toolkitName} ${simpleScheme.mode} Auth Config`,
        credentials: {} as Record<string, string | number | boolean>,
      });
      return { ok: true, authConfigId: config.id, authScheme: simpleScheme.mode };
    } catch {
      return { ok: true, authConfigId: "", authScheme: simpleScheme.mode };
    }
  }

  // 6. All schemes require custom developer credentials.
  //    Return information about available schemes so the frontend can inform the user.
  const primaryScheme = allSchemes[0];
  const requiredFields = primaryScheme?.fields?.authConfigCreation?.required ?? [];
  const fieldNames = requiredFields.length > 0
    ? requiredFields.map((f) => f.displayName || f.name).join(", ")
    : "developer credentials (client ID, client secret)";

  return {
    ok: false,
    reason: `${toolkitName} requires custom ${fieldNames}. This app needs you to register a developer application with ${toolkitName} and provide your own credentials. Composio does not provide managed authentication for this app.`,
    requiredFields: requiredFields.map((f) => ({
      name: f.name,
      displayName: f.displayName,
      description: f.description,
    })),
    availableSchemes: allSchemes.map((s) => ({
      mode: s.mode,
      needsDevSetup: !SIMPLE_AUTH_SCHEMES.has(s.mode.toUpperCase()) &&
        (s.fields?.authConfigCreation?.required ?? []).length > 0,
    })),
  };
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
    /** Optional preferred auth scheme (e.g. "API_KEY", "OAUTH2") */
    authScheme?: string;
    /** Custom developer credentials for OAuth (e.g. { client_id, client_secret }) */
    customCredentials?: Record<string, string>;
  };

  const { toolkit, toolkitName, toolkitIcon, authScheme, customCredentials } = body;

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
    const authResult = await ensureAuthConfig(composio, toolkit, toolkitName, authScheme, customCredentials);

    if (!authResult.ok) {
      // The toolkit requires custom credentials the user hasn't provided.
      // Return a specific error so the frontend can show a helpful message.
      void flushComposio();
      return NextResponse.json(
        {
          error: authResult.reason,
          code: "CUSTOM_CREDENTIALS_REQUIRED",
          requiredFields: authResult.requiredFields,
          availableSchemes: authResult.availableSchemes,
        },
        { status: 400 }
      );
    }

    // Authorize the user for this toolkit via Composio SDK.
    // Composio returns a hosted auth page URL for both OAuth and API key flows.
    // Pass authConfigId if we have one — empty string means let authorize() auto-resolve.
    const connection = await composio.toolkits.authorize(
      user.id,
      toolkit,
      authResult.authConfigId || undefined
    );

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

    // Extract a more specific error message from Composio API errors
    let userError = "Failed to initiate connection. Please try again.";
    if (message.includes("Missing required field") || message.includes("Auth_Config_ValidationError")) {
      userError = `${toolkitName} requires developer credentials that aren't available. This app may need custom OAuth setup.`;
    }

    void flushComposio();
    return NextResponse.json(
      { error: userError },
      { status: 500 }
    );
  }
}
