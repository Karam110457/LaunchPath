"use client";

import { useState } from "react";
import { Globe, Loader2, AlertCircle } from "lucide-react";
import { OptionCard } from "@/components/flows/OptionCard";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DiscoveredPage } from "@/types/agent-wizard";

interface BusinessContextStepProps {
  mode: "link_system" | "describe" | null;
  linkedSystemId: string | null;
  businessDescription: string;
  websiteUrl: string;
  discoveredPages: DiscoveredPage[];
  businesses: Array<{ id: string; name: string }>;
  onModeChange: (mode: "link_system" | "describe") => void;
  onSystemSelect: (id: string | null) => void;
  onDescriptionChange: (desc: string) => void;
  onWebsiteUrlChange: (url: string) => void;
  onDiscoveredPagesChange: (pages: DiscoveredPage[]) => void;
}

export function BusinessContextStep({
  mode,
  linkedSystemId,
  businessDescription,
  websiteUrl,
  discoveredPages,
  businesses,
  onModeChange,
  onSystemSelect,
  onDescriptionChange,
  onWebsiteUrlChange,
  onDiscoveredPagesChange,
}: BusinessContextStepProps) {
  const hasBusinesses = businesses.length > 0;
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  async function handleDiscoverPages() {
    if (!websiteUrl.trim()) return;

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Who is this agent for?
        </h2>
        <p className="text-sm text-muted-foreground">
          Help your agent understand the business it represents.
        </p>
      </div>

      {/* Mode selection */}
      <div className="space-y-3">
        {hasBusinesses && (
          <OptionCard
            value="link_system"
            label="Link an existing business"
            description="Use context from a business you've already set up"
            selected={mode === "link_system"}
            onSelect={() => onModeChange("link_system")}
          />
        )}
        <OptionCard
          value="describe"
          label="Describe the business"
          description="Tell us about the business in your own words"
          selected={mode === "describe"}
          onSelect={() => onModeChange("describe")}
        />
      </div>

      {/* Linked system selector */}
      {mode === "link_system" && hasBusinesses && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="system-select">Select a business</Label>
          <select
            id="system-select"
            value={linkedSystemId ?? ""}
            onChange={(e) => onSystemSelect(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Choose a business...</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Business description */}
      {mode === "describe" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="business-desc">Business description</Label>
          <Textarea
            id="business-desc"
            placeholder="e.g., We're a roofing company in Dallas that does residential roof replacement, repair, and inspections. Our main customers are homeowners dealing with storm damage."
            value={businessDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            The more detail you provide, the better your agent will be at
            representing your business.
          </p>
        </div>
      )}

      {/* Website URL (always shown when a mode is selected) */}
      {mode && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2 pt-3">
            <Label htmlFor="website-url" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Website URL
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                type="url"
                placeholder="https://yourbusiness.com"
                value={websiteUrl}
                onChange={(e) => {
                  onWebsiteUrlChange(e.target.value);
                  if (discoveredPages.length > 0) {
                    onDiscoveredPagesChange([]);
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDiscoverPages}
                disabled={discovering || !websiteUrl.trim()}
                className="shrink-0"
              >
                {discovering ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Globe className="w-4 h-4 mr-1.5" />
                )}
                Scan
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll discover pages on your site to build your agent&apos;s
              knowledge base in the next step.
            </p>
          </div>

          {/* Error */}
          {discoverError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{discoverError}</p>
            </div>
          )}

          {/* Discovered pages */}
          {discoveredPages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Found {discoveredPages.length} pages
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => toggleAll(true)}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => toggleAll(false)}
                  >
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                {discoveredPages.map((page, i) => (
                  <label
                    key={page.url}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={page.selected}
                      onChange={() => togglePage(i)}
                      className="rounded border-input"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-xs">
                        {page.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {page.url}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
