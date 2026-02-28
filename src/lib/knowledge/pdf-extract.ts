/**
 * PDF text extraction using pdf-parse.
 */

/** Extract plain text from a PDF buffer. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse has no proper ESM default export — dynamic import + fallback
  const mod = await (Function('return import("pdf-parse")')() as Promise<
    Record<string, unknown>
  >);
  const pdfParse = (
    typeof mod.default === "function" ? mod.default : mod
  ) as (buf: Buffer) => Promise<{ text: string }>;

  const data = await pdfParse(buffer);
  // Clean excessive whitespace while preserving paragraph breaks
  return data.text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
