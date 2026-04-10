import { axe } from "jest-axe";
import "jest-axe/extend-expect";
import { renderCsvReference } from "../src/render/csvReference.js";

describe("a11y", () => {
  test("renderCsvReference has no obvious accessibility violations", async () => {
    document.body.innerHTML = `<main id="root"></main>`;
    const root = document.querySelector("#root");

    const meta = {
      fetchedAt: Date.now(),
      rowCount: 10,
      schema: [
        { name: "FieldA", type: "string", examples: ["x", "y"] },
        { name: "FieldB", type: "number", examples: ["1", "2"] }
      ]
    };

    renderCsvReference({ root, url: "https://example.com/x.csv", meta });

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test("renderCsvReference includes an explicit label for field search", () => {
    document.body.innerHTML = `<main id="root"></main>`;
    const root = document.querySelector("#root");

    const meta = {
      fetchedAt: Date.now(),
      rowCount: 10,
      schema: [
        { name: "FieldA", type: "string", examples: ["x", "y"] }
      ]
    };

    renderCsvReference({ root, url: "https://example.com/x.csv", meta });

    const label = document.querySelector('label[for="fieldSearch"]');
    const input = document.querySelector("#fieldSearch");

    expect(label).not.toBeNull();
    expect(label.textContent).toBe("Search fields");
    expect(input).not.toBeNull();
  });

  test("renderCsvReference shows built-in AI fallback prompts when browser AI is unavailable", () => {
    document.body.innerHTML = `<main id="root"></main>`;
    const root = document.querySelector("#root");

    const meta = {
      fetchedAt: Date.now(),
      rowCount: 10,
      schema: [
        { name: "Facility Name", type: "string", examples: ["Example Clinic"] },
        { name: "State", type: "string", examples: ["MD"] }
      ]
    };

    delete window.ai;

    renderCsvReference({ root, url: "https://example.com/x.csv", meta, datasetTitle: "Example dataset" });

    expect(root.textContent).toContain("Explore with Built-in AI");
    expect(root.textContent).toContain("Checking built-in browser AI availability");
    expect(root.textContent).toContain("Show copyable explanation prompt");
    expect(root.textContent).toContain("Show copyable question prompt");
    expect(root.textContent).toContain("Chrome:");
    expect(root.textContent).toContain("Edge:");
    expect(root.textContent).toContain("Firefox:");
  });
});
