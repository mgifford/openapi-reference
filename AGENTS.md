# AGENTS.md

> **System instructions for AI coding assistants contributing to this project.**
>
> This file provides guidance for AI agents (GitHub Copilot, Cursor, Claude, GPT-4, etc.) to maintain project standards and quality.

## Primary References

Before proposing or writing changes, read these project policy files:

1. **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** — Accessibility commitment, requirements, and known issues (WCAG 2.2 AA)
2. **[README.md](./README.md)** — Project overview, architecture, and deployment

## Purpose

This repository provides an **accessible, human-readable CSV dataset explorer** with intelligent CORS handling and healthcare.gov integration.

It is intentionally:
- **Static-first architecture** - Works on GitHub Pages without backend server
- **Hybrid capable** - Optional Node.js proxy server for legacy CORS-restricted datasets
- Framework-free (vanilla JavaScript only, zero runtime dependencies on client)
- Accessibility-first (WCAG 2 AA compliant)
- Test-driven
- Designed for long-term reuse across government data portals (healthcare.gov, CDC, CMS, etc.)

## Core Principles (Non-Negotiable)

1. **Accessibility is a primary requirement**
   - Semantic HTML first
   - ARIA only when required, and only following WAI-ARIA Authoring Practices
   - Keyboard-only operation must work by default
   - WCAG 2 AA color contrast compliance (4.5:1 minimum)

2. **Vanilla JavaScript only**
   - No frameworks
   - No runtime dependencies in production
   - DOM must be constructed using `document.createElement` (not string templates)

3. **Test-Driven Development**
   - Tests come before implementation
   - Bug fixes require regression tests
   - Quality checks automated via GitHub Actions

4. **Remote data, local processing**
   - Fetch CSV resources via direct browser request (CORS-enabled datasets)
   - Fall back to proxy server only when direct fetch fails
   - Process and cache locally using IndexedDB (zero server storage)
   - Server is optional and stateless - only proxies when needed

## Architecture

### Client-Side (Browser)
- **CSV Processing**: Parse and infer schema from CSV files
- **Data Storage**: IndexedDB for local caching (no server storage)
- **Healthcare.gov Integration**: 
  - DKAN API (CKAN-compatible) for dataset metadata
  - Supports both Socrata-style IDs (`5k5i-wzex`) and UUID format (`477ffb11-...`)
  - HTML parsing fallback when API is unavailable
- **Bookmarklet**: Drag-and-drop installation for one-click access
- **CORS Handling**: Try direct fetch first, use proxy only if needed

### Server-Side (Optional Node.js)
- Express proxy for CORS-restricted datasets
- Metadata extraction from healthcare.gov pages
- Stateless - no database, no persistent storage
- Only required for legacy datasets without CORS support

## Deployment

### GitHub Pages (Static Hosting)
- **Primary deployment**: https://mgifford.github.io/openapi-reference/
- Works without backend server for CORS-enabled datasets
- Bookmarklet functional for healthcare.gov integration
- Base path detection for subpath hosting

### Local Development
- Express server provides proxy for all datasets
- Accessible at http://localhost:3000
- Required for testing CORS-restricted datasets

## Out of Scope (Unless Explicitly Approved)

- Embedded AI / LLM calls (prompts are copyable for external LLMs)
- Chat UI
- "Try it out" API execution consoles
- Authentication workflows
- Database storage on server (server is stateless)

## Definition of Done

A change is complete when:
- All tests pass (5/5)
- HTML validation: 0 errors
- Accessibility scan: 0 violations (Playwright + axe-core)
- Security scan: 0 high-severity issues
- Works with keyboard only and assistive technology
- Local validation completed before pushing to GitHub

## Accessibility Requirements for AI Agents

All code changes must comply with **WCAG 2.2 Level AA**. See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for the full policy. Key rules that must never be violated:

### DOM Construction
- Always use `document.createElement` — **never** `innerHTML` with template literals or string concatenation
- This prevents both XSS vulnerabilities and accessibility regressions from malformed HTML

### Form Controls
- Every `<input>`, `<select>`, and `<textarea>` must have an explicit `<label for="...">` or `aria-label`
- `placeholder` is not a substitute for a label — it disappears when the user types and is inconsistently read by screen readers

### Focus Management
- Never use `outline: none` without providing an equivalent or better visible focus indicator that meets WCAG 2.4.11
- Focus order must follow the visual/logical reading order of the page

### Semantic Structure
- Use `<button>` for actions, `<a>` for navigation — never swap roles or add `role="button"` to links
- Use heading hierarchy correctly: one `<h1>` per page, then `<h2>`, `<h3>`, etc. without skipping levels
- Use landmark elements (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`) for page regions
- Include a skip-to-main-content link at the top of every page with repeated navigation

### Dynamic Content
- Use `role="status"` + `aria-live="polite"` for non-urgent status messages
- Use `aria-live="assertive"` only for urgent alerts; avoid overuse

### Decorative Content
- Emoji used as decoration (not conveyance of unique meaning) should be wrapped with `aria-hidden="true"`
- Images that are purely decorative must have `alt=""`

### Colour and Contrast
- Normal text: minimum 4.5:1 contrast ratio against background
- Large text (18pt / 14pt bold): minimum 3:1 contrast ratio
- UI components and focus indicators: minimum 3:1 contrast ratio

## Priority Taxonomy

When identifying issues, use this severity scale:

- **Critical** — Prevents a user from completing a core task (loading data, searching fields, exporting)
- **High** — Significantly impedes AT users (e.g., missing label, invisible focus indicator)
- **Medium** — Creates friction or confusion (e.g., missing skip link, unclear heading hierarchy)
- **Low** — Minor improvement, cosmetic, or enhancement (e.g., decorative emoji without aria-hidden)

Never suggest changes that introduce Critical or High severity accessibility issues.

## AI Disclosure Requirement

Transparency about AI use is a core value of this project. When contributing as an AI agent, you **must** keep the **`## 🤖 AI Disclosure`** section in `README.md` accurate and up to date.

Specifically:

1. **If you introduce new AI-assisted features** (e.g., browser-based AI, server-side LLM calls, embedded model inference), add a row to the relevant table in the AI Disclosure section describing:
   - Which AI tool or model is used
   - What it is used for
   - Whether any user data is sent externally

2. **If you are an AI coding assistant** (e.g., GitHub Copilot, Claude, GPT-4, Cursor), update the "Used to Build This Project" table to reflect your involvement if the tool is not already listed.

3. **Do not add AI tools that were not actually used.** Accuracy matters more than completeness.

4. **Do not remove existing entries** unless a feature has been fully removed and the AI tool is no longer in use anywhere in the project.

## Quick Decision Framework

If uncertain about an approach:

1. Consult [ACCESSIBILITY.md](./ACCESSIBILITY.md) for project accessibility policy
2. Choose the more semantic HTML option before reaching for ARIA
3. Test with keyboard-only navigation before marking a feature complete
4. When in doubt, choose the more accessible option
