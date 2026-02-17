/**
 * Chat tool factory for the Business Strategist agent.
 *
 * All tools receive emit, systemId, supabase client, profile, and system via closure.
 * This lets action tools stream progress events directly into the SSE stream
 * while executing, without any additional channels or coordination.
 */

import { tool } from "ai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database";
import type { ServerEvent, CardData, ProgressStep } from "@/lib/chat/types";
import {
  INTENT_OPTIONS,
  INDUSTRY_OPTIONS,
  WHAT_WENT_WRONG_OPTIONS,
  DELIVERY_MODEL_SIMPLE_OPTIONS,
  DELIVERY_MODEL_FULL_OPTIONS,
  PRICING_STANDARD_OPTIONS,
  PRICING_EXPANDED_OPTIONS,
  LOCATION_TARGET_OPTIONS,
  GROWTH_DIRECTION_OPTIONS,
} from "@/types/start-business";
import { mastra } from "@/mastra";
import { buildUserContext } from "@/lib/ai/serge-prompt";
import { nicheAnalysisOutputSchema, assembledOfferSchema } from "@/lib/ai/schemas";
import { logger } from "@/lib/security/logger";

type Profile = Tables<"user_profiles">;
type System = Tables<"user_systems">;
type EmitFn = (event: ServerEvent) => void;

// ---------------------------------------------------------------------------
// Helper: emit a card
// ---------------------------------------------------------------------------

function emitCard(emit: EmitFn, card: CardData) {
  emit({ type: "card", card });
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createChatTools(
  emit: EmitFn,
  systemId: string,
  supabase: SupabaseClient,
  profile: Profile,
  system: System
) {
  // -------------------------------------------------------------------------
  // INPUT-REQUEST TOOLS
  // These emit a card to the frontend and return "awaiting_user_input".
  // The SSE stream ends after these — the user responds in the next request.
  // -------------------------------------------------------------------------

  const request_intent_selection = tool({
    description: "Show an option card asking the user what their goal is for this system.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "option-selector",
        id: "intent",
        question: "What's the goal for this system?",
        options: INTENT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      });
      return { awaiting_user_input: true, field: "intent" };
    },
  });

  const request_industry_interests = tool({
    description:
      "Show a multi-select card asking the user which industries interest them. Max 2 selections.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "option-selector",
        id: "industry_interests",
        question: "Any of these interest you? Pick up to 2.",
        options: INDUSTRY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
          description: o.description,
        })),
        multiSelect: true,
        maxSelect: 2,
      });
      return { awaiting_user_input: true, field: "industry_interests" };
    },
  });

  const request_own_idea = tool({
    description:
      "Ask whether the user has their own niche idea or wants AI to find the best opportunity.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "option-selector",
        id: "own_idea",
        question: "Do you already have a niche idea, or should I find the best opportunity for you?",
        options: [
          {
            value: "__find_for_me__",
            label: "Find me the best opportunity",
            description: "I'll analyse your profile and surface the strongest match",
          },
          {
            value: "__has_idea__",
            label: "I have an idea",
            description: "Tell me what you're thinking and I'll evaluate it",
          },
        ],
      });
      return { awaiting_user_input: true, field: "own_idea" };
    },
  });

  const request_own_idea_text = tool({
    description: "After the user says they have an idea, ask them to describe it.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "text-input",
        id: "own_idea_text",
        question: "What's your niche idea?",
        placeholder: "e.g. AI lead generation for HVAC companies",
        hint: "Be specific — the more detail, the better the analysis.",
      });
      return { awaiting_user_input: true, field: "own_idea" };
    },
  });

  const request_tried_niche = tool({
    description: "Ask the user what niche they've been working in or exploring.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "text-input",
        id: "tried_niche",
        question: "What niche have you been working in or exploring?",
        placeholder: "e.g. HVAC companies, dental practices, local restaurants...",
        multiline: false,
      });
      return { awaiting_user_input: true, field: "tried_niche" };
    },
  });

  const request_what_went_wrong = tool({
    description: "Ask the user what the biggest challenge has been.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "option-selector",
        id: "what_went_wrong",
        question: "What's been the biggest challenge?",
        options: WHAT_WENT_WRONG_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      });
      return { awaiting_user_input: true, field: "what_went_wrong" };
    },
  });

  const request_fix_or_pivot = tool({
    description:
      "Ask whether the user wants to fix their approach in the same niche or try a completely different one.",
    inputSchema: z.object({
      tried_niche: z.string().describe("The niche they previously tried, for personalising the question."),
    }),
    execute: async ({ tried_niche }) => {
      emitCard(emit, {
        type: "option-selector",
        id: "fix_or_pivot",
        question: `Do you want to fix your approach in ${tried_niche || "that niche"}, or try something completely different?`,
        options: [
          {
            value: "fix",
            label: `Fix my approach in ${tried_niche || "this niche"}`,
            description: "I'll diagnose what went wrong and rebuild a stronger strategy",
          },
          {
            value: "pivot",
            label: "Try a completely different niche",
            description: "Start fresh — I'll find the strongest opportunity for your profile",
          },
        ],
      });
      return { awaiting_user_input: true, field: "growth_direction" };
    },
  });

  const request_current_business = tool({
    description: "Ask about the user's current client setup — niche, client count, and pricing.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "text-input",
        id: "current_business",
        question: "Tell me about your current setup.",
        placeholder: "e.g. I work with dental practices, have 2 clients, charging £800/month each",
        hint: "Include your niche, how many clients you have, and what you charge.",
        multiline: true,
      });
      return { awaiting_user_input: true, field: "current_business" };
    },
  });

  const request_growth_direction = tool({
    description: "Ask the user what they want to do with their business.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "option-selector",
        id: "growth_direction",
        question: "What do you want to do?",
        options: GROWTH_DIRECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      });
      return { awaiting_user_input: true, field: "growth_direction" };
    },
  });

  const request_delivery_model = tool({
    description:
      "Ask the user how they want to deliver their service. Pass mode='simple' for users with limited time (5-15h/week), or mode='full' for users with more time.",
    inputSchema: z.object({
      mode: z.enum(["simple", "full"]),
    }),
    execute: async ({ mode }) => {
      const options =
        mode === "simple"
          ? DELIVERY_MODEL_SIMPLE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }))
          : DELIVERY_MODEL_FULL_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }));

      emitCard(emit, {
        type: "option-selector",
        id: "delivery_model",
        question:
          mode === "simple"
            ? "With your available time, would you rather:"
            : "How do you want to deliver your service?",
        options,
      });
      return { awaiting_user_input: true, field: "delivery_model" };
    },
  });

  const request_pricing_direction = tool({
    description:
      "Ask the user about their pricing approach. Pass mode='standard' for £3-5k goal, 'expanded' for £5k+ goal.",
    inputSchema: z.object({
      mode: z.enum(["standard", "expanded"]),
    }),
    execute: async ({ mode }) => {
      const options =
        mode === "standard"
          ? PRICING_STANDARD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
          : PRICING_EXPANDED_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

      emitCard(emit, {
        type: "option-selector",
        id: "pricing_direction",
        question:
          mode === "standard"
            ? "For pricing, do you lean toward:"
            : "How do you want to structure your pricing?",
        options,
      });
      return { awaiting_user_input: true, field: "pricing_direction" };
    },
  });

  const request_location = tool({
    description: "Ask the user where they're based and where they want to find clients.",
    inputSchema: z.object({}),
    execute: async () => {
      emitCard(emit, {
        type: "location",
        id: "location",
      });
      return { awaiting_user_input: true, field: "location" };
    },
  });

  // -------------------------------------------------------------------------
  // DYNAMIC CARD TOOLS
  // General-purpose tools for ad-hoc questions that don't map to a standard
  // data collection field. The agent decides when to use these vs plain text.
  // -------------------------------------------------------------------------

  const present_choices = tool({
    description:
      "Present an interactive choice card to the user for ANY ad-hoc question. Use this instead of listing options as plain text. Do NOT use this for standard data collection fields — use the specific request_* tools for those.",
    inputSchema: z.object({
      id: z
        .string()
        .describe(
          "A unique kebab-case identifier for this question, e.g. 'strategic-vs-hands-on', 'timeline-preference'. Must NOT match any standard field name."
        ),
      question: z.string().describe("The question to display above the options."),
      options: z
        .array(
          z.object({
            value: z.string().describe("Machine-readable value returned when selected."),
            label: z.string().describe("Human-readable label shown on the button."),
            description: z
              .string()
              .optional()
              .describe("Optional sub-text shown below the label."),
          })
        )
        .min(2)
        .max(6)
        .describe("The options to present. Min 2, max 6."),
      allow_multiple: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether the user can select multiple options."),
      max_select: z
        .number()
        .optional()
        .describe("Max selections when allow_multiple is true."),
    }),
    execute: async ({ id, question, options, allow_multiple, max_select }) => {
      emitCard(emit, {
        type: "option-selector",
        id: `dyn-${id}`,
        question,
        options,
        multiSelect: allow_multiple ?? false,
        maxSelect: max_select,
      });
      return { awaiting_user_input: true, field: `dynamic:${id}` };
    },
  });

  const request_input = tool({
    description:
      "Show a text input card to collect freeform text from the user for ANY ad-hoc question. Use this instead of asking the user to type in the chat. Do NOT use this for standard data collection fields — use the specific request_* tools for those.",
    inputSchema: z.object({
      id: z
        .string()
        .describe(
          "A unique kebab-case identifier for this input, e.g. 'describe-ideal-client', 'biggest-fear'. Must NOT match any standard field name."
        ),
      question: z.string().describe("The question to display above the input."),
      placeholder: z
        .string()
        .optional()
        .default("")
        .describe("Placeholder text inside the input field."),
      hint: z
        .string()
        .optional()
        .describe("Optional hint text shown below the question."),
      multiline: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to show a multi-line textarea instead of a single-line input."),
    }),
    execute: async ({ id, question, placeholder, hint, multiline }) => {
      emitCard(emit, {
        type: "text-input",
        id: `dyn-${id}`,
        question,
        placeholder: placeholder ?? "",
        hint,
        multiline: multiline ?? false,
      });
      return { awaiting_user_input: true, field: `dynamic:${id}` };
    },
  });

  // -------------------------------------------------------------------------
  // SAVE TOOLS
  // Silent DB writes. No visual output.
  // -------------------------------------------------------------------------

  const save_collected_answers = tool({
    description:
      "Save one or more field values to the system record. Call this immediately after the user provides data, before asking the next question.",
    inputSchema: z.object({
      updates: z
        .record(z.string(), z.unknown())
        .describe(
          "Key-value pairs to update. Valid keys: intent, direction_path, industry_interests, own_idea, tried_niche, what_went_wrong, growth_direction, current_niche, current_clients, current_pricing, delivery_model, pricing_direction, location_city, location_target"
        ),
    }),
    execute: async ({ updates }) => {
      try {
        await supabase
          .from("user_systems")
          .update(updates as Record<string, unknown>)
          .eq("id", systemId);
        return { saved: true };
      } catch (err) {
        logger.error("Failed to save chat answers", { systemId, error: String(err) });
        return { saved: false, error: String(err) };
      }
    },
  });

  // -------------------------------------------------------------------------
  // UTILITY TOOLS
  // -------------------------------------------------------------------------

  const interpret_freeform_response = tool({
    description:
      "When a user types a freeform response instead of using an option card, use this to extract the structured value. Returns the correct field name and value to save.",
    inputSchema: z.object({
      expected_field: z
        .string()
        .describe("The field name you were trying to collect (e.g. 'intent', 'delivery_model')"),
      user_text: z.string().describe("Exactly what the user typed"),
      valid_values: z
        .array(z.string())
        .describe("The valid enum values for this field, so the model can pick the right one"),
    }),
    execute: async ({ expected_field, user_text, valid_values }) => {
      try {
        const result = await generateText({
          model: anthropic("claude-haiku-4-5-20251001"),
          system: `You extract structured values from user messages. Return ONLY a JSON object with "field" and "value" keys. The value must be one of the valid values listed. If you cannot determine the value confidently, return null for value.`,
          prompt: `Field: ${expected_field}\nValid values: ${valid_values.join(", ")}\nUser said: "${user_text}"\n\nRespond with JSON only: {"field": "${expected_field}", "value": "one_of_the_valid_values_or_null"}`,
        });

        const raw = result.text.trim();
        const match = raw.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { field: string; value: string | null };
          return parsed;
        }
        return { field: expected_field, value: null };
      } catch {
        return { field: expected_field, value: null };
      }
    },
  });

  // -------------------------------------------------------------------------
  // ACTION TOOLS
  // Run workflows, emit progress, return result data.
  // -------------------------------------------------------------------------

  const run_niche_analysis = tool({
    description:
      "Run the Serge niche analysis to find the best opportunities for this user. Call only when all required fields have been saved. Shows a progress tracker while running.",
    inputSchema: z.object({}),
    execute: async () => {
      const analysisSteps: ProgressStep[] = [
        { id: "profile", label: "Analysing your profile", status: "pending" },
        { id: "scan", label: "Scanning 70+ validated niches", status: "pending" },
        { id: "score", label: "Scoring market opportunities", status: "pending" },
        { id: "bottleneck", label: "Identifying bottlenecks", status: "pending" },
        { id: "segment", label: "Evaluating segment fit", status: "pending" },
        { id: "revenue", label: "Calculating revenue potential", status: "pending" },
        { id: "build", label: "Building recommendations", status: "pending" },
      ];

      const trackerId = "niche-analysis-progress";
      emitCard(emit, {
        type: "progress-tracker",
        id: trackerId,
        title: "Finding your opportunity...",
        steps: analysisSteps,
      });

      // Re-fetch the latest system state (user may have just saved fields)
      const [systemResult, profileResult] = await Promise.all([
        supabase.from("user_systems").select("*").eq("id", systemId).single(),
        supabase.from("user_profiles").select("*").eq("id", profile.id).single(),
      ]);

      if (!systemResult.data || !profileResult.data) {
        return { error: "Could not fetch system state for analysis." };
      }

      const latestSystem = systemResult.data;
      const latestProfile = profileResult.data;

      const keepsSwitching = (latestProfile.blockers ?? []).includes("keep_switching");
      const recommendationCount = keepsSwitching ? 1 : 3;

      const userContext = buildUserContext(
        {
          time_availability: latestProfile.time_availability,
          outreach_comfort: latestProfile.outreach_comfort,
          technical_comfort: latestProfile.technical_comfort,
          revenue_goal: latestProfile.revenue_goal,
          current_situation: latestProfile.current_situation,
          blockers: latestProfile.blockers ?? [],
        },
        {
          intent: latestSystem.intent,
          direction_path: latestSystem.direction_path,
          industry_interests: latestSystem.industry_interests ?? [],
          own_idea: latestSystem.own_idea,
          tried_niche: latestSystem.tried_niche,
          what_went_wrong: latestSystem.what_went_wrong,
          current_niche: latestSystem.current_niche,
          current_clients: latestSystem.current_clients,
          current_pricing: latestSystem.current_pricing,
          growth_direction: latestSystem.growth_direction,
          delivery_model: latestSystem.delivery_model,
          pricing_direction: latestSystem.pricing_direction,
          location_city: latestSystem.location_city,
          location_target: latestSystem.location_target,
        },
        recommendationCount
      );

      // Emit timed progress steps while the LLM call runs in parallel
      const stepIds = analysisSteps.map((s) => s.id);
      const totalDuration = 10000; // ~10 seconds for Serge
      const stepInterval = totalDuration / stepIds.length;

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < stepIds.length) {
          if (stepIndex > 0) {
            emit({
              type: "progress",
              cardId: trackerId,
              stepId: stepIds[stepIndex - 1],
              status: "done",
            });
          }
          emit({
            type: "progress",
            cardId: trackerId,
            stepId: stepIds[stepIndex],
            status: "active",
          });
          stepIndex++;
        }
      }, stepInterval);

      try {
        const agent = mastra.getAgent("serge");
        const result = await agent.generate(userContext, {
          structuredOutput: { schema: nicheAnalysisOutputSchema },
        });

        clearInterval(progressInterval);

        // Mark all remaining steps done
        for (let i = stepIndex - 1; i < stepIds.length; i++) {
          emit({ type: "progress", cardId: trackerId, stepId: stepIds[i], status: "done" });
        }

        const parsed = result.object;
        if (!parsed?.recommendations?.length) {
          return { error: "Analysis returned no recommendations." };
        }

        // Save to DB
        await supabase
          .from("user_systems")
          .update({ ai_recommendations: parsed.recommendations as unknown as Record<string, unknown>[] })
          .eq("id", systemId);

        // Emit score cards
        emitCard(emit, {
          type: "score-cards",
          id: "niche-results",
          recommendations: parsed.recommendations,
        });

        // Return minimal summary — full data is in the score cards the user sees.
        // Returning the full recommendations would tempt the model to re-describe them.
        const summaries = parsed.recommendations.map((r: { niche: string; score: number }) => ({
          niche: r.niche,
          score: r.score,
        }));
        return {
          success: true,
          count: summaries.length,
          niches: summaries,
          note: "Score cards are displayed to the user. Do NOT list recommendation details in text.",
        };
      } catch (err) {
        clearInterval(progressInterval);
        logger.error("Niche analysis failed in chat tool", { systemId, error: String(err) });
        return { error: "Analysis failed. Try again." };
      }
    },
  });

  const save_niche_choice = tool({
    description: "Save the user's chosen niche recommendation and pre-generate the offer in the background.",
    inputSchema: z.object({
      recommendation: z
        .object({
          niche: z.string(),
          score: z.number(),
          target_segment: z.object({ description: z.string(), why: z.string() }),
          bottleneck: z.string(),
          strategic_insight: z.string(),
          your_solution: z.string(),
          revenue_potential: z.object({
            per_client: z.string(),
            target_clients: z.number(),
            monthly_total: z.string(),
          }),
          why_for_you: z.string(),
          ease_of_finding: z.string(),
          segment_scores: z.object({
            roi_from_service: z.number(),
            can_afford_it: z.number(),
            guarantee_results: z.number(),
            easy_to_find: z.number(),
            total: z.number(),
          }),
        })
        .describe("The full recommendation object the user selected"),
    }),
    execute: async ({ recommendation }) => {
      await supabase
        .from("user_systems")
        .update({ chosen_recommendation: recommendation as unknown as Record<string, unknown> })
        .eq("id", systemId);

      // Fire-and-forget pre-generation
      const { preGenerateOfferForChat } = await import("@/lib/chat/pre-generate");
      preGenerateOfferForChat(systemId, profile.id).catch((err: unknown) => {
        logger.warn("Pre-generation failed (non-fatal)", { systemId, error: String(err) });
      });

      return { saved: true };
    },
  });

  const generate_offer = tool({
    description:
      "Run the offer generation workflow to create a complete offer based on the chosen niche. Returns the assembled offer. After this, send editable content cards for 3 exchanges.",
    inputSchema: z.object({}),
    execute: async () => {
      // Check for pre-generated offer first
      const { data: freshSystem } = await supabase
        .from("user_systems")
        .select("offer, chosen_recommendation, delivery_model, pricing_direction, location_city")
        .eq("id", systemId)
        .single();

      if (freshSystem?.offer) {
        const existing = freshSystem.offer as Record<string, unknown>;
        if (existing.transformation_from && existing.guarantee_text) {
          const offer = assembledOfferSchema.safeParse(existing);
          if (offer.success) {
            return { offer: offer.data };
          }
        }
      }

      const chosenRec = freshSystem?.chosen_recommendation as {
        niche: string;
        bottleneck: string;
        your_solution: string;
        target_segment: { description: string; why: string };
        revenue_potential: { per_client: string; target_clients: number; monthly_total: string };
        strategic_insight: string;
      } | null;

      if (!chosenRec) {
        return { error: "No niche selected." };
      }

      const OFFER_STEP_LABELS: Record<string, string> = {
        "prepare-prompts": "Reading your niche and profile...",
        "generate-transformation": "Writing your transformation story...",
        "generate-guarantee": "Crafting your guarantee...",
        "generate-pricing": "Setting your pricing...",
        "assemble-offer": "Assembling your offer...",
        "validate-offer": "Final review...",
      };

      const offerSteps: ProgressStep[] = Object.entries(OFFER_STEP_LABELS).map(([id, label]) => ({
        id,
        label,
        status: "pending" as const,
      }));

      const trackerId = "offer-generation-progress";
      emitCard(emit, {
        type: "progress-tracker",
        id: trackerId,
        title: "Building your offer...",
        steps: offerSteps,
      });

      try {
        const workflow = mastra.getWorkflow("offer-generation");
        const run = await workflow.createRun();

        const workflowStream = run.stream({
          inputData: {
            chosenRecommendation: chosenRec,
            profile: {
              time_availability: profile.time_availability,
              revenue_goal: profile.revenue_goal,
              blockers: profile.blockers ?? [],
            },
            answers: {
              delivery_model: freshSystem?.delivery_model,
              pricing_direction: freshSystem?.pricing_direction,
              location_city: freshSystem?.location_city,
            },
          },
        });

        for await (const chunk of workflowStream.fullStream) {
          const c = chunk as unknown as Record<string, unknown>;
          const chunkType = c.type as string | undefined;

          if (chunkType === "workflow-step-start") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              emit({ type: "progress", cardId: trackerId, stepId: stepName, status: "active" });
            }
          } else if (chunkType === "workflow-step-result") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              emit({ type: "progress", cardId: trackerId, stepId: stepName, status: "done" });
            }
          }
        }

        const finalResult = await workflowStream.result;

        if (finalResult.status !== "success") {
          return { error: "Offer generation failed." };
        }

        const offer = finalResult.result;

        // Save to DB
        await supabase
          .from("user_systems")
          .update({ offer: offer as unknown as Record<string, unknown> })
          .eq("id", systemId);

        return { offer };
      } catch (err) {
        logger.error("Offer generation failed in chat tool", { systemId, error: String(err) });
        return { error: "Offer generation failed. Please try again." };
      }
    },
  });

  const offerFieldsSchema = z.object({
    segment: z.string().optional(),
    transformation_from: z.string().optional(),
    transformation_to: z.string().optional(),
    system_description: z.string().optional(),
    pricing_setup: z.union([z.number(), z.string()]).transform(Number).optional(),
    pricing_monthly: z.union([z.number(), z.string()]).transform(Number).optional(),
    guarantee_text: z.string().optional(),
  });

  const save_offer_section = tool({
    description:
      "Save the user's confirmed (possibly edited) offer section values to the database. Only valid offer field keys are accepted.",
    inputSchema: z.object({
      updates: z
        .record(z.string(), z.unknown())
        .describe(
          "Offer fields to update. Valid keys: segment, transformation_from, transformation_to, system_description, pricing_setup, pricing_monthly, guarantee_text"
        ),
    }),
    execute: async ({ updates }) => {
      // Validate and coerce — only allow known offer fields
      const parsed = offerFieldsSchema.safeParse(updates);
      const validated = parsed.success ? parsed.data : updates;

      // Strip undefined values
      const clean = Object.fromEntries(
        Object.entries(validated).filter(([, v]) => v !== undefined)
      );

      const { data: current } = await supabase
        .from("user_systems")
        .select("offer")
        .eq("id", systemId)
        .single();

      const currentOffer = (current?.offer as Record<string, unknown>) ?? {};
      const merged = { ...currentOffer, ...clean };

      await supabase
        .from("user_systems")
        .update({ offer: merged })
        .eq("id", systemId);

      return { saved: true, updatedFields: Object.keys(clean) };
    },
  });

  // ---------------------------------------------------------------------------
  // Offer card tools — emit editable-content and offer-summary cards
  // ---------------------------------------------------------------------------

  const show_offer_story = tool({
    description:
      "Show the editable-content card for Exchange 1 (the business story). Call after generate_offer returns. Fields: segment, transformation_from, transformation_to, system_description.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data: freshSystem } = await supabase
        .from("user_systems")
        .select("offer")
        .eq("id", systemId)
        .single();

      const offer = (freshSystem?.offer ?? {}) as Record<string, unknown>;

      emitCard(emit, {
        type: "editable-content",
        id: "offer-story",
        title: "Your Business Story",
        subtitle: "Edit anything that doesn't feel right",
        fields: [
          { name: "segment", label: "Target Segment", value: String(offer.segment ?? ""), type: "textarea" },
          { name: "transformation_from", label: "Where they are now", value: String(offer.transformation_from ?? ""), type: "textarea" },
          { name: "transformation_to", label: "Where they'll be", value: String(offer.transformation_to ?? ""), type: "textarea" },
          { name: "system_description", label: "What you deliver", value: String(offer.system_description ?? ""), type: "textarea" },
        ],
        confirmLabel: "Looks good",
      });

      return { displayed: true, section: "story" };
    },
  });

  const show_offer_pricing = tool({
    description:
      "Show the editable-content card for Exchange 2 (pricing and guarantee). Call after the user confirms Exchange 1. Fields: pricing_setup, pricing_monthly, guarantee_text.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data: freshSystem } = await supabase
        .from("user_systems")
        .select("offer")
        .eq("id", systemId)
        .single();

      const offer = (freshSystem?.offer ?? {}) as Record<string, unknown>;

      emitCard(emit, {
        type: "editable-content",
        id: "offer-pricing",
        title: "The Commitment",
        subtitle: "Your pricing and guarantee",
        fields: [
          { name: "pricing_setup", label: "Setup Fee", value: String(offer.pricing_setup ?? "0"), type: "number", prefix: "£" },
          { name: "pricing_monthly", label: "Monthly Fee", value: String(offer.pricing_monthly ?? "0"), type: "number", prefix: "£" },
          { name: "guarantee_text", label: "Guarantee", value: String(offer.guarantee_text ?? ""), type: "textarea" },
        ],
        confirmLabel: "Confirm pricing",
      });

      return { displayed: true, section: "pricing" };
    },
  });

  const show_offer_review = tool({
    description:
      "Show the offer-summary card for Exchange 3 (final review). Call after the user confirms Exchange 2. Shows the complete offer with a 'Build My System' CTA.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data: freshSystem } = await supabase
        .from("user_systems")
        .select("offer")
        .eq("id", systemId)
        .single();

      const parsed = assembledOfferSchema.safeParse(freshSystem?.offer);
      if (!parsed.success) {
        return { error: "Could not load offer for review." };
      }

      emitCard(emit, {
        type: "offer-summary",
        id: "offer-review",
        offer: parsed.data,
      });

      return { displayed: true, section: "review" };
    },
  });

  const generate_system = tool({
    description:
      "Run the demo builder workflow to create a live demo page. Call after the offer is confirmed. Streams real progress and emits a system-ready card when done.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data: freshSystem } = await supabase
        .from("user_systems")
        .select("offer, chosen_recommendation")
        .eq("id", systemId)
        .single();

      const chosenRec = freshSystem?.chosen_recommendation as {
        niche: string;
        bottleneck: string;
        your_solution: string;
        target_segment: { description: string; why: string };
        revenue_potential: { per_client: string; target_clients: number; monthly_total: string };
        strategic_insight: string;
      } | null;

      const offer = freshSystem?.offer as {
        segment: string;
        transformation_from: string;
        transformation_to: string;
        system_description: string;
        guarantee_text: string;
        guarantee_type: string;
        pricing_setup: number;
        pricing_monthly: number;
        pricing_rationale: string;
        delivery_model: string;
      } | null;

      if (!chosenRec || !offer) {
        return { error: "Missing niche or offer data." };
      }

      const DEMO_STEP_LABELS: Record<string, string> = {
        "generate-demo-config": "Designing your demo page...",
        "validate-demo-config": "Reviewing your demo page...",
      };

      const demoSteps: ProgressStep[] = [
        { id: "generate-demo-config", label: "Designing your demo page...", status: "pending" },
        { id: "niche-agent", label: "Mapping your niche agent...", status: "pending" },
        { id: "form-fields", label: "Building lead qualification form...", status: "pending" },
        { id: "scoring", label: "Configuring scoring rules...", status: "pending" },
        { id: "validate-demo-config", label: "Finalising your unique URL...", status: "pending" },
      ];

      const trackerId = "system-generation-progress";
      emitCard(emit, {
        type: "progress-tracker",
        id: trackerId,
        title: "Building your system...",
        steps: demoSteps,
      });

      try {
        const workflow = mastra.getWorkflow("demo-builder");
        const run = await workflow.createRun();

        const workflowStream = run.stream({
          inputData: {
            chosenRecommendation: chosenRec,
            offer: {
              segment: offer.segment ?? "",
              transformation_from: offer.transformation_from ?? "",
              transformation_to: offer.transformation_to ?? "",
              system_description: offer.system_description ?? "",
              guarantee_text: offer.guarantee_text ?? "",
              guarantee_type: offer.guarantee_type ?? "",
              pricing_setup: Number(offer.pricing_setup ?? 0),
              pricing_monthly: Number(offer.pricing_monthly ?? 0),
              pricing_rationale: offer.pricing_rationale ?? "",
              delivery_model: offer.delivery_model ?? "not specified",
            },
          },
        });

        for await (const chunk of workflowStream.fullStream) {
          const c = chunk as unknown as Record<string, unknown>;
          const chunkType = c.type as string | undefined;

          if (chunkType === "workflow-step-start") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName && DEMO_STEP_LABELS[stepName]) {
              emit({ type: "progress", cardId: trackerId, stepId: stepName, status: "active" });
            }
          } else if (chunkType === "workflow-step-result") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              emit({ type: "progress", cardId: trackerId, stepId: stepName, status: "done" });
            }
          }
        }

        const finalResult = await workflowStream.result;

        if (finalResult.status !== "success") {
          return { error: "System generation failed." };
        }

        const demoConfig = finalResult.result;
        const demoUrl = `/demo/${systemId}`;

        await supabase
          .from("user_systems")
          .update({
            demo_config: demoConfig as unknown as Record<string, unknown>,
            demo_url: demoUrl,
            status: "complete",
          })
          .eq("id", systemId);

        // Emit system ready card
        const fullOffer = assembledOfferSchema.safeParse(freshSystem?.offer);
        emitCard(emit, {
          type: "system-ready",
          id: "system-ready",
          demoUrl,
          offer: fullOffer.success ? fullOffer.data : (freshSystem?.offer as never),
        });

        return { demoUrl };
      } catch (err) {
        logger.error("System generation failed in chat tool", { systemId, error: String(err) });
        return { error: "System generation failed. Please try again." };
      }
    },
  });

  return {
    request_intent_selection,
    request_industry_interests,
    request_own_idea,
    request_own_idea_text,
    request_tried_niche,
    request_what_went_wrong,
    request_fix_or_pivot,
    request_current_business,
    request_growth_direction,
    request_delivery_model,
    request_pricing_direction,
    request_location,
    present_choices,
    request_input,
    save_collected_answers,
    interpret_freeform_response,
    run_niche_analysis,
    save_niche_choice,
    generate_offer,
    save_offer_section,
    show_offer_story,
    show_offer_pricing,
    show_offer_review,
    generate_system,
  };
}
