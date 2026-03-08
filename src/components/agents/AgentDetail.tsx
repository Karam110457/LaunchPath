import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface AgentDetailProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    model: string;
    status: string;
    created_at: string;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
  } | null;
  tools: Array<{
    tool_id: string;
    label: string;
    description: string;
  }>;
}

export function AgentDetail({ agent, personality, tools }: AgentDetailProps) {
  return (
    <div className="grid gap-6 max-w-3xl">
      {/* Personality Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            Personality
          </CardTitle>
          <CardDescription>How your agent communicates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {personality?.tone && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tone
              </span>
              <p className="text-sm mt-0.5">{personality.tone}</p>
            </div>
          )}
          {personality?.greeting_message && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Greeting
              </span>
              <p className="text-sm mt-0.5 italic">
                &ldquo;{personality.greeting_message}&rdquo;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Prompt Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>
            Instructions that guide your agent&apos;s behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4 max-h-80 overflow-y-auto">
            {agent.system_prompt}
          </pre>
        </CardContent>
      </Card>

      {/* Tools Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>
            Capabilities available to your agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tools.length > 0 ? (
            <div className="space-y-2">
              {tools.map((tool) => (
                <div key={tool.tool_id} className="flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0">
                    {tool.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tool.description}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tools configured.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meta Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
            >
              {agent.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model</span>
            <span className="text-muted-foreground/80 font-mono text-xs">
              {agent.model.replace("claude-", "").replace("-20250929", "")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(agent.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
