import { User, Quote, ShieldCheck } from "lucide-react";

export function Trust() {
  return (
    <section className="py-32 border-t border-white/5 bg-white/[0.02] relative overflow-hidden">
      {/* Decorative Quote Mark */}
      <div className="absolute top-20 left-10 md:left-40 text-white/[0.02]">
        <Quote className="w-64 h-64 rotate-180" />
      </div>

      <div className="container mx-auto relative z-10 px-4">
        <div className="max-w-4xl mx-auto bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 md:p-16 shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center p-1">
            <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
               <ShieldCheck className="w-10 h-10 text-primary/80" />
            </div>
          </div>

          <div className="text-center mt-8 mb-12">
            <h2 className="font-serif italic text-3xl md:text-5xl text-white mb-4">
              Why LaunchPath?
            </h2>
            <p className="text-primary font-medium tracking-wide uppercase text-sm">
              Built by builders, for builders
            </p>
          </div>

          <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed font-light text-center max-w-2xl mx-auto">
            <p>
              <strong className="text-white font-serif italic text-2xl block mb-2">Most "experts" sell theory.</strong> 
              LaunchPath sells execution.
            </p>
            <p>
              This isn't a generic chat wrapper. It's a structured engineering system built on the workflows of successful AI consultants. It forces you to make decisions, ship code, and send emails.
            </p>
            <p className="border-t border-white/5 pt-8 mt-8">
              We don't promise you'll get rich quick. <br />
              We promise you'll get <span className="text-white border-b border-primary/50 pb-0.5">competent fast</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
