/**
 * Use-case presets for popular Composio toolkits.
 *
 * Each preset maps a user-friendly label to a set of action slugs and a
 * pre-written agent instruction. The UI offers these as one-click shortcuts
 * so beginners don't need to understand individual actions.
 *
 * For toolkits without presets, the UI falls back to a flat toggle list
 * with auto-generated descriptions.
 */

export interface ToolkitPreset {
  id: string;
  label: string;
  /** Pre-fills the "Agent instructions" field. */
  description: string;
  /** Composio action slugs to enable when this preset is selected. */
  actions: string[];
}

interface ToolkitPresetGroup {
  toolkit: string;
  presets: ToolkitPreset[];
}

const TOOLKIT_PRESETS: ToolkitPresetGroup[] = [
  {
    toolkit: "gmail",
    presets: [
      {
        id: "email_management",
        label: "Email management",
        description:
          "Use Gmail to send emails, read the inbox, create drafts, and archive messages.",
        actions: [
          "GMAIL_SEND_EMAIL",
          "GMAIL_FETCH_EMAILS",
          "GMAIL_CREATE_EMAIL_DRAFT",
          "GMAIL_ADD_LABEL_TO_EMAIL",
        ],
      },
      {
        id: "email_sending",
        label: "Sending only",
        description: "Use Gmail to send emails and create drafts on behalf of the user.",
        actions: ["GMAIL_SEND_EMAIL", "GMAIL_CREATE_EMAIL_DRAFT"],
      },
    ],
  },
  {
    toolkit: "slack",
    presets: [
      {
        id: "messaging",
        label: "Team messaging",
        description:
          "Use Slack to send messages to channels and direct messages to team members.",
        actions: [
          "SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL",
          "SLACK_SEND_A_DIRECT_MESSAGE_IN_SLACK",
          "SLACK_LIST_ALL_SLACK_TEAM_CHANNELS",
        ],
      },
    ],
  },
  {
    toolkit: "googlecalendar",
    presets: [
      {
        id: "scheduling",
        label: "Scheduling",
        description:
          "Use Google Calendar to create events, find available time slots, and list upcoming events.",
        actions: [
          "GOOGLECALENDAR_CREATE_EVENT",
          "GOOGLECALENDAR_FIND_FREE_SLOTS",
          "GOOGLECALENDAR_GET_CALENDAR_EVENTS",
        ],
      },
      {
        id: "full_calendar",
        label: "Full calendar management",
        description:
          "Use Google Calendar to create, update, and delete events, find free time, and manage the calendar.",
        actions: [
          "GOOGLECALENDAR_CREATE_EVENT",
          "GOOGLECALENDAR_FIND_FREE_SLOTS",
          "GOOGLECALENDAR_GET_CALENDAR_EVENTS",
          "GOOGLECALENDAR_UPDATE_EVENT",
          "GOOGLECALENDAR_DELETE_EVENT",
          "GOOGLECALENDAR_QUICK_ADD_EVENT",
        ],
      },
    ],
  },
  {
    toolkit: "hubspot",
    presets: [
      {
        id: "crm_basics",
        label: "CRM basics",
        description:
          "Use HubSpot to create and search contacts, create deals, and log activities.",
        actions: [
          "HUBSPOT_CREATE_CONTACT",
          "HUBSPOT_SEARCH_CONTACTS",
          "HUBSPOT_CREATE_DEAL",
          "HUBSPOT_LIST_DEALS",
        ],
      },
    ],
  },
  {
    toolkit: "notion",
    presets: [
      {
        id: "page_management",
        label: "Page management",
        description:
          "Use Notion to create and update pages, search content, and manage databases.",
        actions: [
          "NOTION_CREATE_NOTION_PAGE",
          "NOTION_UPDATE_NOTION_PAGE",
          "NOTION_SEARCH_NOTION_PAGE",
          "NOTION_FETCH_NOTION_DATABASE",
        ],
      },
    ],
  },
  {
    toolkit: "github",
    presets: [
      {
        id: "issue_management",
        label: "Issue management",
        description:
          "Use GitHub to create issues, list issues, and add comments to issues.",
        actions: [
          "GITHUB_CREATE_AN_ISSUE",
          "GITHUB_LIST_REPOSITORY_ISSUES",
          "GITHUB_CREATE_AN_ISSUE_COMMENT",
        ],
      },
    ],
  },
  {
    toolkit: "linear",
    presets: [
      {
        id: "task_management",
        label: "Task management",
        description:
          "Use Linear to create issues, list issues, and update issue status.",
        actions: [
          "LINEAR_CREATE_LINEAR_ISSUE",
          "LINEAR_LIST_LINEAR_ISSUES",
          "LINEAR_UPDATE_LINEAR_ISSUE",
        ],
      },
    ],
  },
  {
    toolkit: "stripe",
    presets: [
      {
        id: "payments",
        label: "Payment management",
        description:
          "Use Stripe to create payment links, list customers, and retrieve payment details.",
        actions: [
          "STRIPE_CREATE_PAYMENT_LINK",
          "STRIPE_LIST_CUSTOMERS",
          "STRIPE_RETRIEVE_PAYMENT_INTENT",
        ],
      },
    ],
  },
];

/** Look up presets for a toolkit. Returns empty array for apps without presets. */
export function getPresetsForToolkit(toolkit: string): ToolkitPreset[] {
  return (
    TOOLKIT_PRESETS.find(
      (g) => g.toolkit.toLowerCase() === toolkit.toLowerCase()
    )?.presets ?? []
  );
}

/**
 * Generate a tool description from selected action names.
 * Returns a one-liner like: "Use Gmail to send emails, read inbox, and create drafts."
 */
export function generateToolDescription(
  appName: string,
  selectedActions: { slug: string; name: string }[]
): string {
  if (selectedActions.length === 0) {
    return `Use ${appName} to help the user.`;
  }

  const phrases = selectedActions
    .slice(0, 5)
    .map((a) => a.name.toLowerCase());

  const suffix =
    selectedActions.length > 5
      ? `, and ${selectedActions.length - 5} more actions`
      : "";

  if (phrases.length === 1) {
    return `Use ${appName} to ${phrases[0]}${suffix}.`;
  }

  if (phrases.length === 2) {
    return `Use ${appName} to ${phrases[0]} and ${phrases[1]}${suffix}.`;
  }

  const last = phrases.pop()!;
  return `Use ${appName} to ${phrases.join(", ")}, and ${last}${suffix}.`;
}
