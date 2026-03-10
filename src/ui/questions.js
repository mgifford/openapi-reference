/**
 * ui/questions.js
 * Question-based review view for DKAN datasets.
 *
 * Generates evidence-triggered questions only – never answers or conclusions.
 * All questions are based on observed facts from the data profile.
 */

import { el, text, button } from "../render/components.js";
import { buildBaseQuestions } from "../export/index.js";
import {
  buildQuestionsPrompt,
  isBuiltinAiAvailable,
  runBuiltinAi
} from "../ai/prompts/dataset.js";

/**
 * Render the "Questions this dataset raises" section.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {import('../data/profile.js').DataProfile} opts.profile
 * @returns {HTMLElement}
 */
export function renderQuestionsSection({ title, profile }) {
  const baseQuestions = buildBaseQuestions(profile);
  const prompt = buildQuestionsPrompt({ title, profile });
  const aiAvailable = isBuiltinAiAvailable();

  const questionList = el("ol", { class: "question-list" },
    baseQuestions.map(q => el("li", {}, [text(q)]))
  );

  const aiOutputEl = el("div", {
    class: "ai-output",
    role: "status",
    "aria-live": "polite"
  }, []);

  const section = el("section", {
    class: "questions-section",
    "aria-labelledby": "questions-heading"
  }, [
    el("h2", { id: "questions-heading" }, [text("Questions This Dataset Raises")]),
    el("p", {}, [text(
      "These questions are evidence-triggered from the dataset structure. " +
      "They surface decisions to make, not conclusions to draw."
    )]),
    questionList
  ]);

  // AI-generated additional questions
  section.appendChild(el("h3", {}, [text("AI-Generated Questions (Optional)")]));

  if (aiAvailable) {
    const genBtn = button("Generate more questions (Built-in AI)", async () => {
      genBtn.disabled = true;
      aiOutputEl.textContent = "Generating…";
      try {
        const result = await runBuiltinAi(prompt);
        aiOutputEl.textContent = "";

        const lines = result.split("\n").filter(l => l.trim());
        const aiList = el("ol", { class: "question-list ai-questions" }, []);
        lines.forEach(line => {
          const clean = line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim();
          if (clean) aiList.appendChild(el("li", {}, [text(clean)]));
        });

        aiOutputEl.appendChild(el("p", { class: "ai-disclaimer" }, [
          text("AI-generated questions – review for relevance before use. "),
          text("Derived from CMS open data. Interpretations are assistive only.")
        ]));
        aiOutputEl.appendChild(aiList);
      } catch (err) {
        aiOutputEl.textContent = `AI generation failed: ${err.message}`;
      } finally {
        genBtn.disabled = false;
      }
    }, { class: "primary-btn" });

    section.appendChild(genBtn);
  } else {
    section.appendChild(el("p", { class: "ai-unavailable" }, [
      text("Chrome Built-in AI is not available. Use the copyable prompt below with any external AI tool.")
    ]));
  }

  section.appendChild(el("details", {}, [
    el("summary", {}, [text("Show copyable AI prompt")]),
    el("pre", { class: "prompt-block" }, [text(prompt)]),
    button("Copy prompt", async () => {
      await navigator.clipboard.writeText(prompt);
    }, { class: "secondary-btn" })
  ]));

  section.appendChild(aiOutputEl);
  return section;
}

/**
 * Render a compact inline questions callout (e.g. sidebar widget).
 *
 * @param {import('../data/profile.js').DataProfile} profile
 * @returns {HTMLElement}
 */
export function renderQuestionsCallout(profile) {
  const questions = buildBaseQuestions(profile).slice(0, 4);

  return el("aside", { class: "questions-callout", "aria-label": "Key questions to consider" }, [
    el("h3", {}, [text("Questions to Consider")]),
    el("ul", {}, questions.map(q => el("li", {}, [text(q)]))),
    el("p", { class: "inferred-label" }, [
      text("Evidence-triggered questions. Not conclusions.")
    ])
  ]);
}
