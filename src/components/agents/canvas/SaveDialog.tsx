"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  isSaving: boolean;
}

export function SaveDialog({
  open,
  onClose,
  onSave,
  isSaving,
}: SaveDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const prevOpen = useRef(open);

  // Clear fields only when the dialog closes (after a successful save or cancel)
  useEffect(() => {
    if (prevOpen.current && !open) {
      setTitle("");
      setDescription("");
    }
    prevOpen.current = open;
  }, [open]);

  const handleSave = () => {
    onSave(title.trim(), description.trim());
    // Fields are cleared by the useEffect above when `open` flips to false
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[420px] p-0 gap-0 rounded-[2rem] border-white/60 canvas-dark:border-neutral-700/60 bg-white/90 canvas-dark:bg-neutral-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50">
          <DialogTitle className="text-[14px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 tracking-tight">Save Changes</DialogTitle>
          <button onClick={handleClose} className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="version-title" className="text-xs font-medium text-neutral-500 canvas-dark:text-neutral-400">
              Title <span className="opacity-50 font-normal">(optional)</span>
            </Label>
            <Input
              id="version-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Updated greeting message"
              className="h-10 text-sm rounded-xl bg-white/50 canvas-dark:bg-neutral-800/50 border-neutral-200/60 canvas-dark:border-neutral-700/60 text-neutral-900 canvas-dark:text-neutral-100 placeholder:text-neutral-400 canvas-dark:placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-400 canvas-dark:focus-visible:ring-neutral-500"
              disabled={isSaving}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="version-desc" className="text-xs font-medium text-neutral-500 canvas-dark:text-neutral-400">
              Description <span className="opacity-50 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="version-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed..."
              rows={3}
              className="text-sm rounded-xl bg-white/50 canvas-dark:bg-neutral-800/50 border-neutral-200/60 canvas-dark:border-neutral-700/60 text-neutral-900 canvas-dark:text-neutral-100 placeholder:text-neutral-400 canvas-dark:placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-400 canvas-dark:focus-visible:ring-neutral-500 resize-none"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-neutral-50/50 canvas-dark:bg-neutral-800/30 border-t border-neutral-100 canvas-dark:border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl text-xs font-medium text-neutral-600 canvas-dark:text-neutral-300 hover:bg-neutral-100 canvas-dark:hover:bg-neutral-800 hover:text-neutral-900 canvas-dark:hover:text-neutral-100"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-9 px-4 rounded-xl text-xs font-medium bg-neutral-900 canvas-dark:bg-neutral-100 text-white canvas-dark:text-neutral-900 hover:bg-neutral-800 canvas-dark:hover:bg-neutral-200 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
