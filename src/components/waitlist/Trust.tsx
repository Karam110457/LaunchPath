import { Quote, ShieldCheck } from "lucide-react";

export function Trust() {
  return (
    <section id="why" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-10 left-4 sm:top-20 sm:left-10 md:left-40 text-white/[0.02]" aria-hidden>
        <Quote className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rotate-180" />
      </div>

      <div className="container mx-auto relative z-10 px-4">
        <div className="max-w-4xl mx-auto border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-16 shadow-2xl relative md:backdrop-blur-sm bg-black/30 md:bg-black/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border border-white/10 flex items-center justify-center p-1 bg-black/50 md:bg-black/40 md:backdrop-blur-md">
            <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary/80" aria-hidden />
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 mb-6 sm:mb-10">
            <h2 className="font-serif italic text-2xl sm:text-3xl md:text-5xl text-white mb-2 sm:mb-4">
              Why LaunchPath?
            </h2>
            <p className="text-primary font-medium tracking-wide uppercase text-xs sm:text-sm">
              Built by builders, for builders
            </p>
          </div>

          <ul className="space-y-4 sm:space-y-5 md:space-y-6 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto list-none pl-0">
            <li className="flex gap-2 sm:gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span><strong className="text-white font-medium">Most &quot;experts&quot; sell theory.</strong> LaunchPath sells execution: one offer thesis, one delivery system, one revenue engine.</span>
            </li>
            <li className="flex gap-2 sm:gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span>Structured system, not a generic chat. Forces decisions, shipping, and outreach.</span>
            </li>
            <li className="flex gap-2 sm:gap-3">
              <span className="text-primary shrink-0 mt-0.5" aria-hidden>•</span>
              <span>We don&apos;t promise get rich quick. We promise you get <strong className="text-white border-b border-primary/50 pb-0.5">competent fast</strong>.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
