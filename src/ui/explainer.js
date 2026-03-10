/**
 * ui/explainer.js
 * Dataset explainer views – renders the human-readable explanation layer
 * over a loaded DKAN dataset and its computed profile.
 *
 * All DOM construction uses document.createElement (no innerHTML).
 * All inferences are explicitly flagged.
 */

import { el, text, button } from "../render/components.js";
import {
  buildExplainPrompt,
  buildFieldDictionaryPrompt,
  isBuiltinAiAvailable,
  runBuiltinAi
} from "../ai/prompts/dataset.js";

/* ─── Dataset Overview ────────────────────────────────────────────────────── */

/**
 * Render the dataset overview section.
 *
 * @param {object} opts
 * @param {import('../dkan/ingest.js').DkanDataset|null} opts.dkanMeta
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.sourceUrl
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {HTMLElement}
 */
export function renderDatasetOverview({ dkanMeta, title, description, sourceUrl, profile }) {
  const meta = dkanMeta || {};

  const metaItems = [
    el("li", {}, [el("strong", {}, [text("Source: ")]), text(sourceUrl)]),
    el("li", {}, [el("strong", {}, [text("Rows: ")]), text(profile.rowCount.toLocaleString())]),
    el("li", {}, [el("strong", {}, [text("Fields: ")]), text(String(profile.fieldCount))])
  ];

  if (meta.publisher) metaItems.push(el("li", {}, [el("strong", {}, [text("Publisher: ")]), text(meta.publisher)]));
  if (meta.lastUpdated) metaItems.push(el("li", {}, [el("strong", {}, [text("Last updated: ")]), text(meta.lastUpdated)]));
  if (meta.updateFrequency) metaItems.push(el("li", {}, [el("strong", {}, [text("Update frequency: ")]), text(meta.updateFrequency)]));
  if (meta.license) metaItems.push(el("li", {}, [el("strong", {}, [text("License: ")]), text(meta.license)]));

  const section = el("section", { class: "explainer-overview", "aria-labelledby": "overview-heading" }, [
    el("h2", { id: "overview-heading" }, [text("Dataset Overview")]),
    el("h3", {}, [text(title || "Untitled Dataset")]),
    el("p", {}, [text(description || "No description available for this dataset.")]),
    el("ul", {}, metaItems)
  ]);

  // Resources list
  if (meta.resources && meta.resources.length > 0) {
    const resourceItems = meta.resources.map(r =>
      el("li", {}, [
        el("span", { class: "resource-format" }, [text(r.format || "FILE")]),
        text(" "),
        el("a", { href: r.url, target: "_blank", rel: "noopener noreferrer" }, [text(r.name || r.url)])
      ])
    );
    section.appendChild(el("h3", {}, [text("Available Resources")]));
    section.appendChild(el("ul", { class: "resource-list" }, resourceItems));
  }

  return section;
}

/* ─── Field-Level Data Dictionary ────────────────────────────────────────── */

/**
 * Render the field-level data dictionary table with inferred roles.
 *
 * @param {import('../data/profile.js').DataProfile} profile
 * @returns {HTMLElement}
 */
export function renderFieldDictionary(profile) {
  const tbody = el("tbody", {}, profile.fields.map(f => {
    const piiCell = f.piiWarnings.length > 0
      ? el("td", { class: "pii-warning" }, [
          el("span", { role: "img", "aria-label": "Warning" }, [text("⚠️ ")]),
          text(`Possible ${f.piiWarnings.join(", ")} – review before sharing`)
        ])
      : el("td", {}, [text("")]);

    return el("tr", {}, [
      el("td", {}, [el("code", {}, [text(f.name)])]),
      el("td", {}, [text(f.type)]),
      el("td", {}, [text(f.role), el("span", { class: "inferred-label" }, [text(" (inferred)")])]),
      el("td", {}, [text(f.missingPct > 0 ? `${f.missingPct}%` : "—")]),
      el("td", {}, [text(f.examples.slice(0, 3).join(", ") || "—")]),
      piiCell
    ]);
  }));

  return el("section", { class: "explainer-dictionary", "aria-labelledby": "dictionary-heading" }, [
    el("h2", { id: "dictionary-heading" }, [text("Field-Level Data Dictionary")]),
    el("p", { class: "inferred-label" }, [
      el("span", { role: "img", "aria-label": "Information" }, [text("ℹ️ ")]),
      text("Types, roles, and missing percentages are inferred from the data sample. Verify against official documentation.")
    ]),
    el("div", { style: "overflow-x: auto;" }, [
      el("table", { class: "data-dictionary" }, [
        el("caption", {}, [text("Inferred field profiles")]),
        el("thead", {}, [
          el("tr", {}, [
            el("th", { scope: "col" }, [text("Field")]),
            el("th", { scope: "col" }, [text("Type")]),
            el("th", { scope: "col" }, [text("Role")]),
            el("th", { scope: "col" }, [text("Missing")]),
            el("th", { scope: "col" }, [text("Examples")]),
            el("th", { scope: "col" }, [text("Notes")])
          ])
        ]),
        tbody
      ])
    ])
  ]);
}

/* ─── Data Quality Profile ────────────────────────────────────────────────── */

/**
 * Render the data quality and structure summary.
 *
 * @param {import('../data/profile.js').DataProfile} profile
 * @returns {HTMLElement}
 */
export function renderDataProfile(profile) {
  const items = [
    el("li", {}, [el("strong", {}, [text("Row count: ")]), text(profile.rowCount.toLocaleString())]),
    el("li", {}, [el("strong", {}, [text("Field count: ")]), text(String(profile.fieldCount))])
  ];

  if (profile.sparsestFields.length > 0) {
    items.push(el("li", {}, [
      el("strong", {}, [text("Sparsest fields (top 5): ")]),
      el("ul", {}, profile.sparsestFields.map(f =>
        el("li", {}, [text(`${f.name} – ${f.missingPct}% missing`)])
      ))
    ]));
  }

  if (profile.primaryKeyCandidates.length > 0) {
    items.push(el("li", {}, [
      el("strong", {}, [text("Candidate primary keys (inferred): ")]),
      text(profile.primaryKeyCandidates.join(", "))
    ]));
  }

  if (profile.likelyJoinKeys.length > 0) {
    items.push(el("li", {}, [
      el("strong", {}, [text("Likely join keys (inferred): ")]),
      text(profile.likelyJoinKeys.join(", "))
    ]));
  }

  if (profile.piiRiskFields.length > 0) {
    items.push(el("li", { class: "pii-warning" }, [
      el("strong", {}, [text("PII risk indicators (pattern-based, warnings only): ")]),
      el("ul", {}, profile.piiRiskFields.map(f =>
        el("li", {}, [text(`${f.name}: possible ${f.warnings.join(", ")}`)])
      ))
    ]));
  }

  return el("section", { class: "explainer-profile", "aria-labelledby": "profile-heading" }, [
    el("h2", { id: "profile-heading" }, [text("Data Quality & Structure Profile")]),
    el("p", { class: "inferred-label" }, [text("Computed from the loaded data sample. All values are inferred – not authoritative.")]),
    el("ul", {}, items)
  ]);
}

/* ─── "Explain this dataset" button section ─────────────────────────────── */

/**
 * Render the "Explain this dataset" interactive section.
 * Uses Chrome Built-in AI if available; falls back to a copyable prompt.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.sourceUrl
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {HTMLElement}
 */
export function renderExplainSection({ title, description, sourceUrl, profile }) {
  const prompt = buildExplainPrompt({ title, description, url: sourceUrl, profile });
  const outputEl = el("div", { class: "ai-output", role: "status", "aria-live": "polite" }, []);
  const aiAvailable = isBuiltinAiAvailable();

  const section = el("section", { class: "explainer-explain", "aria-labelledby": "explain-heading" }, [
    el("h2", { id: "explain-heading" }, [text("Explain This Dataset")]),
    el("p", {}, [text(
      aiAvailable
        ? "Generate a plain-language explanation using your browser's built-in AI (runs locally – no data is sent externally)."
        : "Copy the prompt below into any AI tool to generate a plain-language explanation."
    )])
  ]);

  if (aiAvailable) {
    const explainBtn = button("Generate explanation (Built-in AI)", async () => {
      explainBtn.disabled = true;
      outputEl.textContent = "Generating…";
      try {
        const result = await runBuiltinAi(prompt);
        outputEl.textContent = "";
        const pre = el("pre", { class: "ai-result" }, [text(result)]);
        const disclaimer = el("p", { class: "ai-disclaimer" }, [
          text("⚠️ AI-generated. Review before use. "),
          text("Derived from CMS open data. Interpretations are assistive only.")
        ]);
        outputEl.appendChild(pre);
        outputEl.appendChild(disclaimer);
      } catch (err) {
        outputEl.textContent = `AI generation failed: ${err.message}`;
      } finally {
        explainBtn.disabled = false;
      }
    }, { class: "primary-btn" });

    section.appendChild(explainBtn);
  } else {
    section.appendChild(el("p", { class: "ai-unavailable" }, [
      text("Chrome Built-in AI is not available in this browser. Use the copyable prompt below with any external AI tool.")
    ]));
  }

  section.appendChild(el("details", {}, [
    el("summary", {}, [text("Show copyable AI prompt")]),
    el("pre", { class: "prompt-block" }, [text(prompt)]),
    button("Copy prompt", async () => {
      await navigator.clipboard.writeText(prompt);
    }, { class: "secondary-btn" })
  ]));

  section.appendChild(outputEl);
  return section;
}

/**
 * Render the field dictionary prompt section.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {HTMLElement}
 */
export function renderFieldDictionaryPromptSection({ title, profile }) {
  const prompt = buildFieldDictionaryPrompt({ title, profile });

  return el("section", { class: "explainer-dict-prompt", "aria-labelledby": "dict-prompt-heading" }, [
    el("h2", { id: "dict-prompt-heading" }, [text("Plain-Language Field Descriptions")]),
    el("p", {}, [text("Copy this prompt into any AI tool to get plain-language descriptions for each field.")]),
    el("details", {}, [
      el("summary", {}, [text("Show copyable AI prompt")]),
      el("pre", { class: "prompt-block" }, [text(prompt)]),
      button("Copy prompt", async () => {
        await navigator.clipboard.writeText(prompt);
      }, { class: "secondary-btn" })
    ])
  ]);
}
