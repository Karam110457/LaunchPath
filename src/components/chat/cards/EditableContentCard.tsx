"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CollapsedCard from "./CollapsedCard";
import type { CardData, EditableField } from "@/lib/chat/types";

interface EditableContentCardProps {
  card: Extract<CardData, { type: "editable-content" }>;
  completed: boolean;
  completedSummary?: string;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function EditableContentCard({
  card,
  completed,
  completedSummary,
  onComplete,
}: EditableContentCardProps) {
  // Track current values per field name
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(card.fields.map((f) => [f.name, f.value]))
  );
  // Which field is currently being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  // Draft value while editing
  const [draftValue, setDraftValue] = useState<string>("");

  if (completed) {
    return <CollapsedCard summary={completedSummary} />;
  }

  function startEdit(field: EditableField) {
    setEditingField(field.name);
    setDraftValue(values[field.name] ?? "");
  }

  function confirmEdit(fieldName: string) {
    setValues((prev) => ({ ...prev, [fieldName]: draftValue }));
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  function handleConfirm() {
    onComplete(
      `Confirmed: ${card.title}`,
      `[${card.id} confirmed: ${JSON.stringify(values)}]`
    );
  }

  return (
    <div className="max-w-[600px] w-full space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-zinc-800">{card.title}</h3>
        {card.subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{card.subtitle}</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {card.fields.map((field) => (
          <FieldRow
            key={field.name}
            field={field}
            currentValue={values[field.name] ?? ""}
            isEditing={editingField === field.name}
            draftValue={draftValue}
            onDraftChange={setDraftValue}
            onStartEdit={() => startEdit(field)}
            onConfirmEdit={() => confirmEdit(field.name)}
            onCancelEdit={cancelEdit}
          />
        ))}
      </div>

      {/* Confirm button */}
      <Button
        onClick={handleConfirm}
        disabled={editingField !== null}
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base"
      >
        {card.confirmLabel ?? "Looks good →"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------

function FieldRow({
  field,
  currentValue,
  isEditing,
  draftValue,
  onDraftChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
}: {
  field: EditableField;
  currentValue: string;
  isEditing: boolean;
  draftValue: string;
  onDraftChange: (v: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && field.type !== "textarea") {
      e.preventDefault();
      onConfirmEdit();
    }
    if (e.key === "Escape") onCancelEdit();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Field header */}
      <div className="px-3 pt-3 pb-1 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-zinc-700">{field.label}</p>
          {field.hint && (
            <p className="text-xs text-zinc-400 mt-0.5">{field.hint}</p>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[32px]"
          >
            <Pencil className="size-3" />
            Edit
          </button>
        )}
      </div>

      {/* Value / edit area */}
      <div className="px-3 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            {field.type === "textarea" ? (
              <Textarea
                autoFocus
                rows={3}
                value={draftValue}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none rounded-lg border-zinc-200 text-sm focus-visible:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center gap-1">
                {field.prefix && (
                  <span className="text-sm font-semibold text-zinc-500">
                    {field.prefix}
                  </span>
                )}
                <Input
                  autoFocus
                  type={field.type === "number" ? "number" : "text"}
                  value={draftValue}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9 rounded-lg border-zinc-200 text-sm focus-visible:ring-indigo-500"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                <X className="size-3" />
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Check className="size-3" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2 min-h-[36px]">
            <p className="text-sm text-zinc-800 break-words">
              {field.prefix && (
                <span className="font-semibold text-zinc-500 mr-0.5">
                  {field.prefix}
                </span>
              )}
              {currentValue || (
                <span className="text-zinc-400 italic">Not set</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
