"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface FormFieldDef {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

interface DemoFormProps {
  formFields: FormFieldDef[];
  formData: Record<string, string>;
  onUpdateField: (key: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isFormValid: boolean;
  ctaText: string;
  error: string | null;
}

export function DemoForm({
  formFields,
  formData,
  onUpdateField,
  onSubmit,
  isSubmitting,
  isFormValid,
  ctaText,
  error,
}: DemoFormProps) {
  return (
    <ScrollReveal className="max-w-xl mx-auto px-4">
      <div className="space-y-6">
        {/* Section heading */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
            Free Analysis
          </p>
          <h2 className="text-xl sm:text-2xl font-serif font-light italic text-foreground">
            Get Your Personalized Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Fill out the form below. It takes less than 60 seconds.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-4">
            {formFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label
                  htmlFor={field.key}
                  className="text-sm text-foreground/80"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                </Label>

                {field.type === "select" && field.options ? (
                  <Select
                    id={field.key}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      onUpdateField(field.key, e.target.value)
                    }
                  >
                    <option value="">
                      {field.placeholder ?? "Select..."}
                    </option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      onUpdateField(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "number" ? "number" : "text"}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      onUpdateField(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                )}

                {field.helpText && (
                  <p className="text-xs text-muted-foreground/70">
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            disabled={isSubmitting || !isFormValid}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Analysing...
              </>
            ) : (
              <>
                {ctaText}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </ScrollReveal>
  );
}
