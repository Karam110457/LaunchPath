"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

interface AddContactDialogProps {
  campaignId: string;
  onDone: () => void;
  onClose: () => void;
}

export function AddContactDialog({
  campaignId,
  onDone,
  onClose,
}: AddContactDialogProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: trimmedPhone,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          tags: tagList.length > 0 ? tagList : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add contact");
      }

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              Add Contact
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Phone Number *</Label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
              placeholder="+1234567890"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              E.164 format with country code (e.g., +1 for US)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Contact name"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={INPUT_CLASS}
              placeholder="vip, campaign-q1 (comma-separated)"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50/60 dark:bg-red-900/20 rounded-xl px-3 py-2 border border-red-200/50 dark:border-red-800/30">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Contact"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
