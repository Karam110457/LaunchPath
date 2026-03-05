import { randomBytes } from "crypto";

const TOKEN_PREFIX = "lp_ch_";
const TOKEN_LENGTH = 54; // prefix (6) + 48 hex chars

/** Generate a new channel deployment token. */
export function generateChannelToken(): string {
  return TOKEN_PREFIX + randomBytes(24).toString("hex");
}

/** Quick format check — does this string look like a channel token? */
export function isChannelToken(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX) && value.length === TOKEN_LENGTH;
}
