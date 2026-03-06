/**
 * Returns "#ffffff" or "#1a1a1a" based on the luminance of the given hex color.
 * Uses the YIQ formula (same as Bootstrap, Material Design, etc.).
 */
export function getContrastColor(hex: string): string {
  // Strip # and handle shorthand (#fff → #ffffff)
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) return "#ffffff";

  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);

  // YIQ luminance — threshold 150 gives good results
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq > 150 ? "#1a1a1a" : "#ffffff";
}
