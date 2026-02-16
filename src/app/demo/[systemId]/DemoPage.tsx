"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { AgentConfig } from "@/lib/ai/agents/types";
import type { DemoResult } from "@/lib/ai/agents/types";

interface DemoPageProps {
  systemId: string;
  agent: AgentConfig;
  businessName: string;
  solution: string;
  segment: string;
  systemDescription?: string;
}

export function DemoPage({
  systemId,
  agent,
  businessName,
  solution,
  segment,
  systemDescription,
}: DemoPageProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function isFormValid(): boolean {
    return agent.formFields
      .filter((f) => f.required)
      .every((f) => formData[f.key]?.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/demo/${systemId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_data: formData }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/5 text-primary rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            AI-Powered Analysis
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-light italic tracking-tight">
            {agent.name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {agent.description}
          </p>
        </div>

        {/* Context */}
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">For:</span>{" "}
              {segment}
            </p>
            {systemDescription && (
              <p>
                <span className="font-medium text-foreground">Service:</span>{" "}
                {systemDescription}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Result display */}
        {result ? (
          <DemoResultCard result={result} onReset={() => setResult(null)} />
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {agent.formFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label
                      htmlFor={field.key}
                      className="text-sm text-muted-foreground"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-0.5">*</span>
                      )}
                    </Label>
                    {field.type === "select" && field.options ? (
                      <select
                        id={field.key}
                        value={formData[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">
                          {field.placeholder ?? "Select..."}
                        </option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={formData[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type === "number" ? "number" : "text"}
                        value={formData[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analysing...
                </>
              ) : (
                <>
                  Get Your Analysis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by{" "}
          <a href="/" className="text-primary hover:underline">
            LaunchPath
          </a>
        </p>
      </div>
    </div>
  );
}

// --- Result card ---
function DemoResultCard({
  result,
  onReset,
}: {
  result: DemoResult;
  onReset: () => void;
}) {
  const priorityColor = {
    HIGH: "text-red-500 bg-red-500/10",
    MEDIUM: "text-yellow-500 bg-yellow-500/10",
    LOW: "text-green-500 bg-green-500/10",
  }[result.priority];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Priority + Score */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${priorityColor}`}
            >
              {result.priority} priority
            </span>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold">
                {result.score}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Estimated value */}
          {result.estimated_value && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Estimated value
              </p>
              <p className="text-lg font-medium">{result.estimated_value}</p>
            </div>
          )}

          {/* Insights */}
          {result.insights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Key Insights
              </h4>
              <ul className="space-y-1.5">
                {result.insights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fit analysis */}
          {Object.keys(result.fit_analysis).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Detailed Analysis
              </h4>
              <div className="space-y-2">
                {Object.entries(result.fit_analysis).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 text-sm border-b border-border/50 pb-2 last:border-0"
                  >
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          {result.next_steps.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Recommended Next Steps
              </h4>
              <ol className="space-y-1.5 list-decimal list-inside">
                {result.next_steps.map((step, i) => (
                  <li key={i} className="text-sm">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={onReset}>
        Submit Another
      </Button>
    </div>
  );
}
