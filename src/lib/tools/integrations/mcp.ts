import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import type { MCPConfig } from "../types";

/**
 * Connect to an MCP server via Streamable HTTP transport and return
 * Vercel AI SDK–compatible tool definitions for all tools the server exposes.
 *
 * Each tool's execute function proxies calls back to the MCP server.
 * A new connection is created per-request (HTTP transport is stateless).
 */
export async function buildMCPTools(
  config: MCPConfig
): Promise<Record<string, unknown>> {
  const tools: Record<string, unknown> = {};

  try {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    const client = new Client({ name: "launchpath-agent", version: "1.0.0" }, {});
    const transport = new StreamableHTTPClientTransport(new URL(config.server_url));
    await client.connect(transport);

    const { tools: mcpTools } = await client.listTools();

    for (const mcpTool of mcpTools) {
      // Sanitize to a valid Claude tool name; deduplicate if two tools collide post-sanitization
      const baseName = mcpTool.name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 57);
      let toolName = baseName;
      let suffix = 2;
      while (tools[toolName]) {
        toolName = `${baseName}_${suffix++}`;
      }

      // Build a Zod schema from the MCP inputSchema
      const zodSchema = mcpSchemaToZod(
        (mcpTool.inputSchema as Record<string, unknown>) ?? {}
      );

      // Capture tool name + client reference in closure
      const capturedName = mcpTool.name;

      tools[toolName] = tool({
        description: mcpTool.description ?? `Call the ${mcpTool.name} tool on the MCP server.`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputSchema: zodSchema as any,
        execute: async (args: unknown) => {
          // Re-connect for execution (Streamable HTTP is request-scoped)
          const execClient = new Client({ name: "launchpath-agent", version: "1.0.0" }, {});
          const execTransport = new StreamableHTTPClientTransport(
            new URL(config.server_url)
          );
          try {
            await execClient.connect(execTransport);
            const result = await execClient.callTool({
              name: capturedName,
              arguments: args as Record<string, unknown>,
            });
            await execClient.close();
            return result;
          } catch (err) {
            logger.error("MCP tool execution error", { tool: capturedName, err });
            await execClient.close().catch(() => {});
            return { error: `MCP tool ${capturedName} failed.` };
          }
        },
      });
    }

    await client.close();
  } catch (err) {
    logger.error("Failed to build MCP tools", { url: config.server_url, err });
    // Return empty — MCP failure doesn't break the agent
  }

  return tools;
}

/**
 * Convert a basic JSON Schema object (from MCP) to a Zod schema.
 * Handles common cases: object with string/number/boolean properties.
 * Falls back to z.record(z.unknown()) for complex/unsupported schemas.
 */
function mcpSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  if (schema.type !== "object" || !schema.properties) {
    return z.record(z.string(), z.unknown()).describe("Arguments for this tool");
  }

  const properties = schema.properties as Record<string, Record<string, unknown>>;
  const required = (schema.required as string[]) ?? [];
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let fieldSchema: z.ZodTypeAny;

    switch (prop.type) {
      case "string":
        fieldSchema = z.string();
        break;
      case "number":
      case "integer":
        fieldSchema = z.number();
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "array":
        fieldSchema = z.array(z.unknown());
        break;
      default:
        fieldSchema = z.unknown();
    }

    if (prop.description && typeof prop.description === "string") {
      fieldSchema = fieldSchema.describe(prop.description);
    }

    if (!required.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape);
}
