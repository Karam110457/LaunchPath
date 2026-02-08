import { Header } from "@/components/waitlist/Header";
import { Hero } from "@/components/waitlist/Hero";
import { Problem } from "@/components/waitlist/Problem";
import { Solution } from "@/components/waitlist/Solution";
import { Trust } from "@/components/waitlist/Trust";
import { FAQ } from "@/components/waitlist/FAQ";
import { Footer } from "@/components/waitlist/Footer";
import { SectionViewTracker } from "@/components/waitlist/SectionViewTracker";
import { BackgroundGrid } from "@/components/ui/background-grid";

export default function WaitlistPage() {
  return (
    <main className="min-h-[100dvh] text-foreground selection:bg-primary/20 selection:text-white relative pb-[var(--safe-area-inset-bottom)]" role="main">
      <BackgroundGrid />
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <Trust />
      <FAQ />
      <Footer />
      <SectionViewTracker />
    </main>
  );
}
