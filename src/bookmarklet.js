/**
 * CSV Dataset Explorer Bookmarklet
 * 
 * Detects CSV download links on any page and opens the explorer.
 * For healthcare.gov pages, extracts dataset ID and fetches metadata.
 * To install: Drag this to your bookmarks bar, or copy the bookmarklet() function as a javascript: URL
 */

(function bookmarklet() {
  // Find the app domain (production or development)
  const appDomain = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-app-domain.com'; // Update this for production
  
  const explorerUrl = appDomain + '/demo/';

  /**
   * Check if we're on a healthcare.gov dataset page
   * Returns dataset ID if found
   */
  function getHealthcareDatasetId() {
    const pathMatch = window.location.pathname.match(/\/dataset\/([a-z0-9-]+)/);
    if (pathMatch && window.location.hostname.includes('healthcare.gov')) {
      return pathMatch[1];
    }
    return null;
  }

  /**
   * Detect CSV URLs on the page
   */
  function findCsvUrls() {
    const urls = new Set();
    
    // Check all links
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.href;
      if (href && (href.endsWith('.csv') || href.includes('.csv?'))) {
        urls.add(href);
      }
    });
    
    // Check buttons and data attributes
    document.querySelectorAll('[data-csv-url], [data-download]').forEach(el => {
      const url = el.dataset.csvUrl || el.dataset.download;
      if (url && (url.endsWith('.csv') || url.includes('.csv?'))) {
        urls.add(url);
      }
    });

    // Check for common data portal patterns
    const datasetElement = document.querySelector(
      '[data-dataset-download-url], [data-download-url], .download-csv'
    );
    if (datasetElement) {
      const url = datasetElement.href || datasetElement.dataset.downloadUrl || datasetElement.dataset.datasetDownloadUrl;
      if (url && (url.endsWith('.csv') || url.includes('.csv?'))) {
        urls.add(url);
      }
    }

    return Array.from(urls);
  }

  // Check if on healthcare.gov dataset page
  const datasetId = getHealthcareDatasetId();
  if (datasetId) {
    // Open explorer with healthcare.gov dataset ID
    const params = new URLSearchParams({
      dataset: datasetId,
      domain: 'healthcare.gov'
    });
    window.open(`${explorerUrl}?${params.toString()}`, 'csv_explorer');
    return;
  }

  const csvUrls = findCsvUrls();

  if (csvUrls.length === 0) {
    // Fallback: prompt for URL
    const url = prompt('Enter CSV URL:');
    if (url) {
      window.open(`${explorerUrl}?url=${encodeURIComponent(url)}`, 'csv_explorer');
    } else {
      alert('No CSV URLs found on this page. Please enter a URL or visit a data portal.');
    }
  } else if (csvUrls.length === 1) {
    // Single URL found - open directly
    const url = csvUrls[0];
    window.open(`${explorerUrl}?url=${encodeURIComponent(url)}`, 'csv_explorer');
  } else {
    // Multiple URLs found - show selection dialog
    const selection = prompt(
      'Multiple CSV downloads found. Choose one:\n\n' +
      csvUrls.map((url, i) => `${i + 1}. ${url.split('/').pop()}`).join('\n') +
      '\n\nEnter number (1-' + csvUrls.length + ') or paste a custom URL:',
      '1'
    );

    if (selection) {
      const index = parseInt(selection) - 1;
      const url = csvUrls[index] || selection;
      if (url) {
        window.open(`${explorerUrl}?url=${encodeURIComponent(url)}`, 'csv_explorer');
      }
    }
  }
})();
