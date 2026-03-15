/**
 * Contact Ingest Webhook (machine-to-machine)
 * POST /api/campaigns/[campaignId]/contacts/ingest
 *
 * Auth: Bearer token (campaign channel token)
 * Rate: 100 contacts/request, 10 req/min
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimitDb } from "@/lib/api/rate-limit";
import { logger } from "@/lib/security/logger";
import { checkAutoEnrollOnIngest } from "@/lib/sequences/triggers";

const E164_RE = /^\+[1-9]\d{6,14}$/;
const MAX_CONTACTS_PER_REQUEST = 100;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;

  // Auth via Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createServiceClient();

  // Find channel by campaign + token
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, user_id, agent_id")
    .eq("campaign_id", campaignId)
    .eq("token", token)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Invalid token or campaign" }, { status: 401 });
  }

  // Rate limit per token (not per IP — this is a machine-to-machine API)
  // Uses DB-backed limiter for cross-instance accuracy
  const rl = await rateLimitDb(token, "contact-ingest", 10);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limited. Try again later.", retryAfterMs: rl.retryAfter },
      { status: 429 }
    );
  }

  const body = (await req.json()) as {
    contacts?: Array<{
      phone: string;
      name?: string;
      email?: string;
      tags?: string[];
      source?: string;
      source_id?: string;
      custom_fields?: Record<string, unknown>;
    }>;
  };

  if (!body.contacts || !Array.isArray(body.contacts)) {
    return NextResponse.json({ error: "contacts array is required" }, { status: 400 });
  }

  if (body.contacts.length > MAX_CONTACTS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CONTACTS_PER_REQUEST} contacts per request` },
      { status: 400 }
    );
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { index: number; reason: string }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Separate contacts with source_id (need individual lookup) from phone-only (can batch)
  interface ValidContact {
    index: number;
    phone: string;
    name: string | null;
    email: string | null;
    tags: string[];
    source: string;
    source_id: string | null;
    custom_fields: Record<string, unknown>;
  }
  const sourceIdContacts: ValidContact[] = [];
  const phoneOnlyContacts: ValidContact[] = [];

  for (let i = 0; i < body.contacts.length; i++) {
    const c = body.contacts[i];
    let phone = (c.phone ?? "").replace(/\s+/g, "");
    if (!phone.startsWith("+")) phone = `+${phone}`;

    if (!E164_RE.test(phone)) {
      skipped++;
      errors.push({ index: i, reason: `Invalid phone: ${phone}` });
      continue;
    }

    const valid: ValidContact = {
      index: i,
      phone,
      name: c.name?.trim() || null,
      email: c.email?.trim() || null,
      tags: c.tags ?? [],
      source: c.source ?? "api",
      source_id: c.source_id ?? null,
      custom_fields: c.custom_fields ?? {},
    };

    if (c.source_id) {
      sourceIdContacts.push(valid);
    } else {
      phoneOnlyContacts.push(valid);
    }
  }

  // Handle source_id contacts: batch lookup then individual update or add to phone batch
  if (sourceIdContacts.length > 0) {
    const sourceIds = sourceIdContacts.map((c) => c.source_id!);
    const { data: existingBySrc } = await fromAny("campaign_contacts")
      .select("id, source_id")
      .eq("channel_id", channel.id)
      .in("source_id", sourceIds);

    const srcMap = new Map<string, string>();
    for (const row of (existingBySrc ?? []) as { id: string; source_id: string }[]) {
      srcMap.set(row.source_id, row.id);
    }

    for (const c of sourceIdContacts) {
      const existingId = srcMap.get(c.source_id!);
      if (existingId) {
        // Update existing by source_id
        await fromAny("campaign_contacts")
          .update({
            phone: c.phone,
            name: c.name,
            email: c.email,
            tags: c.tags,
            source: c.source,
            custom_fields: c.custom_fields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId);
        updated++;
      } else {
        // No source_id match — add to phone batch
        phoneOnlyContacts.push(c);
      }
    }
  }

  // Batch upsert phone-only contacts in chunks of 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < phoneOnlyContacts.length; i += CHUNK_SIZE) {
    const chunk = phoneOnlyContacts.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((c) => ({
      user_id: channel.user_id,
      channel_id: channel.id,
      agent_id: channel.agent_id,
      phone: c.phone,
      name: c.name,
      email: c.email,
      tags: c.tags,
      source: c.source,
      source_id: c.source_id,
      custom_fields: c.custom_fields,
    }));

    const { data: results, error } = await fromAny("campaign_contacts")
      .upsert(rows, { onConflict: "channel_id,phone" })
      .select("id, created_at, updated_at");

    if (error) {
      skipped += chunk.length;
      for (const c of chunk) {
        errors.push({ index: c.index, reason: "Database error" });
      }
      continue;
    }

    for (const contact of (results ?? []) as { id: string; created_at: string; updated_at: string }[]) {
      const createdAt = new Date(contact.created_at).getTime();
      const updatedAt = new Date(contact.updated_at).getTime();
      if (Math.abs(updatedAt - createdAt) < 1000) {
        imported++;
        checkAutoEnrollOnIngest(supabase, contact.id, channel.id).catch(() => {});
      } else {
        updated++;
      }
    }
  }

  logger.info("Contact ingest completed", {
    campaignId,
    channelId: channel.id,
    imported,
    updated,
    skipped,
  });

  return NextResponse.json({ imported, updated, skipped, errors: errors.slice(0, 50) });
}
