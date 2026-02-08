import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

export function Hero() {
  return (
    <section
      className="relative min-h-[100dvh] flex flex-col justify-center pt-24 pb-12 sm:pt-28 sm:pb-16 md:min-h-screen md:pt-40 md:pb-0 overflow-hidden"
      aria-label="Hero"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] md:w-[1000px] h-[400px] sm:h-[500px] md:h-[600px] bg-primary/20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen" aria-hidden />

      <div className="container relative z-10 mx-auto flex flex-col items-center text-center px-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 md:bg-white/5 border border-white/10 text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 md:backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default"
          style={{ animationDuration: "var(--motion-duration, 700ms)" }}
        >
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary" />
          </span>
          <span className="tracking-wide uppercase font-medium">Accepting early access members</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-white mb-4 sm:mb-6 md:mb-8 max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[0.95] break-words px-1">
          <span className="block text-white/95">From Confused Beginner to</span>
          <span className="block mt-1 sm:mt-2 italic text-primary">First AI Client</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground/90 max-w-2xl mb-5 sm:mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light leading-relaxed px-1">
          Get a validated offer, a step-by-step build path, and a client acquisition system in one guided flow, designed to help you land your <strong className="font-semibold text-white">first client</strong> and scale with confidence.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full max-w-full sm:max-w-md flex flex-col items-center gap-4 sm:gap-6">
          <WaitlistForm />

          <p className="text-[11px] sm:text-xs text-muted-foreground/70 max-w-sm text-center leading-relaxed px-2">
            No spam. By signing up you agree to our{" "}
            <Link href="/terms-of-service" className="underline hover:text-white/80 transition-colors touch-manipulation">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy-policy" className="underline hover:text-white/80 transition-colors touch-manipulation">Privacy Policy</Link>.
          </p>

          <p className="text-[11px] sm:text-xs text-muted-foreground/60">
            Founding cohort opens soon. Limited seats.
          </p>
        </div>
      </div>
    </section>
  );
}
