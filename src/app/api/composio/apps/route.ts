/**
 * GET /api/composio/apps
 *
 * Returns available Composio app integrations.
 * Fetches real-time data from Composio SDK with fallback to curated list.
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
  const category = searchParams.get("category") || undefined;
  const searchQuery = searchParams.get("search") || undefined;

  try {
    const composio = getComposioClient();

    // Fetch real toolkit data from Composio
    const toolkits = await composio.toolkits.get({
      sortBy: "usage",
      ...(category ? { category } : {}),
    });

    // Transform to our app format
    const apps: ComposioApp[] = (toolkits as unknown as ComposioToolkitItem[])
      .filter((t) => !t.isLocalToolkit)
      .map((t) => {
        const primaryCategory =
          t.meta?.categories?.[0]?.slug ?? "other";

        return {
          toolkit: t.slug,
          name: t.name,
          icon: t.meta?.logo ?? t.name.charAt(0),
          logo: t.meta?.logo ?? null,
          category: primaryCategory,
          description: t.meta?.description ?? "",
          authSchemes: t.authSchemes ?? [],
          noAuth: t.noAuth ?? false,
          toolsCount: t.meta?.toolsCount ?? 0,
        };
      });

    // Client-side search filtering (Composio SDK doesn't have search param on list)
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

    // Return empty list on failure — UI can show appropriate message
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
