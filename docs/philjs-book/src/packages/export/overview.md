# @philjs/export

Data export utilities for PhilJS applications. Export your data to CSV, Excel, JSON, XML, YAML, and PDF formats with comprehensive formatting, streaming support, and signal-based reactive state management.

## Installation

```bash
npm install @philjs/export
# or
pnpm add @philjs/export
```

## Overview

The `@philjs/export` package provides a unified API for exporting data from your PhilJS applications to various formats. It supports:

- **Multiple formats**: CSV, Excel (XLSX), JSON, XML, YAML, and PDF
- **Streaming exports**: Handle large datasets efficiently with memory-conscious streaming
- **Progress tracking**: Monitor export progress with callbacks and reactive signals
- **Customizable formatting**: Control how data is formatted before export
- **ZIP compression**: Bundle multiple exports into compressed archives
- **UI components**: Ready-to-use ExportButton and ExportMenu components
- **Reactive hooks**: Signal-based hooks for integration with PhilJS applications

## Supported Export Formats

| Format | Extension | Description | Use Case |
|--------|-----------|-------------|----------|
| CSV | `.csv` | Comma-Separated Values | Spreadsheets, data import |
| Excel | `.xlsx` | Microsoft Excel | Advanced spreadsheets with styling |
| JSON | `.json` | JavaScript Object Notation | APIs, data interchange |
| XML | `.xml` | Extensible Markup Language | Configuration, legacy systems |
| YAML | `.yaml` | YAML Ain't Markup Language | Configuration files |
| PDF | `.pdf` | Portable Document Format | Reports, printing |

## Quick Start

### Basic Export Functions

```typescript
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToXML,
  exportToYAML,
  exportToPDF
} from '@philjs/export';

// Sample data
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
  { id: 2, name: 'Bob', email: 'bob@example.com', active: false },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', active: true }
];

// Export to CSV (downloads automatically)
await exportToCSV(users, { filename: 'users.csv' });

// Export to Excel
await exportToExcel(users, { filename: 'users.xlsx', sheetName: 'Users' });

// Export to JSON (pretty printed)
await exportToJSON(users, { filename: 'users.json', pretty: true });

// Export to XML
await exportToXML(users, { filename: 'users.xml', rootElement: 'users' });

// Export to YAML
await exportToYAML(users, { filename: 'users.yaml' });

// Export to PDF with title
await exportToPDF(users, {
  filename: 'users.pdf',
  title: 'User Report',
  orientation: 'landscape'
});
```

### Get Blob Without Downloading

```typescript
// Set download: false to get the Blob without triggering download
const csvBlob = await exportToCSV(users, { download: false });
const excelBlob = await exportToExcel(users, { download: false });

// Use the blob for custom handling
console.log('CSV size:', csvBlob.size, 'bytes');
```

## Export Configuration Options

### Common Options (ExportOptions)

All export functions accept a common set of options:

```typescript
interface ExportOptions {
  // File settings
  filename?: string;           // Output filename
  format?: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
  download?: boolean;          // Whether to trigger download (default: true)

  // Progress tracking
  onProgress?: (progress: number) => void;  // Progress callback (0-1)

  // Document metadata
  title?: string;              // Document title

  // CSV-specific options
  delimiter?: string;          // Field delimiter (default: ',')
  includeHeader?: boolean;     // Include header row (default: true)

  // Excel-specific options
  sheetName?: string;          // Worksheet name
  autoFilter?: boolean;        // Enable auto-filter
  freezeHeader?: boolean;      // Freeze header row

  // JSON-specific options
  pretty?: boolean;            // Pretty print (default: true)
  indent?: number;             // Indentation spaces (default: 2)

  // PDF-specific options
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid';
  columns?: string[];          // Columns to include
}
```

## Format-Specific APIs

### CSV Export

The CSV module provides detailed control over CSV generation:

```typescript
import { toCSV, streamToCSV, parseCSV, createCSVBlob } from '@philjs/export/formats';

// Basic CSV conversion
const csvString = toCSV(users, {
  delimiter: ',',           // Field delimiter
  header: true,             // Include headers
  quoteChar: '"',           // Quote character
  newline: '\r\n',          // Line ending
  columns: ['id', 'name'],  // Specific columns to export
  columnHeaders: {          // Custom header names
    id: 'User ID',
    name: 'Full Name'
  },
  skipEmptyLines: true,
  transformRow: (row) => ({
    ...row,
    name: row.name.toUpperCase()
  })
});

// Create a downloadable blob with BOM for Excel compatibility
const blob = createCSVBlob(csvString);

// Parse CSV back to data
const parsedData = parseCSV(csvString, {
  header: true,
  dynamicTyping: true
});
```

#### Streaming Large Datasets to CSV

```typescript
import { streamToCSV } from '@philjs/export/formats';

// Stream large datasets with progress tracking
const largeDataset = getLargeDataset(); // Array or AsyncIterable

async function exportLargeCSV() {
  const chunks: string[] = [];

  for await (const chunk of streamToCSV(largeDataset, {
    chunkSize: 1000,
    onProgress: (progress, processedRows) => {
      console.log(`Progress: ${(progress * 100).toFixed(1)}% (${processedRows} rows)`);
    },
    onChunk: (chunk, index) => {
      console.log(`Chunk ${index} ready`);
    }
  })) {
    chunks.push(chunk);
  }

  const fullCSV = chunks.join('');
  return createCSVBlob(fullCSV);
}
```

### Excel Export

Create sophisticated Excel workbooks with styling, multiple sheets, and more:

```typescript
import {
  createWorkbook,
  createSheet,
  toExcelBlob,
  streamToExcel,
  parseExcel
} from '@philjs/export/formats';

// Create a multi-sheet workbook
const workbook = createWorkbook([
  {
    name: 'Active Users',
    data: users.filter(u => u.active),
    columns: [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'name', header: 'Name', width: 20 },
      { key: 'email', header: 'Email', width: 30 }
    ],
    headerStyle: {
      font: { bold: true, color: '#FFFFFF' },
      fill: { patternType: 'solid', fgColor: '#4472C4' }
    },
    freezeRows: 1,
    autoFilter: true
  },
  {
    name: 'Inactive Users',
    data: users.filter(u => !u.active)
  }
], {
  title: 'User Report',
  author: 'PhilJS App'
});

// Convert to Blob for download
const blob = toExcelBlob([{ name: 'Users', data: users }]);

// Stream large datasets
const streamedBlob = await streamToExcel(largeDataset, 'Large Dataset', {
  chunkSize: 10000,
  onProgress: (progress, rows) => console.log(`${rows} rows processed`)
});

// Parse Excel file
const data = parseExcel(arrayBuffer, {
  sheetName: 'Sheet1',  // or sheetIndex: 0
  header: true
});
```

#### Excel Cell Styling

```typescript
interface CellStyle {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;         // Hex color like '#FF0000'
  };
  fill?: {
    type?: 'pattern' | 'gradient';
    patternType?: 'solid' | 'none';
    fgColor?: string;
    bgColor?: string;
  };
  border?: {
    top?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    bottom?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    left?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    right?: { style: 'thin' | 'medium' | 'thick'; color?: string };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
    wrapText?: boolean;
  };
  numFmt?: string;          // Number format like '0.00%'
}
```

### JSON Export

Export with formatting control and support for JSON Lines (NDJSON):

```typescript
import {
  toJSON,
  streamToJSON,
  toJSONLines,
  streamToJSONLines,
  parseJSON,
  parseJSONLines,
  createJSONBlob
} from '@philjs/export/formats';

// Basic JSON with options
const jsonString = toJSON(users, {
  pretty: true,
  indent: 2,
  includeNull: false,       // Omit null values
  dateFormat: 'iso',        // 'iso' | 'timestamp' | 'string'
  sortKeys: true,           // Alphabetically sort keys
  fields: ['id', 'name'],   // Include only these fields
  excludeFields: ['email'], // Exclude these fields
  maxDepth: 5,              // Limit nesting depth
  transform: (key, value) => {
    if (key === 'password') return '[REDACTED]';
    return value;
  }
});

// JSON Lines format (one JSON object per line)
const jsonLines = toJSONLines(users);
// Output: {"id":1,"name":"Alice",...}
//         {"id":2,"name":"Bob",...}

// Parse JSON Lines back
const parsed = parseJSONLines(jsonLines);

// Stream large JSON arrays
for await (const chunk of streamToJSON(largeDataset, {
  chunkSize: 1000,
  onProgress: (progress, items) => console.log(`${items} items`)
})) {
  process.stdout.write(chunk);
}
```

### XML Export

Convert data to XML with customizable structure:

```typescript
import {
  toXML,
  arrayToXML,
  streamToXML,
  parseXML,
  createXMLBlob
} from '@philjs/export/formats';

// Single object to XML
const xml = toXML(user, {
  rootElement: 'user',
  declaration: true,
  version: '1.0',
  encoding: 'UTF-8',
  pretty: true,
  indent: '  '
});

// Array to XML with item wrapping
const usersXml = arrayToXML(users, {
  rootElement: 'users',
  itemElement: 'user',
  namespace: {
    prefix: 'app',
    uri: 'https://example.com/schema'
  },
  attributeKeys: ['id'],    // Render as attributes
  cdataKeys: ['description'], // Wrap in CDATA
  elementNames: {
    email: 'emailAddress'   // Custom element names
  },
  dateFormat: 'iso'
});
// Output:
// <?xml version="1.0" encoding="UTF-8"?>
// <users xmlns:app="https://example.com/schema">
//   <user id="1">
//     <name>Alice</name>
//     <emailAddress>alice@example.com</emailAddress>
//   </user>
//   ...
// </users>

// Stream to XML
for await (const chunk of streamToXML(largeDataset, {
  chunkSize: 1000,
  onProgress: (progress, items) => console.log(`${items} items`)
})) {
  process.stdout.write(chunk);
}

// Parse XML (browser only - uses DOMParser)
const doc = parseXML(xmlString);
```

### YAML Export

Export to YAML with full formatting control:

```typescript
import {
  toYAML,
  arrayToYAMLDocuments,
  streamToYAML,
  parseYAML,
  parseYAMLDocuments,
  validateYAML,
  createYAMLBlob
} from '@philjs/export/formats';

// Basic YAML
const yaml = toYAML(users, {
  indent: 2,
  lineWidth: 80,
  sortKeys: true,
  includeNulls: false,
  forceQuotes: false,
  dateFormat: 'iso',
  comment: 'User data export'
});

// Multiple YAML documents (separated by ---)
const multiDoc = arrayToYAMLDocuments(users);
// Output:
// name: Alice
// email: alice@example.com
// ---
// name: Bob
// email: bob@example.com

// Validate YAML
const { valid, errors } = validateYAML(yamlString);
if (!valid) {
  console.error('Invalid YAML:', errors);
}

// Parse YAML
const data = parseYAML(yamlString);
const documents = parseYAMLDocuments(multiDocYaml);
```

### PDF Export

Generate PDF reports with tables and styling:

```typescript
import {
  createPDF,
  createMultiTablePDF,
  toPDFBlob,
  toPDFBuffer,
  toPDFBase64,
  streamToPDF,
  addImageToPDF
} from '@philjs/export/formats';

// Basic PDF with table
const doc = createPDF(users, {
  title: 'User Report',
  author: 'PhilJS App',
  orientation: 'landscape',
  format: 'a4',
  fontSize: 10,
  header: 'Company Confidential',
  footer: 'Generated by PhilJS Export',
  showPageNumbers: true,
  margin: { top: 20, right: 14, bottom: 20, left: 14 }
});

// Get as Blob
const blob = toPDFBlob(users);

// Get as base64 data URI
const dataUri = toPDFBase64(users);

// Multi-table PDF
const multiTableDoc = createMultiTablePDF([
  {
    data: activeUsers,
    title: 'Active Users',
    columns: [
      { key: 'id', header: 'ID', width: 50 },
      { key: 'name', header: 'Name', format: (v) => String(v).toUpperCase() }
    ],
    headerStyle: {
      fillColor: '#4CAF50',
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    showHeader: true
  },
  {
    data: inactiveUsers,
    title: 'Inactive Users',
    alternateRowStyle: {
      fillColor: '#FFEBEE'
    }
  }
], {
  title: 'Complete User Report',
  orientation: 'portrait'
});

// Add images or charts
addImageToPDF(doc, canvasElement, 10, 100, 100, 75, 'PNG');

// Stream large datasets
const pdfBlob = await streamToPDF(largeDataset, {
  chunkSize: 1000,
  onProgress: (progress, rows) => console.log(`${rows} rows processed`)
});
```

## Reactive Hooks

### useExport Hook

The primary hook for exporting data with reactive state:

```typescript
import { useExport } from '@philjs/export';

function DataExporter() {
  const { state, exportData, reset } = useExport();

  const handleExport = async () => {
    const blob = await exportData(myData, 'excel', {
      filename: 'report.xlsx',
      sheetName: 'Data'
    });

    if (blob) {
      console.log('Export successful!');
    }
  };

  const currentState = state();

  return (
    <div>
      {currentState.isExporting && (
        <progress value={currentState.progress} max={100} />
      )}
      {currentState.error && (
        <div class="error">{currentState.error.message}</div>
      )}
      <button onClick={handleExport} disabled={currentState.isExporting}>
        Export to Excel
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### useStreamingExport Hook

For streaming large datasets with progress tracking:

```typescript
import { useStreamingExport } from '@philjs/export';
import { streamToCSV } from '@philjs/export/formats';

function LargeDataExporter() {
  const { state, streamExport, reset } = useStreamingExport();

  const handleExport = async () => {
    const generator = streamToCSV(largeDataset, { chunkSize: 1000 });

    const chunks = await streamExport(generator, {
      onChunk: (chunk) => console.log('Chunk received'),
      onProgress: (progress) => console.log(`${progress.itemsPerSecond} items/sec`),
      onComplete: (stats) => console.log(`Completed: ${stats.totalItems} items`)
    });

    const fullCSV = chunks.join('');
  };

  const currentState = state();

  return (
    <div>
      {currentState.isStreaming && currentState.progress && (
        <div>
          Processing: {currentState.progress.processedItems} items
          ({currentState.progress.itemsPerSecond.toFixed(0)}/sec)
        </div>
      )}
      {currentState.stats && (
        <div>
          Completed: {currentState.stats.totalItems} items in {currentState.stats.totalTimeMs}ms
        </div>
      )}
    </div>
  );
}
```

### useBatchExport Hook

Export multiple datasets in batch:

```typescript
import { useBatchExport } from '@philjs/export';

function BatchExporter() {
  const { state, batchExport, reset } = useBatchExport();

  const handleBatchExport = async () => {
    const datasets = [dataset1, dataset2, dataset3];
    const blobs = await batchExport(datasets, 'csv', {
      download: false
    });

    console.log(`Exported ${blobs.length} files`);
  };

  const currentState = state();

  return (
    <div>
      {currentState.isExporting && (
        <div>
          Exporting {currentState.currentIndex + 1} of {currentState.totalItems}
        </div>
      )}
      {currentState.errors.length > 0 && (
        <div>
          {currentState.errors.length} errors occurred
        </div>
      )}
    </div>
  );
}
```

## UI Components

### ExportButton

A ready-to-use button component for triggering exports:

```typescript
import { ExportButton } from '@philjs/export';

// Basic usage
<ExportButton
  data={users}
  format="excel"
  options={{ filename: 'users.xlsx' }}
/>

// With callbacks and dynamic data
<ExportButton
  data={async () => await fetchUsers()}
  format="csv"
  label="Download CSV"
  disabled={isLoading}
  onExportStart={() => console.log('Starting...')}
  onExportComplete={(blob) => console.log('Done!', blob.size)}
  onExportError={(error) => console.error(error)}
  className="export-btn"
  testID="export-button"
/>
```

### ExportMenu

A dropdown menu for selecting export format:

```typescript
import { ExportMenu } from '@philjs/export';

// All formats
<ExportMenu
  data={users}
  label="Export As..."
  options={{ filename: 'users' }}
/>

// Custom formats
<ExportMenu
  data={users}
  formats={[
    { format: 'csv', label: 'CSV File (.csv)' },
    { format: 'excel', label: 'Excel Spreadsheet (.xlsx)' },
    { format: 'pdf', label: 'PDF Report (.pdf)', options: { orientation: 'landscape' } }
  ]}
  onExportStart={(format) => console.log(`Exporting as ${format}`)}
  onExportComplete={(format, blob) => console.log(`${format} export complete`)}
/>
```

## Utility Functions

### Data Formatters

Format data values before export:

```typescript
import {
  formatDate,
  formatNumber,
  formatBoolean,
  formatString,
  formatArray,
  applyFormatters,
  createTransformer,
  sanitizeForExport,
  sanitizeRow
} from '@philjs/export/utils';

// Format individual values
formatDate(new Date(), 'long', { locale: 'en-US' });          // "January 1, 2024"
formatDate(new Date(), 'YYYY-MM-DD');                          // "2024-01-01"

formatNumber(1234.5678, 'currency', { currency: 'USD' });      // "$1,234.57"
formatNumber(0.15, 'percent');                                  // "15.00%"
formatNumber(1500000, 'compact');                               // "1.5M"

formatBoolean(true, 'yes/no');                                  // "Yes"
formatBoolean(false, '1/0');                                    // "0"

formatString('hello world', 'title');                           // "Hello World"

formatArray(['a', 'b', 'c'], ' | ');                           // "a | b | c"

// Create a row transformer
const transformer = createTransformer([
  { key: 'createdAt', type: 'date', format: 'long' },
  { key: 'price', type: 'number', format: 'currency', options: { currency: 'EUR' } },
  { key: 'active', type: 'boolean', format: 'yes/no' },
  { key: 'name', type: 'string', format: 'title' }
]);

const formattedRows = data.map(transformer);

// Sanitize for safe export (prevents formula injection)
sanitizeForExport('=SUM(A1:A10)');  // "'=SUM(A1:A10)"
sanitizeRow({ formula: '=CMD|...' }); // Prefixes dangerous values
```

### Streaming Utilities

Handle large datasets efficiently:

```typescript
import {
  createProgressTracker,
  chunkArray,
  chunkAsyncIterable,
  createReadableStream,
  createCollectorStream,
  transformStream,
  concatStringStream,
  streamToBlob,
  rateLimitStream,
  withProgress,
  bufferStream,
  createTimeoutController
} from '@philjs/export/utils';

// Chunk arrays for processing
for (const chunk of chunkArray(largeArray, 1000)) {
  await processChunk(chunk);
}

// Progress tracking
const tracker = createProgressTracker(totalItems, (progress) => {
  console.log(`${(progress.progress * 100).toFixed(1)}%`);
  console.log(`${progress.itemsPerSecond.toFixed(0)} items/sec`);
  console.log(`ETA: ${progress.estimatedRemainingMs}ms`);
});

for (const item of items) {
  processItem(item);
  tracker.update(processedCount, bytesWritten);
}

const stats = tracker.complete();
console.log(`Total: ${stats.totalItems} in ${stats.totalTimeMs}ms`);

// Rate limiting for API exports
for await (const item of rateLimitStream(asyncIterable, 100)) {
  // Max 100 items per second
  await sendToAPI(item);
}

// Timeout control
const controller = createTimeoutController(30000); // 30s timeout
try {
  await longRunningExport({ signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Export timed out');
  }
}
```

### ZIP Compression

Bundle multiple exports into ZIP archives:

```typescript
import {
  createZip,
  createZipWithFolders,
  streamToZip,
  extractZip,
  listZipContents,
  addToZip,
  removeFromZip,
  createExportZip,
  createZipEntry
} from '@philjs/export/utils';

// Create a simple ZIP
const zip = await createZip([
  { name: 'users.csv', content: csvData },
  { name: 'report.pdf', content: pdfBlob },
  { name: 'data.json', content: JSON.stringify(data) }
], {
  compression: 'DEFLATE',
  compressionLevel: 6,
  comment: 'Export archive',
  onProgress: (progress) => console.log(`${progress * 100}%`)
});

// Create ZIP with folder structure
const folderZip = await createZipWithFolders({
  'reports/': [
    { name: 'q1.pdf', content: q1Report },
    { name: 'q2.pdf', content: q2Report }
  ],
  'data/': [
    { name: 'users.csv', content: usersCSV },
    { name: 'products.csv', content: productsCSV }
  ],
  'README.txt': 'Archive contents description'
});

// Stream files into ZIP
async function* fileGenerator() {
  for (const file of files) {
    yield createZipEntry(file.name, await file.getData());
  }
}

const streamedZip = await streamToZip(fileGenerator(), {
  onFileProgress: (fileName, progress) => console.log(`${fileName}: ${progress * 100}%`)
});

// Create export bundle
const exportBundle = await createExportZip([
  { fileName: 'users.csv', data: csvString, format: 'csv' },
  { fileName: 'users.xlsx', data: excelBlob, format: 'excel' },
  { fileName: 'users.pdf', data: pdfBlob, format: 'pdf' }
]);

// Extract ZIP
const files = await extractZip(zipBlob, {
  onProgress: (progress, fileName) => console.log(`Extracting ${fileName}`)
});

for (const [name, blob] of files) {
  console.log(`${name}: ${blob.size} bytes`);
}

// List contents without extracting
const contents = await listZipContents(zipBlob);
contents.forEach(file => {
  console.log(`${file.name}: ${file.size} bytes (compressed: ${file.compressedSize})`);
});

// Modify existing ZIP
const updatedZip = await addToZip(existingZip, [
  { name: 'new-file.txt', content: 'New content' }
]);

const prunedZip = await removeFromZip(existingZip, ['old-file.txt']);
```

## Integration with PhilJS Data Layer

### With @philjs/db

```typescript
import { useQuery } from '@philjs/db';
import { useExport } from '@philjs/export';

function DatabaseExporter() {
  const users = useQuery('SELECT * FROM users WHERE active = ?', [true]);
  const { exportData } = useExport();

  const handleExport = () => {
    exportData(users.data(), 'excel', {
      filename: 'active-users.xlsx',
      title: 'Active Users Report'
    });
  };
}
```

### With @philjs/realtime

```typescript
import { useRealtimeQuery } from '@philjs/realtime';
import { ExportButton } from '@philjs/export';

function RealtimeExporter() {
  const liveData = useRealtimeQuery('analytics');

  return (
    <ExportButton
      data={() => liveData.snapshot()}
      format="json"
      options={{ filename: `analytics-${Date.now()}.json` }}
    />
  );
}
```

### With @philjs/graphql

```typescript
import { useQuery } from '@philjs/graphql';
import { exportToCSV } from '@philjs/export';

async function exportQueryResults() {
  const result = await client.query({
    query: GET_USERS,
    variables: { limit: 10000 }
  });

  await exportToCSV(result.data.users, {
    filename: 'graphql-export.csv'
  });
}
```

## Performance Considerations

### Memory Management

For large datasets, use streaming exports to avoid loading everything into memory:

```typescript
// BAD: Loads all data into memory
const allData = await fetchAllRecords(); // 1M records
await exportToCSV(allData);

// GOOD: Stream data in chunks
async function* fetchRecordsStream() {
  let offset = 0;
  const limit = 10000;

  while (true) {
    const batch = await fetchRecords({ offset, limit });
    if (batch.length === 0) break;

    for (const record of batch) {
      yield record;
    }

    offset += limit;
  }
}

const blob = await streamToBlob(
  streamToCSV(fetchRecordsStream(), { chunkSize: 1000 }),
  'text/csv'
);
```

### Chunk Size Optimization

Choose appropriate chunk sizes based on your data:

| Data Size | Record Size | Recommended Chunk Size |
|-----------|-------------|------------------------|
| < 10K records | Small (< 1KB) | 1000 |
| 10K - 100K records | Small | 5000 |
| 100K - 1M records | Small | 10000 |
| Any | Large (> 10KB) | 100-500 |
| Streaming to disk | Any | 1000 |

### Web Worker Offloading

For very large exports, consider using a Web Worker:

```typescript
// export.worker.ts
import { streamToCSV, concatStringStream } from '@philjs/export/utils';

self.onmessage = async (e) => {
  const { data, options } = e.data;

  const csv = await concatStringStream(
    streamToCSV(data, {
      ...options,
      onProgress: (progress, items) => {
        self.postMessage({ type: 'progress', progress, items });
      }
    })
  );

  const blob = new Blob([csv], { type: 'text/csv' });
  self.postMessage({ type: 'complete', blob });
};

// Main thread
const worker = new Worker('./export.worker.ts', { type: 'module' });

worker.postMessage({ data: largeDataset, options: { chunkSize: 5000 } });

worker.onmessage = (e) => {
  if (e.data.type === 'progress') {
    updateProgressUI(e.data.progress);
  } else if (e.data.type === 'complete') {
    downloadBlob(e.data.blob, 'export.csv');
  }
};
```

### PDF Performance Tips

PDF generation can be CPU-intensive. Optimize by:

1. **Limit columns**: Only include necessary columns
2. **Use landscape for wide data**: Reduces page count
3. **Batch processing**: For multi-table PDFs, process tables sequentially
4. **Avoid complex styling**: Simple styles render faster

```typescript
// Optimized PDF export
await exportToPDF(data, {
  columns: ['id', 'name', 'status'], // Only essential columns
  orientation: 'landscape',          // Fewer pages for wide data
  pageSize: 'a4',
  onProgress: (progress) => updateUI(progress)
});
```

## Error Handling

```typescript
import { useExport } from '@philjs/export';

function RobustExporter() {
  const { state, exportData } = useExport();

  const handleExport = async () => {
    try {
      const blob = await exportData(data, 'excel');

      if (!blob) {
        // Export failed - check state for error
        const { error } = state();
        console.error('Export failed:', error?.message);
        return;
      }

      console.log('Export successful');
    } catch (error) {
      // Unexpected error
      console.error('Unexpected error:', error);
    }
  };
}

// With streaming
import { streamToCSV } from '@philjs/export/formats';

async function safeStreamExport() {
  try {
    for await (const chunk of streamToCSV(data)) {
      // Process chunk
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Export was cancelled');
    } else {
      console.error('Stream error:', error);
    }
  }
}
```

## TypeScript Support

The package is fully typed with TypeScript:

```typescript
import type {
  ExportOptions,
  ExportState,
  StreamingExportState,
  BatchExportState,
  CSVOptions,
  StreamingCSVOptions,
  ExcelOptions,
  SheetConfig,
  ColumnConfig,
  CellStyle,
  JSONOptions,
  XMLOptions,
  YAMLOptions,
  PDFOptions,
  PDFStyle,
  PDFColumnConfig,
  PDFTableConfig,
  StreamProgress,
  StreamStats,
  ZipFileEntry,
  ZipOptions,
  ColumnFormatter,
  FormatterOptions
} from '@philjs/export';
```

## Dependencies

The package uses the following libraries:

- **papaparse**: CSV parsing and generation
- **xlsx**: Excel file generation and parsing
- **jspdf**: PDF document generation
- **jspdf-autotable**: PDF table support
- **jszip**: ZIP archive creation
- **file-saver**: Browser file download
- **yaml**: YAML parsing and generation

## Browser Support

All modern browsers are supported. For older browsers, ensure you have polyfills for:

- `Blob`
- `URL.createObjectURL`
- `AsyncGenerator`
- `ReadableStream` / `WritableStream` (for streaming features)

## See Also

- [@philjs/db](../db/overview.md) - Database integration
- [@philjs/realtime](../realtime/overview.md) - Real-time data
- [@philjs/pdf](../pdf/overview.md) - Advanced PDF generation
- [@philjs/charts](../charts/overview.md) - Chart exports
