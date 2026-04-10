import {
  buildCsvExplorerExplainPrompt,
  buildCsvExplorerQuestionsPrompt,
  detectBrowserFamily,
  getBuiltinAiAvailability,
  getBuiltinAiBrowserSupport,
  hasBuiltinAiPromptApi
} from "../src/ai/prompts/dataset.js";

describe("CSV explorer AI prompts", () => {
  const meta = {
    rowCount: 250,
    profileSampleSize: 250,
    schema: [
      { name: "Facility Name", type: "string", examples: ["Example Clinic"] },
      { name: "State", type: "string", examples: ["MD"] }
    ],
    profile: {
      rowCount: 250,
      fieldCount: 2,
      fields: [
        {
          name: "Facility Name",
          type: "string",
          role: "descriptive text",
          missingPct: 0,
          examples: ["Example Clinic"]
        },
        {
          name: "State",
          type: "string",
          role: "geographic",
          missingPct: 4,
          examples: ["MD"]
        }
      ],
      sparsestFields: [{ name: "State", missingPct: 4 }],
      primaryKeyCandidates: ["Facility Name"],
      likelyJoinKeys: ["State"],
      dateFields: [],
      piiRiskFields: []
    }
  };

  test("explanation prompt includes profile hints when available", () => {
    const prompt = buildCsvExplorerExplainPrompt({
      title: "Example dataset",
      url: "https://example.com/data.csv",
      meta
    });

    expect(prompt).toContain("Candidate identifiers: Facility Name");
    expect(prompt).toContain("Likely join or geography fields: State");
    expect(prompt).toContain("Sparsest fields: State (4% missing)");
  });

  test("question prompt includes inferred roles when available", () => {
    const prompt = buildCsvExplorerQuestionsPrompt({
      title: "Example dataset",
      url: "https://example.com/data.csv",
      meta
    });

    expect(prompt).toContain("Facility Name (string, role: descriptive text)");
    expect(prompt).toContain("State (string, role: geographic)");
  });
});

describe("built-in AI browser support detection", () => {
  afterEach(() => {
    delete window.ai;
    delete window.LanguageModel;
  });

  test("detects browser families conservatively", () => {
    expect(detectBrowserFamily("Mozilla/5.0 Chrome/123.0.0.0 Safari/537.36")).toBe("chrome");
    expect(detectBrowserFamily("Mozilla/5.0 Edg/123.0.0.0")).toBe("edge");
    expect(detectBrowserFamily("Mozilla/5.0 Firefox/124.0")).toBe("firefox");
  });

  test("marks the current browser in support summary", () => {
    const support = getBuiltinAiBrowserSupport("Mozilla/5.0 Edg/123.0.0.0");
    const current = support.find(browser => browser.isCurrent);

    expect(current).toBeTruthy();
    expect(current.label).toBe("Edge");
  });

  test("detects modern Prompt API namespace and availability", async () => {
    window.LanguageModel = {
      availability: async () => "downloadable"
    };

    expect(hasBuiltinAiPromptApi()).toBe(true);
    await expect(getBuiltinAiAvailability()).resolves.toBe("downloadable");
  });

  test("falls back to detected state for older window.ai namespace", async () => {
    window.ai = {
      languageModel: {}
    };

    expect(hasBuiltinAiPromptApi()).toBe(true);
    await expect(getBuiltinAiAvailability()).resolves.toBe("detected");
  });
});
