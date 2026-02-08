import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="py-8 sm:py-10 md:py-12 text-xs sm:text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5 sm:gap-2 text-center md:text-left">
            <Logo className="text-base sm:text-lg text-white" />
            <p>© {new Date().getFullYear()} LaunchPath. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/privacy-policy"
              className="min-h-[44px] flex items-center justify-center px-2 hover:text-white transition-colors touch-manipulation"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="min-h-[44px] flex items-center justify-center px-2 hover:text-white transition-colors touch-manipulation"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
