"use client";

import { useState, useCallback } from "react";
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
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { DiscoveredPage, WizardFaq, WizardFile } from "@/types/agent-wizard";

interface KnowledgeBaseStepProps {
  discoveredPages: DiscoveredPage[];
  faqs: WizardFaq[];
  files: WizardFile[];
  businessDescription: string;
  onPagesChange: (pages: DiscoveredPage[]) => void;
  onFaqsChange: (faqs: WizardFaq[]) => void;
  onFilesChange: (files: WizardFile[]) => void;
}

export function KnowledgeBaseStep({
  discoveredPages,
  faqs,
  files,
  businessDescription,
  onPagesChange,
  onFaqsChange,
  onFilesChange,
}: KnowledgeBaseStepProps) {
  const selectedPages = discoveredPages.filter((p) => p.selected);
  const scannedPages = selectedPages.filter((p) => p.status === "done");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Build your knowledge base
        </h2>
        <p className="text-sm text-muted-foreground">
          Give your agent the information it needs to help your customers.
        </p>
      </div>

      <Tabs defaultValue="website" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="website" className="flex-1 gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Website
            {scannedPages.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
              >
                {scannedPages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex-1 gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            FAQs
            {faqs.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
              >
                {faqs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="flex-1 gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Files
            {files.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
              >
                {files.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website">
          <WebsiteTab
            discoveredPages={discoveredPages}
            onPagesChange={onPagesChange}
          />
        </TabsContent>

        <TabsContent value="faqs">
          <FaqsTab
            faqs={faqs}
            onFaqsChange={onFaqsChange}
            scrapedContent={scannedPages.map((p) => p.content || "").join("\n\n")}
            businessDescription={businessDescription}
            hasUnscannedPages={selectedPages.length > scannedPages.length && selectedPages.length > 0}
          />
        </TabsContent>

        <TabsContent value="files">
          <FilesTab files={files} onFilesChange={onFilesChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Website Tab
// ---------------------------------------------------------------------------

function WebsiteTab({
  discoveredPages,
  onPagesChange,
}: {
  discoveredPages: DiscoveredPage[];
  onPagesChange: (pages: DiscoveredPage[]) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const selectedPages = discoveredPages.filter((p) => p.selected);

  async function handleScanPages() {
    if (selectedPages.length === 0) return;

    setScanning(true);
    const updated = [...discoveredPages];

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
          updated[i] = {
            ...updated[i],
            status: "done",
            content: data.content || "",
            title: data.title || updated[i].title,
          };
        } else {
          updated[i] = { ...updated[i], status: "error" };
        }
      } catch {
        updated[i] = { ...updated[i], status: "error" };
      }

      onPagesChange([...updated]);
    }

    setScanning(false);
  }

  if (discoveredPages.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Globe className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          No pages discovered yet. Add a website URL in the previous step to
          scan pages.
        </p>
      </div>
    );
  }

  const doneCount = discoveredPages.filter((p) => p.status === "done").length;
  const selectedCount = selectedPages.length;

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {doneCount} of {selectedCount} selected pages scanned
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleScanPages}
          disabled={scanning || selectedCount === 0}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <Globe className="w-4 h-4 mr-1.5" />
          )}
          Scan selected pages
        </Button>
      </div>

      <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
        {discoveredPages
          .filter((p) => p.selected)
          .map((page) => (
            <div
              key={page.url}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1 mr-3">
                <p className="font-medium truncate text-xs">{page.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {page.url}
                </p>
              </div>
              <PageStatus status={page.status} />
            </div>
          ))}
      </div>
    </div>
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
    case "error":
      return (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="text-xs text-muted-foreground">Pending</span>
      );
  }
}

// ---------------------------------------------------------------------------
// FAQs Tab
// ---------------------------------------------------------------------------

function FaqsTab({
  faqs,
  onFaqsChange,
  scrapedContent,
  businessDescription,
  hasUnscannedPages,
}: {
  faqs: WizardFaq[];
  onFaqsChange: (faqs: WizardFaq[]) => void;
  scrapedContent: string;
  businessDescription: string;
  hasUnscannedPages: boolean;
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

      // Append to existing, don't replace
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

  const hasScrapedContent = scrapedContent.trim().length > 0;
  const hasDescription = businessDescription.trim().length > 0;
  const hasContent = hasScrapedContent || hasDescription;

  return (
    <div className="space-y-4 pt-3">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleGenerateFaqs}
          disabled={generating || !hasContent}
          className="gap-1.5"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate FAQs
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add manually
        </Button>
      </div>

      {!hasContent && (
        <p className="text-xs text-muted-foreground">
          {hasUnscannedPages
            ? "Scan your website pages in the Website tab first, then come back to generate FAQs."
            : "Add a business description (step 2) or scan website pages first to enable AI FAQ generation."}
        </p>
      )}

      {genError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{genError}</p>
        </div>
      )}

      {/* Manual add form */}
      {showAddForm && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Question</Label>
            <Input
              placeholder="What is your return policy?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Answer</Label>
            <Textarea
              placeholder="We offer a 30-day money-back guarantee..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddManual}
              disabled={!newQuestion.trim() || !newAnswer.trim()}
            >
              Add FAQ
            </Button>
          </div>
        </div>
      )}

      {/* FAQ list */}
      {faqs.length === 0 ? (
        <div className="py-6 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No FAQs yet. Generate them from your content or add them manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg border p-3 group relative"
            >
              <button
                type="button"
                onClick={() => handleRemoveFaq(faq.id)}
                className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{faq.question}</p>
                </div>
                <p className="text-xs text-muted-foreground">{faq.answer}</p>
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px] h-4 px-1.5"
                >
                  {faq.source === "generated" ? "AI generated" : "Manual"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Files Tab
// ---------------------------------------------------------------------------

function FilesTab({
  files,
  onFilesChange,
}: {
  files: WizardFile[];
  onFilesChange: (files: WizardFile[]) => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: WizardFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (!["pdf", "txt", "md"].includes(ext || "")) continue;

        let extractedText: string | undefined;
        if (ext === "txt" || ext === "md") {
          extractedText = await file.text();
        }
        // PDFs will be processed server-side after agent creation

        newFiles.push({
          file,
          name: file.name,
          size: file.size,
          extractedText,
        });
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleRemoveFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Drop zone */}
      <label
        className={`
          flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors
          ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/50"
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports PDF, TXT, and MD files
        </p>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md"
          multiple
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(f.size)}
                    {f.extractedText ? " — text extracted" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(i)}
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
