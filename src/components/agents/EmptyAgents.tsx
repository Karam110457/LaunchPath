import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";
import Link from "next/link";

export function EmptyAgents() {
  return (
    <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-dashed border-2 border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[24px]">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Create your first agent</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Build AI agents that handle appointments, qualify leads, and support
          customers — then deploy them to WhatsApp, SMS, or your website.
        </p>
        <Button asChild>
          <Link href="/dashboard/agents/new">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
