import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold text-foreground">
            LaunchPath
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center gap-8 py-24 text-center md:py-32">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Ship your product with{" "}
            <span className="text-primary">confidence</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            LaunchPath gives you the tools to launch, measure, and iterate on
            your SaaS—all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-11 px-8">
                Start free trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Built for modern teams
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Auth & users</CardTitle>
                  <CardDescription>
                    Supabase-powered auth. Email, OAuth, and magic links ready to
                    go.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>App Router</CardTitle>
                  <CardDescription>
                    Next.js 15 App Router with TypeScript and server components.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Design system</CardTitle>
                  <CardDescription>
                    shadcn/ui and Tailwind for a consistent, accessible UI.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} LaunchPath. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
