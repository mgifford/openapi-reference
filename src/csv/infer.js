function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(s);
}

function inferValueType(v) {
  if (v === null || v === undefined) return "empty";
  const s = String(v).trim();
  if (!s) return "empty";

  const n = Number(s);
  if (!Number.isNaN(n) && /^[+-]?\d+(\.\d+)?$/.test(s)) return "number";
  if (isIsoDate(s)) return "date";
  return "string";
}

export function inferSchema(headers, rows, { sampleSize = 200 } = {}) {
  const cols = headers.map((name) => ({
    name,
    types: new Set(),
    examples: new Set()
  }));

  const limit = Math.min(rows.length, sampleSize);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    for (let c = 0; c < cols.length; c++) {
      const v = row[c] ?? "";
      const t = inferValueType(v);
      if (t !== "empty") cols[c].types.add(t);
      if (String(v).trim() && cols[c].examples.size < 5) cols[c].examples.add(String(v).trim());
    }
  }

  return cols.map((c) => {
    const types = Array.from(c.types);
    let type = "string";
    if (types.length === 1) type = types[0];
    if (types.includes("string")) type = "string";
    return {
      name: c.name,
      type,
      examples: Array.from(c.examples)
    };
  });
}
