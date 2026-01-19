import { el, text, button } from "./components.js";

function renderSchemaTable(schema) {
  return el("table", { class: "data-dictionary" }, [
    el("caption", {}, [text("Data Dictionary (inferred)")]),
    el("thead", {}, [
      el("tr", {}, [
        el("th", { scope: "col" }, [text("Field")]),
        el("th", { scope: "col" }, [text("Type")]),
        el("th", { scope: "col" }, [text("Examples")])
      ])
    ]),
    el("tbody", {}, schema.map(col =>
      el("tr", {}, [
        el("td", {}, [text(col.name)]),
        el("td", {}, [text(col.type)]),
        el("td", {}, [text((col.examples || []).join(", "))])
      ])
    ))
  ]);
}

function renderFieldSearch(schema) {
  const searchContainer = el("div", { style: "margin-bottom: 1.5rem;" }, [
    el("input", {
      type: "text",
      id: "fieldSearch",
      placeholder: "Search fields...",
      style: "width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
    })
  ]);

  const searchInput = searchContainer.querySelector("#fieldSearch");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(".data-dictionary tbody tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });
  });

  return searchContainer;
}

function renderSampleQueries(schema) {
  const fieldNames = schema.map(c => c.name);
  const queries = [
    `Count records by ${fieldNames[0] || "field"}`,
    `Filter by ${fieldNames[1] || "field"} = specific value`,
    `Find null/empty values in any field`,
    `Group by ${fieldNames[2] || "field"} and count`,
    `Export subset of fields`
  ];

  return el("section", {}, [
    el("h2", {}, [text("Sample Queries")]),
    el("p", {}, [text("Common questions you could answer with this data:")]),
    el("ul", {}, queries.map(q => el("li", {}, [text(q)])))
  ]);
}

function renderExportOptions(meta, url) {
  return el("section", {}, [
    el("h2", {}, [text("Export Options")]),
    el("div", { style: "display: flex; gap: 0.5rem; flex-wrap: wrap;" }, [
      button("Download as JSON", async () => {
        const json = JSON.stringify({
          source: url,
          schema: meta.schema,
          metadata: {
            rowCount: meta.rowCount,
            fetchedAt: meta.fetchedAt
          }
        }, null, 2);
        await navigator.clipboard.writeText(json);
        alert("Schema JSON copied to clipboard");
      }),
      button("Download as CSV Headers", async () => {
        const headers = meta.schema.map(s => s.name).join(",");
        await navigator.clipboard.writeText(headers);
        alert("CSV headers copied to clipboard");
      })
    ])
  ]);
}

function renderDataValidationRules(schema) {
  const rules = schema.map(col => {
    let rule = `${col.name} (${col.type})`;
    if (col.type === "number") rule += " - must be numeric";
    if (col.type === "string" && col.name.includes("Date")) rule += " - should be a valid date";
    return rule;
  });

  return el("section", {}, [
    el("h2", {}, [text("Data Validation Rules")]),
    el("ul", {}, rules.map(r => el("li", {}, [text(r)])))
  ]);
}

function renderSqlQueryExamples(url, meta) {
  // Extract dataset UUID from healthcare.gov CSV URL if possible
  // Format: https://data.healthcare.gov/api/views/{id}/rows.csv?accessType=DOWNLOAD
  const match = url.match(/\/views\/([^\/]+)\/rows\.csv/);
  const datasetId = match ? match[1] : "DATASET_UUID";
  
  const fieldNames = meta.schema.slice(0, 3).map(c => c.name);
  
  // Provide simple query examples using local filtering and curl for downloads
  const examples = [
    {
      title: "Filter by a specific field (local filtering)",
      description: `Search in the loaded dataset for records where ${fieldNames[0] || "field_name"} matches your criteria using the Field Search tool above.`,
      code: `Open the Field Search tool above and search within the ${fieldNames[0] || "field"} column.`
    },
    {
      title: "Download full dataset for analysis",
      description: "Export all records as JSON or CSV for further analysis in Excel, Python, R, or other tools.",
      code: `Click "Export Records" below to save the full dataset locally.`
    },
    {
      title: "Paginate through large datasets",
      description: "This tool automatically caches data locally. Scroll down to load more rows as needed.",
      code: `The Data Dictionary shows total row count (cached). Scroll to view additional records.`
    }
  ];

  return el("section", {}, [
    el("h2", {}, [text("Query & Filter Examples")]),
    el("p", {}, [text("This tool provides client-side filtering and export for working with healthcare.gov datasets. For advanced analysis, export the data and use tools like Excel, curl, or Python.")]),
    ...examples.map(ex => 
      el("div", { class: "prompt-block" }, [
        el("h3", {}, [text(ex.title)]),
        el("p", {}, [text(ex.description)]),
        el("p", {}, [
          el("strong", {}, [text("How:")]), 
          text(" "),
          el("code", {}, [text(ex.code)])
        ])
      ])
    ),
    el("p", {}, [
      text("For REST API access to healthcare.gov datasets, see the "),
      el("a", { 
        href: "https://data.healthcare.gov/api",
        target: "_blank",
        rel: "noopener noreferrer"
      }, [text("DKAN API documentation")]),
      text(".")
    ])
  ]);
}

export function renderCsvReference({ root, url, meta, datasetTitle }) {
  root.innerHTML = "";

  root.appendChild(el("h1", {}, [text("Dataset Explorer")]));

  // Show dataset title if provided (from healthcare.gov API)
  if (datasetTitle) {
    root.appendChild(el("section", { class: "summary" }, [
      el("h2", {}, [text("Dataset")]),
      el("h3", {}, [text(datasetTitle)])
    ]));
  }

  root.appendChild(el("section", { class: "summary" }, [
    el("h2", {}, [text("Source")]),
    el("p", {}, [text(url)]),
    el("ul", {}, [
      el("li", {}, [text(`Rows cached: ${meta.rowCount}`)]),
      el("li", {}, [text(`Last fetched: ${new Date(meta.fetchedAt).toLocaleString()}`)]),
      meta.etag ? el("li", {}, [text(`ETag: ${meta.etag}`)]) : null,
      meta.lastModified ? el("li", {}, [text(`Last-Modified: ${meta.lastModified}`)]) : null
    ].filter(Boolean))
  ]));

  root.appendChild(el("section", {}, [
    el("h2", {}, [text("Data Dictionary")]),
    el("p", {}, [text("Generated from the CSV header and sample values. For authoritative definitions, link to the dataset’s official documentation when available.")]),
    renderFieldSearch(meta.schema),
    renderSchemaTable(meta.schema)
  ]));

  root.appendChild(renderSampleQueries(meta.schema));
  root.appendChild(renderSqlQueryExamples(url, meta));
  root.appendChild(renderDataValidationRules(meta.schema));
  root.appendChild(renderExportOptions(meta, url));

  const promptText =
`You are helping a non-technical reader understand a public healthcare dataset.

Dataset source CSV:
${url}

Data dictionary (field meanings and example values):
${meta.schema.map(c => `- ${c.name} (${c.type}): examples: ${c.examples.join("; ")}`).join("\n")}

Task:
1) Explain what this dataset appears to cover in plain language.
2) Identify 5 fields that matter most to ordinary people and explain each.
3) List 3 questions a resident could answer with this dataset.
4) Warn about limitations or ambiguity you can infer from the fields and examples.
Do not invent facts not supported by the fields or examples.`;

  const promptSection = el("section", {}, [
    el("h2", {}, [text("Copyable prompt templates")]),
    el("p", {}, [text("Plain text prompts users can paste into any AI tool. This site does not embed or call AI.")]),
    el("div", { class: "prompt-block" }, [
      el("h3", {}, [text("Explain this dataset")]),
      el("pre", {}, [text(promptText)]),
      button("Copy prompt", async () => {
        await navigator.clipboard.writeText(promptText);
        alert("Prompt copied to clipboard");
      })
    ])
  ]);

  root.appendChild(promptSection);
}
