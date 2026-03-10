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
