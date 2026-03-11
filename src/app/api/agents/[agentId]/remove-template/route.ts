import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";
import { updatePromptDirectives } from "@/lib/agents/config-directives";

/**
 * POST /api/agents/[agentId]/remove-template
 *
 * Removes the template from a wizard-created agent, converting it to a
 * template-less agent. This is destructive:
 *  - Clears wizard_config (behavior settings, qualifying questions)
 *  - Clears tool_guidelines
 *  - Removes the Configuration Directives section from system_prompt
 *  - Optionally removes template-suggested tools
 */

interface RemoveTemplateBody {
  removeTemplateTools: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as RemoveTemplateBody;
  const { removeTemplateTools } = body;

  // Fetch current agent
  const { data: agent, error: agentErr } = await supabase
    .from("ai_agents")
    .select("id, wizard_config, system_prompt, tool_guidelines")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const wizardConfig = agent.wizard_config as Record<string, unknown> | null;
  if (!wizardConfig?.templateId) {
    return NextResponse.json(
      { error: "Agent has no template to remove" },
      { status: 400 },
    );
  }

  // Remove template-suggested tools if requested
  if (removeTemplateTools) {
    const { getTemplateById } = await import("@/lib/agents/templates");
    const template = getTemplateById(wizardConfig.templateId as string);
    if (template?.suggestedTools?.length) {
      const templateToolkits = new Set(
        template.suggestedTools.map((t) => t.toolkit),
      );

      const { data: existingTools } = await supabase
        .from("agent_tools")
        .select("id, config")
        .eq("agent_id", agentId)
        .eq("user_id", user.id);

      if (existingTools) {
        const toolIdsToRemove = existingTools
          .filter((t) => {
            const config = t.config as Record<string, unknown> | null;
            const toolkit = config?.toolkit as string;
            return toolkit && templateToolkits.has(toolkit);
          })
          .map((t) => t.id);

        if (toolIdsToRemove.length > 0) {
          await supabase
            .from("agent_tools")
            .delete()
            .in("id", toolIdsToRemove);

          logger.info("Removed template tools during template removal", {
            agentId,
            removedCount: toolIdsToRemove.length,
          });
        }
      }
    }
  }

  // Strip the configuration directives section from the system prompt
  const currentPrompt = (agent.system_prompt as string) ?? "";
  const cleanedPrompt = updatePromptDirectives(currentPrompt, "");

  // Clear wizard_config and tool_guidelines
  const { error: updateErr } = await supabase
    .from("ai_agents")
    .update({
      wizard_config: null,
      tool_guidelines: null,
      template_id: null,
      system_prompt: cleanedPrompt,
    })
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (updateErr) {
    logger.error("Failed to remove template", {
      agentId,
      error: updateErr.message,
    });
    return NextResponse.json(
      { error: "Failed to remove template" },
      { status: 500 },
    );
  }

  // Return updated tool list
  const { data: tools } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  logger.info("Template removed from agent", { agentId });

  return NextResponse.json({
    ok: true,
    systemPrompt: cleanedPrompt,
    tools: tools ?? [],
  });
}
