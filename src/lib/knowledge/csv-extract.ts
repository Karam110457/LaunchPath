/**
 * CSV text extraction — converts rows to readable "Key: Value" format.
 */

export function extractCsvText(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "";

  // Parse header row
  const headers = parseCsvLine(lines[0]);

  // Convert each data row to "Header: Value" pairs
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers
      .map((h, i) => `${h}: ${values[i] ?? ""}`)
      .join(", ");
  });

  return rows.join("\n\n");
}

/** Simple CSV line parser — handles quoted fields with commas. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}
