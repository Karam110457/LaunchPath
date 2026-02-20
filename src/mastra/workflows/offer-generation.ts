/**
 * Offer Generation Workflow
 *
 * Orchestrates parallel generation of transformation copy, guarantee, and pricing,
 * then assembles and validates the result. Includes a validation extension point.
 *
 * Flow:
 *   Input → [prepare] → [parallel: transformation, guarantee, pricing] → [assemble] → [validate] → Output
 *
 * All three parallel agents receive the full shared context so their outputs
 * are consistent with each other — pricing aligns with the guarantee, the
 * guarantee aligns with the transformation, etc.
 */

import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { buildOfferContext } from "@/lib/ai/offer-prompt";
import { buildGuaranteeContext } from "@/lib/ai/guarantee-prompt";
import { buildPricingContext } from "@/lib/ai/pricing-prompt";
import {
  offerTransformationOutputSchema,
  guaranteeOutputSchema,
  aiPricingOutputSchema,
  assembledOfferSchema,
} from "@/lib/ai/schemas";

// -- Workflow input schema --

const offerWorkflowInputSchema = z.object({
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
  profile: z.object({
    time_availability: z.string().nullable(),
    revenue_goal: z.string().nullable(),
  }),
  answers: z.object({
    location_city: z.string().nullable(),
  }),
});

type OfferWorkflowInput = z.infer<typeof offerWorkflowInputSchema>;

// -- Step 1: Prepare prompts for all three agents --
// sharedContext is threaded through to every parallel step so each agent
// has the full picture and can align its output with the others.

const sharedContextSchema = z.object({
  niche: z.string(),
  bottleneck: z.string(),
  solution: z.string(),
  segment: z.string(),
  strategic_insight: z.string(),
  revenue_per_client: z.string(),
  revenue_goal: z.string().nullable(),
});

const prepareOutputSchema = z.object({
  offerPrompt: z.string(),
  guaranteePrompt: z.string(),
  pricingPrompt: z.string(),
  sharedContext: sharedContextSchema,
  segment: z.string(),
});

const preparePrompts = createStep({
  id: "prepare-prompts",
  description: "Build context prompts for offer, guarantee, and pricing agents",
  inputSchema: offerWorkflowInputSchema,
  outputSchema: prepareOutputSchema,
  execute: async ({ inputData, writer }) => {
    const { chosenRecommendation, profile, answers } = inputData;

    await writer?.write({
      type: "step-progress",
      label: "Reading your niche and profile...",
      stepId: "prepare-prompts",
    });

    const offerPrompt = buildOfferContext(chosenRecommendation, profile, answers);
    const guaranteePrompt = buildGuaranteeContext(
      chosenRecommendation,
      profile
    );
    const pricingPrompt = buildPricingContext(
      chosenRecommendation,
      profile
    );

    const sharedContext = {
      niche: chosenRecommendation.niche,
      bottleneck: chosenRecommendation.bottleneck,
      solution: chosenRecommendation.your_solution,
      segment: chosenRecommendation.target_segment.description,
      strategic_insight: chosenRecommendation.strategic_insight,
      revenue_per_client: chosenRecommendation.revenue_potential.per_client,
      revenue_goal: profile.revenue_goal,
    };

    return {
      offerPrompt,
      guaranteePrompt,
      pricingPrompt,
      sharedContext,
      segment: chosenRecommendation.target_segment.description,
    };
  },
});

// -- Step 2a: Generate transformation copy (parallel) --

const generateTransformation = createStep({
  id: "generate-transformation",
  description: "Generate transformation copy using the offer agent",
  inputSchema: prepareOutputSchema,
  outputSchema: offerTransformationOutputSchema,
  execute: async ({ inputData, mastra, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Writing your transformation story...",
      stepId: "generate-transformation",
    });

    const agent = mastra.getAgent("offer");
    const result = await agent.generate(inputData.offerPrompt, {
      structuredOutput: { schema: offerTransformationOutputSchema },
    });

    await writer?.write({
      type: "step-progress",
      label: "Transformation copy ready.",
      stepId: "generate-transformation",
      done: true,
    });

    return result.object;
  },
});

// -- Step 2b: Generate guarantee (parallel) --

const generateGuarantee = createStep({
  id: "generate-guarantee",
  description: "Generate niche-specific guarantee using the guarantee agent",
  inputSchema: prepareOutputSchema,
  outputSchema: guaranteeOutputSchema,
  execute: async ({ inputData, mastra, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Crafting your guarantee...",
      stepId: "generate-guarantee",
    });

    const agent = mastra.getAgent("guarantee");
    const result = await agent.generate(inputData.guaranteePrompt, {
      structuredOutput: { schema: guaranteeOutputSchema },
    });

    await writer?.write({
      type: "step-progress",
      label: "Guarantee ready.",
      stepId: "generate-guarantee",
      done: true,
    });

    return result.object;
  },
});

// -- Step 2c: Generate pricing (parallel) --

const generatePricing = createStep({
  id: "generate-pricing",
  description: "Generate AI-informed pricing using the pricing agent",
  inputSchema: prepareOutputSchema,
  outputSchema: aiPricingOutputSchema,
  execute: async ({ inputData, mastra, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Setting your pricing...",
      stepId: "generate-pricing",
    });

    const agent = mastra.getAgent("pricing");
    const result = await agent.generate(inputData.pricingPrompt, {
      structuredOutput: { schema: aiPricingOutputSchema },
    });

    await writer?.write({
      type: "step-progress",
      label: "Pricing ready.",
      stepId: "generate-pricing",
      done: true,
    });

    return result.object;
  },
});

// -- Step 3: Assemble the complete offer --

const parallelOutputSchema = z.object({
  "generate-transformation": offerTransformationOutputSchema,
  "generate-guarantee": guaranteeOutputSchema,
  "generate-pricing": aiPricingOutputSchema,
});

const assembleOffer = createStep({
  id: "assemble-offer",
  description: "Merge parallel outputs into a single assembled offer",
  inputSchema: parallelOutputSchema,
  outputSchema: assembledOfferSchema,
  execute: async ({ inputData, getInitData, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Assembling your offer...",
      stepId: "assemble-offer",
    });

    const initData = getInitData<OfferWorkflowInput>();
    const transformation = inputData["generate-transformation"];
    const guarantee = inputData["generate-guarantee"];
    const pricing = inputData["generate-pricing"];

    return {
      segment: initData.chosenRecommendation.target_segment.description,
      transformation_from: transformation.transformation_from,
      transformation_to: transformation.transformation_to,
      system_description: transformation.system_description,
      guarantee_text: guarantee.guarantee_text,
      guarantee_type: guarantee.guarantee_type,
      guarantee_confidence: guarantee.confidence_notes,
      pricing_setup: pricing.pricing_setup,
      pricing_monthly: pricing.pricing_monthly,
      pricing_rationale: pricing.rationale,
      pricing_comparables: pricing.comparable_services,
      revenue_projection: pricing.revenue_projection,
      delivery_model: "build_once",
      validation_status: "passed" as const,
      validation_notes: [],
    };
  },
});

// -- Step 4: Validate offer (extension point) --

const validatedOfferSchema = assembledOfferSchema;

const validateOffer = createStep({
  id: "validate-offer",
  description:
    "Extension point: future home for web search validation, RAG checks, compliance review. Currently passes through.",
  inputSchema: assembledOfferSchema,
  outputSchema: validatedOfferSchema,
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "step-progress",
      label: "Final review...",
      stepId: "validate-offer",
    });

    // FUTURE: Insert research tool calls, RAG retrieval, web search validation here.
    // researchContext and ragContext will be populated here when those systems are built.
    // The step wiring does not need to change — just populate inputData with those contexts.
    return {
      ...inputData,
      validation_status: "passed" as const,
      validation_notes: [] as string[],
    };
  },
});

// -- Workflow definition --

export const offerGenerationWorkflow = createWorkflow({
  id: "offer-generation",
  description:
    "Generate a complete offer: transformation copy, guarantee, and pricing in parallel, then assemble and validate",
  inputSchema: offerWorkflowInputSchema,
  outputSchema: validatedOfferSchema,
  steps: [
    preparePrompts,
    generateTransformation,
    generateGuarantee,
    generatePricing,
    assembleOffer,
    validateOffer,
  ],
})
  .then(preparePrompts)
  .parallel([generateTransformation, generateGuarantee, generatePricing])
  .then(assembleOffer)
  .then(validateOffer)
  .commit();
