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
  greetingMessage?: string;
  greetingDelay?: number;
  widgetSize?: "compact" | "default" | "large";
  preChatForm?: {
    enabled: boolean;
    fields: ("name" | "email")[];
  };
  csatSurvey?: {
    enabled: boolean;
  };
  fileUpload?: {
    enabled: boolean;
  };
  endChat?: {
    enabled: boolean;
  };
  autoEscalation?: {
    enabled: boolean;
    keywords?: string[];
  };
  autoClose?: {
    enabled: boolean;
    hours?: number;
  };
}

/** Visitor info collected from pre-chat form */
export interface VisitorInfo {
  name?: string;
  email?: string;
}

export const SIZE_MAP = {
  compact: { launcher: 48, panelW: 340, panelH: 460, fontSize: 13 },
  default: { launcher: 56, panelW: 380, panelH: 520, fontSize: 14 },
  large: { launcher: 64, panelW: 420, panelH: 580, fontSize: 15 },
} as const;

export interface MessageAttachment {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp: number;
  /** True for messages injected by a human agent during takeover */
  isHumanAgent?: boolean;
  /** File attachment (image/PDF) */
  attachment?: MessageAttachment;
}

export type ConversationStatus = "active" | "paused" | "human_takeover" | "closed";

export interface ConfigResponse {
  channelId: string;
  agentId: string;
  token: string;
  config: WidgetConfig;
}
