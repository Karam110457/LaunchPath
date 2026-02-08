"use client";

import { useActionState, useEffect, useRef } from "react";
import { joinWaitlist, type State } from "@/app/actions/join-waitlist";
import { completeWaitlistStep2, type Step2State } from "@/app/actions/complete-waitlist-step2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { trackWaitlistEvent } from "@/lib/analytics";

const initialState: State = { status: "idle", message: "" };
const initialStep2State: Step2State = { status: "idle", message: "" };

const ROLE_OPTIONS = [
  { value: "", label: "Select your stage…" },
  { value: "exploring", label: "Just exploring" },
  { value: "building_side", label: "Building something on the side" },
  { value: "ready_first_client", label: "Ready to get first client" },
  { value: "have_clients_scale", label: "Already have clients, want to scale" },
  { value: "other", label: "Other" },
];

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(joinWaitlist, initialState);
  const [step2State, step2FormAction, isStep2Pending] = useActionState(completeWaitlistStep2, initialStep2State);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const step2ViewedRef = useRef(false);

  useEffect(() => {
    trackWaitlistEvent("waitlist_view");
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      setSubmittedEmail(email || null);
      setEmail("");
      trackWaitlistEvent("waitlist_step1_submitted");
    }
  }, [state.status, email]);

  // Use submittedEmail ?? email so step 2 shows on first success render (before useEffect sets submittedEmail)
  const step2Email = submittedEmail ?? ((email && email.trim()) || null);
  const showStep2 = state.status === "success" && step2State.status !== "success" && !!step2Email;
  const showFinalSuccess = state.status === "success" && (step2State.status === "success" || !showStep2);

  if (showFinalSuccess && !showStep2) {
    return (
      <div
        className="flex items-center gap-3 text-primary bg-primary/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-sm shadow-[0_0_20px_-10px_var(--primary)] w-full"
        role="status"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" aria-hidden />
        </div>
        <span className="font-medium text-base sm:text-lg">{state.message}</span>
      </div>
    );
  }

  if (showFinalSuccess && step2State.status === "success") {
    return (
      <div
        className="flex items-center gap-3 text-primary bg-primary/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-sm w-full"
        role="status"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" aria-hidden />
        </div>
        <span className="font-medium text-base sm:text-lg">{step2State.message}</span>
      </div>
    );
  }

  if (showStep2) {
    if (!step2ViewedRef.current) {
      step2ViewedRef.current = true;
    }
    return (
      <div className="w-full max-w-md space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-2" role="region" aria-label="Optional: help us tailor your experience">
        <p className="text-xs sm:text-sm text-muted-foreground text-center px-1">
          One quick question (optional). Skip if you prefer.
        </p>
        <form
          action={step2FormAction}
          className="space-y-3 sm:space-y-4"
          onSubmit={(e) => {
            const submitter = (e.nativeEvent as SubmitEvent).submitter;
            if (submitter?.getAttribute("name") !== "skipped") {
              trackWaitlistEvent("waitlist_step2_submitted");
            }
          }}
        >
          <input type="hidden" name="email" value={step2Email ?? ""} />
          <div>
            <label htmlFor="role_stage" className="sr-only">Your stage</label>
            <select
              id="role_stage"
              name="role_stage"
              className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 touch-manipulation"
              aria-label="Your stage"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="biggest_blocker" className="sr-only">Biggest blocker</label>
            <textarea
              id="biggest_blocker"
              name="biggest_blocker"
              rows={3}
              placeholder="What's your biggest blocker right now? (optional)"
              className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 resize-y touch-manipulation"
              aria-label="Biggest blocker"
              maxLength={500}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2">
            <Button
              type="submit"
              disabled={isStep2Pending}
              className="min-h-[48px] w-full sm:w-auto px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed touch-manipulation"
            >
              {isStep2Pending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                  <span className="ml-2">Saving…</span>
                </>
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              type="submit"
              name="skipped"
              value="true"
              variant="ghost"
              disabled={isStep2Pending}
              className="min-h-[48px] w-full sm:w-auto px-6 text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
              onClick={() => trackWaitlistEvent("waitlist_step2_skipped")}
            >
              {isStep2Pending ? "Saving…" : "Skip"}
            </Button>
          </div>
        </form>
        {step2State.status === "error" && (
          <p className="text-sm text-red-400 text-center px-2">{step2State.message}</p>
        )}
      </div>
    );
  }

  return (
    <form
      id="waitlist-form"
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:gap-4 w-full max-w-md relative group"
      onSubmit={() => trackWaitlistEvent("hero_cta_click", { action: "submit" })}
    >
      <input type="hidden" name="source_page" value="homepage" />
      <input
        type="text"
        name="confirm_email"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      <div className="relative flex flex-col gap-2 w-full">
        <div className="relative flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md focus-within:border-primary/50 focus-within:bg-white/10 transition-colors duration-300 shadow-lg">
          <Input
            type="email"
            name="email"
            placeholder="Enter your email…"
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 h-12 min-h-[44px] text-base sm:text-base placeholder:text-muted-foreground/50 px-4 touch-manipulation"
            aria-label="Email address"
            inputMode="email"
            autoComplete="email"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 min-h-[44px] w-full sm:w-auto sm:min-w-[44px] sm:px-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 rounded-lg shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Reserve my spot"
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                <span className="ml-2 sr-only sm:not-sr-only">Joining…</span>
              </>
            ) : (
              <>
                Reserve My Spot
                <ArrowRight className="w-4 h-4 ml-2 shrink-0 hidden sm:block" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
      {state.status === "error" && (
        <p className="text-sm text-red-400 animate-in fade-in text-center bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
