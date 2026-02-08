import { Hero } from "@/components/waitlist/Hero";
import { Problem } from "@/components/waitlist/Problem";
import { Solution } from "@/components/waitlist/Solution";
import { Trust } from "@/components/waitlist/Trust";
import { Footer } from "@/components/waitlist/Footer";

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-white/20">
      <Hero />
      <Problem />
      <Solution />
      <Trust />
      <Footer />
    </main>
  );
}
