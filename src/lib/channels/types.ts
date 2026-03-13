/** Widget-specific configuration stored in agent_channels.config */
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
  /** Greeting bubble text shown next to launcher when chat is closed */
  greetingMessage?: string;
  /** Seconds before greeting bubble appears (default: 3) */
  greetingDelay?: number;
  /** Widget size preset */
  widgetSize?: "compact" | "default" | "large";
  /** Pre-chat form: collect visitor info before first message */
  preChatForm?: {
    enabled: boolean;
    fields: ("name" | "email")[];
  };
  /** CSAT survey after conversation close */
  csatSurvey?: {
    enabled: boolean;
  };
  /** Allow visitors to upload files (images/PDFs) */
  fileUpload?: {
    enabled: boolean;
  };
  /** Show "End Chat" button in widget header */
  endChat?: {
    enabled: boolean;
  };
  /** Auto-escalation to human when keywords or loops detected */
  autoEscalation?: {
    enabled: boolean;
    keywords?: string[];
  };
  /** Auto-close stale conversations */
  autoClose?: {
    enabled: boolean;
    /** Hours of inactivity before closing (default: 24) */
    hours?: number;
  };
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
