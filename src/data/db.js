const DB_NAME = "dataset_cache_v1";
const DB_VERSION = 1;

export function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("datasets")) {
        db.createObjectStore("datasets", { keyPath: "url" });
      }
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function store(db, name, mode = "readonly") {
  return db.transaction(name, mode).objectStore(name);
}

export async function getDatasetMeta(url) {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const req = store(db, "datasets").get(url);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putDatasetMeta(meta) {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const req = store(db, "datasets", "readwrite").put(meta);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDataset(url) {
  const db = await openDb();

  await new Promise((resolve, reject) => {
    const req = store(db, "datasets", "readwrite").delete(url);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });

  await new Promise((resolve, reject) => {
    const s = store(db, "chunks", "readwrite");
    const c = s.openCursor();
    c.onsuccess = () => {
      const cursor = c.result;
      if (!cursor) return resolve(true);
      if (typeof cursor.key === "string" && cursor.key.startsWith(url + "::")) {
        cursor.delete();
      }
      cursor.continue();
    };
    c.onerror = () => reject(c.error);
  });
}

export async function putChunk({ url, chunkIndex, headers, rows }) {
  const db = await openDb();
  const key = `${url}::${chunkIndex}`;
  return await new Promise((resolve, reject) => {
    const req = store(db, "chunks", "readwrite").put({ key, url, chunkIndex, headers, rows });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getChunk(url, chunkIndex) {
  const db = await openDb();
  const key = `${url}::${chunkIndex}`;
  return await new Promise((resolve, reject) => {
    const req = store(db, "chunks").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
