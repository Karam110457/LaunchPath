import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/agents/templates";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";
import { generateConfigDirectives, updatePromptDirectives } from "@/lib/agents/config-directives";

interface SwitchTemplateBody {
  newTemplateId: string;
  removeOldTools: boolean;
  addNewTools: boolean;
  /** Optional pre-filled config fields from the switch dialog */
  prefilledConfig?: Record<string, unknown>;
  /** Whether to keep qualifying questions from the old template */
  keepQuestions?: boolean;
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

  const body = (await request.json()) as SwitchTemplateBody;
  const { newTemplateId, removeOldTools, addNewTools, prefilledConfig, keepQuestions } = body;

  const newTemplate = getTemplateById(newTemplateId);
  if (!newTemplate) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  // Verify agent ownership
  const { data: agent, error: agentErr } = await supabase
    .from("ai_agents")
    .select("id, wizard_config, system_prompt, personality")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const oldWizardConfig = (agent.wizard_config ?? {}) as Record<string, unknown>;
  const oldTemplateId = oldWizardConfig.templateId as string | undefined;
  const oldTemplate = oldTemplateId ? getTemplateById(oldTemplateId) : null;

  // 1. Remove old template tools if requested (but keep tools shared with new template)
  if (removeOldTools && oldTemplate?.suggestedTools?.length) {
    const oldToolkits = new Set(oldTemplate.suggestedTools.map((t) => t.toolkit));
    const newToolkits = new Set(newTemplate.suggestedTools.map((t) => t.toolkit));

    // Get agent's current tools and filter by old template's toolkits
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
          // Only remove if it belongs to the old template AND is NOT needed by the new template
          return toolkit && oldToolkits.has(toolkit) && !newToolkits.has(toolkit);
        })
        .map((t) => t.id);

      if (toolIdsToRemove.length > 0) {
        await supabase
          .from("agent_tools")
          .delete()
          .in("id", toolIdsToRemove);

        logger.info("Removed old template tools", {
          agentId,
          removedCount: toolIdsToRemove.length,
          oldTemplateId,
        });
      }
    }
  }

  // 2. Add new template tools if requested
  if (addNewTools && newTemplate.suggestedTools?.length) {
    // Check which toolkits are already present to avoid duplicates
    const { data: currentTools } = await supabase
      .from("agent_tools")
      .select("config")
      .eq("agent_id", agentId)
      .eq("user_id", user.id);

    const existingToolkits = new Set(
      (currentTools ?? [])
        .map((t) => (t.config as Record<string, unknown> | null)?.toolkit as string)
        .filter(Boolean),
    );

    const toolsToAdd = newTemplate.suggestedTools.filter(
      (t) => !existingToolkits.has(t.toolkit),
    );

    // Fetch toolkit logos so canvas shows real icons
    const toolkitLogos = toolsToAdd.length > 0
      ? await fetchToolkitLogos(toolsToAdd.map((t) => t.toolkit))
      : {};

    for (const tool of toolsToAdd) {
      await supabase.from("agent_tools").insert({
        agent_id: agentId,
        user_id: user.id,
        tool_type: "composio",
        display_name: tool.displayName,
        description: tool.description,
        config: {
          toolkit: tool.toolkit,
          toolkit_name: tool.toolkitName,
          toolkit_icon: toolkitLogos[tool.toolkit] ?? undefined,
          enabled_actions: tool.actions,
        },
        is_enabled: true,
      });
    }

    if (toolsToAdd.length > 0) {
      logger.info("Added new template tools", {
        agentId,
        addedCount: toolsToAdd.length,
        newTemplateId,
      });
    }
  }

  // 3. Build default behavior config for new template, merged with pre-filled values
  const defaultBc = buildDefaultBehaviorConfig(newTemplateId);
  const oldBc = (oldWizardConfig.behaviorConfig ?? {}) as Record<string, unknown>;
  const oldQualMode = (oldBc.qualification_mode as string) ?? "describe";

  // When keeping lead filtering data, preserve the mode + relevant content
  const keepOverrides: Record<string, unknown> = {};
  if (keepQuestions) {
    keepOverrides.qualification_mode = oldQualMode;
    if (oldQualMode === "describe" && oldBc.icp_description) {
      keepOverrides.icp_description = oldBc.icp_description;
    }
  }

  const behaviorConfig = {
    ...defaultBc,
    ...(prefilledConfig ?? {}),
    ...keepOverrides,
  };

  // 4. Update agent with new wizard_config, tool_guidelines, and system_prompt directives
  const newWizardConfig = {
    ...oldWizardConfig,
    templateId: newTemplateId,
    behaviorConfig,
    // Clear qualifying questions unless user chose to keep them
    ...(keepQuestions ? {} : { qualifyingQuestions: [] }),
  };

  // Regenerate config directives in the system prompt
  const personality = agent.personality as { tone?: string; greeting_message?: string; language?: string } | null;
  const newDirectives = generateConfigDirectives({
    personality,
    wizardConfig: {
      templateId: newTemplateId,
      qualifyingQuestions: keepQuestions
        ? ((oldWizardConfig.qualifyingQuestions as string[] | undefined) ?? [])
        : [],
      behaviorConfig,
    },
    toolGuidelines: newTemplate.toolWorkflow,
  });
  const updatedPrompt = updatePromptDirectives(
    (agent.system_prompt as string) ?? "",
    newDirectives,
  );

  const { error: updateErr } = await supabase
    .from("ai_agents")
    .update({
      wizard_config: newWizardConfig,
      tool_guidelines: newTemplate.toolWorkflow,
      system_prompt: updatedPrompt,
    })
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (updateErr) {
    logger.error("Failed to update agent template", { agentId, error: updateErr.message });
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }

  // 5. Return updated tool list
  const { data: tools } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ok: true,
    wizardConfig: newWizardConfig,
    systemPrompt: updatedPrompt,
    tools: tools ?? [],
  });
}

function buildDefaultBehaviorConfig(templateId: string): Record<string, unknown> {
  if (templateId === "appointment-booker") {
    return {
      lead_fields: { phone: true, company: false, custom_fields: [] },
      booking_behavior: "book_directly",
      availability: {
        timezone: "",
        working_days: ["mon", "tue", "wed", "thu", "fri"],
        start_time: "09:00",
        end_time: "17:00",
        appointment_duration: 30,
        buffer_minutes: 15,
        max_advance_days: 30,
      },
      service_types: [],
      cancellation_policy: "",
      qualification_mode: "describe",
      disqualification_criteria: [],
      icp_description: "",
    };
  }
  if (templateId === "customer-support") {
    return {
      escalation_mode: "escalate_complex",
      response_style: "detailed",
      escalation_contact: "",
      business_hours: "",
      after_hours_message: "",
      forbidden_topics: [],
    };
  }
  if (templateId === "lead-capture" || templateId === "lead-qualification") {
    return {
      lead_fields: { phone: true, company: true, custom_fields: [] },
      notification_behavior: "email_team",
      notification_email: "",
      qualification_mode: "describe",
      icp_description: "",
      disqualification_criteria: [],
    };
  }
  return {};
}

async function fetchToolkitLogos(
  toolkitSlugs: string[],
): Promise<Record<string, string>> {
  try {
    const composio = getComposioClient();
    const allToolkits = (await composio.toolkits.get({
      sortBy: "usage",
      limit: 200,
    })) as unknown as Array<{
      slug: string;
      meta?: { logo?: string };
    }>;

    const logos: Record<string, string> = {};
    const slugSet = new Set(toolkitSlugs);

    for (const tk of allToolkits) {
      if (slugSet.has(tk.slug) && tk.meta?.logo) {
        logos[tk.slug] = tk.meta.logo;
      }
    }

    return logos;
  } catch {
    return {};
  }
}
