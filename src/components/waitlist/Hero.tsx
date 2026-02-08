import { WaitlistForm } from "./WaitlistForm";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10 mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Accepting early access members</span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Stop learning AI. <br />
          <span className="italic text-white/80">Start shipping.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          The guided path from confusion to your first sellable AI offer. 
          No theory dumps. No "get rich quick". Just a system that works.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full flex justify-center">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
