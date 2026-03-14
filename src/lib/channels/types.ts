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

/** WhatsApp-specific configuration stored in agent_channels.config */
export interface WhatsAppConfig {
  /** Meta phone number ID */
  phoneNumberId: string;
  /** WhatsApp Business Account ID (required for template management) */
  businessAccountId: string;
  /** Long-lived system user access token (masked in API responses) */
  accessToken: string;
  /** Shared secret for webhook verification handshake */
  verifyToken: string;
  /** Simulated typing delay in ms before sending reply (default: 2000) */
  responseDelay?: number;
  /** Send read receipts on incoming messages */
  readReceipts?: boolean;
  /** Message sent to first-time contacts */
  greetingMessage?: string;
  /** Auto-close conversations after N hours of inactivity */
  autoClose?: { enabled: boolean; hours?: number };
  /** Auto-escalate to human on keywords/loops */
  autoEscalation?: { enabled: boolean; keywords?: string[] };
  /** Template fallback when 24-hour session window is closed */
  templateFallback?: { enabled: boolean; templateId?: string };
  /** Voice note transcription via OpenAI Whisper */
  voiceNotes?: { transcriptionEnabled: boolean };
  /** Image description via vision model */
  imageHandling?: { visionEnabled: boolean };
  /** Business hours configuration */
  businessHours?: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { open: string; close: string } | null>;
    outsideHoursBehavior: "queue" | "away_message" | "always_on";
    awayMessage?: string;
  };
}

/** Agent-level voice settings stored in ai_agents.voice_config */
export interface AgentVoiceSettings {
  ttsProvider: "browser" | "openai";
  voiceId: string;
  voiceName: string;
  speed: number; // 0.5 - 2.0, default 1.0
}

/** Voice channel config for agent_channels where channel_type = 'voice' */
export interface VoiceChannelConfig {
  provider: "vapi" | "elevenlabs" | "retell";
  apiKey: string;
  assistantId?: string;
  greetingMessage?: string;
  autoClose?: { enabled: boolean; hours?: number };
}

/** Union of all channel-specific config types */
export type ChannelConfig = WidgetConfig | WhatsAppConfig | VoiceChannelConfig;

/** Type guard for WhatsApp channel config */
export function isWhatsAppConfig(
  config: ChannelConfig
): config is WhatsAppConfig {
  return (
    "phoneNumberId" in config &&
    "accessToken" in config &&
    "verifyToken" in config
  );
}

/** Type guard for Voice channel config */
export function isVoiceConfig(
  config: ChannelConfig
): config is VoiceChannelConfig {
  return "provider" in config && "apiKey" in config && !("phoneNumberId" in config);
}

/** Shape returned by the channel CRUD API */
export interface ChannelResponse {
  id: string;
  agent_id: string;
  user_id: string;
  channel_type: string;
  name: string;
  token: string;
  webhook_path: string | null;
  allowed_origins: string[];
  rate_limit_rpm: number | null;
  config: ChannelConfig;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
