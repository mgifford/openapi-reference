/**
 * queries/templates.js
 * DKAN-aware query template builders.
 *
 * Generates transparent, reproducible, non-destructive query URLs and
 * client-side filter logic. Never mutates remote data.
 *
 * DKAN/healthcare.gov SQL API constraints observed in practice:
 *  - Field names with spaces cannot be used in WHERE or ORDER BY clauses
 *  - COUNT, GROUP BY, and DISTINCT are not supported
 *  - Only SELECT *, WHERE, LIMIT, OFFSET, ORDER BY work reliably
 */

const DKAN_SQL_BASE = "https://data.healthcare.gov/api/1/datastore/sql";

/**
 * Build a DKAN SQL API URL for a given query fragment.
 * The DKAN API expects the query wrapped in square-bracket notation, URL-encoded.
 *
 * @param {string} datasetId - DKAN dataset UUID
 * @param {string} selectClause - e.g. "SELECT *"
 * @param {string[]} [clauses]  - additional clauses e.g. ["WHERE Status = 'Active'", "LIMIT 10"]
 * @returns {string}
 */
export function buildDkanUrl(datasetId, selectClause, clauses = []) {
  const parts = [`[${selectClause} FROM ${datasetId}]`, ...clauses.map(c => `[${c}]`)].join("");
  return `${DKAN_SQL_BASE}?query=${encodeURIComponent(parts)}&show_db_columns=true`;
}

/**
 * Generate common DKAN query templates for a dataset.
 * Returns only patterns that are known to work given DKAN's limitations.
 *
 * Fields with spaces in their names are excluded from WHERE/ORDER BY positions
 * to avoid "Invalid query string" errors.
 *
 * @param {string} datasetId
 * @param {Array<{name:string, type:string}>} schema
 * @returns {QueryTemplate[]}
 */
export function buildQueryTemplates(datasetId, schema) {
  const simpleFields = (schema || [])
    .filter(f => f && typeof f.name === "string" && !f.name.includes(" "))
    .map(f => f.name);

  const dateFields = (schema || [])
    .filter(f => f && (f.type === "date" || /date|period|year/i.test(f.name || "")))
    .map(f => f.name);

  const numericFields = (schema || [])
    .filter(f => f && f.type === "number" && !f.name.includes(" "))
    .map(f => f.name);

  const firstSimple = simpleFields[0] || null;
  const firstDate = dateFields[0] || firstSimple;
  const firstNumeric = numericFields[0] || firstSimple;

  const templates = [];

  // 1. Latest records (most recent rows)
  templates.push({
    id: "latest-records",
    title: "Latest reporting period",
    description: "Retrieve the most recently added rows.",
    url: firstDate
      ? buildDkanUrl(datasetId, "SELECT *", [`ORDER BY ${firstDate} DESC`, "LIMIT 10"])
      : buildDkanUrl(datasetId, "SELECT *", ["LIMIT 10"]),
    supportsApi: true,
    clientFilter: (rows) => rows.slice(-10)
  });

  // 2. Filter by field value
  if (firstSimple) {
    templates.push({
      id: "filter-by-field",
      title: `Filter by ${firstSimple}`,
      description: `Show rows where ${firstSimple} equals a specific value.`,
      url: buildDkanUrl(datasetId, "SELECT *", [`WHERE ${firstSimple} = 'VALUE'`, "LIMIT 25"]),
      supportsApi: true,
      note: "Replace VALUE with the value you want to filter on.",
      clientFilter: (rows, headers, value) => {
        const idx = headers.indexOf(firstSimple);
        if (idx === -1 || !value) return rows;
        return rows.filter(r => r[idx] === value);
      }
    });
  }

  // 3. Sort by field
  if (firstSimple) {
    templates.push({
      id: "sort-ascending",
      title: `Sort by ${firstSimple} (ascending)`,
      description: `Order all rows by ${firstSimple} from lowest to highest.`,
      url: buildDkanUrl(datasetId, "SELECT *", [`ORDER BY ${firstSimple} ASC`, "LIMIT 25"]),
      supportsApi: true,
      clientFilter: (rows, headers) => {
        const idx = headers.indexOf(firstSimple);
        if (idx === -1) return rows;
        return [...rows].sort((a, b) => String(a[idx]).localeCompare(String(b[idx])));
      }
    });
  }

  // 4. Rows where a field is missing / empty
  templates.push({
    id: "missing-values",
    title: "Rows where a field is missing",
    description: "Identify records with blank or null values in any field.",
    url: firstSimple
      ? buildDkanUrl(datasetId, "SELECT *", [`WHERE ${firstSimple} IS NULL`, "LIMIT 25"])
      : buildDkanUrl(datasetId, "SELECT *", ["LIMIT 25"]),
    supportsApi: !!firstSimple,
    note: firstSimple
      ? `Replace ${firstSimple} with any field name that has no spaces.`
      : "Use the client-side filter below – this dataset has no simple (space-free) field names.",
    clientFilter: (rows, headers, fieldName) => {
      const idx = fieldName ? headers.indexOf(fieldName) : -1;
      if (idx === -1) {
        return rows.filter(r => r.some(v => v === null || v === undefined || String(v).trim() === ""));
      }
      return rows.filter(r => r[idx] === null || r[idx] === undefined || String(r[idx]).trim() === "");
    }
  });

  // 5. Pagination sample
  templates.push({
    id: "pagination",
    title: "Paginated results (rows 11–20)",
    description: "Retrieve a specific page of results.",
    url: buildDkanUrl(datasetId, "SELECT *", ["LIMIT 10 OFFSET 10"]),
    supportsApi: true,
    clientFilter: (rows, _headers, _value, offset = 10, limit = 10) => rows.slice(offset, offset + limit)
  });

  // 6. Records per year (client-side only – GROUP BY not supported in DKAN)
  if (firstDate) {
    templates.push({
      id: "records-per-year",
      title: "Records per year",
      description: "Count how many rows fall in each year. (Client-side only – DKAN does not support GROUP BY.)",
      url: buildDkanUrl(datasetId, "SELECT *", [`ORDER BY ${firstDate} ASC`, "LIMIT 100"]),
      supportsApi: false,
      note: "DKAN does not support GROUP BY. Use the exported CSV in Excel or Python for grouped counts.",
      clientFilter: (rows, headers) => {
        const idx = headers.indexOf(firstDate);
        if (idx === -1) return rows;
        const counts = {};
        rows.forEach(r => {
          const year = String(r[idx] || "").slice(0, 4);
          if (year) counts[year] = (counts[year] || 0) + 1;
        });
        return Object.entries(counts).map(([year, count]) => [year, String(count)]);
      }
    });
  }

  return templates;
}

/**
 * @typedef {object} QueryTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} url          - DKAN API URL (may contain placeholder like VALUE)
 * @property {boolean} supportsApi - false when DKAN limitations prevent server-side execution
 * @property {string} [note]       - usage note shown in the UI
 * @property {Function} clientFilter - (rows, headers, value?, offset?, limit?) => rows
 */
