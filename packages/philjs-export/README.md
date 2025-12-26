# @philjs/export

Export utilities for converting React components and data to various formats including PDF, CSV, Excel, and images. Seamlessly generate downloadable files from your application.

## Installation

```bash
npm install @philjs/export
# or
yarn add @philjs/export
# or
pnpm add @philjs/export
```

## Basic Usage

```tsx
import { exportToPDF, exportToCSV, exportToExcel } from '@philjs/export';

// Export component to PDF
await exportToPDF(<Invoice data={invoiceData} />, {
  filename: 'invoice.pdf',
});

// Export data to CSV
await exportToCSV(tableData, {
  filename: 'report.csv',
  columns: ['name', 'email', 'status'],
});

// Export data to Excel
await exportToExcel(data, {
  filename: 'report.xlsx',
  sheets: [{ name: 'Users', data: users }],
});
```

## Features

- **PDF Export** - Render React components to PDF documents
- **CSV Export** - Generate CSV files from data arrays
- **Excel Export** - Create XLSX files with multiple sheets
- **Image Export** - Export components as PNG, JPEG, or SVG
- **Print Support** - Optimized print layouts
- **Custom Templates** - Define reusable export templates
- **Streaming** - Stream large exports to avoid memory issues
- **Progress Tracking** - Monitor export progress for large files
- **Styling** - Preserve styles in exported documents
- **Headers/Footers** - Add page headers and footers to PDFs
- **Watermarks** - Add watermarks to exported documents
- **Compression** - Optimize file size for exports

## Export Functions

| Function | Output Format |
|----------|---------------|
| `exportToPDF` | PDF document |
| `exportToCSV` | CSV file |
| `exportToExcel` | XLSX spreadsheet |
| `exportToPNG` | PNG image |
| `exportToJPEG` | JPEG image |
| `exportToSVG` | SVG vector |
| `exportToJSON` | JSON file |

## React Hook

```tsx
import { useExport } from '@philjs/export';

function ReportPage() {
  const { exportRef, exportToPDF, isExporting } = useExport();

  return (
    <div>
      <div ref={exportRef}>
        <Report data={data} />
      </div>
      <button onClick={() => exportToPDF()} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Download PDF'}
      </button>
    </div>
  );
}
```

## License

MIT
