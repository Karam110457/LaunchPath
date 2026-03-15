/**
 * WhatsApp media handling: download, transcribe audio, describe images.
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v25.0";
const MEDIA_DOWNLOAD_TIMEOUT_MS = 15_000; // 15 seconds
const MAX_MEDIA_SIZE_BYTES = 16 * 1024 * 1024; // 16MB

/**
 * Download media from WhatsApp Cloud API.
 * Step 1: GET media URL, Step 2: fetch binary.
 */
export async function downloadWhatsAppMedia(params: {
  mediaId: string;
  accessToken: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const { mediaId, accessToken } = params;

  // Get media URL
  const metaRes = await fetch(`${GRAPH_API_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(MEDIA_DOWNLOAD_TIMEOUT_MS),
  });

  if (!metaRes.ok) {
    throw new Error(`Failed to get media URL (${metaRes.status})`);
  }

  const metaData = (await metaRes.json()) as {
    url: string;
    mime_type: string;
  };

  // Download binary with timeout and size limit
  const mediaRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(MEDIA_DOWNLOAD_TIMEOUT_MS),
  });

  if (!mediaRes.ok) {
    throw new Error(`Failed to download media (${mediaRes.status})`);
  }

  // Check Content-Length header first (fast rejection)
  const contentLength = parseInt(mediaRes.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`Media too large (${contentLength} bytes). Maximum ${MAX_MEDIA_SIZE_BYTES} bytes.`);
  }

  const arrayBuffer = await mediaRes.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`Media too large (${arrayBuffer.byteLength} bytes). Maximum ${MAX_MEDIA_SIZE_BYTES} bytes.`);
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: metaData.mime_type,
  };
}

/**
 * Transcribe audio using OpenAI Whisper API.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; durationSeconds?: number }> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured for voice transcription");
  }

  // Determine file extension from MIME type
  const extMap: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/ogg; codecs=opus": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
  };
  const ext = extMap[mimeType] ?? "ogg";

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
    `audio.${ext}`
  );
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Whisper transcription failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { text: string; duration?: number };
  return {
    text: data.text,
    durationSeconds: data.duration,
  };
}

/**
 * Describe an image using OpenAI vision model.
 */
export async function describeImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured for image vision");
  }

  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image concisely in 1-2 sentences. Focus on the main subject and relevant details.",
            },
            {
              type: "image_url",
              image_url: { url: dataUri },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Vision API failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "Image received";
}
