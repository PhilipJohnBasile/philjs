# @philjs/pdf

PDF generation and manipulation library supporting HTML-to-PDF conversion, React components, templates, watermarks, merging, and more.

## Installation

```bash
npm install @philjs/pdf
```

### Optional Peer Dependencies

```bash
# For server-side HTML rendering
npm install puppeteer

# For React component rendering
npm install @react-pdf/renderer
```

## Features

- **HTML to PDF** - Convert HTML strings or URLs using Puppeteer
- **React Components** - Generate PDFs from @react-pdf/renderer components
- **Templates** - Built-in invoice, report, and certificate templates
- **Merge PDFs** - Combine multiple PDFs with page numbers
- **Watermarks** - Add text watermarks with rotation and opacity
- **Split/Extract** - Split PDFs or extract specific pages
- **Metadata** - Read and write PDF metadata
- **Compression** - Reduce PDF file size

## Quick Start

```typescript
import { PDFGenerator, htmlToPdf } from '@philjs/pdf';

// Quick HTML to PDF
const buffer = await htmlToPdf('<h1>Hello World</h1>');

// Or use the generator class
const pdf = new PDFGenerator();
const buffer = await pdf.generateFromHtml('<h1>Hello</h1>', {
  format: 'A4',
  margin: { top: '20mm', bottom: '20mm' },
});

// Clean up browser instance
await pdf.close();
```

## HTML to PDF (Server-Side)

### Basic HTML Rendering

```typescript
import { PDFGenerator } from '@philjs/pdf';

const pdf = new PDFGenerator({
  headless: true,
  format: 'A4',
  margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
});

// From HTML string
const buffer = await pdf.generateFromHtml(`
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>My Report</h1>
      <p>Generated at ${new Date().toLocaleDateString()}</p>
    </body>
  </html>
`);

// Don't forget to close when done
await pdf.close();
```

### From URL

```typescript
const buffer = await pdf.generateFromHtml('https://example.com/report', {
  waitForNavigation: true,
  printBackground: true,
});
```

### Advanced Options

```typescript
const buffer = await pdf.generateFromHtml(html, {
  // Page format
  format: 'A4', // 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid'

  // Custom dimensions
  width: '210mm',
  height: '297mm',

  // Margins
  margin: {
    top: '25mm',
    right: '15mm',
    bottom: '25mm',
    left: '15mm',
  },

  // Orientation
  landscape: false,

  // Include backgrounds
  printBackground: true,

  // Scale
  scale: 1,

  // Use CSS page size
  preferCSSPageSize: true,

  // Inject custom CSS
  css: `
    body { font-size: 12pt; }
    @page { margin: 0; }
  `,

  // Wait for dynamic content
  waitForSelector: '#chart-loaded',
  waitForNavigation: true,

  // Headers and footers
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-size: 10px; text-align: center; width: 100%;">
      My Company Report
    </div>
  `,
  footerTemplate: `
    <div style="font-size: 10px; text-align: center; width: 100%;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
});
```

## React Component Rendering

### Using @react-pdf/renderer

```typescript
import { PDFGenerator } from '@philjs/pdf';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
});

// Create document component
const MyDocument = ({ title, content }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.section}>
        <Text>{content}</Text>
      </View>
    </Page>
  </Document>
);

// Generate PDF
const pdf = new PDFGenerator();
const buffer = await pdf.generateFromComponent(MyDocument, {
  title: 'My Report',
  content: 'This is the report content...',
});
```

### Client-Side Blob Generation

```typescript
const blob = await pdf.generateBlobFromComponent(MyDocument, props);

// Create download link
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'report.pdf';
link.click();
```

## Templates

### Built-in Templates

```typescript
import { PDFGenerator } from '@philjs/pdf';

const pdf = new PDFGenerator();

// Invoice template
const invoice = await pdf.generateFromTemplate({
  template: 'invoice',
  data: {
    invoiceNumber: 'INV-2025-001',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    company: {
      name: 'Acme Inc.',
      address: '123 Business St',
      city: 'San Francisco, CA 94105',
    },
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      address: '456 Customer Ave',
    },
    items: [
      { description: 'Web Development', quantity: 40, rate: 150, amount: 6000 },
      { description: 'Design Services', quantity: 20, rate: 100, amount: 2000 },
    ],
    subtotal: 8000,
    tax: 640,
    total: 8640,
  },
});

// Report template
const report = await pdf.generateFromTemplate({
  template: 'report',
  data: {
    title: 'Q4 2024 Report',
    author: 'Analytics Team',
    date: '2025-01-15',
    sections: [
      { heading: 'Executive Summary', content: '...' },
      { heading: 'Key Metrics', content: '...' },
    ],
  },
});

// Certificate template
const certificate = await pdf.generateFromTemplate({
  template: 'certificate',
  data: {
    recipientName: 'John Doe',
    courseName: 'Advanced JavaScript',
    completionDate: 'January 15, 2025',
    instructorName: 'Jane Smith',
    certificateId: 'CERT-2025-001',
  },
});
```

### Custom Templates

```typescript
// Using {{key}} interpolation
const buffer = await pdf.generateFromTemplate({
  template: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 40px; }
        .header { border-bottom: 2px solid #333; }
        .total { font-size: 24px; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>{{company.name}}</h1>
        <p>Invoice #{{invoiceNumber}}</p>
      </div>
      <p>Customer: {{customer.name}}</p>
      <p class="total">Total: ${{total}}</p>
    </body>
    </html>
  `,
  data: {
    company: { name: 'My Company' },
    invoiceNumber: 'INV-001',
    customer: { name: 'John Doe' },
    total: '1,500.00',
  },
});
```

## PDF Manipulation

### Merging PDFs

```typescript
import { PDFGenerator, mergePdfs } from '@philjs/pdf';

const pdf = new PDFGenerator();

// Basic merge
const merged = await pdf.merge([pdf1Buffer, pdf2Buffer, pdf3Buffer]);

// With page numbers
const mergedWithNumbers = await pdf.merge([pdf1, pdf2, pdf3], {
  addPageNumbers: true,
  pageNumberFormat: 'Page {{page}} of {{total}}',
  pageNumberPosition: 'bottom', // 'top' | 'bottom'
});

// Quick merge function
const merged = await mergePdfs([pdf1, pdf2, pdf3]);
```

### Adding Watermarks

```typescript
const watermarked = await pdf.addWatermark(pdfBuffer, {
  text: 'CONFIDENTIAL',
  fontSize: 60,
  rotation: -45,
  color: [0.8, 0.2, 0.2], // RGB values 0-1
  opacity: 0.2,
  position: 'center', // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
});

// Draft watermark
const draft = await pdf.addWatermark(pdfBuffer, {
  text: 'DRAFT',
  fontSize: 80,
  color: [0.5, 0.5, 0.5],
  opacity: 0.1,
});
```

### Splitting PDFs

```typescript
// Split into individual pages
const pages = await pdf.split(pdfBuffer);

for (let i = 0; i < pages.length; i++) {
  await fs.writeFile(`page-${i + 1}.pdf`, pages[i]);
}
```

### Extracting Pages

```typescript
// Extract specific pages (1-based)
const extracted = await pdf.extractPages(pdfBuffer, [1, 3, 5, 7]);

// Extract first 5 pages
const firstFive = await pdf.extractPages(pdfBuffer, [1, 2, 3, 4, 5]);
```

### PDF Compression

```typescript
const compressed = await pdf.compress(pdfBuffer, {
  level: 9,           // 1-9 compression level
  removeMetadata: true,
  compressImages: true,
  imageQuality: 80,   // 0-100
});
```

### Password Protection

```typescript
const protected = await pdf.protect(pdfBuffer, {
  ownerPassword: 'admin123',    // Full access
  userPassword: 'view123',      // View only
  printing: true,
  copying: false,
  modifying: false,
  annotating: false,
});
```

## Metadata Management

### Reading Metadata

```typescript
const metadata = await pdf.getMetadata(pdfBuffer);

console.log({
  title: metadata.title,
  author: metadata.author,
  subject: metadata.subject,
  keywords: metadata.keywords,
  creator: metadata.creator,
  producer: metadata.producer,
  creationDate: metadata.creationDate,
  modificationDate: metadata.modificationDate,
});
```

### Writing Metadata

```typescript
const updated = await pdf.setMetadata(pdfBuffer, {
  title: 'Annual Report 2024',
  author: 'Analytics Team',
  subject: 'Company Performance',
  keywords: ['report', 'annual', '2024'],
  creator: 'PhilJS PDF',
  producer: 'PhilJS',
});
```

## Utility Functions

### Get Page Count

```typescript
const pageCount = await pdf.getPageCount(pdfBuffer);
console.log(`PDF has ${pageCount} pages`);
```

### Quick Functions

```typescript
import { htmlToPdf, mergePdfs } from '@philjs/pdf';

// Quick HTML conversion
const buffer = await htmlToPdf('<h1>Hello</h1>', {
  format: 'Letter',
  margin: { top: '1in', bottom: '1in' },
});

// Quick merge
const merged = await mergePdfs([pdf1, pdf2, pdf3], {
  addPageNumbers: true,
});
```

## Types Reference

```typescript
// Generator options
interface PDFGeneratorOptions {
  headless?: boolean;
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  margin?: PDFMargin;
  debug?: boolean;
}

// Margin configuration
interface PDFMargin {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}

// HTML to PDF options
interface HTMLToPDFOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  margin?: PDFMargin;
  printBackground?: boolean;
  landscape?: boolean;
  css?: string;
  waitForSelector?: string;
  waitForNavigation?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  scale?: number;
  width?: string | number;
  height?: string | number;
  preferCSSPageSize?: boolean;
}

// Template options
interface TemplateOptions extends HTMLToPDFOptions {
  template: string;
  data: Record<string, unknown>;
}

// Watermark options
interface WatermarkOptions {
  text: string;
  fontSize?: number;
  rotation?: number;
  color?: [number, number, number];
  opacity?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Protection options
interface ProtectionOptions {
  userPassword?: string;
  ownerPassword: string;
  printing?: boolean;
  copying?: boolean;
  modifying?: boolean;
  annotating?: boolean;
}

// Compression options
interface CompressionOptions {
  level?: number;
  compressImages?: boolean;
  imageQuality?: number;
  removeMetadata?: boolean;
}

// Merge options
interface MergeOptions {
  addPageNumbers?: boolean;
  pageNumberFormat?: string;
  pageNumberPosition?: 'top' | 'bottom';
  addBookmarks?: boolean;
}
```

## API Reference

### PDFGenerator Class

| Method | Description |
|--------|-------------|
| `generateFromHtml(html, options?)` | Generate PDF from HTML/URL |
| `generateFromComponent(Component, props?, options?)` | Generate from React component |
| `generateBlobFromComponent(Component, props?)` | Get Blob from React component |
| `generateFromTemplate(options)` | Generate from template |
| `merge(pdfs, options?)` | Merge multiple PDFs |
| `addWatermark(pdf, options)` | Add watermark to PDF |
| `protect(pdf, options)` | Add password protection |
| `compress(pdf, options?)` | Compress PDF |
| `getPageCount(pdf)` | Get page count |
| `extractPages(pdf, pages)` | Extract specific pages |
| `split(pdf)` | Split into individual pages |
| `setMetadata(pdf, metadata)` | Set PDF metadata |
| `getMetadata(pdf)` | Get PDF metadata |
| `close()` | Close browser instance |

### Factory Functions

| Function | Description |
|----------|-------------|
| `createPDFGenerator(options?)` | Create new generator |
| `htmlToPdf(html, options?)` | Quick HTML to PDF |
| `mergePdfs(pdfs, options?)` | Quick merge |

## Examples

### Invoice Generation

```typescript
import { PDFGenerator } from '@philjs/pdf';

async function generateInvoice(invoiceData) {
  const pdf = new PDFGenerator();

  const buffer = await pdf.generateFromTemplate({
    template: 'invoice',
    data: invoiceData,
    format: 'Letter',
    margin: { top: '0.5in', bottom: '0.5in' },
  });

  // Add watermark for unpaid invoices
  if (!invoiceData.paid) {
    return pdf.addWatermark(buffer, {
      text: 'UNPAID',
      color: [1, 0.3, 0.3],
      opacity: 0.15,
    });
  }

  return buffer;
}
```

### Report with Charts

```typescript
import { PDFGenerator } from '@philjs/pdf';

async function generateReport(data) {
  const pdf = new PDFGenerator();

  // Generate HTML with charts
  const html = `
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h1>${data.title}</h1>
      <canvas id="chart"></canvas>
      <script>
        new Chart(document.getElementById('chart'), {
          type: 'bar',
          data: ${JSON.stringify(data.chartData)}
        });
        // Signal chart is ready
        document.body.classList.add('chart-ready');
      </script>
    </body>
    </html>
  `;

  const buffer = await pdf.generateFromHtml(html, {
    waitForSelector: '.chart-ready',
    printBackground: true,
  });

  await pdf.close();
  return buffer;
}
```

### Batch PDF Processing

```typescript
import { PDFGenerator, mergePdfs } from '@philjs/pdf';

async function processDocuments(documents) {
  const pdf = new PDFGenerator();
  const results = [];

  for (const doc of documents) {
    const buffer = await pdf.generateFromHtml(doc.html);
    const withWatermark = await pdf.addWatermark(buffer, {
      text: doc.watermark,
    });
    results.push(withWatermark);
  }

  // Merge all with page numbers
  const merged = await mergePdfs(results, {
    addPageNumbers: true,
    pageNumberFormat: 'Page {{page}} of {{total}}',
  });

  await pdf.close();
  return merged;
}
```
