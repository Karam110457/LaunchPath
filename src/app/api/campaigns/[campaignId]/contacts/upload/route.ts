/**
 * CSV Contact Upload API
 * POST /api/campaigns/[campaignId]/contacts/upload
 *
 * ?preview=true  — parse CSV, return headers + sample rows
 * ?preview=false — upsert contacts with column mapping
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 10_000;
const E164_RE = /^\+[1-9]\d{6,14}$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, agent_id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json(
      { error: "No channel found. Deploy the campaign first." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const isPreview = formData.get("preview") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5MB." },
      { status: 400 }
    );
  }

  const text = await file.text();
  const { data: rows, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json(
      { error: `CSV parse error: ${errors[0].message}` },
      { status: 400 }
    );
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (${rows.length}). Maximum ${MAX_ROWS}.` },
      { status: 400 }
    );
  }

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  // ── Preview mode ─────────────────────────────────────────────────────
  if (isPreview) {
    return NextResponse.json({
      headers,
      sampleRows: rows.slice(0, 5),
      totalRows: rows.length,
    });
  }

  // ── Import mode ──────────────────────────────────────────────────────
  const mappingRaw = formData.get("mapping") as string | null;
  if (!mappingRaw) {
    return NextResponse.json(
      { error: "Column mapping is required for import" },
      { status: 400 }
    );
  }

  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(mappingRaw);
  } catch {
    return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }

  if (!mapping.phone) {
    return NextResponse.json(
      { error: "Phone column mapping is required" },
      { status: 400 }
    );
  }

  const tagsRaw = formData.get("tags") as string | null;
  const importTags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const importErrors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Extract phone
    let phone = (row[mapping.phone] ?? "").replace(/\s+/g, "");
    if (!phone) {
      skipped++;
      importErrors.push({ row: i + 2, reason: "Empty phone" });
      continue;
    }
    if (!phone.startsWith("+")) phone = `+${phone}`;
    if (!E164_RE.test(phone)) {
      skipped++;
      importErrors.push({ row: i + 2, reason: `Invalid phone: ${phone}` });
      continue;
    }

    const name = mapping.name ? (row[mapping.name] ?? "").trim() || null : null;
    const email = mapping.email ? (row[mapping.email] ?? "").trim() || null : null;

    // Build custom fields from any extra mapped columns
    const customFields: Record<string, string> = {};
    for (const [field, csvCol] of Object.entries(mapping)) {
      if (!["phone", "name", "email", "tags"].includes(field) && row[csvCol]) {
        customFields[field] = row[csvCol];
      }
    }

    // Row-level tags
    const rowTags = mapping.tags
      ? (row[mapping.tags] ?? "").split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const allTags = [...new Set([...importTags, ...rowTags])];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact, error } = await (supabase.from as any)("campaign_contacts")
      .upsert(
        {
          user_id: user.id,
          channel_id: channel.id,
          agent_id: campaign.agent_id,
          phone,
          name,
          email,
          tags: allTags,
          custom_fields: Object.keys(customFields).length > 0 ? customFields : {},
          source: "csv_upload",
        },
        { onConflict: "channel_id,phone" }
      )
      .select("id, created_at, updated_at")
      .single();

    if (error) {
      skipped++;
      importErrors.push({ row: i + 2, reason: "Database error" });
      continue;
    }

    if (contact) {
      const createdAt = new Date(contact.created_at).getTime();
      const updatedAt = new Date(contact.updated_at).getTime();
      if (Math.abs(updatedAt - createdAt) < 1000) {
        imported++;
      } else {
        updated++;
      }
    }
  }

  return NextResponse.json({
    imported,
    updated,
    skipped,
    errors: importErrors.slice(0, 50), // Cap error list
  });
}
