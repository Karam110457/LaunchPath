"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PersonalityStepProps {
  tone: string;
  greetingMessage: string;
  onToneChange: (tone: string) => void;
  onGreetingChange: (greeting: string) => void;
}

export function PersonalityStep({
  tone,
  greetingMessage,
  onToneChange,
  onGreetingChange,
}: PersonalityStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          How should your agent sound?
        </h2>
        <p className="text-sm text-muted-foreground">
          Set the tone and first impression for your agent.
        </p>
      </div>

      <div className="space-y-4">
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
