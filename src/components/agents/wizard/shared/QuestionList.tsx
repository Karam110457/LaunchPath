"use client";

import { useState, useCallback } from "react";
import { Pencil, Check, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QuestionListProps {
  questions: string[];
  onChange: (questions: string[]) => void;
}

export function QuestionList({ questions, onChange }: QuestionListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(questions[index]);
    },
    [questions],
  );

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...questions];
    updated[editingIndex] = editValue;
    onChange(updated);
    setEditingIndex(null);
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-2xl bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] px-3 py-2.5 group"
        >
          <span className="shrink-0 text-xs font-mono text-neutral-400 dark:text-neutral-500 mt-0.5 w-5">
            {i + 1}.
          </span>

          {editingIndex === i ? (
            <div className="flex-1 flex gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 h-8 text-sm rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditingIndex(null);
                }}
              />
              <button
                type="button"
                onClick={saveEdit}
                className="shrink-0 p-1.5 rounded-full text-neutral-500 hover:text-[#FF8C00] hover:bg-[#FF8C00]/10 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="flex-1 text-sm mt-0.5 text-neutral-800 dark:text-neutral-200">
                {q || (
                  <span className="text-neutral-400 dark:text-neutral-500 italic">
                    Empty — click edit to add text
                  </span>
                )}
              </p>
              <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-[#FF8C00] hover:bg-[#FF8C00]/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Shortcut button to add an empty question to the list */
export function AddQuestionButton({
  questions,
  onChange,
}: {
  questions: string[];
  onChange: (questions: string[]) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onChange([...questions, ""])}
      className="group gap-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-transparent rounded-full"
    >
      <Plus className="w-3.5 h-3.5 group-hover:text-[#FF8C00] transition-colors" />
      <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF8C00] group-hover:to-[#9D50BB] transition-colors">Add question</span>
    </Button>
  );
}
