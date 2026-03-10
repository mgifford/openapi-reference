/**
 * data/profile.js
 * Compute a data quality and structure profile from parsed CSV data.
 * All processing is client-side. No data leaves the browser.
 *
 * Builds on src/csv/infer.js schema but adds:
 *  - missing/null counts per field
 *  - uniqueness ratios
 *  - inferred field roles
 *  - candidate primary keys
 *  - likely join keys
 *  - basic PII risk indicators (pattern-based, warnings only)
 */

// Patterns used for PII risk hints (warnings only – never definitive)
const PII_PATTERNS = [
  { label: "email address", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { label: "US SSN-like", pattern: /^\d{3}-\d{2}-\d{4}$/ },
  { label: "phone number", pattern: /^\+?1?\s*[\(\-]?\d{3}[\)\-\s]?\s*\d{3}[\-\s]?\d{4}$/ },
  { label: "ZIP code", pattern: /^\d{5}(-\d{4})?$/ },
  { label: "credit card-like", pattern: /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/ }
];

// Keywords used to infer field roles
const ROLE_HINTS = {
  identifier: ["id", "code", "num", "npn", "key", "uuid", "pk"],
  date: ["date", "period", "year", "month", "quarter", "time", "updated", "created"],
  geographic: ["state", "county", "fips", "zip", "region", "territory", "geo", "city"],
  measure: ["amount", "count", "rate", "ratio", "total", "percent", "pct", "avg", "mean", "score"],
  text: ["name", "description", "notes", "title", "label", "narrative", "comment"]
};

/**
 * Infer the semantic role of a field from its name and inferred type.
 *
 * @param {string} name - field name
 * @param {string} type - inferred type ("number"|"date"|"string"|"empty")
 * @returns {string} role label
 */
export function inferFieldRole(name, type) {
  const lower = (name || "").toLowerCase();

  if (type === "date") return "date/time";

  for (const [role, hints] of Object.entries(ROLE_HINTS)) {
    if (hints.some(h => lower.includes(h))) {
      // Override type-based detection only when name strongly signals
      if (role === "date" && type !== "number") return "date/time";
      if (role === "identifier") return "identifier";
      if (role === "geographic") return "geographic";
      if (role === "measure" && type === "number") return "numeric measure";
      if (role === "text" && type === "string") return "descriptive text";
    }
  }

  if (type === "number") return "numeric measure";
  return "descriptive text";
}

/**
 * Check example values for PII risk patterns.
 * Returns array of warning labels (may be empty).
 *
 * @param {string[]} examples
 * @returns {string[]}
 */
export function detectPiiRisk(examples) {
  const warnings = [];
  for (const val of examples) {
    for (const { label, pattern } of PII_PATTERNS) {
      if (pattern.test(String(val))) {
        if (!warnings.includes(label)) warnings.push(label);
      }
    }
  }
  return warnings;
}

/**
 * Compute a full data quality profile from row data and the inferred schema.
 *
 * @param {string[]} headers - column names
 * @param {string[][]} rows - data rows (excluding header row)
 * @param {Array<{name:string, type:string, examples:string[]}>} schema - from inferSchema
 * @returns {DataProfile}
 */
export function profileDataset(headers, rows, schema) {
  const rowCount = rows.length;
  const fieldCount = headers.length;

  const fields = headers.map((name, colIdx) => {
    const schemaField = schema.find(s => s.name === name) || { name, type: "string", examples: [] };
    const values = rows.map(r => r[colIdx]);

    const missingCount = values.filter(v => v === null || v === undefined || String(v).trim() === "").length;
    const missingPct = rowCount > 0 ? Math.round((missingCount / rowCount) * 100) : 0;

    const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== "");
    const unique = new Set(nonEmpty).size;
    const uniquenessRatio = nonEmpty.length > 0 ? Math.round((unique / nonEmpty.length) * 100) / 100 : 0;

    const role = inferFieldRole(name, schemaField.type);
    const piiWarnings = detectPiiRisk(schemaField.examples);

    return {
      name,
      type: schemaField.type,
      examples: schemaField.examples,
      missingCount,
      missingPct,
      uniqueCount: unique,
      uniquenessRatio,
      role,
      piiWarnings
    };
  });

  // Top 5 sparsest fields (most missing)
  const sparsestFields = [...fields]
    .filter(f => f.missingPct > 0)
    .sort((a, b) => b.missingPct - a.missingPct)
    .slice(0, 5)
    .map(f => ({ name: f.name, missingPct: f.missingPct }));

  // Candidate primary keys: high uniqueness (>= 0.95), low nulls (< 5%)
  const primaryKeyCandidates = fields
    .filter(f => f.uniquenessRatio >= 0.95 && f.missingPct < 5)
    .map(f => f.name);

  // Likely join keys: identifiers or geographic codes
  const likelyJoinKeys = fields
    .filter(f => f.role === "identifier" || f.role === "geographic")
    .map(f => f.name);

  // Detect date/period fields for trend preview
  const dateFields = fields.filter(f => f.role === "date/time").map(f => f.name);

  // PII risk summary
  const piiRiskFields = fields
    .filter(f => f.piiWarnings.length > 0)
    .map(f => ({ name: f.name, warnings: f.piiWarnings }));

  return {
    rowCount,
    fieldCount,
    fields,
    sparsestFields,
    primaryKeyCandidates,
    likelyJoinKeys,
    dateFields,
    piiRiskFields
  };
}

/**
 * @typedef {object} FieldProfile
 * @property {string} name
 * @property {string} type
 * @property {string[]} examples
 * @property {number} missingCount
 * @property {number} missingPct
 * @property {number} uniqueCount
 * @property {number} uniquenessRatio  0-1
 * @property {string} role
 * @property {string[]} piiWarnings
 */

/**
 * @typedef {object} DataProfile
 * @property {number} rowCount
 * @property {number} fieldCount
 * @property {FieldProfile[]} fields
 * @property {{name:string, missingPct:number}[]} sparsestFields
 * @property {string[]} primaryKeyCandidates
 * @property {string[]} likelyJoinKeys
 * @property {string[]} dateFields
 * @property {{name:string, warnings:string[]}[]} piiRiskFields
 */
