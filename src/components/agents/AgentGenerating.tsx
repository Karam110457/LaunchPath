import { Card, CardContent } from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";

interface AgentGeneratingProps {
  currentLabel: string | null;
  error: string | null;
}

export function AgentGenerating({ currentLabel, error }: AgentGeneratingProps) {
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Bot className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-medium mb-2">Building your agent...</h3>
        <p className="text-sm text-muted-foreground">
          {currentLabel ?? "Starting..."}
        </p>
      </CardContent>
    </Card>
  );
}
