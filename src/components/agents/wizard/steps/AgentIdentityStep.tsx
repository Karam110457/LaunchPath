"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AgentIdentityStepProps {
  agentName: string;
  agentDescription: string;
  tone: string;
  greetingMessage: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onToneChange: (tone: string) => void;
  onGreetingChange: (greeting: string) => void;
}

export function AgentIdentityStep({
  agentName,
  agentDescription,
  tone,
  greetingMessage,
  onNameChange,
  onDescriptionChange,
  onToneChange,
  onGreetingChange,
}: AgentIdentityStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Name your agent
        </h2>
        <p className="text-sm text-muted-foreground">
          Basic info about your agent and the first impression visitors get.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent name</Label>
          <Input
            id="agent-name"
            placeholder="e.g., Sarah, BookingBot, Support Assistant"
            value={agentName}
            onChange={(e) => onNameChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A name your visitors will see when chatting.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-description">Short description</Label>
          <Input
            id="agent-description"
            placeholder="e.g., Friendly booking assistant for Smith Roofing"
            value={agentDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A one-liner describing what this agent does.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-tone">Communication tone</Label>
          <Input
            id="agent-tone"
            placeholder="e.g., friendly and efficient, warm and professional"
            value={tone}
            onChange={(e) => onToneChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A short phrase describing how your agent communicates.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-greeting">Greeting message</Label>
          <Textarea
            id="agent-greeting"
            placeholder="e.g., Hi! I'd love to help you schedule an appointment. What service are you looking for?"
            value={greetingMessage}
            onChange={(e) => onGreetingChange(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            The first message visitors see when the chat opens.
          </p>
        </div>
      </div>
    </div>
  );
}
