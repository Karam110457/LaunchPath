/** Sequence step definition stored in follow_up_sequences.steps JSONB */
export interface SequenceStep {
  stepNumber: number;
  delayMinutes: number;
  templateId: string;
  stopOnReply?: boolean;
}

/** Auto-enrollment configuration */
export interface AutoEnrollConfig {
  on_tag?: string[];
  on_ingest?: boolean;
}

/** Database row shape for follow_up_sequences */
export interface SequenceRecord {
  id: string;
  campaign_id: string;
  channel_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "archived";
  steps: SequenceStep[];
  auto_enroll: AutoEnrollConfig;
  stop_on_reply: boolean;
  stop_on_tags: string[];
  created_at: string;
  updated_at: string;
}

/** Contact enrollment state */
export interface ContactSequenceState {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
  status: "active" | "completed" | "stopped_reply" | "stopped_tag" | "stopped_optout" | "stopped_manual";
  next_send_at: string | null;
  last_sent_at: string | null;
  enrolled_at: string;
  completed_at: string | null;
  stopped_at: string | null;
  stop_reason: string | null;
}
