import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";
import Link from "next/link";

export function EmptyAgents() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 flex items-center justify-center mb-4">
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <linearGradient id="empty-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#9D50BB" />
              </linearGradient>
            </defs>
          </svg>
          <Bot className="h-6 w-6" style={{ stroke: "url(#empty-icon-gradient)" }} />
        </div>
        <h3 className="text-lg font-medium mb-2">Create your first agent</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Build agents for any use case — customer support, appointment booking,
          lead qualification — and deploy to widget, WhatsApp, SMS, or API.
        </p>
        <Button asChild className="shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0">
          <Link href="/dashboard/agents/new">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
