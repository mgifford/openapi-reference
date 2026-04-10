/**
 * ai/prompts/dataset.js
 * Builds copyable prompt templates for optional AI assistance.
 *
 * These prompts are NEVER sent automatically to any external service.
 * They are displayed as plain text for the user to copy into an AI tool
 * of their choosing.
 *
 * If Chrome Built-in AI (window.ai) is present, the module also exposes
 * helper functions to generate text locally. The caller must check
 * isBuiltinAiAvailable() before using those helpers.
 */

const DISCLAIMER =
  "Derived from CMS open data. Interpretations are assistive only and do not constitute policy guidance.";

/**
 * Build a plain-language "explain this dataset" prompt.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.url
 * @param {import('../../data/profile.js').DataProfile} opts.profile
 * @returns {string}
 */
export function buildExplainPrompt({ title, description, url, profile }) {
  const fieldSummary = profile.fields
    .slice(0, 20)
    .map(f => `- ${f.name} (${f.type}, role: ${f.role}${f.missingPct > 10 ? `, ${f.missingPct}% missing` : ""}): examples: ${f.examples.slice(0, 3).join("; ")}`)
    .join("\n");

  return `You are helping a non-technical CMS policy analyst understand a public dataset.

Dataset title: ${title || "Unknown"}
Dataset description: ${description || "(none provided)"}
Source URL: ${url}
Row count: ${profile.rowCount}
Field count: ${profile.fieldCount}

Fields (inferred):
${fieldSummary}

Sparsest fields (may need attention):
${profile.sparsestFields.map(f => `- ${f.name}: ${f.missingPct}% missing`).join("\n") || "  (none above threshold)"}

Task:
1) Explain what this dataset appears to cover in plain language (2–3 sentences).
2) Describe what kinds of questions it can help answer.
3) Describe what it does NOT answer.
4) Identify any data quality concerns visible in the fields or missing-value summary.

Rules:
- Do not invent facts not supported by the fields and examples above.
- Do not interpret policy or draw conclusions about outcomes.
- Flag all inferences as inferred.

${DISCLAIMER}`;
}

/**
 * Build a prompt that asks an AI to generate candidate data questions.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {import('../../data/profile.js').DataProfile} opts.profile
 * @returns {string}
 */
export function buildQuestionsPrompt({ title, profile }) {
  const fieldLines = profile.fields
    .slice(0, 20)
    .map(f => `- ${f.name} (${f.type}, role: ${f.role})`)
    .join("\n");

  return `You are helping a CMS policy analyst identify open questions about a dataset before using it.

Dataset title: ${title || "Unknown"}
Row count: ${profile.rowCount}
Fields:
${fieldLines}

Candidate primary keys: ${profile.primaryKeyCandidates.join(", ") || "(none identified)"}
Likely join keys: ${profile.likelyJoinKeys.join(", ") || "(none identified)"}
Date/period fields: ${profile.dateFields.join(", ") || "(none identified)"}

Generate a list of 8–12 questions that a careful analyst should ask before using this dataset.
Focus on:
- data structure and grain
- temporal coverage and update frequency
- geographic scope and standardisation
- identifiers and join reliability
- missing data and what it means
- cumulative vs point-in-time fields

Rules:
- Output ONLY questions, not answers.
- Base every question on evidence from the field names and profile above.
- Do not invent requirements or assert conclusions.

${DISCLAIMER}`;
}

/**
 * Build a plain-text field dictionary prompt suitable for AI explanation.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {import('../../data/profile.js').DataProfile} opts.profile
 * @returns {string}
 */
export function buildFieldDictionaryPrompt({ title, profile }) {
  const fieldLines = profile.fields
    .map(f => `- ${f.name} | type: ${f.type} | role: ${f.role} | examples: ${f.examples.slice(0, 3).join("; ")} | missing: ${f.missingPct}%`)
    .join("\n");

  return `Provide plain-language descriptions for each field in this CMS dataset.

Dataset: ${title || "Unknown"}

Fields:
${fieldLines}

For each field write one sentence explaining:
1) What the field likely represents
2) How a non-technical user would interpret it

Flag all interpretations as inferred from field names and examples only.
Do not assert policy meaning.

${DISCLAIMER}`;
}

/**
 * Build a plain-language prompt for the CSV explorer using inferred schema only.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.url
 * @param {object} opts.meta
 * @returns {string}
 */
export function buildCsvExplorerExplainPrompt({ title, url, meta }) {
  const profile = meta.profile || null;
  const schemaLines = ((profile && profile.fields) || meta.schema || [])
    .slice(0, 25)
    .map(field => {
      const roleText = field.role ? `, role: ${field.role}` : "";
      const missingText = typeof field.missingPct === "number" && field.missingPct > 0 ? `, ${field.missingPct}% missing` : "";
      return `- ${field.name} (${field.type}${roleText}${missingText}): examples: ${(field.examples || []).slice(0, 4).join("; ") || "(no examples)"}`;
    })
    .join("\n");

  const profileLines = profile
    ? `
Profile hints (inferred from a local sample of ${meta.profileSampleSize || profile.rowCount || 0} rows):
- Candidate identifiers: ${profile.primaryKeyCandidates.join(", ") || "(none identified)"}
- Likely join or geography fields: ${profile.likelyJoinKeys.join(", ") || "(none identified)"}
- Date or period fields: ${profile.dateFields.join(", ") || "(none identified)"}
- Sparsest fields: ${profile.sparsestFields.map(field => `${field.name} (${field.missingPct}% missing)`).join(", ") || "(none identified)"}`
    : "";

  return `You are helping a non-technical person understand a public open-data CSV.

Dataset title: ${title || "Unknown"}
Source URL: ${url}
Rows cached locally: ${meta.rowCount || 0}
Fields detected: ${(meta.schema || []).length}

Fields (inferred from the CSV header and sample values):
${schemaLines}
${profileLines}

Task:
1) Explain in plain language what this dataset appears to cover.
2) Identify the most important fields for a first-time reader.
3) Suggest 5 useful questions a person could explore with this dataset.
4) Call out any limits, ambiguity, or likely missing context visible from the field names and examples.

Rules:
- Flag all interpretations as inferred.
- Do not invent facts not supported by the fields, examples, or source URL.
- Do not give policy, legal, or medical advice.

Derived from a locally loaded public CSV. Interpretations are assistive only.`;
}

/**
 * Build a question-generation prompt for the CSV explorer using inferred schema only.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.url
 * @param {object} opts.meta
 * @returns {string}
 */
export function buildCsvExplorerQuestionsPrompt({ title, url, meta }) {
  const profile = meta.profile || null;
  const schemaLines = ((profile && profile.fields) || meta.schema || [])
    .slice(0, 25)
    .map(field => {
      const roleText = field.role ? `, role: ${field.role}` : "";
      return `- ${field.name} (${field.type}${roleText})`;
    })
    .join("\n");

  const profileLines = profile
    ? `
Profile hints (inferred from a local sample of ${meta.profileSampleSize || profile.rowCount || 0} rows):
- Candidate identifiers: ${profile.primaryKeyCandidates.join(", ") || "(none identified)"}
- Likely join or geography fields: ${profile.likelyJoinKeys.join(", ") || "(none identified)"}
- Date or period fields: ${profile.dateFields.join(", ") || "(none identified)"}`
    : "";

  return `You are helping someone explore a public open-data CSV before doing deeper analysis.

Dataset title: ${title || "Unknown"}
Source URL: ${url}
Rows cached locally: ${meta.rowCount || 0}
Fields detected: ${(meta.schema || []).length}

Fields:
${schemaLines}
${profileLines}

Generate 8 to 12 concrete questions the user might want to ask next.
Focus on:
- what the dataset measures
- who or what each row likely represents
- time coverage
- geography
- notable counts, rates, or identifiers
- missing context the user should verify in the official documentation

Rules:
- Output only the questions as a bullet list.
- Base every question on the field names and metadata above.
- Flag uncertainty through wording like "appears" or "may".

Derived from a locally loaded public CSV. Interpretations are assistive only.`;
}

/**
 * Detect the current browser family from a user agent string.
 *
 * @param {string} [userAgent]
 * @returns {"edge"|"chrome"|"firefox"|"other"}
 */
export function detectBrowserFamily(userAgent = "") {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("firefox/")) return "firefox";
  if (ua.includes("chrome/") || ua.includes("chromium/")) return "chrome";
  return "other";
}

/**
 * Return a conservative browser support summary for built-in browser AI.
 *
 * @param {string} [userAgent]
 * @returns {Array<{id:string,label:string,status:string,detail:string,isCurrent:boolean}>}
 */
export function getBuiltinAiBrowserSupport(userAgent = "") {
  const current = detectBrowserFamily(userAgent);

  return [
    {
      id: "chrome",
      label: "Chrome",
      status: "supported on desktop",
      detail: "Best fit for built-in AI today, subject to version, hardware, storage, and model availability.",
      isCurrent: current === "chrome"
    },
    {
      id: "edge",
      label: "Edge",
      status: "preview support",
      detail: "Built-in AI support is emerging in Edge, but the Prompt API is still preview-oriented and more limited than Chrome.",
      isCurrent: current === "edge"
    },
    {
      id: "firefox",
      label: "Firefox",
      status: "not natively available",
      detail: "Firefox is exploring browser AI features, but this explorer does not expect native built-in AI support there today.",
      isCurrent: current === "firefox"
    }
  ];
}

/**
 * Detect whether Chrome Built-in AI (window.ai) is available.
 * Safe to call in any browser context.
 *
 * @returns {boolean}
 */
export function isBuiltinAiAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.ai !== "undefined" &&
    typeof window.ai.languageModel !== "undefined"
  );
}

/**
 * Use Chrome Built-in AI to generate a response for a given prompt.
 * The caller must first check isBuiltinAiAvailable().
 *
 * @param {string} prompt
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
export async function runBuiltinAi(prompt, signal) {
  if (!isBuiltinAiAvailable()) {
    throw new Error("Chrome Built-in AI is not available in this browser.");
  }

  const session = await window.ai.languageModel.create();
  const result = await session.prompt(prompt, signal ? { signal } : undefined);
  session.destroy();
  return result;
}
