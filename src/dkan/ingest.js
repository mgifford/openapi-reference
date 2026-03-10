/**
 * dkan/ingest.js
 * DKAN dataset ingestion – detect and fetch metadata and resource URLs
 * from a CKAN/DKAN-compatible API endpoint (e.g. healthcare.gov).
 *
 * This module is read-only. It never mutates remote data.
 */

const DEFAULT_BASE = "https://data.healthcare.gov";

/**
 * Detect whether a URL points to a DKAN dataset page or CSV resource.
 * Returns { type: "dataset"|"csv"|"unknown", id, base }
 *
 * @param {string} url
 * @returns {{ type: string, id: string|null, base: string }}
 */
export function detectDkanUrl(url) {
  try {
    const u = new URL(url);
    const base = `${u.protocol}//${u.host}`;

    // Dataset page: /dataset/{id}
    const datasetMatch = u.pathname.match(/\/dataset\/([a-z0-9_\-]+)/i);
    if (datasetMatch) {
      return { type: "dataset", id: datasetMatch[1], base };
    }

    // CSV resource under /views/{id}/rows.csv  (healthcare.gov pattern)
    const viewsMatch = u.pathname.match(/\/views\/([^/]+)\/rows\.csv/i);
    if (viewsMatch) {
      return { type: "csv", id: viewsMatch[1], base };
    }

    if (u.pathname.endsWith(".csv")) {
      return { type: "csv", id: null, base };
    }

    return { type: "unknown", id: null, base };
  } catch {
    return { type: "unknown", id: null, base: DEFAULT_BASE };
  }
}

/**
 * Fetch DKAN package metadata using the CKAN-compatible API.
 * Supports both Socrata-style IDs (5k5i-wzex) and UUIDs.
 *
 * @param {string} datasetId
 * @param {string} [base]
 * @returns {Promise<DkanDataset>}
 */
export async function fetchDkanDataset(datasetId, base = DEFAULT_BASE) {
  const apiUrl = `${base}/api/3/action/package_show?id=${encodeURIComponent(datasetId)}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`DKAN API returned ${response.status} for dataset "${datasetId}"`);
  }

  const data = await response.json();
  if (!data.success || !data.result) {
    throw new Error(`DKAN API responded but reported failure for dataset "${datasetId}"`);
  }

  return normalizeDkanPackage(data.result, base);
}

/**
 * Attempt to ingest a dataset, trying the CKAN API first then falling back
 * to lightweight HTML parsing. Returns a normalised DkanDataset object.
 *
 * @param {string} datasetId
 * @param {string} [base]
 * @returns {Promise<DkanDataset>}
 */
export async function ingestDataset(datasetId, base = DEFAULT_BASE) {
  try {
    return await fetchDkanDataset(datasetId, base);
  } catch (apiErr) {
    // Fallback: minimal HTML page scrape (handles CORS-blocked API calls)
    return fetchDatasetFromPage(datasetId, base);
  }
}

/**
 * Fetch metadata by parsing the dataset HTML page.
 * Used when the DKAN API is unavailable or returns an error.
 *
 * @param {string} datasetId
 * @param {string} [base]
 * @returns {Promise<DkanDataset>}
 */
async function fetchDatasetFromPage(datasetId, base = DEFAULT_BASE) {
  const pageUrl = `${base}/dataset/${datasetId}`;
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Dataset page returned ${response.status} for "${datasetId}"`);
  }

  const html = await response.text();
  return extractMetadataFromHtml(html, datasetId, base);
}

/**
 * Extract structured metadata from DKAN dataset page HTML.
 *
 * @param {string} html
 * @param {string} datasetId
 * @param {string} base
 * @returns {DkanDataset}
 */
export function extractMetadataFromHtml(html, datasetId, base = DEFAULT_BASE) {
  let title = datasetId;
  const titleMatch =
    html.match(/<h1[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<title>([^<|]+)/i);
  if (titleMatch) title = titleMatch[1].trim();

  let description = "";
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (descMatch) description = descMatch[1].trim();

  // Collect CSV download links
  const csvUrls = [];
  const csvPattern = /href="([^"]*\.csv[^"]*)"/gi;
  let m;
  while ((m = csvPattern.exec(html)) !== null) {
    const href = m[1];
    const absolute = href.startsWith("http") ? href : `${base}${href}`;
    if (!csvUrls.includes(absolute)) csvUrls.push(absolute);
  }

  // Collect API resource URLs (rows.csv pattern)
  const apiPattern = /href="([^"]*\/api\/views\/[^"]*\.csv[^"]*)"/gi;
  while ((m = apiPattern.exec(html)) !== null) {
    const href = m[1];
    const absolute = href.startsWith("http") ? href : `${base}${href}`;
    if (!csvUrls.includes(absolute)) csvUrls.unshift(absolute);
  }

  const resources = csvUrls.map((url, i) => ({
    id: null,
    name: url.split("/").pop().split("?")[0] || `resource-${i}`,
    format: "CSV",
    url,
    description: ""
  }));

  return {
    id: datasetId,
    title,
    description,
    publisher: "",
    updateFrequency: "",
    lastUpdated: "",
    license: "",
    resources,
    source: "html-parse"
  };
}

/**
 * Normalise a raw DKAN/CKAN package_show result into a DkanDataset.
 *
 * @param {object} pkg - raw CKAN package object
 * @param {string} base
 * @returns {DkanDataset}
 */
function normalizeDkanPackage(pkg, base) {
  const resources = (pkg.resources || []).map(r => ({
    id: r.id || null,
    name: r.name || r.url?.split("/").pop() || "resource",
    format: (r.format || "").toUpperCase(),
    url: r.url || "",
    description: r.description || ""
  }));

  return {
    id: pkg.id || pkg.name || "",
    title: pkg.title || pkg.name || "Untitled Dataset",
    description: pkg.notes || "",
    publisher: pkg.organization?.title || pkg.author || "",
    updateFrequency: pkg.frequency_publishing || pkg.extras?.find(e => e.key === "frequency_publishing")?.value || "",
    lastUpdated: pkg.metadata_modified || pkg.metadata_created || "",
    license: pkg.license_title || pkg.license_id || "",
    resources,
    source: "api"
  };
}

/**
 * @typedef {object} DkanDataset
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} publisher
 * @property {string} updateFrequency
 * @property {string} lastUpdated
 * @property {string} license
 * @property {DkanResource[]} resources
 * @property {"api"|"html-parse"} source
 */

/**
 * @typedef {object} DkanResource
 * @property {string|null} id
 * @property {string} name
 * @property {string} format
 * @property {string} url
 * @property {string} description
 */
