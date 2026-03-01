import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { wizardQuestionsOutputSchema } from "@/lib/ai/schemas";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";

export async function POST(request: NextRequest) {
  const rl = rateLimit(getClientIdentifier(request), "wizard/generate-questions", 5);
  if (!rl.success) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    templateId?: string;
    businessDescription?: string;
    scrapedContent?: string;
    faqs?: Array<{ question: string; answer: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { templateId, businessDescription, scrapedContent, faqs } = body;
  if (!templateId) {
    return NextResponse.json(
      { error: "Template ID is required" },
      { status: 400 },
    );
  }

  // Build context for the question generator
  const parts: string[] = [];
  parts.push(
    `Agent type: ${templateId === "appointment-booker" ? "APPOINTMENT BOOKER" : "CUSTOMER SUPPORT"}`,
  );

  if (businessDescription) {
    parts.push(`Business description:\n${businessDescription}`);
  }
  if (scrapedContent) {
    parts.push(
      `Website content (summary):\n${scrapedContent.slice(0, 8000)}`,
    );
  }
  if (faqs && faqs.length > 0) {
    const faqText = faqs
      .map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`)
      .join("\n");
    parts.push(`Existing FAQs:\n${faqText}`);
  }

  const context = parts.join("\n\n---\n\n");

  try {
    const agent = mastra.getAgent("wizard-question-generator");
    const result = await withRateLimitRetry(() =>
      agent.generate(
        `Generate qualifying questions for this agent:\n\n${context}`,
        { structuredOutput: { schema: wizardQuestionsOutputSchema } },
      ),
    );

    const output = result.object;
    if (!output || !output.questions) {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ questions: output.questions });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Question generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
