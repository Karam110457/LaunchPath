import { WaitlistForm } from "./WaitlistForm";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container relative z-10 mx-auto flex flex-col items-center text-center px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="tracking-wide text-xs uppercase font-medium">Accepting early access members</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-white mb-8 max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[0.9]">
          <span className="block text-white/90">Stop learning.</span>
          <span className="italic text-primary block mt-2">Start shipping.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-muted-foreground/80 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light leading-relaxed">
          The guided path from confusion to your first sellable AI offer. 
          <span className="text-white font-normal"> No theory dumps. No "get rich quick".</span> Just a system that works.
        </p>

        {/* Form Container */}
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full flex flex-col items-center gap-6">
          <WaitlistForm />
          
          {/* Social Proof Text */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-[#0a0a0a]" />
              ))}
            </div>
            <p>Join 2,000+ builders shipping this week</p>
          </div>
        </div>
      </div>
    </section>
  );
}
