import { importCsvFromUrl, loadFromCache, getAllCachedDatasets } from "./data/importCsv.js";
import { el, text, button } from "./render/components.js";
import { renderCsvReference } from "./render/csvReference.js";

function renderCachedDatasets(cachedUrls, onLoadDataset) {
  if (cachedUrls.length === 0) {
    return el("div", {}, [text("")]);
  }

  return el("div", { class: "cached-datasets" }, 
    cachedUrls.slice(0, 10).map(url => 
      button(url.split('/').pop().substring(0, 40), () => onLoadDataset(url), { 
        class: "secondary-btn",
        title: url 
      })
    )
  );
}

async function fetchHealthcareDataset(datasetId) {
  try {
    // First, try using healthcare.gov's Socrata API directly (works for Socrata IDs like 5k5i-wzex)
    const apiUrl = `https://data.healthcare.gov/api/3/action/package_show?id=${datasetId}`;
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        
        // Extract CSV URLs from resources
        if (data.result && data.result.resources) {
          const csvResources = data.result.resources.filter(r => 
            r.url && (r.url.endsWith('.csv') || r.format?.toLowerCase() === 'csv')
          );
          
          if (csvResources.length > 0) {
            return {
              url: csvResources[0].url,
              title: data.result.title || data.result.name || 'Dataset',
              description: data.result.notes || ''
            };
          }
        }
      }
    } catch (apiError) {
      // API might not support this ID format, try HTML parsing for UUID format
      console.log('Socrata API call failed, trying HTML parsing for UUID format');
    }

    // Fallback: Parse the dataset page HTML for download links (works for UUID format)
    const pageUrl = `https://data.healthcare.gov/dataset/${datasetId}`;
    const pageResponse = await fetch(pageUrl);
    if (!pageResponse.ok) {
      throw new Error(`Dataset page returned ${pageResponse.status}`);
    }

    const html = await pageResponse.text();
    
    // Extract title from HTML
    let title = 'Dataset';
    const titleMatch = html.match(/<h1[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Look for CSV download links in the HTML
    const csvMatches = html.match(/href="([^"]*\.csv)"/gi);
    if (csvMatches && csvMatches.length > 0) {
      // Extract the first CSV URL
      const csvUrl = csvMatches[0].replace('href="', '').replace('"', '');
      // Make it absolute if needed
      const absoluteUrl = csvUrl.startsWith('http') ? csvUrl : `https://data.healthcare.gov${csvUrl}`;
      
      return {
        url: absoluteUrl,
        title: title,
        description: ''
      };
    }
    
    throw new Error('No CSV found in dataset page');
  } catch (err) {
    console.error('Failed to fetch healthcare.gov dataset:', err);
    throw err;
  }
}

export async function mountDatasetExplorer({ root, defaultCsvUrl = "" }) {
  const container = typeof root === "string" ? document.querySelector(root) : root;
  if (!container) throw new Error("Root container not found");

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramUrl = urlParams.get('url');
  const healthcareDatasetId = urlParams.get('dataset');
  const domain = urlParams.get('domain');

  let initialUrl = paramUrl || defaultCsvUrl;
  let isLoadingHealthcare = false;

  const sidebar = el("aside", {}, [
    el("h1", {}, [text("CSV Explorer")]),
    el("label", { for: "csvUrl" }, [text("CSV URL")]),
    el("input", {
      id: "csvUrl",
      name: "csvUrl",
      type: "url",
      required: "required",
      value: initialUrl,
    }),
    el("div", {}, [
      button("Load and cache locally", () => {}, { id: "loadBtn" })
    ]),
    el("p", { style: "font-size: 0.875rem; color: #666;" }, [text("Data is fetched client-side and cached locally in your browser (IndexedDB).")]),
    el("div", { role: "status", "aria-live": "polite", id: "status" }, []),
    el("h2", {}, [text("Cached Datasets")]),
    el("div", { id: "cachedList" }, [])
  ]);

  const contentArea = el("main", {}, []);
  const wrapper = el("div", { style: "display: flex; height: 100vh;" }, [sidebar, contentArea]);

  container.innerHTML = "";
  container.appendChild(wrapper);

  const status = sidebar.querySelector("#status");
  const cachedListContainer = sidebar.querySelector("#cachedList");
  const urlInput = sidebar.querySelector("#csvUrl");
  const loadBtn = sidebar.querySelector("#loadBtn");

  const setStatus = (msg, isError = false) => { 
    status.textContent = msg;
    status.className = isError ? 'error' : 'success';
  };

  const loadDataset = async (url, datasetTitle = null) => {
    urlInput.value = url;
    setStatus("Fetching and caching…");

    try {
      // Check if this is a healthcare.gov dataset page
      if (url.includes('data.healthcare.gov/dataset/')) {
        const match = url.match(/dataset\/([a-z0-9\-]+)/);
        if (match) {
          const datasetId = match[1];
          setStatus(`Detected healthcare.gov dataset. Fetching metadata…`);
          try {
            const metadata = await fetchHealthcareDataset(datasetId);
            url = metadata.url; // Use the CSV URL instead
            datasetTitle = metadata.title; // Capture the title
            setStatus(`Found CSV. Loading data…`);
          } catch (err) {
            throw new Error(`Could not extract CSV from dataset: ${err.message}`);
          }
        }
      }

      const result = await importCsvFromUrl(url, { chunkSize: 1000, force: true });
      setStatus(result.fromCache ? "Loaded from cache." : "Fetched and cached.");
      renderCsvReference({ root: contentArea, url, meta: result.meta, datasetTitle });
      updateCachedList();
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      
      // Parse detailed error responses from server
      if (err.message.includes('400') || err.message.includes('Bad Request')) {
        try {
          // Try to extract more details from the error
          if (err.detail) {
            errorMsg = `${err.detail.error}. ${err.detail.hint || ''}`;
          }
        } catch (e) {
          // Fall back to original message
        }
      }
      
      setStatus(`Failed: ${errorMsg}`, true);
    }
  };

  const updateCachedList = async () => {
    const cached = await getAllCachedDatasets();
    const cachedUrls = cached.map(d => d.url);
    cachedListContainer.innerHTML = "";
    cachedListContainer.appendChild(
      renderCachedDatasets(cachedUrls, loadDataset)
    );
  };

  loadBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    await loadDataset(url);
  });

  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loadBtn.click();
  });

  // Load healthcare.gov dataset if provided
  if (healthcareDatasetId && domain === 'healthcare.gov') {
    isLoadingHealthcare = true;
    setStatus("Loading healthcare.gov dataset...");
    try {
      const metadata = await fetchHealthcareDataset(healthcareDatasetId);
      await loadDataset(metadata.url, metadata.title);
    } catch (err) {
      setStatus(`Failed to load healthcare.gov dataset: ${err.message}`, true);
    }
  } else if (initialUrl) {
    // Load initial CSV URL
    const cached = await loadFromCache(initialUrl);
    if (cached?.meta) {
      setStatus("Loaded cached dataset. You can refresh by loading again.");
      renderCsvReference({ root: contentArea, url: initialUrl, meta: cached.meta });
    } else {
      await loadDataset(initialUrl);
    }
  }

  await updateCachedList();
}
