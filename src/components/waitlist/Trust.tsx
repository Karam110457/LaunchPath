import { Quote, ShieldCheck } from "lucide-react";

export function Trust() {
  return (
    <section id="why" className="py-32 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-20 left-10 md:left-40 text-white/[0.02]" aria-hidden>
        <Quote className="w-64 h-64 rotate-180" />
      </div>

      <div className="container mx-auto relative z-10 px-4">
        <div className="max-w-4xl mx-auto border border-white/10 rounded-3xl p-8 md:p-16 shadow-2xl relative backdrop-blur-sm bg-black/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/10 flex items-center justify-center p-1 bg-black/40 backdrop-blur-md">
            <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
              <ShieldCheck className="w-10 h-10 text-primary/80" aria-hidden />
            </div>
          </div>

          <div className="text-center mt-8 mb-10">
            <h2 className="font-serif italic text-3xl md:text-5xl text-white mb-4">
              Why LaunchPath?
            </h2>
            <p className="text-primary font-medium tracking-wide uppercase text-sm">
              Built by builders, for builders
            </p>
          </div>

          <ul className="space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto list-none pl-0">
            <li className="flex gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span><strong className="text-white font-medium">Most &quot;experts&quot; sell theory.</strong> LaunchPath sells execution: one offer, one build plan, one sales pack.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span>Structured system, not a generic chat. Forces decisions, shipping, and outreach.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span>We don&apos;t promise get rich quick. We promise you get <strong className="text-white border-b border-primary/50 pb-0.5">competent fast</strong>.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
