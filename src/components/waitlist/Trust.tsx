import { User } from "lucide-react";

export function Trust() {
  return (
    <section className="py-24 border-t border-white/5 bg-white/[0.02]">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-12">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-white/50" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-2">
                Builder, not Guru.
              </h2>
              <p className="text-muted-foreground">
                I'm not here to sell you a dream. I'm here to show you the reality of building with AI.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
            <p>
              <strong className="text-white font-medium">Most "experts" sell theory.</strong> They tell you what could work, but they don't show you the messy middle.
            </p>
            <p>
              LaunchPath is different. It's built on the systems I use every day. 
              I document what breaks, how I fix it, and how I turn mistakes into shortcuts for you.
            </p>
            <p>
              My goal isn't to make you "rich quick". It's to make you <span className="text-white underline decoration-white/30 underline-offset-4">competent fast</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
