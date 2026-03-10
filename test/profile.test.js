/**
 * test/profile.test.js
 * Tests for src/data/profile.js
 */
import { profileDataset, inferFieldRole, detectPiiRisk } from "../src/data/profile.js";

// Minimal schema mimicking infer.js output
const SCHEMA = [
  { name: "NPN", type: "number", examples: ["1234567"] },
  { name: "Status", type: "string", examples: ["Active", "Terminated"] },
  { name: "EffectiveDate", type: "date", examples: ["2023-01-01"] },
  { name: "State", type: "string", examples: ["CA", "TX", "FL"] },
  { name: "Notes", type: "string", examples: ["", "", ""] }
];

const HEADERS = SCHEMA.map(s => s.name);

// Build a rows array: 10 rows, NPN sequential, Status alternating, Notes always empty
const ROWS = Array.from({ length: 10 }, (_, i) => [
  String(1000000 + i),         // NPN
  i % 2 === 0 ? "Active" : "Terminated", // Status
  `2023-0${(i % 9) + 1}-01`,  // EffectiveDate
  ["CA", "TX", "FL"][i % 3],  // State
  ""                           // Notes (always empty)
]);

describe("inferFieldRole", () => {
  test("detects identifier role from name", () => {
    expect(inferFieldRole("NPN", "number")).toBe("identifier");
  });

  test("detects date/time role from type", () => {
    expect(inferFieldRole("EffectiveDate", "date")).toBe("date/time");
  });

  test("detects date/time role from name containing 'date'", () => {
    expect(inferFieldRole("TerminationDate", "string")).toBe("date/time");
  });

  test("detects geographic role from name", () => {
    expect(inferFieldRole("State", "string")).toBe("geographic");
  });

  test("detects numeric measure from number type", () => {
    expect(inferFieldRole("TotalAmount", "number")).toBe("numeric measure");
  });

  test("falls back to descriptive text for generic string", () => {
    expect(inferFieldRole("Notes", "string")).toBe("descriptive text");
  });
});

describe("detectPiiRisk", () => {
  test("flags email addresses", () => {
    expect(detectPiiRisk(["user@example.com"])).toContain("email address");
  });

  test("flags SSN-like patterns", () => {
    expect(detectPiiRisk(["123-45-6789"])).toContain("US SSN-like");
  });

  test("returns empty array for safe values", () => {
    expect(detectPiiRisk(["Active", "2023-01-01", "CA"])).toEqual([]);
  });

  test("does not double-report same pattern type", () => {
    const warnings = detectPiiRisk(["user@a.com", "other@b.com"]);
    expect(warnings.filter(w => w === "email address").length).toBe(1);
  });
});

describe("profileDataset", () => {
  const profile = profileDataset(HEADERS, ROWS, SCHEMA);

  test("computes correct row and field counts", () => {
    expect(profile.rowCount).toBe(10);
    expect(profile.fieldCount).toBe(5);
  });

  test("identifies Notes as 100% missing", () => {
    const notesField = profile.fields.find(f => f.name === "Notes");
    expect(notesField.missingPct).toBe(100);
  });

  test("identifies NPN as high uniqueness", () => {
    const npnField = profile.fields.find(f => f.name === "NPN");
    expect(npnField.uniquenessRatio).toBe(1);
  });

  test("includes Notes in sparsest fields", () => {
    expect(profile.sparsestFields.some(f => f.name === "Notes")).toBe(true);
  });

  test("identifies NPN as candidate primary key", () => {
    expect(profile.primaryKeyCandidates).toContain("NPN");
  });

  test("identifies State as likely join key", () => {
    expect(profile.likelyJoinKeys).toContain("State");
  });

  test("identifies EffectiveDate as a date field", () => {
    expect(profile.dateFields).toContain("EffectiveDate");
  });

  test("returns fields array with correct length", () => {
    expect(profile.fields).toHaveLength(5);
  });

  test("assigns correct role to each field", () => {
    const roles = Object.fromEntries(profile.fields.map(f => [f.name, f.role]));
    expect(roles["NPN"]).toBe("identifier");
    expect(roles["EffectiveDate"]).toBe("date/time");
    expect(roles["State"]).toBe("geographic");
  });
});
