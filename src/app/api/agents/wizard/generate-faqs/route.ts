import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { wizardFaqOutputSchema } from "@/lib/ai/schemas";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { content?: string; businessDescription?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, businessDescription } = body;
  if (!content && !businessDescription) {
    return NextResponse.json(
      { error: "Content or business description is required" },
      { status: 400 },
    );
  }

  const prompt = [
    businessDescription
      ? `Business description:\n${businessDescription}\n`
      : "",
    content ? `Website content:\n${content}` : "",
  ]
    .filter(Boolean)
    .join("\n---\n\n");

  try {
    const agent = mastra.getAgent("wizard-faq-generator");
    const result = await withRateLimitRetry(() =>
      agent.generate(
        `Generate FAQs based on the following:\n\n${prompt}`,
        { structuredOutput: { schema: wizardFaqOutputSchema } },
      ),
    );

    const output = result.object;
    if (!output || !output.faqs) {
      return NextResponse.json(
        { error: "Failed to generate FAQs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ faqs: output.faqs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "FAQ generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
