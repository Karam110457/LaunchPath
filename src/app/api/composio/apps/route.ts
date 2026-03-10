/**
 * GET /api/composio/apps
 *
 * Returns available Composio app integrations.
 * Fetches from Composio SDK with in-memory cache (5 min TTL).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";

export interface ComposioApp {
  toolkit: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  authSchemes?: string[];
  composioManagedAuthSchemes?: string[];
  noAuth?: boolean;
  toolsCount?: number;
  logo?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  email: "Email",
  crm: "CRM",
  communication: "Communication",
  scheduling: "Scheduling",
  productivity: "Productivity",
  "project-management": "Project Management",
  social: "Social Media",
  "developer-tools": "Developer Tools",
  finance: "Finance",
  "customer-support": "Customer Support",
  storage: "File Storage",
  ecommerce: "E-commerce",
  marketing: "Marketing",
  analytics: "Analytics",
  automation: "Automation",
  other: "Other",
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Avoids re-fetching 900+ toolkits from Composio on every modal open.
// TTL: 5 minutes. Shared across requests on the same serverless instance.

let _cachedApps: ComposioApp[] | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedApps(): Promise<ComposioApp[]> {
  if (_cachedApps && Date.now() < _cacheExpiry) {
    return _cachedApps;
  }

  const composio = getComposioClient();

  const toolkits = await composio.toolkits.get({
    sortBy: "usage",
  });

  const apps: ComposioApp[] = (toolkits as unknown as ComposioToolkitItem[])
    .filter((t) => !t.isLocalToolkit)
    .map((t) => {
      const primaryCategory = t.meta?.categories?.[0]?.slug ?? "other";

      return {
        toolkit: t.slug,
        name: t.name,
        icon: t.meta?.logo ?? t.name.charAt(0),
        logo: t.meta?.logo ?? null,
        category: primaryCategory,
        description: t.meta?.description ?? "",
        authSchemes: t.authSchemes ?? [],
        composioManagedAuthSchemes: t.composioManagedAuthSchemes ?? [],
        noAuth: t.noAuth ?? false,
        toolsCount: t.meta?.toolsCount ?? 0,
      };
    });

  _cachedApps = apps;
  _cacheExpiry = Date.now() + CACHE_TTL_MS;

  return apps;
}

// ─── Route handler ───────────────────────────────────────────────────────────

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
  const searchQuery = searchParams.get("search") || undefined;

  try {
    const apps = await getCachedApps();

    let filtered = apps;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.toolkit.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      apps: filtered,
      categories: CATEGORY_LABELS,
    });
  } catch (err) {
    logger.error("Failed to fetch Composio apps", {
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json({
      apps: [],
      categories: CATEGORY_LABELS,
    });
  }
}

/** Shape of items returned by composio.toolkits.get() */
interface ComposioToolkitItem {
  slug: string;
  name: string;
  isLocalToolkit: boolean;
  authSchemes?: string[];
  composioManagedAuthSchemes?: string[];
  noAuth?: boolean;
  meta?: {
    logo?: string;
    description?: string;
    categories?: { slug: string; name: string }[];
    toolsCount?: number;
    triggersCount?: number;
  };
}
