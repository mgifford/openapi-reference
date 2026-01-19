# AGENTS.md

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
  - Socrata API for datasets with Socrata IDs (`5k5i-wzex`)
  - HTML parsing fallback for UUID-format datasets (`477ffb11-...`)
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
