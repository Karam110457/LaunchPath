"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Globe,
  MessageSquare,
  FileText,
  Plus,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import type { DiscoveredPage, WizardFaq, WizardFile } from "@/types/agent-wizard";

interface KnowledgeBaseStepProps {
  templateId: string | null;
  discoveredPages: DiscoveredPage[];
  faqs: WizardFaq[];
  files: WizardFile[];
  businessDescription: string;
  onPagesChange: (pages: DiscoveredPage[]) => void;
  onFaqsChange: (faqs: WizardFaq[]) => void;
}

export function KnowledgeBaseStep({
  discoveredPages,
  faqs,
  files,
  businessDescription,
  onPagesChange,
  onFaqsChange,
}: KnowledgeBaseStepProps) {
  const selectedPages = discoveredPages.filter((p) => p.selected);
  const scannedPages = selectedPages.filter((p) => p.status === "done");
  const hasPages = discoveredPages.length > 0;
  const hasContent = scannedPages.length > 0 || businessDescription.trim().length > 0;
  const isScanning = selectedPages.some((p) => p.status === "pending" || p.status === "scraping");

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title={hasPages || faqs.length > 0 ? "Review what we found" : "Add knowledge"}
        description="Give your agent the information it needs to help your customers accurately."
      />

      {/* Website content section */}
      {hasPages && (
        <WebsiteSection
          discoveredPages={discoveredPages}
          onPagesChange={onPagesChange}
        />
      )}

      {/* FAQs section */}
      <FaqsSection
        faqs={faqs}
        onFaqsChange={onFaqsChange}
        scrapedContent={scannedPages.map((p) => p.content || "").join("\n\n")}
        businessDescription={businessDescription}
        hasContent={hasContent}
        isScanning={isScanning}
      />

      {/* Files summary (uploaded in previous step) */}
      {files.length > 0 && (
        <WizardCard>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Files
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
              {files.length} uploaded
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {files.map((f, i) => (
              <p key={i} className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {f.name}
              </p>
            ))}
          </div>
        </WizardCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Website Section
// ---------------------------------------------------------------------------

function WebsiteSection({
  discoveredPages,
  onPagesChange,
}: {
  discoveredPages: DiscoveredPage[];
  onPagesChange: (pages: DiscoveredPage[]) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const autoScanFired = useRef(false);

  const selectedPages = discoveredPages.filter((p) => p.selected);
  const doneCount = discoveredPages.filter((p) => p.status === "done").length;

  const pagesRef = useRef(discoveredPages);
  pagesRef.current = discoveredPages;

  const scanPages = useCallback(async () => {
    const pages = pagesRef.current;
    const hasUnscanned = pages.some((p) => p.selected && p.status !== "done" && p.status !== "scraping");
    if (!hasUnscanned) return;

    setScanning(true);
    const updated = [...pages];

    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].selected) continue;
      if (updated[i].status === "done") continue;

      updated[i] = { ...updated[i], status: "scraping" };
      onPagesChange([...updated]);

      try {
        const res = await fetch("/api/agents/wizard/scrape-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: updated[i].url }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.content?.trim()) {
            updated[i] = {
              ...updated[i],
              status: "done",
              content: data.content,
              title: data.title || updated[i].title,
            };
          } else {
            updated[i] = { ...updated[i], status: "empty" };
          }
        } else {
          updated[i] = { ...updated[i], status: "error" };
        }
      } catch {
        updated[i] = { ...updated[i], status: "error" };
      }

      onPagesChange([...updated]);
    }

    setScanning(false);
  }, [onPagesChange]);

  // Auto-scan unscanned pages when first mounted
  useEffect(() => {
    if (autoScanFired.current) return;
    const hasUnscanned = discoveredPages.some(
      (p) => p.selected && p.status === "pending",
    );
    if (hasUnscanned) {
      autoScanFired.current = true;
      scanPages();
    }
  }, [discoveredPages, scanPages]);

  return (
    <WizardCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ stroke: "url(#wizard-icon-gradient)" }} />
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Website pages
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
              {scanning ? "Scanning..." : `${doneCount} of ${selectedPages.length} scanned`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!scanning && doneCount < selectedPages.length && selectedPages.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={scanPages}
                className="gap-1.5 rounded-full gradient-accent-bg text-white border-0 shadow-sm text-xs h-7"
              >
                <Globe className="w-3 h-3" />
                {doneCount > 0 ? "Retry failed" : "Scan"}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] divide-y divide-black/5 dark:divide-[#2A2A2A] max-h-48 overflow-y-auto">
            {discoveredPages
              .filter((p) => p.selected)
              .map((page) => (
                <div
                  key={page.url}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium truncate text-xs text-neutral-800 dark:text-neutral-200">
                      {page.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {page.url}
                    </p>
                  </div>
                  <PageStatus status={page.status} />
                </div>
              ))}
          </div>
        )}
      </div>
    </WizardCard>
  );
}

function PageStatus({ status }: { status: DiscoveredPage["status"] }) {
  switch (status) {
    case "scraping":
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          Scanning
        </span>
      );
    case "done":
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      );
    case "empty":
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="w-3 h-3" />
          No content
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return <span className="text-xs text-neutral-400">Pending</span>;
  }
}

// ---------------------------------------------------------------------------
// FAQs Section
// ---------------------------------------------------------------------------

function FaqsSection({
  faqs,
  onFaqsChange,
  scrapedContent,
  businessDescription,
  hasContent,
  isScanning,
}: {
  faqs: WizardFaq[];
  onFaqsChange: (faqs: WizardFaq[]) => void;
  scrapedContent: string;
  businessDescription: string;
  hasContent: boolean;
  isScanning: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  async function handleGenerateFaqs() {
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/agents/wizard/generate-faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: scrapedContent || undefined,
          businessDescription: businessDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Failed to generate FAQs");
        return;
      }

      const generated: WizardFaq[] = data.faqs.map(
        (f: { question: string; answer: string }, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          question: f.question,
          answer: f.answer,
          source: "generated" as const,
        }),
      );

      onFaqsChange([...faqs, ...generated]);
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleAddManual() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const faq: WizardFaq = {
      id: `manual-${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      source: "manual",
    };

    onFaqsChange([...faqs, faq]);
    setNewQuestion("");
    setNewAnswer("");
    setShowAddForm(false);
  }

  function handleRemoveFaq(id: string) {
    onFaqsChange(faqs.filter((f) => f.id !== id));
  }

  return (
    <WizardCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#9D50BB]" />
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              FAQs
            </span>
            {faqs.length > 0 && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                {faqs.length} items
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleGenerateFaqs}
              disabled={generating || isScanning || !hasContent}
              className="gap-1.5 rounded-full gradient-accent-bg text-white border-0 shadow-sm text-xs h-7"
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isScanning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isScanning ? "Waiting for scan..." : "Generate"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-1 rounded-full text-xs h-7 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>
        </div>

        {genError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{genError}</p>
          </div>
        )}

        {/* Manual add form */}
        {showAddForm && (
          <div className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] p-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-600 dark:text-neutral-400">Question</Label>
              <Input
                placeholder="What is your return policy?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="rounded-xl bg-[#f8f9fa] dark:bg-[#1E1E1E] border-black/5 dark:border-[#2A2A2A]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-600 dark:text-neutral-400">Answer</Label>
              <Textarea
                placeholder="We offer a 30-day money-back guarantee..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={2}
                className="rounded-xl bg-[#f8f9fa] dark:bg-[#1E1E1E] border-black/5 dark:border-[#2A2A2A] resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddManual}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="rounded-full gradient-accent-bg text-white border-0"
              >
                Add FAQ
              </Button>
            </div>
          </div>
        )}

        {/* FAQ list */}
        {faqs.length === 0 && !generating ? (
          <div className="py-4 text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              {isScanning
                ? "Scanning your website — you can generate FAQs once it's done."
                : hasContent
                  ? "Click Generate to create FAQs from your content."
                  : "Add a business description or website first to generate FAQs."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] p-3 group relative"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(faq.id)}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="pr-6">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {faq.question}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {faq.answer}
                  </p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border border-black/5 dark:border-[#2A2A2A] text-neutral-400 dark:text-neutral-500">
                    {faq.source === "generated" ? "AI generated" : "Manual"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WizardCard>
  );
}
