/**
 * Country-to-currency mapping utility.
 * Handles fuzzy matching for country names and returns currency info.
 * Default: GBP (£) — UK is the home market.
 */

interface CurrencyInfo {
  code: string;
  symbol: string;
}

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // GBP
  uk: { code: "GBP", symbol: "£" },
  "united kingdom": { code: "GBP", symbol: "£" },
  "great britain": { code: "GBP", symbol: "£" },
  england: { code: "GBP", symbol: "£" },
  scotland: { code: "GBP", symbol: "£" },
  wales: { code: "GBP", symbol: "£" },
  "northern ireland": { code: "GBP", symbol: "£" },

  // USD
  us: { code: "USD", symbol: "$" },
  usa: { code: "USD", symbol: "$" },
  "united states": { code: "USD", symbol: "$" },
  "united states of america": { code: "USD", symbol: "$" },
  america: { code: "USD", symbol: "$" },

  // EUR
  germany: { code: "EUR", symbol: "€" },
  france: { code: "EUR", symbol: "€" },
  spain: { code: "EUR", symbol: "€" },
  italy: { code: "EUR", symbol: "€" },
  netherlands: { code: "EUR", symbol: "€" },
  belgium: { code: "EUR", symbol: "€" },
  austria: { code: "EUR", symbol: "€" },
  ireland: { code: "EUR", symbol: "€" },
  portugal: { code: "EUR", symbol: "€" },
  greece: { code: "EUR", symbol: "€" },
  finland: { code: "EUR", symbol: "€" },
  luxembourg: { code: "EUR", symbol: "€" },
  slovakia: { code: "EUR", symbol: "€" },
  slovenia: { code: "EUR", symbol: "€" },
  estonia: { code: "EUR", symbol: "€" },
  latvia: { code: "EUR", symbol: "€" },
  lithuania: { code: "EUR", symbol: "€" },
  cyprus: { code: "EUR", symbol: "€" },
  malta: { code: "EUR", symbol: "€" },
  croatia: { code: "EUR", symbol: "€" },

  // Africa
  nigeria: { code: "NGN", symbol: "₦" },
  "south africa": { code: "ZAR", symbol: "R" },
  kenya: { code: "KES", symbol: "KSh" },
  ghana: { code: "GHS", symbol: "GH₵" },
  egypt: { code: "EGP", symbol: "E£" },
  tanzania: { code: "TZS", symbol: "TSh" },
  uganda: { code: "UGX", symbol: "USh" },
  ethiopia: { code: "ETB", symbol: "Br" },
  rwanda: { code: "RWF", symbol: "RF" },
  morocco: { code: "MAD", symbol: "MAD" },

  // Asia
  india: { code: "INR", symbol: "₹" },
  pakistan: { code: "PKR", symbol: "Rs" },
  bangladesh: { code: "BDT", symbol: "৳" },
  philippines: { code: "PHP", symbol: "₱" },
  indonesia: { code: "IDR", symbol: "Rp" },
  malaysia: { code: "MYR", symbol: "RM" },
  singapore: { code: "SGD", symbol: "S$" },
  thailand: { code: "THB", symbol: "฿" },
  vietnam: { code: "VND", symbol: "₫" },
  japan: { code: "JPY", symbol: "¥" },
  "south korea": { code: "KRW", symbol: "₩" },
  china: { code: "CNY", symbol: "¥" },
  taiwan: { code: "TWD", symbol: "NT$" },
  "hong kong": { code: "HKD", symbol: "HK$" },
  "sri lanka": { code: "LKR", symbol: "Rs" },

  // Middle East
  "united arab emirates": { code: "AED", symbol: "AED" },
  uae: { code: "AED", symbol: "AED" },
  dubai: { code: "AED", symbol: "AED" },
  "saudi arabia": { code: "SAR", symbol: "SAR" },
  qatar: { code: "QAR", symbol: "QR" },
  kuwait: { code: "KWD", symbol: "KD" },
  bahrain: { code: "BHD", symbol: "BD" },
  oman: { code: "OMR", symbol: "OMR" },
  jordan: { code: "JOD", symbol: "JD" },
  turkey: { code: "TRY", symbol: "₺" },
  israel: { code: "ILS", symbol: "₪" },

  // Americas
  canada: { code: "CAD", symbol: "C$" },
  mexico: { code: "MXN", symbol: "MX$" },
  brazil: { code: "BRL", symbol: "R$" },
  argentina: { code: "ARS", symbol: "AR$" },
  colombia: { code: "COP", symbol: "COL$" },
  chile: { code: "CLP", symbol: "CL$" },
  peru: { code: "PEN", symbol: "S/" },

  // Oceania
  australia: { code: "AUD", symbol: "A$" },
  "new zealand": { code: "NZD", symbol: "NZ$" },

  // Europe (non-EUR)
  switzerland: { code: "CHF", symbol: "CHF" },
  sweden: { code: "SEK", symbol: "kr" },
  norway: { code: "NOK", symbol: "kr" },
  denmark: { code: "DKK", symbol: "kr" },
  poland: { code: "PLN", symbol: "zł" },
  "czech republic": { code: "CZK", symbol: "Kč" },
  czechia: { code: "CZK", symbol: "Kč" },
  romania: { code: "RON", symbol: "lei" },
  hungary: { code: "HUF", symbol: "Ft" },
  bulgaria: { code: "BGN", symbol: "лв" },
};

const DEFAULT_CURRENCY: CurrencyInfo = { code: "GBP", symbol: "£" };

/**
 * Get the currency info for a country name (fuzzy-matched, case-insensitive).
 * Returns GBP as default when country is null/unknown.
 */
export function getCurrencyForCountry(country: string | null): CurrencyInfo {
  if (!country) return DEFAULT_CURRENCY;
  const normalized = country.trim().toLowerCase();
  return CURRENCY_MAP[normalized] ?? DEFAULT_CURRENCY;
}

/**
 * Shorthand: get just the currency symbol for a country.
 */
export function getCurrencySymbol(country: string | null): string {
  return getCurrencyForCountry(country).symbol;
}

/**
 * Format a numeric amount with the appropriate currency symbol for a country.
 * Uses toLocaleString for thousands separators.
 */
export function formatCurrency(amount: number, country: string | null): string {
  const { symbol } = getCurrencyForCountry(country);
  return `${symbol}${amount.toLocaleString()}`;
}
