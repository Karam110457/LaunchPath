export interface WidgetConfig {
  primaryColor?: string;
  agentName?: string;
  agentAvatar?: string;
  welcomeMessage?: string;
  conversationStarters?: string[];
  position?: "right" | "left";
  headerText?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp: number;
}

export interface ConfigResponse {
  channelId: string;
  agentId: string;
  token: string;
  config: WidgetConfig;
}
