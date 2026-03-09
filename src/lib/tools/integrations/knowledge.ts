/**
 * Knowledge base search tool builder.
 *
 * Auto-injected (not via agent_tools DB) when an agent has ready
 * knowledge documents. Gives the agent explicit agency over
 * searching its own knowledge base.
 */

import { tool } from "ai";
import { z } from "zod";
import { retrieveContextWithMetadata } from "@/lib/knowledge/rag";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Fixed tool key — not user-configurable since this is auto-injected. */
export const KNOWLEDGE_TOOL_KEY = "search_knowledge_base";

/** Display name for tool activity UI. */
export const KNOWLEDGE_TOOL_DISPLAY_NAME = "Search Knowledge Base";

/**
 * Build the knowledge base search tool for an agent.
 *
 * @param agentId - The agent whose knowledge base to search.
 * @param supabase - Supabase client for DB queries.
 */
export function buildKnowledgeTool(
  agentId: string,
  supabase: SupabaseClient
) {
  return {
    toolName: KNOWLEDGE_TOOL_KEY,
    toolDef: tool({
      description:
        "Search the agent's knowledge base of uploaded documents and websites. " +
        "Use this when the user asks a question that might be answered by " +
        "the knowledge base, or when you need to look up specific information. " +
        "Provide a clear, specific search query for best results.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "The search query. Be specific — e.g., 'pricing for enterprise plan' " +
            "rather than just 'pricing'. Rephrase the user's question into a " +
            "clear search query if needed."
          ),
      }),
      execute: async (params: { query: string }) => {
        try {
          const result = await retrieveContextWithMetadata(
            agentId,
            params.query,
            supabase
          );

          if (!result.chunks.length) {
            return {
              success: true,
              context:
                "No relevant information found in the knowledge base for this query.",
              sources: [] as Array<{
                name: string;
                type: string;
                similarity: number;
                documentId: string;
              }>,
              chunkCount: 0,
            };
          }

          // Deduplicate sources by documentId
          const seen = new Set<string>();
          const sources: Array<{
            name: string;
            type: string;
            similarity: number;
            documentId: string;
          }> = [];

          for (const chunk of result.chunks) {
            if (!seen.has(chunk.documentId)) {
              seen.add(chunk.documentId);
              sources.push({
                name: chunk.sourceName,
                type: chunk.sourceType,
                similarity: Math.round(chunk.similarity * 100) / 100,
                documentId: chunk.documentId,
              });
            }
          }

          return {
            success: true,
            context: result.contextString,
            sources,
            chunkCount: result.chunks.length,
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          return {
            success: false,
            context: `Knowledge base search failed: ${message}`,
            sources: [] as Array<{
              name: string;
              type: string;
              similarity: number;
              documentId: string;
            }>,
            chunkCount: 0,
          };
        }
      },
    }),
  };
}
