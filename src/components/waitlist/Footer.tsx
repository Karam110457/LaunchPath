import Link from "next/link";
import { Twitter, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-serif italic text-lg text-white">LaunchPath</span>
            <p>© {new Date().getFullYear()} LaunchPath. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
              <Link href="#" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
