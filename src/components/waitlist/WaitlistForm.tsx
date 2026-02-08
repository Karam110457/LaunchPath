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
      <div className="flex items-center gap-3 text-primary bg-primary/5 px-6 py-4 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-sm shadow-[0_0_20px_-10px_var(--primary)]">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <span className="font-medium text-lg">{state.message}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-md relative group">
      {/* Glow Effect behind form */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex flex-col gap-2">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="confirm_email"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />
        
        <div className="relative flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md focus-within:border-primary/50 focus-within:bg-white/10 transition-all duration-300 shadow-lg">
          <Input
            type="email"
            name="email"
            placeholder="Enter your email address..."
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 h-12 text-base placeholder:text-muted-foreground/50 px-4"
          />
          <Button 
            type="submit" 
            disabled={isPending}
            className="h-12 px-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-lg shadow-lg hover:shadow-primary/25"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Join Waitlist
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {state.status === "error" && (
        <p className="text-sm text-red-400 animate-in fade-in text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
          {state.message}
        </p>
      )}
    </form>
  );
}
