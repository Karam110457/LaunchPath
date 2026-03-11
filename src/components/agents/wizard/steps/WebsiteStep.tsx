"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Loader2, AlertCircle, CheckCircle2, Upload, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import type { DiscoveredPage, WizardFile } from "@/types/agent-wizard";

interface WebsiteStepProps {
  websiteUrl: string;
  discoveredPages: DiscoveredPage[];
  files: WizardFile[];
  onWebsiteUrlChange: (url: string) => void;
  onDiscoveredPagesChange: (pages: DiscoveredPage[]) => void;
  onFilesChange: (files: WizardFile[]) => void;
}

export function WebsiteStep({
  websiteUrl,
  discoveredPages,
  files,
  onWebsiteUrlChange,
  onDiscoveredPagesChange,
  onFilesChange,
}: WebsiteStepProps) {
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const autoScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScannedUrlRef = useRef<string>("");
  const [dragActive, setDragActive] = useState(false);

  // Auto-scan: debounce 800ms after user stops typing a valid URL
  useEffect(() => {
    if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);

    const trimmed = websiteUrl.trim();
    if (!trimmed || discovering) return;
    if (trimmed === lastScannedUrlRef.current) return;
    try {
      const parsed = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );
      if (!parsed.hostname.includes(".")) return;
    } catch {
      return;
    }

    autoScanTimerRef.current = setTimeout(() => {
      lastScannedUrlRef.current = trimmed;
      handleDiscoverPages();
    }, 800);

    return () => {
      if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteUrl]);

  async function handleDiscoverPages() {
    if (!websiteUrl.trim()) return;

    lastScannedUrlRef.current = websiteUrl.trim();
    setDiscovering(true);
    setDiscoverError(null);

    try {
      const res = await fetch("/api/agents/wizard/discover-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDiscoverError(data.error || "Failed to discover pages");
        return;
      }

      const pages: DiscoveredPage[] = data.pages.map(
        (p: { url: string; title: string }) => ({
          url: p.url,
          title: p.title,
          selected: true,
          status: "pending" as const,
        }),
      );
      onDiscoveredPagesChange(pages);
    } catch {
      setDiscoverError("Network error. Please check the URL and try again.");
    } finally {
      setDiscovering(false);
    }
  }

  function togglePage(index: number) {
    const updated = [...discoveredPages];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    onDiscoveredPagesChange(updated);
  }

  function toggleAll(selected: boolean) {
    onDiscoveredPagesChange(
      discoveredPages.map((p) => ({ ...p, selected })),
    );
  }

  async function handleFiles(fileList: FileList) {
    const newFiles: WizardFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "txt", "md"].includes(ext || "")) continue;

      let extractedText: string | undefined;
      if (ext === "txt" || ext === "md") {
        extractedText = await file.text();
      }

      newFiles.push({ file, name: file.name, size: file.size, extractedText });
    }
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Train from your website or files"
        description="Your agent will learn from your website content and any files you upload. This is the fastest way to get started."
      />

      {/* Website URL */}
      <WizardCard className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="website-url"
            className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            <Globe className="w-4 h-4 text-[#FF8C00]" />
            Website URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="website-url"
              type="url"
              placeholder="https://yourbusiness.com"
              value={websiteUrl}
              autoFocus
              onChange={(e) => {
                onWebsiteUrlChange(e.target.value);
                if (discoveredPages.length > 0) {
                  onDiscoveredPagesChange([]);
                }
              }}
              className="flex-1 rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] text-base h-11"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleDiscoverPages}
              disabled={discovering || !websiteUrl.trim()}
              className="shrink-0 rounded-full gradient-accent-bg text-white border-0 shadow-sm h-11 px-5"
            >
              {discovering ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Globe className="w-4 h-4 mr-1.5" />
              )}
              Scan
            </Button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            We&apos;ll discover pages on your site and use the content to train your agent.
          </p>
        </div>

        {/* Error */}
        {discoverError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{discoverError}</p>
          </div>
        )}

        {/* Discovered pages */}
        {discoveredPages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 inline mr-1.5 -mt-0.5" />
                Found {discoveredPages.length} pages
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-[#FF8C00] hover:underline"
                  onClick={() => toggleAll(true)}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-xs text-neutral-400 hover:underline"
                  onClick={() => toggleAll(false)}
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-black/5 dark:border-[#2A2A2A] divide-y divide-black/5 dark:divide-[#2A2A2A]">
              {discoveredPages.map((page, i) => (
                <label
                  key={page.url}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white dark:hover:bg-[#252525] cursor-pointer text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={page.selected}
                    onChange={() => togglePage(i)}
                    className="rounded border-neutral-300 dark:border-[#333333] text-neutral-900 dark:text-white focus:ring-neutral-400/30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-xs text-neutral-800 dark:text-neutral-200">
                      {page.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {page.url}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </WizardCard>

      {/* Divider */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-black/5 dark:bg-[#2A2A2A]" />
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          or upload files
        </span>
        <div className="h-px flex-1 bg-black/5 dark:bg-[#2A2A2A]" />
      </div>

      {/* File upload */}
      <label
        className={`
          flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-6 cursor-pointer transition-colors
          ${
            dragActive
              ? "border-neutral-500 dark:border-neutral-400 bg-neutral-100 dark:bg-neutral-800/30"
              : "border-black/10 dark:border-[#2A2A2A] hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/20"
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-5 h-5 text-neutral-400 mb-1.5" />
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Drop files here or click to browse
        </p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
          PDF, TXT, and MD files
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

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-neutral-800 dark:text-neutral-200">
                    {f.name}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatFileSize(f.size)}
                    {f.extractedText
                      ? " — text extracted"
                      : " — will be processed after creation"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                className="shrink-0 p-1.5 rounded-full text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Skip hint */}
      {discoveredPages.length === 0 && files.length === 0 && (
        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          No website or files? No worries — you can skip this step and add content later.
        </p>
      )}
    </div>
  );
}
