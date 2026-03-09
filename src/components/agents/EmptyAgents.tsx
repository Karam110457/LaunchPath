import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";
import Link from "next/link";

export function EmptyAgents() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 flex items-center justify-center mb-4">
          <Bot className="h-6 w-6 text-[#FF8C00]" />
        </div>
        <h3 className="text-lg font-medium mb-2">Create your first agent</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Build AI agents that handle appointments, qualify leads, and support
          customers — then deploy them to WhatsApp, SMS, or your website.
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
