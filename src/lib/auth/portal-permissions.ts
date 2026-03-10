/**
 * Portal role-based permission system.
 * Used in both API routes (guard mutations) and UI (conditional rendering).
 */

export type PortalAction =
  | "campaign.update"
  | "campaign.toggle_status"
  | "conversation.takeover"
  | "conversation.pause"
  | "conversation.resume"
  | "conversation.close"
  | "conversation.send_message"
  | "settings.edit"
  | "settings.invite_member"
  | "settings.remove_member";

const ADMIN_ACTIONS = new Set<PortalAction>([
  "campaign.update",
  "campaign.toggle_status",
  "conversation.takeover",
  "conversation.pause",
  "conversation.resume",
  "conversation.close",
  "conversation.send_message",
  "settings.edit",
  "settings.invite_member",
  "settings.remove_member",
]);

/** Check if a portal role can perform a given action. */
export function canPerform(
  role: "admin" | "viewer",
  action: PortalAction
): boolean {
  if (role === "admin") return ADMIN_ACTIONS.has(action);
  return false; // Viewers have read-only access
}
