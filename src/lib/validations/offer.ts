import { z } from "zod";

/**
 * Validation schema for the complete Offer object before DB save.
 */
export const offerSchema = z.object({
  segment: z.string().min(1),
  transformation_from: z.string().min(1),
  transformation_to: z.string().min(1),
  system_description: z.string().min(1),
  pricing_setup: z.number().min(0),
  pricing_monthly: z.number().min(0),
  guarantee: z.string(), // Can be empty if skipped
  delivery_model: z.string().min(1),
});

export type OfferInput = z.infer<typeof offerSchema>;
