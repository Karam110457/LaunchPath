"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Gift } from "lucide-react";

interface PromoRedeemModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromoRedeemModal({
  open,
  onClose,
  onSuccess,
}: PromoRedeemModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch("/api/dashboard/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(data.credits_added);
      setCode("");

      // Auto-close after 2s and refresh parent data
      setTimeout(() => {
        setSuccess(null);
        onSuccess();
        onClose();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCode("");
      setError("");
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Redeem Promo Code
          </DialogTitle>
          <DialogDescription>
            Enter a promo code to add credits to your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="ENTER-CODE-HERE"
            className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground/50 font-mono text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-border/80 transition-shadow"
            disabled={loading || success !== null}
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">
              {error}
            </p>
          )}

          {success !== null && (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                +{success} credits added to your account!
              </p>
            </div>
          )}

          {success === null && (
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-2.5 rounded-xl font-medium text-sm gradient-accent-bg text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-[opacity,box-shadow]"
            >
              {loading ? "Redeeming..." : "Redeem Code"}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
