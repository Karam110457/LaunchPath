/**
 * CRM Import via Composio
 * POST /api/campaigns/[campaignId]/contacts/import-crm
 * Body: { toolkit: string, action?: string }
 * Query: ?preview=true — return contacts without importing
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, agent_id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) return NextResponse.json({ error: "No channel found" }, { status: 400 });

  const body = (await req.json()) as {
    toolkit: string;
    action?: string;
  };

  if (!body.toolkit) {
    return NextResponse.json({ error: "toolkit is required" }, { status: 400 });
  }

  const preview = new URL(req.url).searchParams.get("preview") === "true";

  try {
    // Dynamically import Composio client
    const { getComposioClient } = await import("@/lib/composio/client");
    const composio = getComposioClient();

    // Get available actions for the toolkit
    const actionName = body.action || `${body.toolkit.toUpperCase()}_LIST_CONTACTS`;

    // Execute the action to fetch contacts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (composio as any).executeAction({
      action: actionName,
      entityId: user.id,
      params: {},
    });

    // Parse contacts from result
    const rawContacts = extractContacts(result);

    if (preview) {
      return NextResponse.json({
        contacts: rawContacts.slice(0, 50),
        total: rawContacts.length,
        preview: true,
      });
    }

    // Import contacts
    let imported = 0;
    let skipped = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromAny = supabase.from as any;

    for (const c of rawContacts) {
      if (!c.phone) {
        skipped++;
        continue;
      }

      let phone = c.phone.replace(/\s+/g, "");
      if (!phone.startsWith("+")) phone = `+${phone}`;

      const { error } = await fromAny("campaign_contacts")
        .upsert(
          {
            user_id: user.id,
            channel_id: channel.id,
            agent_id: campaign.agent_id,
            phone,
            name: c.name || null,
            email: c.email || null,
            source: `crm_${body.toolkit}`,
            source_id: c.id || null,
            tags: ["crm-import"],
            custom_fields: c.custom_fields || {},
          },
          { onConflict: "channel_id,phone" }
        );

      if (error) {
        skipped++;
      } else {
        imported++;
      }
    }

    return NextResponse.json({ imported, skipped, total: rawContacts.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "CRM import failed" },
      { status: 500 }
    );
  }
}

/** Extract contacts from Composio action result — handles various CRM response shapes */
function extractContacts(result: unknown): {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  custom_fields?: Record<string, string>;
}[] {
  if (!result || typeof result !== "object") return [];

  const data = result as Record<string, unknown>;

  // Try common response shapes
  const candidates = [
    data.contacts,
    data.results,
    data.data,
    data.records,
    data.items,
    data.response_data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? item.contact_id ?? ""),
        name: String(item.name ?? item.full_name ?? item.first_name ?? ""),
        phone: String(item.phone ?? item.phone_number ?? item.mobile ?? ""),
        email: String(item.email ?? item.email_address ?? ""),
      }));
    }
  }

  return [];
}
