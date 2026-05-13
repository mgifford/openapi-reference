# Definition of Done

This repository's reports should be complete enough that a maintainer can read them, trust them, and act on them without having to reconstruct missing context.

For this project, a report is done when it meets the standards below.

## 1. It is grounded in the current repository

A finished report is based on the current repository state, not memory or generic advice. It reflects the code, documentation, tests, workflows, and project policies that actually exist in this repository at the time the report is written.

At minimum, the report should draw from relevant sources such as:

- `README.md` for project purpose, architecture, deployment, and AI disclosure
- `ACCESSIBILITY.md` for WCAG 2.2 AA requirements and severity expectations
- `AGENTS.md` for contribution guardrails, architecture constraints, and project definition of done
- `package.json` and existing test tooling for validation expectations
- relevant source files, tests, issues, pull requests, or workflow output when making implementation or quality claims

## 2. It explains the report's purpose clearly

A complete report opens with enough context to answer three questions:

- What was reviewed
- Why it matters
- Who should act on it

For this repository, that usually means being explicit about whether the report is about accessibility, CSV parsing, IndexedDB caching, healthcare.gov integration, DKAN support, bookmarklet behavior, deployment, or documentation quality.

## 3. It uses evidence, not impressions

Material claims in the report are supported by evidence. Evidence may include:

- specific files or sections of files
- test results
- reproducible manual checks
- standards references such as WCAG 2.2 AA
- CI or workflow results
- linked issues or pull requests

If something has not been verified, the report says so plainly. Assumptions, hypotheses, and open questions are separated from confirmed findings.

## 4. It is aligned with this project's actual constraints

A finished report respects the architectural and policy boundaries of this repository. Recommendations should fit the project as it exists:

- static-first architecture, with GitHub Pages as the primary deployment target
- optional stateless Node.js proxy for CORS-restricted datasets
- vanilla JavaScript on the client, with no production framework runtime
- accessibility-first decisions, with semantic HTML preferred over ARIA
- local processing and local caching of remote data
- no server-side AI or automatic external LLM calls

A report is not done if it recommends changes that conflict with these constraints without explicitly calling that out as a deliberate project-level decision.

## 5. It treats accessibility as a quality gate

Because accessibility is a primary requirement in this repository, any report that covers user-facing behavior, documentation structure, or interaction patterns must address accessibility impact when relevant.

That means the report should:

- frame accessibility findings against WCAG 2.2 AA and the repository accessibility policy
- prefer semantic HTML recommendations before ARIA-based workarounds
- consider keyboard-only use, screen reader compatibility, focus visibility, labels, and heading structure where applicable
- avoid suggestions that would introduce Critical or High severity accessibility regressions

When prioritizing findings, the report should use the repository severity model where helpful:

- **Critical** — blocks a core task such as loading data, searching fields, or exporting
- **High** — significantly impedes assistive technology users or core workflows
- **Medium** — causes friction, confusion, or reduced clarity
- **Low** — minor improvement, cleanup, or polish

## 6. It is actionable for maintainers

A done report does more than describe problems. It gives maintainers usable next steps.

Recommendations should be:

- specific enough to turn into issues, tasks, or pull requests
- scoped to the actual problem
- ordered or grouped in a sensible way
- clear about dependencies, risks, and any unknowns

For this repository, a strong report usually makes it obvious which changes belong in documentation, which belong in tests, which affect the browser app, and which affect the optional Node.js proxy.

## 7. It distinguishes current status from follow-up work

A complete report makes it easy to separate:

- what is already working
- what is broken or incomplete
- what still needs validation
- what should happen next

This matters especially in a repository like this one, where some capabilities work fully in static hosting, while others depend on the optional local proxy or on external dataset behavior such as CORS support.

## 8. It includes validation status

If the report references checks, those checks should be run whenever reasonably possible and their status should be stated accurately.

For this repository, the baseline validation context includes:

- `npm test` for the automated test suite
- existing accessibility checks and repository testing practices described in `ACCESSIBILITY.md`
- manual verification when interactive behavior, keyboard flow, bookmarklet behavior, or assistive technology experience is relevant

If a check was not run, the report should say that directly instead of implying completion.

## 9. It is readable and accessible as a document

The report itself should model the standards this project expects:

- clear heading hierarchy
- meaningful link text
- plain and respectful language
- lists and tables only where they improve clarity
- no reliance on colour alone to communicate meaning

The audience should not need deep project history to understand the report.

## 10. It is ready to drive decisions

In this repository, a report is truly done when a maintainer can use it to decide one of the following without additional clarification:

- no action is needed
- an issue should be filed
- a bug should be fixed
- a documentation update is needed
- additional testing or validation is required
- a broader architectural decision is needed

## Summary

For `mgifford/openapi-reference`, a report is done when it is current, evidence-based, accessible, aligned with project constraints, explicit about validation status, and specific enough to support immediate follow-up work.
