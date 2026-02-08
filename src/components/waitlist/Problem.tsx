import { XCircle } from "lucide-react";

export function Problem() {
  return (
    <section className="py-24 border-t border-white/5 bg-white/[0.02]">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
            Stuck in the "Learning Loop"?
          </h2>
          <p className="text-muted-foreground">
            You want to build, but you're trapped consuming content instead.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Tutorial Hell",
              description: "Watching 'AI Agency' videos all day but never knowing what to actually do first.",
            },
            {
              title: "Tool Hopping",
              description: "Switching between Make, Zapier, and n8n without ever shipping a finished product.",
            },
            {
              title: "Analysis Paralysis",
              description: "Overwhelmed by niches, offers, and models. So you do nothing.",
            },
          ].map((item, i) => (
            <div 
              key={i} 
              className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
