"use client";

import { useState } from "react";
import { X, Loader2, Trash2, Phone, Calendar, Hash, MessageCircle, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { ContactRecord } from "./ContactsList";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

interface ContactDetailProps {
  contact: ContactRecord;
  campaignId: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ContactDetail({
  contact,
  campaignId,
  onClose,
  onSaved,
  onDeleted,
}: ContactDetailProps) {
  const [name, setName] = useState(contact.name ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [status, setStatus] = useState(contact.status);
  const [tags, setTags] = useState<string[]>(contact.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/${contact.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || null,
            email: email.trim() || null,
            status,
            tags,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/${contact.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#141414] border-l border-neutral-200/50 dark:border-neutral-700/40 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/40 bg-white/80 dark:bg-[#141414]/80 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-foreground">
            Contact Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Read-only info */}
          <div className="rounded-[1rem] border border-neutral-200/50 dark:border-neutral-700/40 bg-neutral-50/50 dark:bg-neutral-800/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono">{contact.phone}</span>
            </div>
            {contact.profile_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="w-3.5 h-3.5" />
                <span>Profile: {contact.profile_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{contact.conversation_count ?? 0} conversations</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Added {formatDateTime(contact.created_at)}</span>
            </div>
            {contact.last_replied_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last reply {formatDateTime(contact.last_replied_at)}</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground/60">
              Source: {contact.source ?? "—"}
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Name
              </Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact name"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Email
              </Label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Status
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="active">Active</option>
                <option value="opted_out">Opted Out</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Tags
              </Label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-foreground border border-[#FF8C00]/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag…"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="shrink-0 p-2 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Delete contact?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
