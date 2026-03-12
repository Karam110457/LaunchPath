/**
 * POST /api/composio/connect
 *
 * Initiates a connection for a Composio toolkit.
 *
 * Two-layer auth model:
 *   Layer 1 (Auth Config) — developer-level: defines HOW auth works (scheme, OAuth client creds).
 *   Layer 2 (Connected Account) — user-level: the actual credentials (API key, token, subdomain).
 *
 * For simple schemes (API_KEY, BEARER_TOKEN, BASIC):
 *   User credentials are passed at Layer 2 via connectedAccounts.initiate() + AuthScheme.*.
 *   The connection is immediately ACTIVE — no redirect needed.
 *
 * For OAuth schemes:
 *   authorize() returns a redirect URL. The user completes the OAuth flow in a popup.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient, flushComposio } from "@/lib/composio/client";
import type { ComposioAccountItem } from "@/lib/composio/types";
import { AuthScheme } from "@composio/core";
import { logger } from "@/lib/security/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthField = {
  name: string;
  displayName: string;
  description: string;
};

/** Result from ensureAuthConfig. */
type AuthConfigResult =
  | {
      ok: true;
      authConfigId: string;
      authScheme?: string;
      /** Connection-level required fields (Layer 2) for simple schemes. */
      connectionFields?: AuthField[];
    }
  | {
      ok: false;
      reason: string;
      /** Auth-config-level required fields (Layer 1) for OAuth dev setup. */
      requiredFields?: AuthField[];
      availableSchemes?: { mode: string; needsDevSetup: boolean }[];
    };

/** Shape of a single scheme in toolkit.authConfigDetails[]. */
type AuthDetail = {
  mode: string;
  fields?: {
    authConfigCreation?: { required?: AuthField[] };
    connectedAccountInitiation?: { required?: AuthField[] };
  };
};

type ToolkitInfo = {
  authConfigDetails?: AuthDetail[];
  composioManagedAuthSchemes?: string[];
};

/** Schemes where the user enters their own credentials directly — no developer app needed. */
const SIMPLE_AUTH_SCHEMES = new Set([
  "API_KEY", "BEARER_TOKEN", "BASIC", "BASIC_WITH_JWT", "GOOGLE_SERVICE_ACCOUNT",
]);

// ---------------------------------------------------------------------------
// ensureAuthConfig — Layer 1 (auth config creation/reuse)
// ---------------------------------------------------------------------------

/**
 * Ensures an auth config exists for a toolkit, creating one if needed.
 * Also returns the connection-level required fields for simple schemes
 * so the frontend knows what form to show the user.
 */
async function ensureAuthConfig(
  composio: ReturnType<typeof getComposioClient>,
  toolkit: string,
  toolkitName: string,
  preferredScheme?: string,
): Promise<AuthConfigResult> {
  // Fetch toolkit metadata — we need this for connection fields regardless
  const toolkitInfo = (await composio.toolkits.get(toolkit)) as unknown as ToolkitInfo;
  const allSchemes = toolkitInfo.authConfigDetails ?? [];

  // Helper: get connection-level required fields for a scheme
  const getConnectionFields = (scheme: AuthDetail): AuthField[] =>
    (scheme.fields?.connectedAccountInitiation?.required ?? []).map((f) => ({
      name: f.name,
      displayName: f.displayName,
      description: f.description,
    }));

  // 1. Check for an existing auth config
  type ConfigItem = { id: string; authScheme?: string };
  const existing = await composio.authConfigs.list({ toolkit });
  const existingItem = ((existing as unknown as { items: ConfigItem[] }).items ?? [])[0];
  if (existingItem?.id) {
    // Figure out the scheme from the existing config or toolkit metadata
    const scheme = existingItem.authScheme?.toUpperCase()
      ?? allSchemes[0]?.mode?.toUpperCase();
    const schemeDetail = allSchemes.find(
      (s) => s.mode.toUpperCase() === scheme
    );
    return {
      ok: true,
      authConfigId: existingItem.id,
      authScheme: scheme,
      connectionFields: schemeDetail ? getConnectionFields(schemeDetail) : undefined,
    };
  }

  // 2. Try Composio-managed auth (works for OAuth tools where Composio
  //    provides its own developer credentials, e.g. Google, GitHub)
  try {
    const config = await composio.authConfigs.create(toolkit, {
      type: "use_composio_managed_auth" as const,
      name: `${toolkitName} Auth Config`,
    });
    return { ok: true, authConfigId: config.id, authScheme: config.authScheme };
  } catch {
    // Managed auth not available for this toolkit
  }

  if (allSchemes.length === 0) {
    return {
      ok: false,
      reason: `${toolkitName} has no authentication schemes configured in Composio.`,
    };
  }

  // 3. Determine the target scheme
  const targetScheme = preferredScheme
    ? allSchemes.find((s) => s.mode.toUpperCase() === preferredScheme.toUpperCase())
    : allSchemes.find((s) => SIMPLE_AUTH_SCHEMES.has(s.mode.toUpperCase()))
      ?? allSchemes[0];

  if (!targetScheme) {
    return {
      ok: false,
      reason: `No matching auth scheme found for ${toolkitName}.`,
    };
  }

  const mode = targetScheme.mode.toUpperCase();
  const isSimple = SIMPLE_AUTH_SCHEMES.has(mode);
  const configCreationFields = targetScheme.fields?.authConfigCreation?.required ?? [];

  // 4. For simple schemes: create auth config with empty credentials
  //    (user credentials go at Layer 2, not Layer 1)
  if (isSimple) {
    try {
      const config = await composio.authConfigs.create(toolkit, {
        type: "use_custom_auth" as const,
        authScheme: targetScheme.mode as "API_KEY" | "BASIC" | "BEARER_TOKEN",
        name: `${toolkitName} ${targetScheme.mode} Auth Config`,
        credentials: {} as Record<string, string | number | boolean>,
      });
      return {
        ok: true,
        authConfigId: config.id,
        authScheme: targetScheme.mode,
        connectionFields: getConnectionFields(targetScheme),
      };
    } catch (e) {
      return {
        ok: false,
        reason: `Failed to create auth config for ${toolkitName}: ${e instanceof Error ? e.message : "Unknown error"}`,
      };
    }
  }

  // 5. For OAuth/complex schemes that need developer credentials at Layer 1
  if (configCreationFields.length > 0) {
    const fieldNames = configCreationFields
      .map((f) => f.displayName || f.name)
      .join(", ");
    return {
      ok: false,
      reason: `${toolkitName} requires custom ${fieldNames}. Register a developer application with ${toolkitName} and provide your credentials.`,
      requiredFields: configCreationFields.map((f) => ({
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

  // 6. OAuth scheme with no config-creation fields — try creating it
  try {
    const config = await composio.authConfigs.create(toolkit, {
      type: "use_custom_auth" as const,
      authScheme: targetScheme.mode as "OAUTH2" | "OAUTH1",
      name: `${toolkitName} ${targetScheme.mode} Auth Config`,
      credentials: {} as Record<string, string | number | boolean>,
    });
    return { ok: true, authConfigId: config.id, authScheme: targetScheme.mode };
  } catch (e) {
    return {
      ok: false,
      reason: `Failed to create auth config for ${toolkitName}: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }
}

// ---------------------------------------------------------------------------
// buildConnectionConfig — Layer 2 (user credentials for initiate())
// ---------------------------------------------------------------------------

/**
 * Builds the AuthScheme config object for connectedAccounts.initiate().
 * Maps the user-provided credentials to the correct AuthScheme helper.
 */
function buildConnectionConfig(
  scheme: string,
  credentials: Record<string, string>,
) {
  const mode = scheme.toUpperCase();
  switch (mode) {
    case "API_KEY":
      return AuthScheme.APIKey(credentials);
    case "BEARER_TOKEN":
      return AuthScheme.BearerToken(credentials as { token: string });
    case "BASIC":
      return AuthScheme.Basic(credentials as { username: string; password: string });
    case "BASIC_WITH_JWT":
      return AuthScheme.BasicWithJWT(credentials as { username: string; password: string });
    case "GOOGLE_SERVICE_ACCOUNT":
      return AuthScheme.GoogleServiceAccount(credentials as { credentials_json: string });
    case "NO_AUTH":
      return AuthScheme.NoAuth();
    default:
      logger.warn("Unknown auth scheme, falling back to APIKey", { scheme: mode });
      return AuthScheme.APIKey(credentials);
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

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
    /**
     * User-provided credentials.
     * For simple schemes: the actual API key, token, subdomain, etc. (Layer 2)
     * For OAuth: developer app credentials like client_id/secret (Layer 1)
     */
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

    // Check if user already has an active connection for this toolkit
    const existing = await composio.connectedAccounts.list({
      userIds: [user.id],
      toolkitSlugs: [toolkit],
    });
    const items = (existing as unknown as { items: ComposioAccountItem[] }).items ?? [];
    const active = items.find(
      (a) => a.toolkit?.slug === toolkit && a.status === "ACTIVE"
    );

    if (active) {
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

    // -----------------------------------------------------------------------
    // Handle OAuth developer credentials (Layer 1)
    // When the user provides OAuth client_id/secret, create the auth config
    // with those credentials, then proceed to authorize() for the redirect.
    // -----------------------------------------------------------------------
    const resolvedScheme = (authScheme ?? "").toUpperCase();
    const isOAuthWithCustomCreds =
      customCredentials &&
      Object.keys(customCredentials).length > 0 &&
      !SIMPLE_AUTH_SCHEMES.has(resolvedScheme) &&
      (resolvedScheme === "OAUTH2" || resolvedScheme === "OAUTH1");

    if (isOAuthWithCustomCreds) {
      // Always create a fresh auth config with the user's custom OAuth credentials.
      // Don't reuse existing configs — they may belong to a different user/app registration.
      const config = await composio.authConfigs.create(toolkit, {
        type: "use_custom_auth" as const,
        authScheme: resolvedScheme as "OAUTH2" | "OAUTH1",
        name: `${toolkitName} Auth Config`,
        credentials: customCredentials as Record<string, string | number | boolean>,
      });
      const authConfigId = config.id;

      // Proceed to OAuth redirect flow
      const connection = await composio.toolkits.authorize(
        user.id,
        toolkit,
        authConfigId,
      );
      const connResult = connection as unknown as {
        id?: string;
        connected_account_id?: string;
        redirectUrl?: string;
      };
      const composioAccountId = connResult.id ?? connResult.connected_account_id ?? null;

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
      return NextResponse.json({ redirectUrl: connResult.redirectUrl });
    }

    // -----------------------------------------------------------------------
    // Standard flow: ensure auth config exists (Layer 1)
    // -----------------------------------------------------------------------
    const authResult = await ensureAuthConfig(
      composio, toolkit, toolkitName, authScheme
    );

    if (!authResult.ok) {
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

    const effectiveScheme = (authResult.authScheme ?? "").toUpperCase();
    const isSimpleScheme = SIMPLE_AUTH_SCHEMES.has(effectiveScheme);

    // -----------------------------------------------------------------------
    // Simple scheme path (API_KEY, BEARER_TOKEN, BASIC)
    // User credentials go at Layer 2 via connectedAccounts.initiate()
    // -----------------------------------------------------------------------
    if (isSimpleScheme) {
      const hasCredentials = customCredentials && Object.keys(customCredentials).length > 0;

      if (!hasCredentials) {
        // No credentials yet — tell the frontend what fields to collect
        const connFields = authResult.connectionFields ?? [];
        void flushComposio();
        return NextResponse.json(
          {
            error: `${toolkitName} requires your credentials to connect.`,
            code: "CREDENTIALS_REQUIRED",
            requiredFields: connFields.length > 0
              ? connFields
              : [{ name: "api_key", displayName: "API Key", description: `Your ${toolkitName} API key` }],
            authScheme: effectiveScheme,
          },
          { status: 400 }
        );
      }

      // Credentials provided — initiate connection directly (Layer 2)
      const config = buildConnectionConfig(effectiveScheme, customCredentials);
      const connection = await composio.connectedAccounts.initiate(
        user.id,
        authResult.authConfigId,
        { config },
      );

      const connResult = connection as unknown as {
        id?: string;
        connected_account_id?: string;
        status?: string;
        redirectUrl?: string;
      };
      const composioAccountId = connResult.id ?? connResult.connected_account_id ?? null;
      const isFailed = connResult.status === "FAILED" || connResult.status === "EXPIRED";
      const isActive = !isFailed && (connResult.status === "ACTIVE" || !connResult.redirectUrl);

      if (isFailed) {
        void flushComposio();
        return NextResponse.json(
          { error: `${toolkitName} connection failed. The credentials may be invalid.` },
          { status: 400 }
        );
      }

      await supabase.from("user_composio_connections").upsert(
        {
          user_id: user.id,
          toolkit,
          toolkit_name: toolkitName,
          toolkit_icon: toolkitIcon ?? null,
          status: isActive ? "active" : "pending",
          composio_account_id: composioAccountId,
        },
        { onConflict: "user_id,toolkit" }
      );

      void flushComposio();
      return NextResponse.json({
        redirectUrl: connResult.redirectUrl ?? null,
        status: isActive ? "active" : "pending",
      });
    }

    // -----------------------------------------------------------------------
    // OAuth / complex scheme path — use authorize() for redirect flow
    // -----------------------------------------------------------------------
    const connection = await composio.toolkits.authorize(
      user.id,
      toolkit,
      authResult.authConfigId,
    );

    const connResult = connection as unknown as {
      id?: string;
      connected_account_id?: string;
      redirectUrl?: string;
    };
    const composioAccountId = connResult.id ?? connResult.connected_account_id ?? null;

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
    return NextResponse.json({ redirectUrl: connResult.redirectUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    logger.error("Composio connect failed", {
      userId: user.id,
      toolkit,
      error: message,
    });

    // Parse Composio API errors for better user messages
    if (
      message.includes("Missing required field") ||
      message.includes("ConnectedAccount_MissingRequiredFields")
    ) {
      // The connection needs credentials we don't have yet.
      // Try to fetch the toolkit metadata to get the required fields.
      try {
        const composio = getComposioClient();
        const toolkitInfo = (await composio.toolkits.get(toolkit)) as unknown as ToolkitInfo;
        const allSchemes = toolkitInfo.authConfigDetails ?? [];
        const targetScheme = allSchemes.find((s) => SIMPLE_AUTH_SCHEMES.has(s.mode.toUpperCase()))
          ?? allSchemes[0];
        const connFields = targetScheme?.fields?.connectedAccountInitiation?.required ?? [];

        void flushComposio();
        return NextResponse.json(
          {
            error: `${toolkitName} requires your credentials to connect.`,
            code: "CREDENTIALS_REQUIRED",
            requiredFields: connFields.length > 0
              ? connFields.map((f) => ({ name: f.name, displayName: f.displayName, description: f.description }))
              : [{ name: "api_key", displayName: "API Key", description: `Your ${toolkitName} API key` }],
            authScheme: targetScheme?.mode?.toUpperCase() ?? "API_KEY",
          },
          { status: 400 }
        );
      } catch {
        // If metadata fetch fails, still return a helpful error
      }

      void flushComposio();
      return NextResponse.json(
        {
          error: `${toolkitName} requires credentials to connect.`,
          code: "CREDENTIALS_REQUIRED",
          requiredFields: [{ name: "api_key", displayName: "API Key", description: `Your ${toolkitName} API key` }],
          authScheme: "API_KEY",
        },
        { status: 400 }
      );
    }

    let userError = "Failed to initiate connection. Please try again.";
    if (message.includes("Auth_Config_ValidationError")) {
      userError = `${toolkitName} requires developer credentials that aren't available. This app may need custom OAuth setup.`;
    }

    void flushComposio();
    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
