"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import { QuestionList, AddQuestionButton } from "../shared/QuestionList";
import { CustomFieldsList } from "../shared/CustomFieldsList";

interface LeadQualificationStepProps {
  templateId: string;
  qualificationMode: "describe" | "questions";
  icpDescription: string;
  disqualificationCriteria: string[];
  qualifyingQuestions: string[];
  businessDescription: string;
  scrapedContent: string;
  faqs: Array<{ question: string; answer: string }>;
  onModeChange: (mode: "describe" | "questions") => void;
  onIcpChange: (value: string) => void;
  onDisqualChange: (value: string[]) => void;
  onQuestionsChange: (questions: string[]) => void;
}

export function LeadQualificationStep({
  templateId,
  qualificationMode,
  icpDescription,
  disqualificationCriteria,
  qualifyingQuestions,
  businessDescription,
  scrapedContent,
  faqs,
  onModeChange,
  onIcpChange,
  onDisqualChange,
  onQuestionsChange,
}: LeadQualificationStepProps) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerateQuestions() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/agents/wizard/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          businessDescription: businessDescription || undefined,
          scrapedContent: scrapedContent || undefined,
          faqs: faqs.length > 0 ? faqs : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Failed to generate questions");
        return;
      }
      onQuestionsChange(data.questions);
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Who's a good fit?"
        description="Help your agent decide which visitors are worth qualifying so it can focus on the right conversations."
      />

      {/* Mode selector */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onModeChange("describe")}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            qualificationMode === "describe"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${qualificationMode === "describe" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Describe your ideal customer
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Tell the agent who you&apos;re looking for and it will figure out the right questions.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("questions")}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            qualificationMode === "questions"
              ? "border-neutral-700 dark:border-neutral-400 bg-white dark:bg-[#252525] shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${qualificationMode === "questions" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Set specific questions
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Write the exact questions your agent should ask every visitor.
          </p>
        </button>
      </div>

      {/* ICP mode */}
      {qualificationMode === "describe" && (
        <WizardCard>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Who is your ideal customer?
            </Label>
            <Textarea
              value={icpDescription}
              onChange={(e) => onIcpChange(e.target.value)}
              placeholder="e.g., Small business owners with 5–50 employees who need help with scheduling and are ready to start within the next month"
              rows={3}
              className="text-sm rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] resize-none"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              The more detail you give, the better your agent will be at spotting good leads.
            </p>
          </div>
        </WizardCard>
      )}

      {/* Questions mode */}
      {qualificationMode === "questions" && (
        <WizardCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Your questions
              </Label>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="gap-1.5 shrink-0 rounded-full gradient-accent-bg text-white border-0 shadow-sm"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate with AI
              </Button>
            </div>

            {genError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{genError}</p>
              </div>
            )}

            {qualifyingQuestions.length === 0 ? (
              <div className="py-6 text-center rounded-2xl border border-dashed border-black/10 dark:border-[#2A2A2A]">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No questions yet. Generate them with AI or add your own.
                </p>
              </div>
            ) : (
              <QuestionList
                questions={qualifyingQuestions}
                onChange={onQuestionsChange}
              />
            )}

            <AddQuestionButton
              questions={qualifyingQuestions}
              onChange={onQuestionsChange}
            />
          </div>
        </WizardCard>
      )}

      {/* Reasons to decline */}
      <WizardCard>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Reasons to decline a lead
              <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              If a visitor matches any of these, the agent will politely let them know you can&apos;t help.
            </p>
          </div>
          <CustomFieldsList
            fields={disqualificationCriteria}
            onChange={onDisqualChange}
            placeholder="e.g., No budget, just browsing"
          />
        </div>
      </WizardCard>
    </div>
  );
}
