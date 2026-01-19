# Bookmarklet Quick Start

## What It Does

The **CSV Dataset Explorer Bookmarklet** lets you explore any CSV dataset in one click from any website.

## Installation

### Method 1: Copy from Console (Easiest)

1. Open the demo at `http://localhost:8002/demo/`
2. Open your browser's developer console (F12 or Cmd+Option+I)
3. Type (or paste): `generateBookmarklet()`
4. Copy the output code

### Method 2: Manual Bookmark Creation

Create a new bookmark with this as the URL:

```javascript
javascript:(function(){const u=prompt('Enter CSV URL:');if(u)window.open('http://localhost:8002/demo/?url='+encodeURIComponent(u),'csv_explorer');})();
```

> Change `http://localhost:8002` to your production domain when ready

## How to Use

### On a Data Portal (e.g., data.healthcare.gov)

1. Navigate to a dataset page with CSV downloads
2. Click your "CSV Explorer" bookmark
3. **If it finds CSVs:**
   - Single CSV detected → Opens explorer instantly
   - Multiple CSVs found → Shows a selection prompt
4. **If no CSVs found:**
   - Prompts you to enter a custom URL
5. Explorer opens in new window with dataset loaded

### Anywhere Else

1. Click the bookmark
2. When prompted, paste a CSV URL
3. Explorer loads with that dataset

## What Gets Detected

The bookmarklet automatically finds CSV URLs from:

- **Links:** `<a href="...csv">Download</a>`
- **Data attributes:** Elements with `data-csv-url` or `data-download` attributes
- **Data portal patterns:** Standard government data portal markup

## Examples

### healthcare.gov Dataset

1. Visit: https://data.healthcare.gov/dataset/ab-termination-list
2. Click "CSV Explorer" bookmark
3. Detects the CSV URL automatically
4. Opens explorer with data loaded

### Custom CSV

1. Click bookmark
2. Enter: `https://example.com/my-data.csv`
3. Press Enter
4. Explorer loads your data

## Features Available After Loading

Once in the explorer:

- 🔍 **Field Search** - Type to filter columns
- 📋 **Data Dictionary** - Auto-generated schema with field types
- 📊 **Sample Queries** - Suggested analysis questions
- ✔️ **Validation Rules** - Auto-detected constraints
- 📤 **Export** - Get schema as JSON or CSV headers
- 🤖 **AI Prompts** - Copy pre-written prompts for LLMs

## Browser Support

Works in modern browsers:

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Troubleshooting

**Bookmark doesn't work?**
- Make sure JavaScript is enabled in your browser
- Try creating the bookmark in the "Unsorted" bookmarks folder
- Copy the entire `javascript:...` code, including `javascript:` at the start

**Opens blank page?**
- Check that the app is running (`python3 -m http.server 8002`)
- Verify the domain in the bookmarklet code matches your setup

**No CSVs detected?**
- The page may have CSVs in a format the bookmarklet doesn't recognize
- Use the fallback: enter the CSV URL manually when prompted

## For Developers

To customize the bookmarklet:

1. Edit `src/bookmarklet.js`
2. Rebuild the minified version
3. Update the bookmark URL in your browser

## Future Enhancements

- [ ] Detect more CSV formats (S3, APIs, etc.)
- [ ] Save bookmarklet settings (default domain, etc.)
- [ ] Show preview of detected CSVs before opening
- [ ] Browser extension for easier access
