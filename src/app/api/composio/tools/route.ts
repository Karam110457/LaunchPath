/**
 * GET /api/composio/tools?toolkit=gmail[&include_schemas=true]
 *
 * Returns the available actions for a Composio toolkit.
 * All actions are returned with an `isImportant` flag.
 * When `include_schemas=true`, each action includes its full inputSchema
 * for parameter pinning UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";
import type { ComposioActionSchema, JsonSchemaProperty } from "@/lib/tools/types";

type RawTool = {
  slug: string;
  name: string;
  description?: string;
  inputParameters?: {
    type?: string;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const toolkit = searchParams.get("toolkit");
  const includeSchemas = searchParams.get("include_schemas") === "true";

  if (!toolkit) {
    return NextResponse.json(
      { error: "toolkit query param is required" },
      { status: 400 }
    );
  }

  try {
    const composio = getComposioClient();

    // Fetch important and all actions in parallel
    const [importantRaw, allRaw] = await Promise.all([
      composio.tools
        .getRawComposioTools({ toolkits: [toolkit], important: true, limit: 50 })
        .then((r) => (r ?? []) as unknown as RawTool[])
        .catch(() => [] as RawTool[]),
      composio.tools
        .getRawComposioTools({ toolkits: [toolkit], limit: 100 })
        .then((r) => (r ?? []) as unknown as RawTool[])
        .catch(() => [] as RawTool[]),
    ]);

    const importantSlugs = new Set(importantRaw.map((t) => t.slug));

    // Use allRaw as the base. If it's empty (some toolkits only return
    // results with important: true), fall back to importantRaw.
    const base = allRaw.length > 0 ? allRaw : importantRaw;

    const tools: ComposioActionSchema[] = base.map((t) => {
      const displayName =
        t.name ||
        t.slug
          .replace(/^[A-Z]+_/, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const result: ComposioActionSchema = {
        slug: t.slug,
        name: displayName,
        description: t.description ?? "",
        isImportant: importantSlugs.has(t.slug),
      };

      if (includeSchemas && t.inputParameters) {
        result.inputSchema = {
          type: "object",
          properties: (t.inputParameters.properties ?? {}) as Record<
            string,
            JsonSchemaProperty
          >,
          required: t.inputParameters.required,
        };
      }

      return result;
    });

    // Sort: important actions first, then alphabetical
    tools.sort((a, b) => {
      if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ tools });
  } catch (err) {
    logger.error("Composio tools fetch failed", {
      userId: user.id,
      toolkit,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to fetch tools for this app" },
      { status: 500 }
    );
  }
}
