/**
 * Honeypot field for form abuse prevention. Add a hidden field to forms;
 * bots often fill it. If present, treat submission as bot and reject or silently ignore.
 * Use with rate limiting for sign-up/login forms.
 */

export const HONEYPOT_FIELD_NAME = "website_url"; // Looks like a normal field to bots

export type HoneypotResult = { isBot: true } | { isBot: false };

/**
 * Check form data or JSON body for honeypot. If honeypot field has any value, consider it a bot.
 */
export function checkHoneypot(formData: FormData): HoneypotResult {
  const value = formData.get(HONEYPOT_FIELD_NAME);
  if (value !== null && value !== undefined && String(value).trim() !== "") {
    return { isBot: true };
  }
  return { isBot: false };
}

export function checkHoneypotFromBody(body: Record<string, unknown>): HoneypotResult {
  const value = body[HONEYPOT_FIELD_NAME];
  if (value !== null && value !== undefined && String(value).trim() !== "") {
    return { isBot: true };
  }
  return { isBot: false };
}
