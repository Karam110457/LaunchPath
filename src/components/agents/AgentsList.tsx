import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  personality: unknown;
  template_id: string | null;
  created_at: string;
}

interface AgentsListProps {
  agents: AgentListItem[];
}

const STATUS_STYLES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
};

export function AgentsList({ agents }: AgentsListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => {
        const personality = agent.personality as {
          avatar_emoji?: string;
        } | null;
        const emoji = personality?.avatar_emoji ?? "\u{1F916}";
        const statusInfo = STATUS_STYLES[agent.status] ?? STATUS_STYLES.draft;

        return (
          <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{agent.name}</h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description ?? "No description"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
