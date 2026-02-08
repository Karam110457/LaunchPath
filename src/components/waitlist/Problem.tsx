import { XCircle, RefreshCcw, Layers, HelpCircle } from "lucide-react";

export function Problem() {
  return (
    <section id="problem" className="py-16 sm:py-24 md:py-32 relative overflow-hidden scroll-mt-20 md:scroll-mt-28" aria-label="The Problem">
      <div className="container mx-auto relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 md:mb-20">
          <h2 className="font-serif font-light italic text-3xl sm:text-4xl md:text-5xl text-white mb-4 sm:mb-6">
            Stuck in the &quot;Learning Loop&quot;?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed px-1">
            You want to build, but you&apos;re trapped consuming content instead. <br className="hidden md:block" />
            It&apos;s not your fault—the noise is deafening.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Layers,
              title: "Tutorial Hell",
              description: "Watching 'AI Agency' videos all day but never knowing what to actually do first.",
            },
            {
              icon: RefreshCcw,
              title: "Tool Hopping",
              description: "Switching between Make, Zapier, and n8n without ever shipping a finished product.",
            },
            {
              icon: HelpCircle,
              title: "Analysis Paralysis",
              description: "Overwhelmed by niches, offers, and models. So you do nothing.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 sm:mb-6 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors duration-500">
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-light italic text-white mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
