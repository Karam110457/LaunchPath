"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  const handleSave = () => {
    onSave(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  };

  const handleClose = () => {
    if (!isSaving) {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">Save Changes</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="version-title" className="text-xs text-muted-foreground">
              Title <span className="opacity-50">(optional)</span>
            </Label>
            <Input
              id="version-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Updated greeting message"
              className="h-9 text-sm"
              disabled={isSaving}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="version-desc" className="text-xs text-muted-foreground">
              Description <span className="opacity-50">(optional)</span>
            </Label>
            <Textarea
              id="version-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed..."
              rows={2}
              className="text-sm"
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
