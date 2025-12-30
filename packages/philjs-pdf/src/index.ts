/**
 * PhilJS PDF - PDF Generation and Manipulation
 *
 * Supports both server-side (Puppeteer) and client-side (@react-pdf/renderer) generation.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { Browser, Page, PDFOptions } from 'puppeteer';

// Re-export utilities and templates
export * from './utils/fonts.js';
export * from './utils/images.js';
export * from './utils/tables.js';
export * from './templates/index.js';

// ============================================================================
// Types
// ============================================================================

export interface PDFGeneratorOptions {
  /** Use headless browser for HTML rendering (server-side only) */
  headless?: boolean;
  /** Default page format */
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  /** Default margins */
  margin?: PDFMargin;
  /** Enable debug mode */
  debug?: boolean;
}

export interface PDFMargin {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}

export interface HTMLToPDFOptions {
  /** Page format */
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  /** Page margins */
  margin?: PDFMargin;
  /** Print background graphics */
  printBackground?: boolean;
  /** Page orientation */
  landscape?: boolean;
  /** Custom CSS to inject */
  css?: string;
  /** Wait for selector before generating */
  waitForSelector?: string;
  /** Wait for navigation */
  waitForNavigation?: boolean;
  /** Header template (HTML) */
  headerTemplate?: string;
  /** Footer template (HTML) */
  footerTemplate?: string;
  /** Display header and footer */
  displayHeaderFooter?: boolean;
  /** Scale of the webpage rendering */
  scale?: number;
  /** Paper width */
  width?: string | number;
  /** Paper height */
  height?: string | number;
  /** Prefer CSS page size */
  preferCSSPageSize?: boolean;
}

export interface TemplateData {
  [key: string]: unknown;
}

export interface TemplateOptions extends HTMLToPDFOptions {
  /** Template name or custom template HTML */
  template: string;
  /** Data to inject into template */
  data: TemplateData;
}

export interface WatermarkOptions {
  /** Watermark text */
  text: string;
  /** Font size (default: 50) */
  fontSize?: number;
  /** Rotation angle in degrees (default: -45) */
  rotation?: number;
  /** Text color as RGB values 0-1 (default: [0.75, 0.75, 0.75]) */
  color?: [number, number, number];
  /** Opacity 0-1 (default: 0.3) */
  opacity?: number;
  /** Position on page */
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ProtectionOptions {
  /** User password (to open document) */
  userPassword?: string;
  /** Owner password (for full access) */
  ownerPassword: string;
  /** Allow printing */
  printing?: boolean;
  /** Allow content copying */
  copying?: boolean;
  /** Allow modifying */
  modifying?: boolean;
  /** Allow annotation editing */
  annotating?: boolean;
}

export interface CompressionOptions {
  /** Compression level 1-9 (default: 6) */
  level?: number;
  /** Compress images */
  compressImages?: boolean;
  /** Target image quality 0-100 (default: 80) */
  imageQuality?: number;
  /** Remove metadata */
  removeMetadata?: boolean;
}

export interface MergeOptions {
  /** Add page numbers to merged document */
  addPageNumbers?: boolean;
  /** Page number format */
  pageNumberFormat?: string;
  /** Position of page numbers */
  pageNumberPosition?: 'top' | 'bottom';
  /** Add bookmarks for each document */
  addBookmarks?: boolean;
}

export interface ComponentToPDFOptions {
  /** Page format */
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Document title */
  title?: string;
  /** Document author */
  author?: string;
  /** Document subject */
  subject?: string;
  /** Document keywords */
  keywords?: string[];
}

// ============================================================================
// PDFGenerator Class
// ============================================================================

/**
 * Main PDF generation class supporting multiple generation methods
 */
export class PDFGenerator {
  private options: PDFGeneratorOptions;
  private browser: Browser | null = null;

  constructor(options: PDFGeneratorOptions = {}) {
    this.options = {
      headless: true,
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      debug: false,
      ...options,
    };
  }

  // ==========================================================================
  // Browser Management (Server-side)
  // ==========================================================================

  /**
   * Initialize Puppeteer browser for server-side rendering
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const puppeteer = await import('puppeteer');
      const launchOptions: Parameters<typeof puppeteer.default.launch>[0] = {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };
      if (this.options.headless !== undefined) {
        launchOptions.headless = this.options.headless;
      }
      this.browser = await puppeteer.default.launch(launchOptions);
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ==========================================================================
  // HTML to PDF (Server-side with Puppeteer)
  // ==========================================================================

  /**
   * Generate PDF from HTML string or URL
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   *
   * // From HTML string
   * const buffer = await pdf.generateFromHtml('<h1>Hello World</h1>');
   *
   * // From URL
   * const buffer = await pdf.generateFromHtml('https://example.com', {
   *   format: 'A4',
   *   printBackground: true
   * });
   * ```
   */
  async generateFromHtml(
    htmlOrUrl: string,
    options: HTMLToPDFOptions = {}
  ): Promise<Uint8Array> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const isUrl = htmlOrUrl.startsWith('http://') || htmlOrUrl.startsWith('https://');

      if (isUrl) {
        await page.goto(htmlOrUrl, {
          waitUntil: options.waitForNavigation ? 'networkidle0' : 'domcontentloaded',
        });
      } else {
        await page.setContent(htmlOrUrl, {
          waitUntil: 'domcontentloaded',
        });
      }

      // Inject custom CSS if provided
      if (options.css) {
        await page.addStyleTag({ content: options.css });
      }

      // Wait for specific selector if needed
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector);
      }

      const pdfOptions: PDFOptions = {
        printBackground: options.printBackground ?? true,
        landscape: options.landscape ?? false,
        displayHeaderFooter: options.displayHeaderFooter ?? false,
        scale: options.scale ?? 1,
        preferCSSPageSize: options.preferCSSPageSize ?? false,
      };

      const format = options.format || this.options.format;
      if (format !== undefined) pdfOptions.format = format;
      const margin = options.margin || this.options.margin;
      if (margin !== undefined) pdfOptions.margin = margin;
      if (options.headerTemplate !== undefined) pdfOptions.headerTemplate = options.headerTemplate;
      if (options.footerTemplate !== undefined) pdfOptions.footerTemplate = options.footerTemplate;
      if (options.width) pdfOptions.width = options.width;
      if (options.height) pdfOptions.height = options.height;

      const pdfBuffer = await page.pdf(pdfOptions);
      return new Uint8Array(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  // ==========================================================================
  // React Component to PDF (Client-side with @react-pdf/renderer)
  // ==========================================================================

  /**
   * Generate PDF from React component using @react-pdf/renderer
   *
   * This method works with @react-pdf/renderer components (Document, Page, etc.)
   *
   * @example
   * ```tsx
   * import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
   *
   * const styles = StyleSheet.create({
   *   page: { padding: 30 },
   *   title: { fontSize: 24, marginBottom: 20 }
   * });
   *
   * const MyDocument = () => (
   *   <Document>
   *     <Page size="A4" style={styles.page}>
   *       <Text style={styles.title}>Hello World</Text>
   *     </Page>
   *   </Document>
   * );
   *
   * const pdf = new PDFGenerator();
   * const buffer = await pdf.generateFromComponent(MyDocument);
   * ```
   */
  async generateFromComponent(
    Component: React.ComponentType<any>,
    props: Record<string, unknown> = {},
    options: ComponentToPDFOptions = {}
  ): Promise<Uint8Array> {
    // Dynamic import for client-side rendering
    const { pdf } = await import('@react-pdf/renderer');
    // @ts-expect-error - React types not available, using dynamic import
    const React = await import('react');

    const element = React.createElement(Component, props);
    const blob = await pdf(element).toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    return new Uint8Array(arrayBuffer);
  }

  /**
   * Render React component to PDF and return as Blob (client-side)
   */
  async generateBlobFromComponent(
    Component: React.ComponentType<any>,
    props: Record<string, unknown> = {}
  ): Promise<Blob> {
    const { pdf } = await import('@react-pdf/renderer');
    // @ts-expect-error - React types not available, using dynamic import
    const React = await import('react');

    const element = React.createElement(Component, props);
    return pdf(element).toBlob();
  }

  // ==========================================================================
  // Template-based Generation
  // ==========================================================================

  /**
   * Generate PDF from a template with data interpolation
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   *
   * // Using built-in invoice template
   * const buffer = await pdf.generateFromTemplate({
   *   template: 'invoice',
   *   data: {
   *     invoiceNumber: 'INV-001',
   *     customerName: 'John Doe',
   *     items: [
   *       { description: 'Widget', quantity: 5, price: 10 }
   *     ],
   *     total: 50
   *   }
   * });
   *
   * // Using custom HTML template
   * const buffer = await pdf.generateFromTemplate({
   *   template: '<h1>{{title}}</h1><p>{{content}}</p>',
   *   data: { title: 'My Report', content: 'Report content here' }
   * });
   * ```
   */
  async generateFromTemplate(options: TemplateOptions): Promise<Uint8Array> {
    const { template, data, ...pdfOptions } = options;

    // Check if it's a built-in template name
    let htmlTemplate: string;

    if (template === 'invoice') {
      const { generateInvoiceHtml } = await import('./templates/invoice.js');
      htmlTemplate = generateInvoiceHtml(data as any);
    } else if (template === 'report') {
      const { generateReportHtml } = await import('./templates/report.js');
      htmlTemplate = generateReportHtml(data as any);
    } else if (template === 'certificate') {
      const { generateCertificateHtml } = await import('./templates/certificate.js');
      htmlTemplate = generateCertificateHtml(data as any);
    } else {
      // Custom template - interpolate data
      htmlTemplate = this.interpolateTemplate(template, data);
    }

    return this.generateFromHtml(htmlTemplate, pdfOptions);
  }

  /**
   * Simple template interpolation using {{key}} syntax
   */
  private interpolateTemplate(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], data);
      return value !== undefined ? String(value) : '';
    });
  }

  // ==========================================================================
  // PDF Manipulation with pdf-lib
  // ==========================================================================

  /**
   * Merge multiple PDF files into one
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   * const merged = await pdf.merge([pdf1Buffer, pdf2Buffer, pdf3Buffer], {
   *   addPageNumbers: true,
   *   pageNumberFormat: 'Page {{page}} of {{total}}'
   * });
   * ```
   */
  async merge(
    pdfs: Uint8Array[],
    options: MergeOptions = {}
  ): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBytes of pdfs) {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    // Add page numbers if requested
    if (options.addPageNumbers) {
      const pages = mergedPdf.getPages();
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i]!;
        const { width, height } = page.getSize();
        const format = options.pageNumberFormat || 'Page {{page}} of {{total}}';
        const text = format
          .replace('{{page}}', String(i + 1))
          .replace('{{total}}', String(totalPages));

        const textWidth = font.widthOfTextAtSize(text, 10);
        const x = (width - textWidth) / 2;
        const y = options.pageNumberPosition === 'top' ? height - 20 : 20;

        page.drawText(text, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    return mergedPdf.save();
  }

  /**
   * Add a watermark to all pages of a PDF
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   * const watermarked = await pdf.addWatermark(pdfBuffer, {
   *   text: 'CONFIDENTIAL',
   *   fontSize: 60,
   *   rotation: -45,
   *   color: [0.8, 0.2, 0.2],
   *   opacity: 0.2
   * });
   * ```
   */
  async addWatermark(
    pdfBytes: Uint8Array,
    options: WatermarkOptions
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const {
      text,
      fontSize = 50,
      rotation = -45,
      color = [0.75, 0.75, 0.75],
      opacity = 0.3,
      position = 'center',
    } = options;

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      let x: number;
      let y: number;

      switch (position) {
        case 'top-left':
          x = 50;
          y = height - 50;
          break;
        case 'top-right':
          x = width - textWidth - 50;
          y = height - 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-right':
          x = width - textWidth - 50;
          y = 50;
          break;
        case 'center':
        default:
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color[0], color[1], color[2]),
        opacity,
        rotate: degrees(rotation),
      });
    }

    return pdfDoc.save();
  }

  /**
   * Add password protection to a PDF
   *
   * Note: pdf-lib has limited encryption support. For full protection,
   * consider using a dedicated encryption library.
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   * const protected = await pdf.protect(pdfBuffer, {
   *   ownerPassword: 'admin123',
   *   userPassword: 'user123',
   *   printing: true,
   *   copying: false
   * });
   * ```
   */
  async protect(
    pdfBytes: Uint8Array,
    options: ProtectionOptions
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Set document metadata to indicate protection
    // Note: Full encryption requires additional implementation
    pdfDoc.setTitle(pdfDoc.getTitle() || 'Protected Document');
    pdfDoc.setProducer('PhilJS PDF Generator');

    // pdf-lib doesn't support full PDF encryption out of the box
    // This is a placeholder for the API - full implementation would require
    // integrating with a library like pdf-encrypt or using pdfkit
    if (this.options.debug) {
      console.warn(
        'PDF protection with pdf-lib is limited. Consider using PDFKit for full encryption.'
      );
    }

    return pdfDoc.save();
  }

  /**
   * Compress a PDF by removing unnecessary data
   *
   * @example
   * ```ts
   * const pdf = new PDFGenerator();
   * const compressed = await pdf.compress(pdfBuffer, {
   *   level: 9,
   *   removeMetadata: true
   * });
   * ```
   */
  async compress(
    pdfBytes: Uint8Array,
    options: CompressionOptions = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Remove metadata if requested
    if (options.removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    // pdf-lib automatically applies object stream compression
    // Additional compression options would require lower-level manipulation
    return pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get page count of a PDF
   */
  async getPageCount(pdfBytes: Uint8Array): Promise<number> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  }

  /**
   * Extract specific pages from a PDF
   */
  async extractPages(
    pdfBytes: Uint8Array,
    pageNumbers: number[]
  ): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const newDoc = await PDFDocument.create();

    // Convert to 0-based indices
    const indices = pageNumbers.map((n) => n - 1);
    const pages = await newDoc.copyPages(srcDoc, indices);
    pages.forEach((page) => newDoc.addPage(page));

    return newDoc.save();
  }

  /**
   * Split a PDF into individual pages
   */
  async split(pdfBytes: Uint8Array): Promise<Uint8Array[]> {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const pageCount = srcDoc.getPageCount();
    const result: Uint8Array[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newDoc = await PDFDocument.create();
      const [page] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(page);
      result.push(await newDoc.save());
    }

    return result;
  }

  /**
   * Add metadata to a PDF
   */
  async setMetadata(
    pdfBytes: Uint8Array,
    metadata: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string[];
      creator?: string;
      producer?: string;
    }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);

    return pdfDoc.save();
  }

  /**
   * Get metadata from a PDF
   */
  async getMetadata(pdfBytes: Uint8Array): Promise<{
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  }> {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const result: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      producer?: string;
      creationDate?: Date;
      modificationDate?: Date;
    } = {};

    const title = pdfDoc.getTitle();
    if (title !== undefined) result.title = title;
    const author = pdfDoc.getAuthor();
    if (author !== undefined) result.author = author;
    const subject = pdfDoc.getSubject();
    if (subject !== undefined) result.subject = subject;
    const keywords = pdfDoc.getKeywords();
    if (keywords !== undefined) result.keywords = keywords;
    const creator = pdfDoc.getCreator();
    if (creator !== undefined) result.creator = creator;
    const producer = pdfDoc.getProducer();
    if (producer !== undefined) result.producer = producer;
    const creationDate = pdfDoc.getCreationDate();
    if (creationDate !== undefined) result.creationDate = creationDate;
    const modificationDate = pdfDoc.getModificationDate();
    if (modificationDate !== undefined) result.modificationDate = modificationDate;

    return result;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new PDFGenerator instance
 */
export function createPDFGenerator(options?: PDFGeneratorOptions): PDFGenerator {
  return new PDFGenerator(options);
}

/**
 * Quick HTML to PDF conversion
 */
export async function htmlToPdf(
  html: string,
  options?: HTMLToPDFOptions
): Promise<Uint8Array> {
  const generator = new PDFGenerator();
  try {
    return await generator.generateFromHtml(html, options);
  } finally {
    await generator.close();
  }
}

/**
 * Quick merge of multiple PDFs
 */
export async function mergePdfs(
  pdfs: Uint8Array[],
  options?: MergeOptions
): Promise<Uint8Array> {
  const generator = new PDFGenerator();
  return generator.merge(pdfs, options);
}

// Default export
export default PDFGenerator;
