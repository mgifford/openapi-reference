# CSV Dataset Explorer

A lightweight, accessible CSV data explorer for government health datasets. **Hybrid architecture:** Vanilla JS browser app with optional Node.js proxy server that solves CORS restrictions and extracts metadata from healthcare.gov, CDC, and other data portals.

- 🖥️ **Browser app** - Works standalone or with server
- 🔗 **Proxy server** - Handles CORS, no data storage (stateless)
- 🏥 **Healthcare.gov** - One-click integration via bookmarklet
- ♿ **Accessible** - Keyboard-only, ARIA labels, screen readers
- 📦 **Zero production dependencies** - Vanilla JS only
- 🔬 **DKAN Companion** - Dedicated dataset explainer for CMS open data

## DKAN Open Data Companion

A proof-of-concept companion tool for CMS DKAN datasets is included at
[`dkan-companion.html`](./dkan-companion.html).

It is a **read-only, client-side dataset explainer and query helper** that:
- Ingests DKAN dataset metadata via the CKAN-compatible API
- Generates inferred field dictionaries and data quality profiles
- Provides DKAN-aware query templates (respects DKAN's SQL limitations)
- Surfaces evidence-triggered review questions
- Exports artifacts for CMS workflows (JSON, Markdown)
- Optionally uses Chrome Built-in AI for plain-language summaries (local, on-device)

> **It does not modify DKAN or draw policy conclusions.**
> See [DKAN_COMPANION.md](./DKAN_COMPANION.md) for full documentation.

## ✨ Features

**Data Dictionary & Analysis**
- 📊 **Auto-detect schema** - Infers field types from sample data
- 📋 **Validation rules** - Auto-generated constraints (min/max, patterns, required)
- 🔍 **Field search** - Filter & inspect columns instantly
- 📊 **Sample values** - View representative data per field

**Export & Integration**
- 📤 **Export** - Schema as JSON, CSV headers, or field manifest
- 🤖 **AI prompts** - Copy ready-to-use prompts for LLM analysis
- 🔖 **Bookmarklet** - One-click data access from any portal
- 💾 **Local caching** - IndexedDB stores datasets (no server storage)

**Healthcare.gov & Government Portals**
- 🏥 **Healthcare.gov** - Direct dataset integration via optional proxy
- 🏛️ **DKAN portals** - Auto-detect and extract CSVs
- 📊 **Socrata portals** - Works with CDC, CMS, Healthdata.gov
- 🔐 **CORS proxy** - Optional server solves cross-origin restrictions

**Accessibility**
- ♿ **Keyboard-only** - Fully navigable without mouse
- 🏷️ **ARIA labels** - Screen reader compatible
- 📱 **Responsive** - Works mobile to desktop
- 🎨 **High contrast** - WCAG AA compliant styling

## 🚀 Quick Start

### Install & Run

```bash
npm install
npm run server
```

Opens: **http://localhost:3000/demo/**

### Try It

1. Paste a CSV URL or healthcare.gov dataset link
2. Click "Load and cache locally"
3. Browse the auto-generated data dictionary

### Bookmarklet Setup

```javascript
// In browser console (F12):
generateBookmarklet()

// Copy the output code
// Create bookmark with code as URL
// Use on any data portal!
```

## 📋 Use Cases

### Load a Public CSV

```
URL: https://example.com/data.csv
→ Click "Load and cache locally"
→ Browse schema and examples
```

### Explore Healthcare.gov Dataset

```
1. Visit: https://data.healthcare.gov/dataset/5k5i-wzex
2. Click "CSV Explorer" bookmark
3. Explorer opens with data loaded instantly
```

### Use in Workflow

```
1. Bookmark the explorer
2. Visit data.healthcare.gov
3. One click on bookmark
4. Data loads, cached locally
5. Reference schema later by clicking sidebar
```

## 🏗️ How It Works

### Architecture

```
Browser                          Node.js Server
├─ CSV Explorer App             ├─ Express.js
├─ IndexedDB Cache              ├─ CSV Proxy
├─ Bookmarklet                  ├─ Healthcare.gov extractor
└─ Vanilla JavaScript           └─ Socrata API gateway
      ↓ CORS requests ↓
      Solves CORS restrictions, proxies healthcare.gov
```

### Data Flow

```
User clicks bookmark on healthcare.gov
        ↓
Bookmarklet extracts dataset ID
        ↓
App opens with ?dataset=ID&domain=healthcare.gov
        ↓
Server fetches CSV via proxy
        ↓
Browser parses CSV, infers schema
        ↓
Data cached in IndexedDB (local only)
        ↓
User browses, searches, exports (all local)
```

## 📖 Documentation

- **[HEALTHCARE_INTEGRATION.md](HEALTHCARE_INTEGRATION.md)** - healthcare.gov setup, testing, troubleshooting
- **[SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md)** - Production deployment, approval process
- **[BOOKMARKLET.md](BOOKMARKLET.md)** - Bookmarklet installation and usage
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Technical architecture details

## 🔧 API Endpoints

### Proxy CSV (any domain)

```bash
POST /api/proxy/csv
Content-Type: application/json

{
  "url": "https://data.healthcare.gov/sites/default/files/.../data.csv"
}

Response: CSV file (text/csv)
```

### Healthcare.gov Metadata

```bash
GET /api/healthcare/dataset/:id

# Example:
GET /api/healthcare/dataset/5k5i-wzex

Response: {
  "id": "5k5i-wzex",
  "csvUrls": ["https://..."],
  "title": "Dataset Name"
}
```

### Socrata API (generic)

```bash
GET /api/socrata?domain=data.healthcare.gov&id=5k5i-wzex

Response: Socrata package metadata
```

## 🧪 Testing

### Run Test Suite

```bash
npm test
```

### Test Healthcare.gov Integration

```bash
# Test proxy
curl -X POST http://localhost:3000/api/proxy/csv \
  -H "Content-Type: application/json" \
  -d '{"url":"https://data.healthcare.gov/sites/default/files/uploaded_resources/AB_Termination_List_823.csv"}'

# Test metadata extraction
curl http://localhost:3000/api/healthcare/dataset/5k5i-wzex
```

### Manual Testing

1. Start server: `npm run server`
2. Open http://localhost:3000/demo/
3. Test with real healthcare.gov URLs
4. Try bookmarklet on https://data.healthcare.gov/datasets

## 🌐 Browser Support

✅ Chrome/Chromium 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  

Requires: IndexedDB, Fetch API, ES6 modules

## 📁 File Structure

```
src/
├── index.js                 # App, healthcare.gov support
├── bookmarklet.js           # Bookmarklet code
├── csv/
│   ├── parse.js            # CSV parsing
│   └── infer.js            # Schema inference
├── data/
│   ├── db.js               # IndexedDB operations
│   └── importCsv.js        # Fetch + proxy support
└── render/
    ├── components.js       # DOM utilities
    └── csvReference.js     # Data dictionary UI

demo/
├── index.html              # Entry point
└── style.css               # Styling (350+ lines)

server.js                    # Express proxy server
package.json               # Dependencies
```

## 🔐 Security

✅ **No data storage** - Server is stateless  
✅ **Whitelisted domains** - Only healthcare.gov, CDC, etc.  
✅ **Client-side caching** - Data stays in browser  
✅ **HTTPS in production** - Recommended  
✅ **No authentication required** - Works with public datasets  

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for production security details.

## 🚢 Deployment

### Local Development

```bash
npm run server
# http://localhost:3000
```

### Production

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for:
- Heroku, AWS, Azure, Google Cloud
- Docker containerization
- Environment setup
- Approval process documentation

### Healthcare.gov

See [HEALTHCARE_INTEGRATION.md](HEALTHCARE_INTEGRATION.md) for:
- Testing with real datasets
- Bookmarklet deployment
- Integration checklist

## 🎯 Next Steps

1. **Try locally:** `npm run server`
2. **Test bookmarklet:** Follow BOOKMARKLET.md
3. **Test healthcare.gov:** Follow HEALTHCARE_INTEGRATION.md
4. **Deploy:** Follow SERVER_DEPLOYMENT.md

## 📝 License

MIT

## 🤝 Contributing

Improvements welcome! Test against multiple healthcare.gov datasets before submitting.

## ❓ Troubleshooting

### Server won't start
```bash
npm install
npm run server
```

### CSV not loading
Check browser console for error. Common causes:
- URL is incorrect
- Domain not whitelisted (edit `server.js`)
- CSV requires authentication

### Bookmarklet not working
- Ensure server is running
- Check `PROXY_URL` in bookmarklet code
- See HEALTHCARE_INTEGRATION.md for healthcare.gov specifics

### Healthcare.gov datasets not detected
Run diagnostic:
```bash
curl http://localhost:3000/api/healthcare/dataset/5k5i-wzex
```

See detailed troubleshooting in [HEALTHCARE_INTEGRATION.md](HEALTHCARE_INTEGRATION.md)
