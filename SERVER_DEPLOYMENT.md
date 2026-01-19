# Server Deployment Guide

## Overview

The CSV Explorer now includes a Node.js proxy server that solves CORS issues and enables healthcare.gov integration.

## Why a Server?

- **CORS** - healthcare.gov blocks direct browser requests
- **Metadata extraction** - Server extracts CSV URLs from dataset pages
- **Data serving** - Serves the demo app + proxy endpoints
- **Demo-ready** - Works immediately on `localhost:3000`

## Quick Start

### Development

```bash
# Install dependencies (if not already done)
npm install

# Start server
npm run dev

# Visit http://localhost:3000/demo/
```

The server will:
- Serve the demo app on port 3000
- Proxy CSV requests via `/api/proxy/csv`
- Provide healthcare.gov metadata via `/api/healthcare/dataset/:id`
- Support Socrata API queries via `/api/socrata`

### Testing with Healthcare.gov

1. Open demo: http://localhost:3000/demo/
2. Try loading a healthcare.gov CSV:
   ```
   https://data.healthcare.gov/sites/default/files/uploaded_resources/AB_Termination_List_823.csv
   ```
3. Or use the bookmarklet:
   - Go to data.healthcare.gov dataset page
   - Click bookmarklet
   - Should open explorer with dataset loaded

## API Endpoints

### Proxy CSV Endpoint

```bash
POST /api/proxy/csv
Content-Type: application/json

{
  "url": "https://data.healthcare.gov/sites/default/files/...AB_Termination_List_823.csv"
}
```

Response: CSV content (text/csv)

### Healthcare.gov Metadata

```bash
GET /api/healthcare/dataset/:id

# Example:
GET /api/healthcare/dataset/5k5i-wzex
```

Response:
```json
{
  "id": "5k5i-wzex",
  "csvUrls": ["https://..."],
  "apiUrls": ["https://..."],
  "title": "Dataset Title",
  "description": "..."
}
```

### Socrata API (Generic)

```bash
GET /api/socrata?domain=data.healthcare.gov&id=5k5i-wzex
```

## Production Deployment

### Option 1: Heroku/Cloud Run

```bash
# Deploy to Heroku
heroku create csv-explorer
heroku config:set PROXY_URL=https://csv-explorer.herokuapp.com
git push heroku main
```

### Option 2: Your Own Server

```bash
# SSH into server
ssh user@your-server.com

# Clone repo
git clone https://github.com/yourusername/openapi-reference-csv.git
cd openapi-reference-csv

# Install
npm install

# Start with PM2 (production process manager)
npm install -g pm2
pm2 start server.js --name csv-explorer
pm2 startup
pm2 save
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
ENV PROXY_URL=http://localhost:3000
EXPOSE 3000
CMD ["npm", "run", "server"]
```

```bash
docker build -t csv-explorer .
docker run -p 3000:3000 csv-explorer
```

## Configuration

### Environment Variables

```bash
PORT=3000                          # Server port (default: 3000)
PROXY_URL=http://localhost:3000   # URL for bookmarklet proxy calls
NODE_ENV=production               # production or development
```

## Security Considerations

### CORS Whitelist

The server only proxies requests to trusted domains:
- `data.healthcare.gov`
- `data.cdc.gov`
- `healthdata.gov`
- `cms.gov`
- `github.com`
- `raw.githubusercontent.com`

To add more domains, edit `server.js`:

```javascript
const trustedDomains = [
  'data.healthcare.gov',
  'your-domain.com',  // Add here
  // ...
];
```

### Rate Limiting

For production, add rate limiting:

```bash
npm install express-rate-limit
```

Then in `server.js`:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Troubleshooting

### "Cannot find module 'express'"

```bash
npm install
```

### CORS still blocked

- Check `PROXY_URL` matches where server is running
- Verify domain is in whitelist in `server.js`
- Check browser console for specific error

### Healthcare.gov returns HTML instead of CSV

This means the bookmarklet detected the page URL but the actual CSV link extraction failed. The server will try to fetch and parse the page, but if the CSV URL structure changes, it may need updating.

To debug:

```bash
curl http://localhost:3000/api/healthcare/dataset/5k5i-wzex
```

Should return JSON with `csvUrls` array.

## Approval Process for Deployment

When ready to deploy to production servers, you'll need approval. Here's what to provide:

1. **Security Assessment**
   - Code review of proxy logic
   - Whitelisted domains list
   - Rate limiting configuration
   - Data handling practices

2. **Privacy Impact**
   - No data stored on server
   - No logs of user data
   - HTTPS-only in production
   - Proxy just passes through requests

3. **Compliance**
   - HIPAA considerations (if applicable)
   - Government data policies
   - Third-party API ToS compliance

4. **Deployment Plan**
   - Server location/provider
   - Monitoring/logging strategy
   - Rollback procedure
   - Support contacts

## Next Steps

1. Test locally on healthcare.gov
2. Prepare security documentation for approval
3. Set up staging environment
4. Deploy to production
5. Update bookmarklet URL in production
