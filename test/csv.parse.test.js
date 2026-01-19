import { parseCsv } from "../src/csv/parse.js";

describe("parseCsv", () => {
  test("parses simple CSV", () => {
    const rows = parseCsv("a,b\n1,2\n");
    expect(rows).toEqual([["a","b"],["1","2"]]);
  });

  test("parses quoted fields with commas", () => {
    const rows = parseCsv('a,b\n"hello, world",2\n');
    expect(rows[1][0]).toBe("hello, world");
  });

  test("parses escaped quotes", () => {
    const rows = parseCsv('a\n"he said ""hi"""\n');
    expect(rows[1][0]).toBe('he said "hi"');
  });
});
