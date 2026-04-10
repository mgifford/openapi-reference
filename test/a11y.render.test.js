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
});
