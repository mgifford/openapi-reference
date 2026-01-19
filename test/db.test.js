import "fake-indexeddb/auto";

// Polyfill structuredClone for Node.js < 17
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

import { putDatasetMeta, getDatasetMeta, clearDataset, putChunk, getChunk } from "../src/data/db.js";

describe("IndexedDB cache", () => {
  test("stores and retrieves dataset meta and chunks", async () => {
    const url = "https://example.com/data.csv";

    await clearDataset(url);

    await putDatasetMeta({
      url,
      fetchedAt: 123,
      rowCount: 2,
      schema: [{ name: "a", type: "string", examples: ["x"] }],
      chunkSize: 1000,
      chunkCount: 1
    });

    await putChunk({ url, chunkIndex: 0, headers: ["a"], rows: [["x"],["y"]] });

    const meta = await getDatasetMeta(url);
    expect(meta.url).toBe(url);
    expect(meta.rowCount).toBe(2);

    const chunk = await getChunk(url, 0);
    expect(chunk.headers).toEqual(["a"]);
    expect(chunk.rows.length).toBe(2);
  });
});
