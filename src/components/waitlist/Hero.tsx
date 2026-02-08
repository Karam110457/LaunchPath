import { WaitlistForm } from "./WaitlistForm";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center pt-36 md:pt-44 overflow-hidden"
      aria-label="Hero"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen" aria-hidden />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />

      <div className="container relative z-10 mx-auto flex flex-col items-center text-center px-4">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default"
          style={{ animationDuration: "var(--motion-duration, 700ms)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="tracking-wide text-xs uppercase font-medium">Accepting early access members</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tight text-white mb-6 md:mb-8 max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[0.95] break-words">
          <span className="block text-white/95">Stop learning.</span>
          <span className="italic text-primary block mt-2">Start shipping.</span>
        </h1>

        <p className="text-lg md:text-2xl text-muted-foreground/90 max-w-2xl mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light leading-relaxed">
          Get one sellable offer, a step-by-step build plan, and a sales pack — in one guided flow. No endless research.
        </p>
        <p className="text-sm text-white/70 max-w-xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Used by AI beginners to go from stuck to first client. Execution-first, no hype.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full flex flex-col items-center gap-6">
          <WaitlistForm />

          <p className="text-[11px] md:text-xs text-muted-foreground/70 max-w-sm text-center leading-relaxed">
            No spam. By signing up you agree to our{" "}
            <a href="#" className="underline hover:text-white/80 transition-colors">Terms</a>
            {" "}and{" "}
            <a href="#" className="underline hover:text-white/80 transition-colors">Privacy Policy</a>.
          </p>

          <p className="text-xs text-muted-foreground/60">
            Founding cohort opens soon. Limited seats.
          </p>
        </div>
      </div>
    </section>
  );
}
