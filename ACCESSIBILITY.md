# Accessibility Commitment (ACCESSIBILITY.md)

## 1. Our Commitment

We believe accessibility is a subset of quality. This project — CSV Dataset Explorer — commits to **WCAG 2.2 AA** standards across all user-facing HTML, JavaScript-rendered content, and documentation. We track our progress publicly to remain accountable to our users.

This project is intentionally accessibility-first: semantic HTML, keyboard-only operation, screen reader compatibility, and WCAG 2.2 AA colour contrast are non-negotiable requirements for every change.

## 2. Real-Time Health Metrics

| Metric | Status / Value |
| :--- | :--- |
| **Open A11y Issues** | [View open accessibility issues](https://github.com/mgifford/openapi-reference/labels/accessibility) |
| **Automated Test Pass Rate** | Monitored via jest-axe (axe-core) in CI |
| **A11y PRs Merged (MTD)** | Tracked in [project insights](https://github.com/mgifford/openapi-reference/pulse) |
| **Browser Support** | Last 2 major versions of Chrome, Firefox, Safari |
| **AT Tested** | Keyboard-only navigation verified per PR |

## 3. Contributor Requirements (The Guardrails)

To contribute to this repo, you must follow these guidelines:

- **Semantic HTML first:** Use native HTML elements before reaching for ARIA
- **ARIA only when required:** Follow [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- **Keyboard navigation:** All interactive elements must be reachable and operable by keyboard alone
- **Colour contrast:** Minimum 4.5:1 for normal text, 3:1 for large text and UI components (WCAG 2.2 AA)
- **DOM construction:** Use `document.createElement` — not `innerHTML` with template literals — to prevent both accessibility and security regressions
- **Focus indicators:** Never use `outline: none` without providing an equivalent or better replacement that meets WCAG 2.4.11
- **Labels for form controls:** Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` (not only a `placeholder`)
- **Skip links:** Pages with repeated navigation blocks must include a skip-to-main-content link
- **Inclusive language:** Use person-centred, respectful language throughout

### Component-Specific Guidance

- **Forms:** Every form control needs a programmatically associated label ([WCAG 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships))
- **Tables:** Use `<caption>`, `scope="col"/"row"` on header cells
- **Buttons vs Links:** Use `<button>` for actions, `<a>` for navigation — never swap roles
- **Status messages:** Use `role="status"` and `aria-live="polite"` for dynamic updates
- **Decorative emoji/icons:** When emoji or icons are purely decorative, mark the containing element `aria-hidden="true"`

## 4. Reporting & Severity Taxonomy

Please use our [issue templates](https://github.com/mgifford/openapi-reference/issues/new) when reporting issues. Apply the **accessibility** label and prioritise based on:

- **Critical:** Barrier that prevents users from completing a core task (e.g., loading a dataset, searching fields, exporting)
- **High:** Significant barrier that makes a core task very difficult (e.g., missing form labels, invisible focus indicators)
- **Medium:** Degraded experience that creates friction for AT users (e.g., unclear heading hierarchy, missing skip link)
- **Low:** Minor improvement, cosmetic, or enhancement (e.g., decorative emoji without aria-hidden)

## 5. Automated Check Coverage

This project uses:

- **[jest-axe](https://github.com/nickcolley/jest-axe)** — axe-core rules run against rendered DOM in every PR
- **[html-validate](https://html-validate.org/)** — static HTML validation
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** — end-to-end accessibility scan

Automated checks are a floor, not a ceiling. Manual testing with assistive technology is required for any PR that changes interactive behaviour.

## 6. Browser & Assistive Technology Support

### Browser Support Guarantees

Last 2 major versions of:
- **Chrome/Chromium** (including Edge, Brave)
- **Firefox**
- **Safari/WebKit** (macOS and iOS)

### Assistive Technology Testing

Contributors are encouraged to test with:

- **Screen readers:** NVDA + Firefox (Windows), VoiceOver + Safari (macOS/iOS), TalkBack (Android)
- **Keyboard navigation:** Tab, Shift+Tab, arrow keys, Enter, Space
- **Zoom / magnification:** Browser zoom up to 400%, OS magnifier
- **Voice control:** Dragon NaturallySpeaking, macOS Voice Control

## 7. Known Accessibility Issues

The issues documented in the 2026-03-09 source review were addressed in the current source as of 2026-04-10, including:

- explicit labeling for the field search input
- visible focus indicators for URL and field-search inputs
- skip links on the landing page and demo
- `document.createElement`-based bookmarklet rendering instead of `innerHTML`
- decorative heading emoji marked with `aria-hidden`
- CSS heading selector aligned to the actual feature card markup

New accessibility regressions should be filed as GitHub issues with the **accessibility** label as they are discovered. Automated checks and manual keyboard/AT verification are still required before release.

## 8. Machine-Readable Standards

This project follows [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/). For AI agents working on this project, refer to the accessibility guidance in [AGENTS.md](./AGENTS.md).

## 9. Getting Help

- **Questions:** Open a [discussion](https://github.com/mgifford/openapi-reference/discussions)
- **Bugs or barriers:** Open an [issue](https://github.com/mgifford/openapi-reference/issues) with the **accessibility** label
- **Contributions:** See [README.md](./README.md)

## 10. Continuous Improvement

We regularly review and update:
- WCAG conformance as standards evolve (currently targeting 2.2 AA)
- Automated test coverage (axe-core rule set)
- Assistive technology compatibility
- Inclusive language in UI copy and documentation

Last updated: 2026-04-10
