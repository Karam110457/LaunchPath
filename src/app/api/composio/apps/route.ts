/**
 * GET /api/composio/apps
 *
 * Returns the curated list of available Composio app integrations.
 * Requires authentication.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface ComposioApp {
  toolkit: string;
  name: string;
  icon: string;
  category: string;
  description: string;
}

// Curated list of ~50 popular apps grouped by category.
// These are Composio toolkit slugs — verified against the catalog.
const CURATED_APPS: ComposioApp[] = [
  // Email
  { toolkit: "gmail", name: "Gmail", icon: "📧", category: "email", description: "Send, read, and manage emails" },
  { toolkit: "outlook", name: "Outlook", icon: "📬", category: "email", description: "Microsoft Outlook email management" },
  { toolkit: "mailchimp", name: "Mailchimp", icon: "🐵", category: "email", description: "Email marketing and campaigns" },

  // CRM
  { toolkit: "hubspot", name: "HubSpot", icon: "🟠", category: "crm", description: "Contacts, deals, tickets, and notes" },
  { toolkit: "salesforce", name: "Salesforce", icon: "☁️", category: "crm", description: "Full CRM — leads, opportunities, accounts" },
  { toolkit: "pipedrive", name: "Pipedrive", icon: "🟢", category: "crm", description: "Sales pipeline and deal management" },
  { toolkit: "zoho_crm", name: "Zoho CRM", icon: "🔴", category: "crm", description: "Leads, contacts, and deal tracking" },

  // Communication
  { toolkit: "slack", name: "Slack", icon: "💬", category: "communication", description: "Send messages, manage channels" },
  { toolkit: "discord", name: "Discord", icon: "🎮", category: "communication", description: "Send messages in servers and channels" },
  { toolkit: "twilio", name: "Twilio", icon: "📱", category: "communication", description: "SMS, voice, and WhatsApp messaging" },
  { toolkit: "intercom", name: "Intercom", icon: "💁", category: "communication", description: "Customer messaging and support" },

  // Scheduling
  { toolkit: "google_calendar", name: "Google Calendar", icon: "📅", category: "scheduling", description: "Create, update, and check calendar events" },
  { toolkit: "calendly", name: "Calendly", icon: "🗓️", category: "scheduling", description: "Scheduling and booking management" },

  // Productivity
  { toolkit: "notion", name: "Notion", icon: "📝", category: "productivity", description: "Pages, databases, and workspace management" },
  { toolkit: "google_docs", name: "Google Docs", icon: "📄", category: "productivity", description: "Create and edit documents" },
  { toolkit: "google_sheets", name: "Google Sheets", icon: "📊", category: "productivity", description: "Spreadsheet data management" },
  { toolkit: "airtable", name: "Airtable", icon: "📋", category: "productivity", description: "Flexible database and spreadsheets" },
  { toolkit: "clickup", name: "ClickUp", icon: "✅", category: "productivity", description: "Task and project management" },

  // Project Management
  { toolkit: "linear", name: "Linear", icon: "🔷", category: "project_management", description: "Issue tracking and project management" },
  { toolkit: "jira", name: "Jira", icon: "🔵", category: "project_management", description: "Agile project and issue tracking" },
  { toolkit: "asana", name: "Asana", icon: "🟡", category: "project_management", description: "Task and project management" },
  { toolkit: "trello", name: "Trello", icon: "📌", category: "project_management", description: "Kanban boards and task tracking" },
  { toolkit: "monday", name: "Monday.com", icon: "🟣", category: "project_management", description: "Work management platform" },

  // Social Media
  { toolkit: "twitter", name: "X (Twitter)", icon: "🐦", category: "social", description: "Post tweets, read timeline, manage DMs" },
  { toolkit: "instagram", name: "Instagram", icon: "📸", category: "social", description: "Post content and manage interactions" },
  { toolkit: "linkedin", name: "LinkedIn", icon: "💼", category: "social", description: "Professional networking and posts" },
  { toolkit: "facebook", name: "Facebook", icon: "👥", category: "social", description: "Pages, posts, and messenger" },
  { toolkit: "tiktok", name: "TikTok", icon: "🎵", category: "social", description: "Video content management" },
  { toolkit: "youtube", name: "YouTube", icon: "▶️", category: "social", description: "Video management and analytics" },

  // Developer Tools
  { toolkit: "github", name: "GitHub", icon: "🐙", category: "developer", description: "Repos, issues, PRs, and actions" },
  { toolkit: "gitlab", name: "GitLab", icon: "🦊", category: "developer", description: "Git repos and CI/CD pipelines" },
  { toolkit: "vercel", name: "Vercel", icon: "▲", category: "developer", description: "Deployments and project management" },
  { toolkit: "sentry", name: "Sentry", icon: "🐛", category: "developer", description: "Error tracking and monitoring" },

  // Finance
  { toolkit: "stripe", name: "Stripe", icon: "💳", category: "finance", description: "Payments, subscriptions, and invoices" },
  { toolkit: "quickbooks", name: "QuickBooks", icon: "📒", category: "finance", description: "Accounting and financial management" },
  { toolkit: "xero", name: "Xero", icon: "💰", category: "finance", description: "Accounting and bookkeeping" },

  // Support
  { toolkit: "zendesk", name: "Zendesk", icon: "🎫", category: "support", description: "Help desk and customer support tickets" },
  { toolkit: "freshdesk", name: "Freshdesk", icon: "🎯", category: "support", description: "Customer support ticketing system" },

  // File Storage
  { toolkit: "google_drive", name: "Google Drive", icon: "📁", category: "storage", description: "File storage, sharing, and management" },
  { toolkit: "dropbox", name: "Dropbox", icon: "📦", category: "storage", description: "File storage and collaboration" },

  // E-commerce
  { toolkit: "shopify", name: "Shopify", icon: "🛍️", category: "ecommerce", description: "Products, orders, and store management" },
  { toolkit: "woocommerce", name: "WooCommerce", icon: "🛒", category: "ecommerce", description: "WordPress e-commerce platform" },

  // Marketing
  { toolkit: "google_ads", name: "Google Ads", icon: "📢", category: "marketing", description: "Ad campaigns and performance tracking" },
  { toolkit: "facebook_ads", name: "Facebook Ads", icon: "📣", category: "marketing", description: "Ad management and targeting" },
  { toolkit: "activecampaign", name: "ActiveCampaign", icon: "⚡", category: "marketing", description: "Email marketing and automation" },
  { toolkit: "sendgrid", name: "SendGrid", icon: "✉️", category: "marketing", description: "Transactional and marketing email" },

  // Analytics
  { toolkit: "google_analytics", name: "Google Analytics", icon: "📈", category: "analytics", description: "Website traffic and analytics" },
  { toolkit: "mixpanel", name: "Mixpanel", icon: "📉", category: "analytics", description: "Product analytics and user tracking" },

  // Automation
  { toolkit: "zapier", name: "Zapier", icon: "⚡", category: "automation", description: "Connect and automate workflows" },
  { toolkit: "make", name: "Make", icon: "🔄", category: "automation", description: "Visual automation platform" },
];

const CATEGORY_LABELS: Record<string, string> = {
  email: "Email",
  crm: "CRM",
  communication: "Communication",
  scheduling: "Scheduling",
  productivity: "Productivity",
  project_management: "Project Management",
  social: "Social Media",
  developer: "Developer Tools",
  finance: "Finance",
  support: "Customer Support",
  storage: "File Storage",
  ecommerce: "E-commerce",
  marketing: "Marketing",
  analytics: "Analytics",
  automation: "Automation",
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    apps: CURATED_APPS,
    categories: CATEGORY_LABELS,
  });
}
