import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

/**
 * Proxy endpoint for fetching CSV files
 * Usage: POST /api/proxy/csv with { url: "https://example.com/data.csv" }
 */
app.post('/api/proxy/csv', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if this looks like a healthcare.gov dataset page, not a CSV
    if (url.includes('data.healthcare.gov/dataset/')) {
      const match = url.match(/dataset\/([a-z0-9\-]+)/);
      if (match) {
        const datasetId = match[1];
        return res.status(400).json({ 
          error: 'This is a dataset page, not a CSV file.',
          hint: `Use /api/healthcare/dataset/${datasetId} to fetch metadata and find CSV URLs`,
          suggestedUrl: `/api/healthcare/dataset/${datasetId}`
        });
      }
    }

    // Validate URL is a CSV or data endpoint
    if (!isSafeUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL or domain not whitelisted' });
    }

    console.log(`[PROXY] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CSV-Explorer-Proxy/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Remote server returned ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        url: url
      });
    }

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    // Check if response is actually CSV, not HTML
    if (text.trim().startsWith('<')) {
      return res.status(400).json({ 
        error: 'Response is HTML, not CSV data',
        hint: 'The URL may be a dataset page (HTML) instead of a direct CSV file',
        contentType: contentType,
        firstChars: text.substring(0, 100)
      });
    }

    console.log(`[PROXY] Success: ${url.substring(0, 60)}... (${text.length} bytes)`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(text);
  } catch (err) {
    console.error('[PROXY] Error:', err.message);
    res.status(500).json({ 
      error: err.message,
      type: err.code || 'Unknown'
    });
  }
});

/**
 * Healthcare.gov specific endpoint
 * Fetches dataset metadata and extracts download URLs
 */
app.get('/api/healthcare/dataset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch dataset page
    const pageUrl = `https://data.healthcare.gov/dataset/${id}`;
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': 'CSV-Explorer/1.0' }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const html = await response.text();
    
    // Extract metadata and CSV URLs from the HTML
    const metadata = extractHealthcareMetadata(html, id);
    
    res.json(metadata);
  } catch (err) {
    console.error('Healthcare API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Socrata API endpoint (for other data portals)
 * Usage: GET /api/socrata?domain=data.healthcare.gov&id=5k5i-wzex
 */
app.get('/api/socrata', async (req, res) => {
  try {
    const { domain, id } = req.query;
    
    if (!domain || !id) {
      return res.status(400).json({ error: 'domain and id required' });
    }

    const apiUrl = `https://${domain}/api/3/action/package_show?id=${id}`;
    console.log(`Querying Socrata: ${apiUrl}`);

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error('Socrata error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Serve the static demo app
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/demo', express.static(path.join(__dirname, 'demo')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo', 'landing.html'));
});

/**
 * Utility: Check if URL is safe to fetch
 */
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    // Whitelist trusted domains
    const trustedDomains = [
      'data.healthcare.gov',
      'data.cdc.gov',
      'healthdata.gov',
      'cms.gov',
      'github.com',
      'raw.githubusercontent.com'
    ];
    
    return trustedDomains.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Extract metadata from healthcare.gov dataset page
 */
function extractHealthcareMetadata(html, id) {
  const metadata = {
    id,
    csvUrls: [],
    apiUrls: [],
    title: '',
    description: ''
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1];

  // Look for CSV download links in data attributes or script tags
  const csvRegex = /https:\/\/[^"'<>\s]+\.csv(?:\?[^"'<>\s]*)?/gi;
  const csvMatches = html.match(csvRegex);
  if (csvMatches) {
    metadata.csvUrls = [...new Set(csvMatches)]; // Deduplicate
  }

  // Look for API endpoints
  const apiRegex = /https:\/\/data\.healthcare\.gov\/api\/[^"'<>\s]+/gi;
  const apiMatches = html.match(apiRegex);
  if (apiMatches) {
    metadata.apiUrls = [...new Set(apiMatches)];
  }

  return metadata;
}

app.listen(PORT, () => {
  console.log(`✅ CSV Explorer Proxy Server running on port ${PORT}`);
  console.log(`📊 Demo: http://localhost:${PORT}/demo/`);
  console.log(`🔗 API: http://localhost:${PORT}/api/proxy/csv`);
});
