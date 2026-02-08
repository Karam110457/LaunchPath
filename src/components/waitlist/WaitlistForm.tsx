"use client";

import { useActionState } from "react";
import { joinWaitlist, type State } from "@/app/actions/join-waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const initialState: State = { status: "idle", message: "" };

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(joinWaitlist, initialState);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      setEmail("");
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-3 rounded-lg border border-emerald-400/20 animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">{state.message}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-2">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="confirm_email"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />
        
        <div className="flex gap-2">
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="bg-background/50 border-white/10 focus:border-white/20 h-12"
          />
          <Button 
            type="submit" 
            disabled={isPending}
            className="h-12 px-6 font-medium bg-white text-black hover:bg-white/90 transition-all"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Join
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {state.status === "error" && (
        <p className="text-sm text-red-400 animate-in fade-in">{state.message}</p>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        Join 2,000+ builders shipping their first AI offer.
      </p>
    </form>
  );
}
