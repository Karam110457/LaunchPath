import { XCircle, RefreshCcw, Layers, HelpCircle } from "lucide-react";

export function Problem() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="font-serif italic text-4xl md:text-5xl text-white mb-6">
            Stuck in the "Learning Loop"?
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            You want to build, but you're trapped consuming content instead. <br className="hidden md:block" />
            It's not your fault—the noise is deafening.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
              className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors duration-500">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif italic">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
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
