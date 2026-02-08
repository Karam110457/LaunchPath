import { Sparkles, Hammer, Banknote } from "lucide-react";

export function Solution() {
  return (
    <section id="solution" className="py-16 sm:py-24 md:py-32 relative scroll-mt-20 md:scroll-mt-28" aria-label="How it Works">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-20 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-xs font-medium text-primary mb-4 sm:mb-6 uppercase tracking-wider">
            The LaunchPath Method
          </div>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-6xl text-white mb-4 sm:mb-6">
            One Clear Path
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light px-1">
            LaunchPath removes the noise. We guide you through a fixed flow to get you to your first sale.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute top-16 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12 md:gap-16 relative z-10">
            {[
              {
                step: "01",
                icon: Sparkles,
                title: "Offer Blueprint",
                description: "We help you pick ONE sellable idea. No more guessing what the market wants.",
                detail: "Output: Validated Offer Doc",
                time: "~15 min",
              },
              {
                step: "02",
                icon: Hammer,
                title: "Build Plan",
                description: "A step-by-step blueprint to build your system. Tools, templates, and code.",
                detail: "Output: Step-by-step Guide",
                time: "~1–2 hrs",
              },
              {
                step: "03",
                icon: Banknote,
                title: "Sales Pack",
                description: "Everything you need to sell it. Scripts, outreach plans, and objection handling.",
                detail: "Output: Outreach Scripts",
                time: "~30 min",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#0c0c0c] border-2 border-white/20 flex items-center justify-center mb-5 sm:mb-6 md:mb-8 relative z-10 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 shadow-2xl">
                  <div className="absolute inset-3 sm:inset-4 rounded-full bg-white/[0.06] group-hover:bg-primary/10 transition-colors duration-300" />
                  <div className="relative z-20 flex flex-col items-center gap-0.5 sm:gap-1">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white/70 group-hover:text-primary transition-colors duration-300" aria-hidden />
                    <span className="font-serif italic text-xs sm:text-sm text-muted-foreground/70">Step {item.step}</span>
                  </div>
                  {i === 1 && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse motion-reduce:animate-none" aria-hidden />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-white mb-1 group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-primary/90 mb-2 sm:mb-3 uppercase tracking-wide font-medium">
                  {item.detail}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 mb-2 sm:mb-3 font-medium">
                  {item.time}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto px-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
