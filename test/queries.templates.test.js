/**
 * test/queries.templates.test.js
 * Tests for src/queries/templates.js
 */
import { buildQueryTemplates, buildDkanUrl } from "../src/queries/templates.js";

const PLACEHOLDER_ID = "TEST_DATASET_UUID";

const SCHEMA = [
  { name: "NPN", type: "number" },
  { name: "Status", type: "string" },
  { name: "EffectiveDate", type: "date" },
  { name: "State code", type: "string" }, // has a space – should be excluded from sort/where
  { name: "Amount", type: "number" }
];

describe("buildDkanUrl", () => {
  test("builds a valid URL with SELECT and LIMIT", () => {
    const url = buildDkanUrl("UUID", "SELECT *", ["LIMIT 10"]);
    expect(url).toContain("SELECT");
    expect(url).toContain("LIMIT");
    expect(url).toContain("UUID");
  });

  test("URL-encodes the query string", () => {
    const url = buildDkanUrl("UUID", "SELECT *", ["LIMIT 5"]);
    // Should not contain unencoded brackets
    expect(url).not.toMatch(/\[SELECT/);
    expect(url).toContain("%5B"); // [ encoded
  });
});

describe("buildQueryTemplates", () => {
  const templates = buildQueryTemplates(PLACEHOLDER_ID, SCHEMA);

  test("returns at least 4 templates", () => {
    expect(templates.length).toBeGreaterThanOrEqual(4);
  });

  test("every template has required fields", () => {
    for (const t of templates) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.title).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(typeof t.url).toBe("string");
      expect(typeof t.supportsApi).toBe("boolean");
      expect(typeof t.clientFilter).toBe("function");
    }
  });

  test("no template URL contains a field with spaces in WHERE or ORDER BY", () => {
    for (const t of templates) {
      // "State code" has a space and must not appear encoded in WHERE or ORDER BY
      expect(t.url).not.toMatch(/State%20code|State\+code/i);
    }
  });

  test("no template URL uses COUNT, GROUP BY, or DISTINCT", () => {
    for (const t of templates) {
      expect(t.url).not.toMatch(/COUNT|GROUP%20BY|DISTINCT/i);
    }
  });

  test("all URLs contain the dataset ID", () => {
    for (const t of templates) {
      expect(t.url).toContain(PLACEHOLDER_ID);
    }
  });

  test("includes a 'latest-records' template", () => {
    expect(templates.some(t => t.id === "latest-records")).toBe(true);
  });

  test("includes a 'missing-values' template", () => {
    expect(templates.some(t => t.id === "missing-values")).toBe(true);
  });

  test("records-per-year template is marked supportsApi=false", () => {
    const rpy = templates.find(t => t.id === "records-per-year");
    if (rpy) {
      expect(rpy.supportsApi).toBe(false);
    }
  });

  test("clientFilter for latest-records returns an array", () => {
    const t = templates.find(t => t.id === "latest-records");
    const rows = [["a", "b"], ["c", "d"], ["e", "f"]];
    const result = t.clientFilter(rows);
    expect(Array.isArray(result)).toBe(true);
  });

  test("handles empty schema gracefully", () => {
    const emptyTemplates = buildQueryTemplates(PLACEHOLDER_ID, []);
    expect(Array.isArray(emptyTemplates)).toBe(true);
    expect(emptyTemplates.length).toBeGreaterThan(0);
  });
});
