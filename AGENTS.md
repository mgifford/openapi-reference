# AGENTS.md

## Purpose

This repository provides an **accessible, human-readable API and dataset reference renderer** with server-side proxy support for government data portals.

It is intentionally:
- **Hybrid architecture** - Vanilla JS browser app + optional Node.js proxy server
- Framework-free (vanilla JavaScript only, zero runtime dependencies on client)
- Accessibility-first
- Test-driven
- Designed for long-term reuse across portals (including DKAN, Socrata, healthcare.gov)

## Core Principles (Non-Negotiable)

1. **Accessibility is a primary requirement**
   - Semantic HTML first
   - ARIA only when required, and only following WAI-ARIA Authoring Practices
   - Keyboard-only operation must work by default

2. **Vanilla JavaScript only**
   - No frameworks
   - No runtime dependencies in production
   - DOM must be constructed using `document.createElement` (not string templates)

3. **Test-Driven Development**
   - Tests come before implementation
   - Bug fixes require regression tests

4. **Remote data, local processing**
   - Fetch CSV resources via direct browser request when CORS allows
   - Use optional Node.js proxy server for CORS restrictions (healthcare.gov, CDC, etc.)
   - Process and cache locally using IndexedDB (not localStorage, zero server storage)
   - Server is stateless - only proxies and extracts metadata, never stores data

## Out of Scope (Unless Explicitly Approved)

- Embedded AI / LLM calls (prompts are copyable for external LLMs)
- Chat UI
- "Try it out" API execution consoles
- Authentication workflows
- Database storage on server (server is stateless)

## Definition of Done

A change is complete when:
- Tests pass
- Accessibility checks pass
- The output is usable with keyboard only and works with assistive tech
