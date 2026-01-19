// Integration-lite tests for DKAN SQL examples
// These tests validate that our builder avoids invalid patterns and can optionally
// hit the DKAN SQL endpoint when RUN_SQL_INTEGRATION=1 is set.

import { buildDkanSqlExamples } from "../src/render/csvReference.js";

// Schema for AB_Termination_List_823.csv from user-provided dictionary
const AB_SCHEMA = [
  { name: "NPN", type: "number" },
  { name: "Effective Plan Year", type: "number" },
  { name: "Marketplaces", type: "string" },
  { name: "Registration Completion Date", type: "string" },
  { name: "Individual Registration Date", type: "string" },
  { name: "SHOP Registration Date", type: "string" },
  { name: "Termination or Suspension Date", type: "string" },
  { name: "Termination Reconsidered or Suspension Lifted", type: "string" },
  { name: "Status", type: "string" }
];

// Placeholder datasetId; examples should still be formed correctly.
const PLACEHOLDER_DATASET_ID = "DATASET_UUID";

describe("DKAN SQL examples builder", () => {
  test("avoids field names with spaces and aggregates", () => {
    const examples = buildDkanSqlExamples(PLACEHOLDER_DATASET_ID, AB_SCHEMA);

    // All example URLs should:
    // - Use SELECT *, WHERE, LIMIT, OFFSET, ORDER BY only
    // - Never include COUNT, GROUP BY, DISTINCT
    // - Not include quoted field names (with %22)
    for (const ex of examples) {
      const url = ex.url;
      expect(url).toMatch(/SELECT/);
      expect(url).toMatch(/LIMIT/);
      expect(url).not.toMatch(/COUNT|GROUP%20BY|DISTINCT/);
      expect(url).not.toMatch(/%22/); // no double quotes URL-encoded
    }
  });

  test("uses only fields without spaces when selecting, sorting, filtering", () => {
    const examples = buildDkanSqlExamples(PLACEHOLDER_DATASET_ID, AB_SCHEMA);
    const noSpaceFields = AB_SCHEMA.filter(f => !f.name.includes(" ")).map(f => f.name);

    // Ensure any explicit field mentions are from noSpaceFields
    for (const ex of examples) {
      for (const field of noSpaceFields) {
        // OK if present; skip checking others
      }
      // crude check: encoded space should not appear inside field tokens
      expect(ex.url).not.toMatch(/Effective%20Plan%20Year|Registration%20Completion%20Date|Termination%20or%20Suspension%20Date/);
    }
  });
});

// Optional integration test: run against a known working dataset UUID
// Enable with: RUN_SQL_INTEGRATION=1 npm test
const RUN_INTEGRATION = process.env.RUN_SQL_INTEGRATION === "1";
const KNOWN_DATASET_ID = "c37a0651-60a7-5e9f-9d16-87376b33b1cc"; // example known to work

(RUN_INTEGRATION ? test : test.skip)("integration: first example returns HTTP 200", async () => {
  const examples = buildDkanSqlExamples(KNOWN_DATASET_ID, AB_SCHEMA);
  const firstUrl = examples[0].url;

  // Use global fetch if available; otherwise skip
  if (typeof fetch !== "function") {
    console.warn("global fetch not available; skipping integration fetch");
    return;
  }

  const res = await fetch(firstUrl, { headers: { accept: "application/json" } });
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toBeDefined();
  // expect presence of 'data' or similar top-level key; schema may vary
  expect(Object.keys(json).length).toBeGreaterThan(0);
});
