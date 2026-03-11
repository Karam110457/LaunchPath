"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomFieldsListProps {
  fields: string[];
  onChange: (fields: string[]) => void;
  placeholder?: string;
}

export function CustomFieldsList({
  fields,
  onChange,
  placeholder = "e.g., Address, Project Size",
}: CustomFieldsListProps) {
  const [newField, setNewField] = useState("");

  function addField() {
    const name = newField.trim();
    if (!name) return;
    if (fields.some((f) => f.toLowerCase() === name.toLowerCase())) return;
    onChange([...fields, name]);
    setNewField("");
  }

  return (
    <div className="space-y-2">
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 text-neutral-700 dark:text-neutral-300"
            >
              {f}
              <button
                type="button"
                onClick={() => onChange(fields.filter((_, idx) => idx !== i))}
                className="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          placeholder={placeholder}
          className="h-9 text-sm flex-1 rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addField();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={!newField.trim()}
          className="gap-1 h-9 shrink-0 rounded-full border-neutral-200/60 dark:border-[#2A2A2A]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
