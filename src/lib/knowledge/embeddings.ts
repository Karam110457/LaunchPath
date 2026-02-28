/**
 * OpenAI embedding service for knowledge base RAG.
 * Uses text-embedding-3-small (1536 dimensions).
 */

import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

const EMBEDDING_MODEL = "text-embedding-3-small";

/** Embed a single text string. */
export async function embedText(text: string): Promise<number[]> {
  const openai = getClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/** Embed multiple texts in a single API call (max 2048 inputs). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const openai = getClient();
  // OpenAI batch limit is 2048 inputs per call
  const BATCH_SIZE = 2048;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of response.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}
