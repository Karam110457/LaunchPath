"use client";

import { useState } from "react";
import { X, Plus, Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const TEXTAREA_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50 resize-none font-mono";

const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

interface TemplateEditorProps {
  channelApiBase: string;
  onCreated: () => void;
  onClose: () => void;
}

type Category = "MARKETING" | "UTILITY" | "AUTHENTICATION";

const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: "MARKETING", label: "Marketing", hint: "Promotions & offers" },
  { value: "UTILITY", label: "Utility", hint: "Order updates & alerts" },
  { value: "AUTHENTICATION", label: "Authentication", hint: "OTP & verification" },
];

interface ButtonEntry {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
}

export function TemplateEditor({
  channelApiBase,
  onCreated,
  onClose,
}: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState<Category>("MARKETING");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<ButtonEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function insertVariable() {
    // Count existing {{N}} variables and add next
    const matches = bodyText.match(/\{\{\d+\}\}/g) ?? [];
    const next = matches.length + 1;
    setBodyText((prev) => prev + `{{${next}}}`);
  }

  function addButton() {
    if (buttons.length >= 3) return;
    setButtons((prev) => [...prev, { type: "QUICK_REPLY", text: "" }]);
  }

  function updateButton(i: number, update: Partial<ButtonEntry>) {
    setButtons((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, ...update } : b))
    );
  }

  function removeButton(i: number) {
    setButtons((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim()) return;

    setSaving(true);
    setError(null);

    // Build components array
    const components: Record<string, unknown>[] = [];

    if (headerText.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerText.trim(),
      });
    }

    components.push({
      type: "BODY",
      text: bodyText.trim(),
    });

    if (footerText.trim()) {
      components.push({
        type: "FOOTER",
        text: footerText.trim(),
      });
    }

    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons
          .filter((b) => b.text.trim())
          .map((b) => {
            const btn: Record<string, unknown> = {
              type: b.type,
              text: b.text.trim(),
            };
            if (b.type === "URL" && b.url) btn.url = b.url;
            if (b.type === "PHONE_NUMBER" && b.phone_number)
              btn.phone_number = b.phone_number;
            return btn;
          }),
      });
    }

    try {
      const res = await fetch(`${channelApiBase}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_"),
          language,
          category,
          components,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-base font-semibold text-foreground">
            Create Template
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Template Name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
              placeholder="e.g., order_confirmation"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Lowercase, underscores only. Auto-formatted on submit.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    style={isSelected ? gradientBorderStyle : undefined}
                    className={`text-center px-3 py-2.5 rounded-[16px] border-2 transition-all text-xs ${
                      isSelected
                        ? "[--card-bg:#fff] dark:[--card-bg:#171717] border-transparent font-medium text-foreground"
                        : "border-neutral-200/60 dark:border-[#2A2A2A] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                    <span className="block text-[9px] text-muted-foreground mt-0.5">
                      {cat.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="en_US">English (US)</option>
              <option value="en_GB">English (UK)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt_BR">Portuguese (BR)</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

          {/* Header */}
          <div className="space-y-1.5">
            <Label className="text-xs">Header (optional)</Label>
            <input
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g., Order Update"
              maxLength={60}
            />
            <CharCount current={headerText.length} max={60} />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Body *</Label>
              <button
                type="button"
                onClick={insertVariable}
                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Variable
              </button>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              className={TEXTAREA_CLASS}
              placeholder={"Hi {{1}}, your order #{{2}} has been shipped!"}
              required
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Use {"{{1}}"}, {"{{2}}"}, etc. for dynamic values.
              </p>
              <CharCount current={bodyText.length} max={1024} />
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-1.5">
            <Label className="text-xs">Footer (optional)</Label>
            <input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g., Reply STOP to unsubscribe"
              maxLength={60}
            />
            <CharCount current={footerText.length} max={60} />
          </div>

          <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

          {/* Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Buttons (optional, max 3)</Label>
              {buttons.length < 3 && (
                <button
                  type="button"
                  onClick={addButton}
                  className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              )}
            </div>

            {buttons.map((btn, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={btn.type}
                    onChange={(e) =>
                      updateButton(i, {
                        type: e.target.value as ButtonEntry["type"],
                      })
                    }
                    className={`${INPUT_CLASS} w-auto`}
                  >
                    <option value="QUICK_REPLY">Quick Reply</option>
                    <option value="URL">URL</option>
                    <option value="PHONE_NUMBER">Phone</option>
                  </select>
                  <input
                    value={btn.text}
                    onChange={(e) => updateButton(i, { text: e.target.value })}
                    className={`${INPUT_CLASS} flex-1`}
                    placeholder="Button text"
                    maxLength={25}
                  />
                  <button
                    type="button"
                    onClick={() => removeButton(i)}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {btn.type === "URL" && (
                  <input
                    value={btn.url ?? ""}
                    onChange={(e) => updateButton(i, { url: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="https://example.com/{{1}}"
                  />
                )}
                {btn.type === "PHONE_NUMBER" && (
                  <input
                    value={btn.phone_number ?? ""}
                    onChange={(e) =>
                      updateButton(i, { phone_number: e.target.value })
                    }
                    className={INPUT_CLASS}
                    placeholder="+1234567890"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !bodyText.trim()}
              className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit to Meta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  const color = ratio >= 1 ? "text-red-500" : ratio >= 0.8 ? "text-amber-500" : "text-muted-foreground/60";
  return (
    <span className={`text-[10px] font-mono ${color}`}>
      {current}/{max}
    </span>
  );
}
