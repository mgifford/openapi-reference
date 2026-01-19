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
  
  // Build SQL API query examples with proper URL encoding
  // Key: Spaces=%20, Asterisk=%2A, Brackets=%5B%5D, show_db_columns=true (not empty)
  const queries = [
    {
      title: "Retrieve first 2 rows",
      curl: `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20%2A%20FROM%20${datasetId}%5D%5BLIMIT%202%5D&show_db_columns=true' -H 'accept: application/json'`
    },
    {
      title: "Select specific columns",
      curl: fieldNames.length >= 2
        ? `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20${fieldNames.slice(0, 2).map(f => f.replace(/ /g, '%20')).join('%2C%20')}%20FROM%20${datasetId}%5D%5BLIMIT%202%5D&show_db_columns=true' -H 'accept: application/json'`
        : `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20field_name%20FROM%20${datasetId}%5D%5BLIMIT%202%5D&show_db_columns=true' -H 'accept: application/json'`
    },
    {
      title: "Pagination (rows 500-502)",
      curl: `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20%2A%20FROM%20${datasetId}%5D%5BLIMIT%202%20OFFSET%20500%5D&show_db_columns=true' -H 'accept: application/json'`
    },
    {
      title: "Sort by a field (ascending)",
      curl: fieldNames.length >= 1
        ? `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20%2A%20FROM%20${datasetId}%5D%5BORDER%20BY%20${fieldNames[0].replace(/ /g, '%20')}%20ASC%5D%5BLIMIT%2010%5D&show_db_columns=true' -H 'accept: application/json'`
        : `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20%2A%20FROM%20${datasetId}%5D%5BORDER%20BY%20field_name%20ASC%5D%5BLIMIT%2010%5D&show_db_columns=true' -H 'accept: application/json'`
    },
    {
      title: "Count distinct values",
      curl: fieldNames.length >= 1
        ? `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20COUNT%28DISTINCT%20${fieldNames[0].replace(/ /g, '%20')}%29%20FROM%20${datasetId}%5D&show_db_columns=true' -H 'accept: application/json'`
        : `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20COUNT%28%2A%29%20FROM%20${datasetId}%5D&show_db_columns=true' -H 'accept: application/json'`
    },
    {
      title: "Group by and count",
      curl: fieldNames.length >= 1
        ? `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20${fieldNames[0].replace(/ /g, '%20')}%2C%20COUNT%28%2A%29%20FROM%20${datasetId}%5D%5BGROUP%20BY%20${fieldNames[0].replace(/ /g, '%20')}%5D%5BLIMIT%2010%5D&show_db_columns=true' -H 'accept: application/json'`
        : `curl -X GET 'https://data.healthcare.gov/api/1/datastore/sql?query=%5BSELECT%20field_name%2C%20COUNT%28%2A%29%20FROM%20${datasetId}%5D%5BGROUP%20BY%20field_name%5D%5BLIMIT%2010%5D&show_db_columns=true' -H 'accept: application/json'`
    }
  ];

  return el("section", {}, [
    el("h2", {}, [text("SQL Query Examples (DKAN API)")]),
    el("p", {}, [text("Healthcare.gov provides direct SQL API access. Copy these curl commands and paste them into your terminal, or paste the URL directly into your browser. Requires proper URL encoding (spaces=%20, asterisk=%2A, brackets=%5B%5D).")]),
    ...queries.map(q => 
      el("div", { class: "prompt-block" }, [
        el("h3", {}, [text(q.title)]),
        el("p", {}, [el("strong", {}, [text("curl command:")])]),
        el("pre", {}, [text(q.curl)]),
        button("Copy curl command", async () => {
          await navigator.clipboard.writeText(q.curl);
          alert("curl command copied to clipboard");
        })
      ])
    ),
    el("p", {}, [
      text("Visit the "),
      el("a", { 
        href: "https://data.healthcare.gov/api",
        target: "_blank",
        rel: "noopener noreferrer"
      }, [text("Healthcare.gov API documentation")]),
      text(" for more advanced query options.")
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

  const explainPrompt =
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

  const sqlQueryPrompt =
`You are helping someone write a DKAN datastore SQL query to analyze healthcare data.

Dataset UUID: [DATASET_UUID]
Available fields and types:
${meta.schema.map(c => `- ${c.name} (${c.type})`).join("\n")}

The user wants to: [USER_GOAL - replace with your analysis goal]

DKAN SQL Query Rules (IMPORTANT - these are strict):
1. Field names with spaces MUST be wrapped in double quotes, but DKAN often fails on complex queries with quoted names
2. Keep queries simple: SELECT, WHERE, LIMIT, ORDER BY, DISTINCT
3. Syntax: each clause goes in separate brackets like [SELECT ...][WHERE ...][LIMIT ...]
4. URL encoding: spaces=%20, asterisk=%2A, brackets=%5B%5D, quotes=%22, parentheses=%28%29, commas=%2C
5. Test with simple SELECT first, then add complexity

Example working query:
[SELECT * FROM [DATASET_UUID]][LIMIT 10]

If your generated query fails with "Invalid query string", try:
- Remove quoted field names (use unquoted if possible)
- Simplify the WHERE clause
- Remove aggregate functions (COUNT, GROUP BY)
- Use LIMIT to test before filtering

Provide:
1) The plain SQL query (with brackets) 
2) The URL-encoded curl command ready to copy-paste
3) An explanation of what the query does
4) If field names have spaces, note that DKAN may reject them - suggest manual filtering instead`;

  const promptSection = el("section", {}, [
    el("h2", {}, [text("Copyable prompt templates")]),
    el("p", {}, [text("Plain text prompts users can paste into any AI tool. This site does not embed or call AI.")]),
    el("div", { class: "prompt-block" }, [
      el("h3", {}, [text("Explain this dataset")]),
      el("pre", {}, [text(explainPrompt)]),
      button("Copy prompt", async () => {
        await navigator.clipboard.writeText(explainPrompt);
        alert("Prompt copied to clipboard");
      })
    ]),
    el("div", { class: "prompt-block" }, [
      el("h3", {}, [text("Generate SQL query with AI")]),
      el("p", {}, [text("Replace [USER_GOAL] with your analysis goal, then paste this prompt into any AI tool.")]),
      el("pre", {}, [text(sqlQueryPrompt)]),
      button("Copy prompt", async () => {
        await navigator.clipboard.writeText(sqlQueryPrompt);
        alert("Prompt copied to clipboard");
      })
    ])
  ]);

  root.appendChild(promptSection);
}


