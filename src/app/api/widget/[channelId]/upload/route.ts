/**
 * Widget File Upload API
 * POST /api/widget/[channelId]/upload
 *
 * Accepts a file from the widget chat, stores it in Supabase Storage,
 * and returns a public URL to embed in the conversation.
 *
 * Max file size: 5MB
 * Allowed types: images (png, jpg, gif, webp), PDFs
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const BUCKET = "chat-attachments";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const origin = request.headers.get("origin") ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400, headers: corsHeaders }
    );
  }

  const file = formData.get("file") as File | null;
  const sessionId = formData.get("sessionId") as string | null;

  if (!file || !sessionId) {
    return NextResponse.json(
      { error: "file and sessionId are required" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 413, headers: corsHeaders }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Supported: images, PDF" },
      { status: 415, headers: corsHeaders }
    );
  }

  const supabase = createServiceClient();

  // Check if file upload is enabled in channel config
  const { data: channelRow } = await supabase
    .from("agent_channels")
    .select("config")
    .eq("id", channelId)
    .single();

  const widgetConfig = (channelRow?.config ?? {}) as Record<string, unknown>;
  const fileUploadEnabled = (widgetConfig.fileUpload as { enabled?: boolean } | undefined)?.enabled !== false; // default: on

  if (!fileUploadEnabled) {
    return NextResponse.json(
      { error: "File upload is disabled for this channel" },
      { status: 403, headers: corsHeaders }
    );
  }

  // Verify conversation exists
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("id")
    .eq("channel_id", channelId)
    .eq("session_id", sessionId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  // Generate a unique path
  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${channelId}/${sessionId}/${uniqueId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500, headers: corsHeaders }
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json(
    {
      url: urlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
