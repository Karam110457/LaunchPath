import { z } from "zod";

/**
 * Validation schema for demo page form submissions.
 * The form_data is flexible (varies by niche agent) so we validate loosely.
 */
export const demoSubmissionSchema = z.object({
  form_data: z.record(z.string(), z.unknown()).refine(
    (data) => Object.keys(data).length > 0,
    { message: "Form data cannot be empty" }
  ),
});

export type DemoSubmissionInput = z.infer<typeof demoSubmissionSchema>;
