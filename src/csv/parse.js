/**
 * Small, dependency-free CSV parser.
 * Supports:
 * - comma delimiter
 * - CRLF / LF newlines
 * - quoted fields with escaped quotes ("")
 * This is not intended to handle every CSV dialect.
 */
export function parseCsv(text, { maxRows = Infinity } = {}) {
  if (typeof text !== "string") throw new Error("CSV text must be a string");

  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i += 1;

      pushField();
      pushRow();

      if (rows.length >= maxRows) break;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush last field/row
  pushField();
  // Avoid extra empty trailing row if file ends with newline
  const isTrailingEmptyRow = row.length === 1 && row[0] === "" && text.endsWith("\n");
  if (!isTrailingEmptyRow) pushRow();

  return rows;
}
