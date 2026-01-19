import { parseCsv } from "../csv/parse.js";
import { inferSchema } from "../csv/infer.js";
import { clearDataset, getDatasetMeta, putChunk, putDatasetMeta, getChunk, openDb } from "./db.js";

const DEFAULT_CHUNK_SIZE = 1000;
// Support both Node.js (server) and browser environments
const PROXY_URL = typeof process !== 'undefined' && process.env?.PROXY_URL 
  ? process.env.PROXY_URL 
  : 'http://localhost:3000';

async function fetchTextWithMeta(url, useProxy = false) {
  let fetchUrl = url;
  let options = { method: "GET" };

  // Use proxy for healthcare.gov and other restricted domains
  if (useProxy || needsProxy(url)) {
    fetchUrl = `${PROXY_URL}/api/proxy/csv`;
    options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    };
  }

  const res = await fetch(fetchUrl, options);
  
  if (!res.ok) {
    let errorDetail = {};
    try {
      errorDetail = await res.json();
    } catch (e) {
      // If response isn't JSON, just use the status text
      errorDetail = { error: res.statusText };
    }
    
    const error = new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    error.detail = errorDetail;
    error.status = res.status;
    throw error;
  }
  
  return {
    text: await res.text(),
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    contentType: res.headers.get("content-type")
  };
}

function needsProxy(url) {
  const restrictedDomains = [
    'data.healthcare.gov',
    'data.cdc.gov',
    'healthdata.gov'
  ];
  return restrictedDomains.some(domain => url.includes(domain));
}

function chunkRows(rows, chunkSize) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function loadFromCache(url) {
  const meta = await getDatasetMeta(url);
  if (!meta) return null;
  const firstChunk = await getChunk(url, 0);
  if (!firstChunk) return null;
  return { url, meta, headers: firstChunk.headers };
}

export async function importCsvFromUrl(url, { chunkSize = DEFAULT_CHUNK_SIZE, force = false } = {}) {
  if (!url) throw new Error("Missing url");

  if (!force) {
    const existing = await getDatasetMeta(url);
    if (existing) return { ok: true, fromCache: true, meta: existing };
  }

  const { text, etag, lastModified, contentType } = await fetchTextWithMeta(url);

  const table = parseCsv(text);
  if (table.length < 1) throw new Error("CSV contained no rows");

  const headers = table[0].map((h) => String(h || "").trim());
  const dataRows = table.slice(1);

  const schema = inferSchema(headers, dataRows);

  await clearDataset(url);

  const chunks = chunkRows(dataRows, chunkSize);
  for (let i = 0; i < chunks.length; i++) {
    await putChunk({ url, chunkIndex: i, headers, rows: chunks[i] });
  }

  const meta = {
    url,
    fetchedAt: Date.now(),
    etag,
    lastModified,
    contentType,
    rowCount: dataRows.length,
    chunkSize,
    chunkCount: chunks.length,
    schema
  };

  await putDatasetMeta(meta);
  return { ok: true, fromCache: false, meta };
}

export async function getAllCachedDatasets() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("datasets", "readonly");
    const store = tx.objectStore("datasets");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
