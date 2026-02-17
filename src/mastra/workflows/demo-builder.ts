/**
 * Demo Builder Workflow
 *
 * Generates a complete demo page configuration from the user's offer and niche recommendation.
 * The existing 10 niche agents in the registry serve as reference examples for the builder.
 *
 * Flow:
 *   Input → [generateDemoConfig] → [validateDemoConfig] → Output
 */

import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { buildDemoBuilderContext } from "@/lib/ai/demo-builder-prompt";
import { demoConfigSchema, assembledOfferSchema } from "@/lib/ai/schemas";
import {
  findAgentSlug,
  getAgentForNiche,
} from "@/lib/ai/agents/registry";

// -- Workflow input schema --

const demoBuilderInputSchema = z.object({
  chosenRecommendation: z.object({
    niche: z.string(),
    bottleneck: z.string(),
    your_solution: z.string(),
    target_segment: z.object({
      description: z.string(),
      why: z.string(),
    }),
    revenue_potential: z.object({
      per_client: z.string(),
      target_clients: z.number(),
      monthly_total: z.string(),
    }),
    strategic_insight: z.string(),
  }),
  offer: z.object({
    segment: z.string(),
    transformation_from: z.string(),
    transformation_to: z.string(),
    system_description: z.string(),
    guarantee_text: z.string(),
    guarantee_type: z.string(),
    pricing_setup: z.number(),
    pricing_monthly: z.number(),
    pricing_rationale: z.string(),
    delivery_model: z.string(),
  }),
});

type DemoBuilderInput = z.infer<typeof demoBuilderInputSchema>;

// -- Step 1: Generate demo page config --

const generateDemoConfig = createStep({
  id: "generate-demo-config",
  description:
    "Generate a complete demo page configuration from the offer and niche recommendation",
  inputSchema: demoBuilderInputSchema,
  outputSchema: demoConfigSchema,
  execute: async ({ inputData, mastra, writer }) => {
    const { chosenRecommendation, offer } = inputData;

    await writer?.write({
      type: "step-progress",
      label: "Looking up niche reference...",
      stepId: "generate-demo-config",
    });

    // Check if a reference agent exists for this niche
    const agentSlug = findAgentSlug(chosenRecommendation.niche);
    const registryAgent = agentSlug ? getAgentForNiche(agentSlug) : null;

    const registryExample = registryAgent
      ? {
          formFields: registryAgent.formFields.map((f) => ({
            name: f.key,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder ?? "",
            required: f.required,
            options: f.options?.map((o) => o.label),
          })),
          systemPrompt: registryAgent.systemPrompt,
          agentName: registryAgent.name,
        }
      : undefined;

    await writer?.write({
      type: "step-progress",
      label: "Designing your demo page...",
      stepId: "generate-demo-config",
    });

    const context = buildDemoBuilderContext(
      chosenRecommendation,
      offer,
      registryExample
    );

    const agent = mastra.getAgent("demo-builder");
    const result = await agent.generate(context, {
      structuredOutput: { schema: demoConfigSchema },
    });

    await writer?.write({
      type: "step-progress",
      label: "Demo page designed.",
      stepId: "generate-demo-config",
      done: true,
    });

    return result.object;
  },
});

// -- Step 2: Validate demo config (extension point) --

const validateDemoConfig = createStep({
  id: "validate-demo-config",
  description:
    "Extension point: future home for design validation, copy review, A/B testing logic. Currently passes through.",
  inputSchema: demoConfigSchema,
  outputSchema: demoConfigSchema,
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Reviewing your demo page...",
      stepId: "validate-demo-config",
    });

    // FUTURE: Validate form fields against niche best practices (RAG)
    // FUTURE: Check hero copy against high-converting patterns (research tool)
    // FUTURE: Validate scoring rules produce reasonable distributions
    return {
      ...inputData,
      validation_status: "passed" as const,
      validation_notes: [] as string[],
    };
  },
});

// -- Workflow definition --

export const demoBuilderWorkflow = createWorkflow({
  id: "demo-builder",
  description:
    "Generate a complete demo page configuration from an offer and niche recommendation",
  inputSchema: demoBuilderInputSchema,
  outputSchema: demoConfigSchema,
  steps: [generateDemoConfig, validateDemoConfig],
})
  .then(generateDemoConfig)
  .then(validateDemoConfig)
  .commit();
