import { Check, ArrowRight } from "lucide-react";

export function Solution() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
            One Clear Path
          </h2>
          <p className="text-muted-foreground">
            LaunchPath removes the noise. We guide you through a fixed flow to get you to your first sale.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {[
              {
                step: "01",
                title: "Offer Verdict",
                description: "We help you pick ONE sellable idea. No more guessing what the market wants.",
              },
              {
                step: "02",
                title: "Build Plan",
                description: "A step-by-step blueprint to build your system. Tools, templates, and code.",
              },
              {
                step: "03",
                title: "Sales Pack",
                description: "Everything you need to sell it. Scripts, outreach plans, and objection handling.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center mb-6 relative group">
                  <span className="font-serif text-2xl text-white/50 group-hover:text-white transition-colors">
                    {item.step}
                  </span>
                  {/* Active Ring */}
                  {i === 1 && (
                    <div className="absolute inset-0 rounded-full border border-primary/50 animate-pulse" />
                  )}
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
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
