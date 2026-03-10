/**
 * export/index.js
 * Generate downloadable or copyable export artifacts for CMS workflows.
 *
 * All exports are clearly labeled:
 *   "Derived from CMS open data. Interpretations are assistive."
 *
 * Supported formats:
 *  - Data dictionary (JSON)
 *  - Data dictionary (Markdown)
 *  - Dataset briefing (Markdown, non-technical)
 *  - Query catalog (JSON)
 *  - Question list (plain text / Markdown)
 */

const EXPORT_LABEL =
  "_Derived from CMS open data. Interpretations are assistive only and do not constitute policy guidance._";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function isoNow() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Trigger a browser file download of a text blob.
 *
 * @param {string} content
 * @param {string} filename
 * @param {string} [mimeType]
 */
export function downloadText(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Data Dictionary ─────────────────────────────────────────────────────── */

/**
 * Export data dictionary as a JSON string.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.sourceUrl
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {string}
 */
export function buildDataDictionaryJson({ title, sourceUrl, profile }) {
  const dict = {
    exportedAt: isoNow(),
    label: EXPORT_LABEL,
    dataset: {
      title: title || "Unknown",
      sourceUrl,
      rowCount: profile.rowCount,
      fieldCount: profile.fieldCount
    },
    fields: profile.fields.map(f => ({
      name: f.name,
      inferredType: f.type,
      inferredRole: f.role,
      missingPct: f.missingPct,
      uniquenessRatio: f.uniquenessRatio,
      exampleValues: f.examples,
      piiRiskHints: f.piiWarnings.length > 0
        ? f.piiWarnings.map(w => `Possible ${w} – review before publishing`)
        : []
    })),
    qualitySummary: {
      sparsestFields: profile.sparsestFields,
      primaryKeyCandidates: profile.primaryKeyCandidates,
      likelyJoinKeys: profile.likelyJoinKeys,
      piiRiskFields: profile.piiRiskFields
    }
  };
  return JSON.stringify(dict, null, 2);
}

/**
 * Export data dictionary as a Markdown string.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.sourceUrl
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {string}
 */
export function buildDataDictionaryMarkdown({ title, sourceUrl, profile }) {
  const rows = profile.fields.map(f => {
    const pii = f.piiWarnings.length > 0 ? `⚠️ possible ${f.piiWarnings.join(", ")}` : "";
    return `| ${f.name} | ${f.type} | ${f.role} | ${f.missingPct}% | ${f.uniquenessRatio.toFixed(2)} | ${f.examples.slice(0, 2).join("; ")} | ${pii} |`;
  }).join("\n");

  return `# Data Dictionary – ${title || "Dataset"}

**Source:** ${sourceUrl}  
**Exported:** ${isoNow()}  
**Rows:** ${profile.rowCount} | **Fields:** ${profile.fieldCount}

${EXPORT_LABEL}

## Fields

| Field | Type (inferred) | Role (inferred) | Missing % | Uniqueness | Examples | Notes |
|-------|----------------|----------------|-----------|------------|---------|-------|
${rows}

## Quality Summary

**Sparsest fields:**
${profile.sparsestFields.map(f => `- ${f.name}: ${f.missingPct}% missing`).join("\n") || "- None above threshold"}

**Candidate primary keys:** ${profile.primaryKeyCandidates.join(", ") || "None identified"}

**Likely join keys:** ${profile.likelyJoinKeys.join(", ") || "None identified"}
${profile.piiRiskFields.length > 0 ? `\n**PII risk hints (review required):**\n${profile.piiRiskFields.map(f => `- ${f.name}: possible ${f.warnings.join(", ")}`).join("\n")}` : ""}
`;
}

/* ─── Dataset Briefing ───────────────────────────────────────────────────── */

/**
 * Export a non-technical dataset briefing in Markdown.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.sourceUrl
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @param {import('../dkan/ingest.js').DkanDataset} [opts.dkanMeta]
 * @returns {string}
 */
export function buildDatasetBriefing({ title, description, sourceUrl, profile, dkanMeta }) {
  const publisher = dkanMeta?.publisher || "Not specified";
  const lastUpdated = dkanMeta?.lastUpdated || "Not specified";
  const license = dkanMeta?.license || "Not specified";

  const sparseSummary = profile.sparsestFields.length > 0
    ? profile.sparsestFields.map(f => `- **${f.name}**: ${f.missingPct}% of rows are blank`).join("\n")
    : "- No significant missing-data issues detected";

  return `# Dataset Briefing – ${title || "Dataset"}

**Source:** ${sourceUrl}  
**Publisher:** ${publisher}  
**Last updated:** ${lastUpdated}  
**License:** ${license}  
**Exported:** ${isoNow()}

${EXPORT_LABEL}

---

## What This Dataset Is

${description || "No description is available for this dataset."}

## Structure at a Glance

- **${profile.rowCount.toLocaleString()} rows** and **${profile.fieldCount} fields**
- Likely identifiers: ${profile.primaryKeyCandidates.join(", ") || "none identified"}
- Date / period fields: ${profile.dateFields.join(", ") || "none identified"}
- Geographic fields: ${profile.likelyJoinKeys.filter(k => profile.fields.find(f => f.name === k)?.role === "geographic").join(", ") || "none identified"}

## What a First-Time User Should Know

1. This dataset is provided as-is. Verify the source and update date before using it in analysis.
2. Field names are inferred from the CSV header; official definitions should be obtained from the publisher.
3. Missing values exist in some fields – see the Common Pitfalls section below.
${profile.piiRiskFields.length > 0 ? `4. Some fields may contain sensitive data – review the Data Dictionary before sharing derived outputs.` : ""}

## Common Pitfalls

${sparseSummary}

## How to Use This Dataset

- Load in Excel, Python (pandas), or R for analysis.
- Use the DKAN API query templates for server-side filtering (see query catalog).
- For complex grouping or aggregation, export the full CSV and process locally.

---

*This briefing was generated automatically from inferred metadata. All interpretations should be verified against the official dataset documentation.*
`;
}

/* ─── Query Catalog ──────────────────────────────────────────────────────── */

/**
 * Export a query catalog as a JSON string.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.sourceUrl
 * @param {import('../queries/templates.js').QueryTemplate[]} opts.templates
 * @returns {string}
 */
export function buildQueryCatalogJson({ title, sourceUrl, templates }) {
  const catalog = {
    exportedAt: isoNow(),
    label: EXPORT_LABEL,
    dataset: { title: title || "Unknown", sourceUrl },
    queries: templates.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      apiUrl: t.url,
      supportsApi: t.supportsApi,
      note: t.note || null
    }))
  };
  return JSON.stringify(catalog, null, 2);
}

/* ─── Question List ──────────────────────────────────────────────────────── */

/**
 * Generate a Markdown question list from a profile and optional AI-generated text.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @param {string[]} [opts.aiQuestions] - additional questions from AI (optional)
 * @returns {string}
 */
export function buildQuestionListMarkdown({ title, profile, aiQuestions = [] }) {
  const baseQuestions = buildBaseQuestions(profile);
  const all = [...baseQuestions, ...aiQuestions].map((q, i) => `${i + 1}. ${q}`).join("\n");

  return `# Questions for Dataset Review – ${title || "Dataset"}

**Exported:** ${isoNow()}

${EXPORT_LABEL}

---

${all}

---

*These questions are evidence-triggered from the dataset structure. They surface decisions to make, not conclusions to draw.*
`;
}

/**
 * Generate evidence-triggered review questions from a data profile.
 * Questions are based only on observed facts – no speculation.
 *
 * @param {import('../data/profile.js').DataProfile} profile
 * @returns {string[]}
 */
export function buildBaseQuestions(profile) {
  const questions = [];

  if (profile.dateFields.length > 0) {
    questions.push(`Is this dataset cumulative or point-in-time? (Date field detected: ${profile.dateFields[0]})`);
    questions.push(`Which field represents the reporting period, and what is its update frequency?`);
  } else {
    questions.push("Is there a date or reporting-period field that is not yet identified?");
  }

  if (profile.primaryKeyCandidates.length > 0) {
    questions.push(`What field should be treated as the stable identifier? (Candidates: ${profile.primaryKeyCandidates.join(", ")})`);
  } else {
    questions.push("Does this dataset have a stable unique identifier? None was detected automatically.");
  }

  if (profile.likelyJoinKeys.length > 0) {
    questions.push(`Are geographic fields standardised to a known code system? (Fields: ${profile.likelyJoinKeys.join(", ")})`);
  }

  if (profile.sparsestFields.length > 0) {
    questions.push(`What does a blank value mean in the sparsest fields? (${profile.sparsestFields.map(f => `${f.name}: ${f.missingPct}% missing`).join(", ")})`);
  }

  if (profile.piiRiskFields.length > 0) {
    questions.push(`Have the following fields been reviewed for sensitive data before public release? (${profile.piiRiskFields.map(f => f.name).join(", ")})`);
  }

  questions.push("Is this dataset a complete extract or a sample? What are the inclusion/exclusion criteria?");
  questions.push("Are the field definitions documented in an official data dictionary? Where can it be found?");
  questions.push("Are there suppressed values (e.g. cells replaced with * or <11) that affect completeness?");

  return questions;
}
