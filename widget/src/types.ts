export interface WidgetConfig {
  primaryColor?: string;
  agentName?: string;
  agentAvatar?: string;
  launcherIcon?: string;
  welcomeMessage?: string;
  conversationStarters?: string[];
  position?: "right" | "left";
  /** @deprecated Use agentName instead */
  headerText?: string;
  theme?: "light" | "dark";
  borderRadius?: "rounded" | "sharp";
  autoOpenDelay?: number;
  showBranding?: boolean;
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
