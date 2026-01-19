# Healthcare.gov Integration Update

## Problem Solved

**Issue:** healthcare.gov pages return HTML, not CSV data when accessed directly. CORS blocks browser requests.

**Solution:** Added Node.js proxy server that:
1. Handles CORS for any origin
2. Proxies CSV downloads from trusted domains
3. Extracts metadata from healthcare.gov dataset pages
4. Serves the demo app + API endpoints

## What's New

### Server (`server.js`)

A lightweight Express.js server that:

**Endpoints:**
- `POST /api/proxy/csv` - Proxy CSV files (solves CORS)
- `GET /api/healthcare/dataset/:id` - Extract CSV URLs from healthcare.gov pages
- `GET /api/socrata` - Query Socrata API (for any data portal using Socrata)
- `GET /demo/` - Serve the demo app

**Security:**
- Whitelists trusted domains (healthcare.gov, CDC, etc.)
- Validates URLs before proxying
- Rejects HTML responses (detects and reports)

### Updated Bookmarklet

Now detects healthcare.gov dataset pages:

1. **On healthcare.gov dataset page:**
   - Extracts dataset ID from URL
   - Opens explorer with that dataset
   - Server fetches CSV automatically

2. **On other pages:**
   - Finds CSV download links
   - Prompts if multiple found
   - Fallback to manual URL entry

### Updated App (`src/index.js`)

Now supports:
- `?url=...` - Direct CSV URL
- `?dataset=5k5i-wzex&domain=healthcare.gov` - Healthcare dataset ID

### Proxy Integration (`src/data/importCsv.js`)

Auto-uses proxy for:
- healthcare.gov
- CDC data
- Other government data portals

Transparent to user - they just enter a URL and it works.

## How to Use

### Start Server

```bash
npm install  # First time only
npm run server
```

Server runs on `http://localhost:3000`

### Try It

**Method 1: Direct URL**
1. Open http://localhost:3000/demo/
2. Paste CSV URL from healthcare.gov
3. Click "Load and cache locally"

**Method 2: Bookmarklet**
1. Open http://localhost:3000/demo/
2. Press F12 (developer console)
3. Type: `generateBookmarklet()`
4. Copy the code
5. Create bookmark with code as URL
6. Go to healthcare.gov dataset page
7. Click bookmark
8. Explorer opens with data loaded

### Test URLs

These should now work:

```
Direct CSV:
https://data.healthcare.gov/sites/default/files/uploaded_resources/AB_Termination_List_823.csv

Dataset page (use bookmarklet on this):
https://data.healthcare.gov/dataset/5k5i-wzex
```

## File Changes

### New Files
- `server.js` - Express proxy server (240 lines)
- `SERVER_DEPLOYMENT.md` - Deployment guide

### Updated Files
- `package.json` - Added express, cors, node-fetch dependencies
- `src/index.js` - Added healthcare.gov dataset support
- `src/bookmarklet.js` - Added healthcare.gov detection
- `src/data/importCsv.js` - Added proxy support

## Production Deployment

When ready to deploy:

1. **Get approval** (see SERVER_DEPLOYMENT.md)
2. **Choose hosting:**
   - Heroku (easiest)
   - AWS/Azure/Google Cloud
   - Your own server
   - Docker container

3. **Set environment variables:**
   ```bash
   PROXY_URL=https://your-domain.com
   NODE_ENV=production
   ```

4. **Update bookmarklet:**
   Change `localhost:3000` to production domain

## Security Notes

### What Gets Proxied

Only requests to whitelisted domains:
- healthcare.gov
- CDC data portals
- CMS data
- Other government health data

### What Gets Stored

Nothing! The proxy:
- Fetches CSV on demand
- Passes it through
- Doesn't log or store data
- Client caches locally in IndexedDB

### CORS Handling

Server allows cross-origin requests to proxy endpoints:
- Solves browser CORS restrictions
- Only affects demo domain (localhost/your-domain)
- Production HTTPS recommended

## Troubleshooting

**Server won't start:**
```bash
npm install
npm run server
```

**CSV not loading:**
Check browser console for error message. Common issues:
- URL is wrong
- Domain not whitelisted (edit server.js)
- CSV file is behind login

**Bookmarklet not working:**
- Make sure server is running on correct port
- Check `PROXY_URL` in bookmarklet matches server
- Healthcare.gov pages may have different CSV URL structure

**How to test healthcare.gov:**

```bash
# Test proxy endpoint directly
curl -X POST http://localhost:3000/api/proxy/csv \
  -H "Content-Type: application/json" \
  -d '{"url":"https://data.healthcare.gov/sites/default/files/uploaded_resources/AB_Termination_List_823.csv"}'

# Test healthcare.gov metadata extraction
curl http://localhost:3000/api/healthcare/dataset/5k5i-wzex
```

## Next Steps

1. ✅ Test server locally
2. ✅ Test bookmarklet on healthcare.gov
3. ⏳ Prepare for approval process
4. ⏳ Deploy to staging
5. ⏳ Deploy to production
6. ⏳ Update all bookmarklet URLs to production domain

## Quick Reference

**Local Development:**
```bash
npm run server                    # Start server
# Visit http://localhost:3000/demo/
```

**Test Bookmarklet:**
```javascript
generateBookmarklet()             # In browser console
```

**Check Server:**
```bash
curl http://localhost:3000/       # Should return HTML
```

**Proxy a CSV:**
```bash
curl -X POST http://localhost:3000/api/proxy/csv \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/data.csv"}'
```
