/** Widget-specific configuration stored in agent_channels.config */
export interface WidgetConfig {
  primaryColor?: string;
  agentName?: string;
  agentAvatar?: string;
  welcomeMessage?: string;
  conversationStarters?: string[];
  position?: "right" | "left";
  headerText?: string;
}

/** Shape returned by the channel CRUD API */
export interface ChannelResponse {
  id: string;
  agent_id: string;
  user_id: string;
  channel_type: string;
  name: string;
  token: string;
  allowed_origins: string[];
  rate_limit_rpm: number | null;
  config: WidgetConfig;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
