import { Check, ArrowRight, Sparkles, Hammer, Banknote } from "lucide-react";

export function Solution() {
  return (
    <section id="solution" className="py-32 border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-black relative">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6 uppercase tracking-wider">
            The LaunchPath Method
          </div>
          <h2 className="font-serif italic text-4xl md:text-6xl text-white mb-6">
            One Clear Path
          </h2>
          <p className="text-xl text-muted-foreground font-light">
            LaunchPath removes the noise. We guide you through a fixed flow to get you to your first sale.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="grid md:grid-cols-3 gap-16 relative z-10">
            {[
              {
                step: "01",
                icon: Sparkles,
                title: "Offer Blueprint",
                description: "We help you pick ONE sellable idea. No more guessing what the market wants.",
                detail: "Output: Validated Offer Doc"
              },
              {
                step: "02",
                icon: Hammer,
                title: "Build Plan",
                description: "A step-by-step blueprint to build your system. Tools, templates, and code.",
                detail: "Output: Step-by-step Guide"
              },
              {
                step: "03",
                icon: Banknote,
                title: "Sales Pack",
                description: "Everything you need to sell it. Scripts, outreach plans, and objection handling.",
                detail: "Output: Outreach Scripts"
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-32 h-32 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center mb-8 relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:border-primary/30 shadow-2xl">
                  {/* Inner Glow */}
                  <div className="absolute inset-4 rounded-full bg-white/5 group-hover:bg-primary/5 transition-colors duration-500" />
                  
                  <div className="relative z-20 flex flex-col items-center gap-1">
                    <item.icon className="w-8 h-8 text-white/40 group-hover:text-primary transition-colors duration-500" />
                    <span className="font-serif italic text-sm text-muted-foreground/50">Step {item.step}</span>
                  </div>

                  {/* Active Pulse for middle item */}
                  {i === 1 && (
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
                  )}
                </div>
                
                <h3 className="text-2xl font-serif text-white mb-2 group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-sm font-medium text-primary/80 mb-3 uppercase tracking-wide text-[10px]">
                  {item.detail}
                </p>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
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
