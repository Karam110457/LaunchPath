import { cn } from "@/lib/utils";

export function BackgroundGrid() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0a0a0a]">
      {/* Base Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 40%, transparent 100%)"
        }}
      />

      {/* Random Filled Cells - Simulated with absolute divs for simplicity/performance */}
      {/* We use deterministic positions to avoid hydration mismatch */}
      {[
        { top: "15%", left: "10%", opacity: 0.03 },
        { top: "25%", left: "85%", opacity: 0.04 },
        { top: "45%", left: "20%", opacity: 0.02 },
        { top: "65%", left: "75%", opacity: 0.03 },
        { top: "85%", left: "15%", opacity: 0.04 },
        { top: "10%", left: "60%", opacity: 0.02 },
        { top: "75%", left: "40%", opacity: 0.03 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-[40px] h-[40px] bg-white"
          style={{
            top: pos.top,
            left: pos.left,
            opacity: pos.opacity,
          }}
        />
      ))}

      {/* Subtle Green Glow (Ambient) */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full mix-blend-screen opacity-30" />
      <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full mix-blend-screen opacity-20" />
    </div>
  );
}
