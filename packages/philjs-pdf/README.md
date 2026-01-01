# philjs-pdf

PDF generation and manipulation for PhilJS applications. Supports both server-side (Puppeteer) and client-side (@react-pdf/renderer) generation.

## Features

- **HTML to PDF** - Convert HTML strings or URLs to PDF using Puppeteer
- **React Component to PDF** - Generate PDFs from React components using @react-pdf/renderer
- **Template-based Generation** - Built-in templates for invoices, reports, and certificates
- **PDF Manipulation** - Merge, split, watermark, protect, and compress PDFs using pdf-lib
- **Font Management** - Embed standard and custom fonts
- **Image Embedding** - Support for PNG and JPEG images
- **Table Generation** - Helper utilities for creating tables in PDFs

## Installation

```bash
npm install philjs-pdf
# or
yarn add philjs-pdf
# or
pnpm add philjs-pdf
```

## Quick Start

### HTML to PDF (Server-side)

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

// From HTML string
const buffer = await pdf.generateFromHtml('<h1>Hello World</h1>', {
  format: 'A4',
  margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
});

// From URL
const buffer = await pdf.generateFromHtml('https://example.com', {
  printBackground: true,
  waitForNavigation: true,
});

// Don't forget to close the browser when done
await pdf.close();
```

### React Component to PDF (Client-side)

```tsx
import { PDFGenerator } from 'philjs-pdf';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
});

const MyDocument = ({ title }: { title: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
    </Page>
  </Document>
);

const pdf = new PDFGenerator();
const buffer = await pdf.generateFromComponent(MyDocument, { title: 'My Report' });
```

### Template-based Generation

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

// Generate invoice
const invoice = await pdf.generateFromTemplate({
  template: 'invoice',
  data: {
    invoiceNumber: 'INV-001',
    invoiceDate: '2024-01-15',
    companyName: 'Acme Corp',
    customerName: 'John Doe',
    items: [
      { description: 'Widget A', quantity: 5, unitPrice: 10 },
      { description: 'Widget B', quantity: 3, unitPrice: 25 },
    ],
    total: 125,
  },
});

// Generate certificate
const certificate = await pdf.generateFromTemplate({
  template: 'certificate',
  data: {
    title: 'Certificate of Completion',
    recipientName: 'Jane Smith',
    achievement: 'has successfully completed the Advanced TypeScript Course',
    organizationName: 'Tech Academy',
    issueDate: 'January 15, 2024',
  },
});

await pdf.close();
```

### Custom HTML Template

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

const customTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{content}}</p>
  <p>Date: {{date}}</p>
</body>
</html>
`;

const buffer = await pdf.generateFromTemplate({
  template: customTemplate,
  data: {
    title: 'Custom Report',
    content: 'This is a custom report generated from a template.',
    date: new Date().toLocaleDateString(),
  },
});

await pdf.close();
```

## PDF Manipulation

### Merge Multiple PDFs

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

const merged = await pdf.merge([pdf1Buffer, pdf2Buffer, pdf3Buffer], {
  addPageNumbers: true,
  pageNumberFormat: 'Page {{page}} of {{total}}',
  pageNumberPosition: 'bottom',
});
```

### Add Watermark

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

const watermarked = await pdf.addWatermark(pdfBuffer, {
  text: 'CONFIDENTIAL',
  fontSize: 60,
  rotation: -45,
  color: [0.8, 0.2, 0.2],
  opacity: 0.2,
  position: 'center',
});
```

### Password Protection

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

const protected = await pdf.protect(pdfBuffer, {
  ownerPassword: 'admin123',
  userPassword: 'user123',
  printing: true,
  copying: false,
});
```

### Compress PDF

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

const compressed = await pdf.compress(pdfBuffer, {
  level: 9,
  removeMetadata: true,
});
```

### Extract Pages

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

// Extract pages 1, 3, and 5
const extracted = await pdf.extractPages(pdfBuffer, [1, 3, 5]);

// Split into individual pages
const pages = await pdf.split(pdfBuffer);
```

### Metadata Management

```typescript
import { PDFGenerator } from 'philjs-pdf';

const pdf = new PDFGenerator();

// Set metadata
const withMetadata = await pdf.setMetadata(pdfBuffer, {
  title: 'Annual Report 2024',
  author: 'John Doe',
  subject: 'Financial Summary',
  keywords: ['annual', 'report', 'finance'],
});

// Get metadata
const metadata = await pdf.getMetadata(pdfBuffer);
console.log(metadata.title, metadata.author);
```

## Utility Classes

### Font Management

```typescript
import { FontManager, getStandardFonts, wrapText } from 'philjs-pdf/utils';
import { PDFDocument } from 'pdf-lib';

const pdfDoc = await PDFDocument.create();
const fontManager = new FontManager();
await fontManager.init(pdfDoc);

// Embed standard font
const helvetica = await fontManager.embedStandardFont('Helvetica');

// Embed custom font
const customFont = await fontManager.embedCustomFont({
  name: 'MyFont',
  path: '/fonts/myfont.ttf',
});

// Word wrap text
const lines = wrapText(helvetica, 'Long text that needs wrapping...', 12, 200);
```

### Image Embedding

```typescript
import { ImageManager, scaleToFit } from 'philjs-pdf/utils';
import { PDFDocument } from 'pdf-lib';

const pdfDoc = await PDFDocument.create();
const imageManager = new ImageManager();
await imageManager.init(pdfDoc);

// Embed from URL
const logo = await imageManager.embedFromUrl('https://example.com/logo.png');

// Embed from file
const photo = await imageManager.embedFromFile('/images/photo.jpg');

// Draw on page
const page = pdfDoc.addPage();
imageManager.drawImage(page, logo, {
  x: 50,
  y: 700,
  width: 100,
  maintainAspectRatio: true,
});
```

### Table Generation

```typescript
import { TableRenderer, createTable, currencyFormatter } from 'philjs-pdf/utils';
import { PDFDocument } from 'pdf-lib';

const pdfDoc = await PDFDocument.create();
const tableRenderer = new TableRenderer();
await tableRenderer.init(pdfDoc);

const page = pdfDoc.addPage();

const result = tableRenderer.drawTable(page, {
  x: 50,
  y: 700,
  width: 500,
  columns: [
    { header: 'Product', key: 'product', width: '*' },
    { header: 'Quantity', key: 'qty', width: 80, align: 'center' },
    { header: 'Price', key: 'price', width: 100, align: 'right', formatter: currencyFormatter('$') },
  ],
  data: [
    { product: 'Widget A', qty: 5, price: 10 },
    { product: 'Widget B', qty: 3, price: 25 },
  ],
  style: {
    headerBackground: { r: 0.1, g: 0.2, b: 0.4 },
    headerColor: { r: 1, g: 1, b: 1 },
    alternateRowBackground: { r: 0.95, g: 0.95, b: 0.95 },
  },
});

console.log(`Table rendered, ends at Y: ${result.endY}`);
```

## Built-in Templates

### Invoice Template

```typescript
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  currency?: string;
}
```

### Report Template

```typescript
interface ReportData {
  title: string;
  subtitle?: string;
  reportDate: string;
  reportNumber?: string;
  author?: string;
  authorTitle?: string;
  department?: string;
  companyName?: string;
  companyLogo?: string;
  executiveSummary?: string;
  sections: Array<{
    title: string;
    content: string;
    type?: 'text' | 'chart' | 'table' | 'image';
    data?: any;
  }>;
  showTableOfContents?: boolean;
  confidential?: boolean;
  footerText?: string;
}
```

### Certificate Template

```typescript
interface CertificateData {
  title: string;
  subtitle?: string;
  certificateNumber?: string;
  issueDate: string;
  expiryDate?: string;
  recipientName: string;
  recipientTitle?: string;
  achievement: string;
  description?: string;
  course?: string;
  hours?: number;
  grade?: string;
  score?: number;
  organizationName: string;
  organizationLogo?: string;
  signatures?: Array<{
    name: string;
    title: string;
    signature?: string;
  }>;
  theme?: 'classic' | 'modern' | 'elegant' | 'corporate';
  borderStyle?: 'ornate' | 'simple' | 'none';
  primaryColor?: string;
  secondaryColor?: string;
}
```

## Configuration Options

### PDFGenerator Options

```typescript
interface PDFGeneratorOptions {
  headless?: boolean;        // Use headless browser (default: true)
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  debug?: boolean;           // Enable debug mode
}
```

### HTML to PDF Options

```typescript
interface HTMLToPDFOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  margin?: PDFMargin;
  printBackground?: boolean;  // Include background colors/images
  landscape?: boolean;        // Landscape orientation
  css?: string;              // Custom CSS to inject
  waitForSelector?: string;  // Wait for element before generating
  waitForNavigation?: boolean;
  headerTemplate?: string;   // HTML header template
  footerTemplate?: string;   // HTML footer template
  displayHeaderFooter?: boolean;
  scale?: number;            // Page scale (0.1 - 2)
  width?: string | number;   // Custom page width
  height?: string | number;  // Custom page height
  preferCSSPageSize?: boolean;
}
```

## Server vs Client Usage

### Server-side (Node.js)

Use Puppeteer for HTML to PDF conversion:

```typescript
import { PDFGenerator } from 'philjs-pdf';

// Server-side rendering with Puppeteer
const pdf = new PDFGenerator({ headless: true });
const buffer = await pdf.generateFromHtml(html);
await pdf.close();
```

### Client-side (Browser)

Use @react-pdf/renderer for React component to PDF:

```typescript
import { PDFGenerator } from 'philjs-pdf/client';

// Client-side rendering with @react-pdf/renderer
const pdf = new PDFGenerator();
const blob = await pdf.generateBlobFromComponent(MyDocument);

// Create download link
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'document.pdf';
link.click();
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./templates, ./utils
- Source files: packages/philjs-pdf/src/index.ts, packages/philjs-pdf/src/templates/index.ts, packages/philjs-pdf/src/utils/index.ts

### Public API
- Direct exports: ComponentToPDFOptions, CompressionOptions, HTMLToPDFOptions, MergeOptions, PDFGenerator, PDFGeneratorOptions, PDFMargin, ProtectionOptions, TemplateData, TemplateName, TemplateOptions, WatermarkOptions, createPDFGenerator, htmlToPdf, mergePdfs, templates
- Re-exported names: (none detected)
- Re-exported modules: ./certificate.js, ./fonts.js, ./images.js, ./invoice.js, ./report.js, ./tables.js, ./templates/index.js, ./utils/fonts.js, ./utils/images.js, ./utils/tables.js
<!-- API_SNAPSHOT_END -->

## License

MIT
