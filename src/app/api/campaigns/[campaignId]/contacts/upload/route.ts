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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Validate and prepare all rows first
  interface PreparedRow {
    csvRow: number;
    phone: string;
    name: string | null;
    email: string | null;
    tags: string[];
    custom_fields: Record<string, string>;
  }
  const prepared: PreparedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

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

    const customFields: Record<string, string> = {};
    for (const [field, csvCol] of Object.entries(mapping)) {
      if (!["phone", "name", "email", "tags"].includes(field) && row[csvCol]) {
        customFields[field] = row[csvCol];
      }
    }

    const rowTags = mapping.tags
      ? (row[mapping.tags] ?? "").split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const allTags = [...new Set([...importTags, ...rowTags])];

    prepared.push({ csvRow: i + 2, phone, name, email, tags: allTags, custom_fields: customFields });
  }

  // Batch upsert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < prepared.length; i += CHUNK_SIZE) {
    const chunk = prepared.slice(i, i + CHUNK_SIZE);
    const upsertRows = chunk.map((p) => ({
      user_id: user.id,
      channel_id: channel.id,
      agent_id: campaign.agent_id,
      phone: p.phone,
      name: p.name,
      email: p.email,
      tags: p.tags,
      custom_fields: Object.keys(p.custom_fields).length > 0 ? p.custom_fields : {},
      source: "csv_upload",
    }));

    const { data: results, error } = await fromAny("campaign_contacts")
      .upsert(upsertRows, { onConflict: "channel_id,phone" })
      .select("id, created_at, updated_at");

    if (error) {
      skipped += chunk.length;
      for (const p of chunk) {
        importErrors.push({ row: p.csvRow, reason: "Database error" });
      }
      continue;
    }

    for (const contact of (results ?? []) as { id: string; created_at: string; updated_at: string }[]) {
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
