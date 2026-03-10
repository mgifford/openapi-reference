# CMS DKAN Open Data Companion

A read-only, client-side dataset explainer and query helper built on top of
[openapi-reference](./README.md). It augments DKAN — it does not replace it.

---

## What This Tool Is

The CMS DKAN Open Data Companion is a **proof of concept** that demonstrates
how CMS datasets can be understood, queried, and reused more effectively
*without* modifying DKAN, changing governance, or introducing vendor lock-in.

It is:

- A **dataset explainer** — plain-language summaries of structure and content
- A **query helper** — transparent, reproducible query templates
- A **decision-surfacing aid** — evidence-triggered questions for review meetings

It is **not**:

- A new data portal
- An analytics or BI platform
- An AI decision system
- A replacement for DKAN
- An automated policy interpreter

---

## What Is DKAN?

[DKAN](https://dkan.readthedocs.io/) is an open-source data portal platform
built on Drupal and CKAN. CMS's [data.healthcare.gov](https://data.healthcare.gov/)
runs on DKAN. It exposes a CKAN-compatible API at `/api/3/action/` and a
custom SQL API at `/api/1/datastore/sql`.

---

## Why It Is Safe for CMS

| Constraint | How this tool satisfies it |
|------------|---------------------------|
| **Read-only** | No write requests are ever made. All fetches are GET or CSV downloads. |
| **Client-side** | All analysis (schema inference, profiling, question generation) runs in the browser. |
| **No data exfiltration** | Data is fetched from existing DKAN endpoints and cached locally in IndexedDB. It never leaves your browser. |
| **Optional AI only** | AI features use Chrome Built-in AI (local, on-device) or copyable prompts. No data is sent to external AI services. |
| **Explainability over automation** | The tool describes data; it does not draw conclusions or interpret policy. |
| **No authentication** | No credentials, no cookies, no sessions. |
| **Stateless server** | The optional proxy server stores no data. It only forwards public CSV requests. |

---

## How It Complements DKAN

DKAN is the authoritative data portal. This companion is a lightweight viewer:

```
DKAN (source of truth)
  └─► DKAN Companion (read-only viewer + explainer)
        ├─ Ingests metadata via DKAN API
        ├─ Fetches CSV for local analysis
        ├─ Generates field dictionary and quality profile
        ├─ Produces query templates (links back to DKAN)
        └─ Exports artifacts for CMS workflows
```

No changes to DKAN are required.

---

## Privacy and Data Handling

- **No server storage.** The optional proxy server logs nothing and stores nothing.
- **Local caching only.** Dataset rows are cached in your browser's IndexedDB
  and are never transmitted to this application's server.
- **Public datasets only.** The tool works with publicly accessible URLs. It
  does not support authenticated endpoints.
- **PII detection is advisory only.** Pattern-based hints flag fields that
  *may* contain sensitive data. The tool never labels anything definitively as PII.
- **AI is optional and local.** Chrome Built-in AI runs on-device. Prompts are
  copyable plain text — you choose if, when, and where to use them.

---

## Feature Overview

### 1. DKAN Dataset Ingestion (`src/dkan/ingest.js`)

- Detects dataset IDs and CSV URLs from any DKAN-compatible URL
- Fetches metadata via `GET /api/3/action/package_show`
- Falls back to lightweight HTML parsing when the API is unavailable
- Returns title, description, publisher, license, update frequency, and resource list

### 2. Dataset Explainer (`src/ui/explainer.js`)

- **Overview**: Title, description, publisher, license, row/field counts
- **Field dictionary**: Name, inferred type, inferred role, % missing, examples
- **Data quality profile**: Sparsest fields, candidate keys, PII risk hints

All inferences are explicitly labeled as _inferred_.

### 3. Data Quality Profile (`src/data/profile.js`)

Computed client-side:

- Row count and field count
- Missing data summary (top 5 sparsest fields)
- Candidate primary keys (high uniqueness, low nulls)
- Likely join keys (identifiers, geographic codes)
- Basic PII risk indicators (pattern-based, warnings only)

### 4. DKAN-Aware Query Templates (`src/queries/templates.js`)

Generates transparent, reproducible API URLs that respect DKAN's constraints:

- ✅ SELECT \*, WHERE, LIMIT, OFFSET, ORDER BY
- ❌ No COUNT, GROUP BY, DISTINCT (not supported by DKAN)
- ❌ No field names with spaces in WHERE/ORDER BY (causes DKAN errors)

Templates include: latest records, filter by field, sort, missing values,
pagination, records per year (client-side only).

### 5. "Explain This Dataset" (`src/ui/explainer.js`)

Generates a plain-language explanation derived only from metadata and schema.
Uses Chrome Built-in AI if available, or a copyable prompt for any external AI tool.

### 6. "Questions This Dataset Raises" (`src/ui/questions.js`)

Evidence-triggered review questions — no answers, no conclusions.
Questions cover: data grain, temporal coverage, geographic scope, identifiers,
missing data, and cumulative vs. point-in-time.

### 7. Optional AI Assistance (`src/ai/prompts/dataset.js`)

- Three copyable prompt templates: explain dataset, generate questions, field dictionary
- Chrome Built-in AI integration (on-device, no external calls)
- Graceful degradation when AI is unavailable
- AI outputs are labeled and advisory only

### 8. Export Artifacts (`src/export/index.js`)

All exports are labeled: _"Derived from CMS open data. Interpretations are assistive only."_

| Artifact | Format | Use |
|----------|--------|-----|
| Data Dictionary | JSON | Machine-readable, for tools |
| Data Dictionary | Markdown | Documentation, review |
| Dataset Briefing | Markdown | Non-technical summary |
| Query Catalog | JSON | Reusable query templates |
| Question List | Markdown | Review meetings |

---

## Code Structure

```
src/
├── dkan/
│   └── ingest.js          Dataset and resource detection
├── data/
│   ├── importCsv.js       CSV import and proxy support (existing)
│   ├── db.js              IndexedDB caching (existing)
│   └── profile.js         Schema inference and statistics
├── queries/
│   └── templates.js       DKAN-aware query builders
├── ui/
│   ├── explainer.js       Dataset explanation views
│   └── questions.js       Question-based review
├── ai/
│   └── prompts/
│       └── dataset.js     Optional AI prompt builders
└── export/
    └── index.js           Artifact generation
```

---

## Deployment

### GitHub Pages (Static)

The companion page (`dkan-companion.html`) works without a server for
CORS-enabled datasets. Deploy alongside the existing static site.

### Local Development

```bash
npm install
npm run server
# Open: http://localhost:3000/dkan-companion
```

The proxy server is only needed for CORS-restricted datasets.

---

## Acceptance Criteria

- [x] A CMS dataset can be loaded without modifying DKAN
- [x] Non-technical users can understand what the dataset is, what fields mean, and how to query it
- [x] No policy conclusions are drawn
- [x] AI outputs are optional, labeled, and conservative
- [x] The tool can be deployed as a static companion
- [x] All tests pass

---

## Explicit Non-Goals

This tool intentionally does **not**:

- Rank states, providers, or outcomes
- Benchmark performance
- Make automated compliance claims
- Modify data
- Score "insights"
- Run black-box analysis

---

_This tool is a quiet, careful amplifier of CMS open data — not a disruptor._
