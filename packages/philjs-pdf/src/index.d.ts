/**
 * PhilJS PDF - PDF Generation and Manipulation
 *
 * Supports both server-side (Puppeteer) and client-side (@react-pdf/renderer) generation.
 */
export * from './utils/fonts.js';
export * from './utils/images.js';
export * from './utils/tables.js';
export * from './templates/index.js';
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
/**
 * Main PDF generation class supporting multiple generation methods
 */
export declare class PDFGenerator {
    private options;
    private browser;
    constructor(options?: PDFGeneratorOptions);
    /**
     * Initialize Puppeteer browser for server-side rendering
     */
    private getBrowser;
    /**
     * Close the browser instance
     */
    close(): Promise<void>;
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
    generateFromHtml(htmlOrUrl: string, options?: HTMLToPDFOptions): Promise<Uint8Array>;
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
    generateFromComponent(Component: React.ComponentType<any>, props?: Record<string, unknown>, options?: ComponentToPDFOptions): Promise<Uint8Array>;
    /**
     * Render React component to PDF and return as Blob (client-side)
     */
    generateBlobFromComponent(Component: React.ComponentType<any>, props?: Record<string, unknown>): Promise<Blob>;
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
    generateFromTemplate(options: TemplateOptions): Promise<Uint8Array>;
    /**
     * Simple template interpolation using {{key}} syntax
     */
    private interpolateTemplate;
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
    merge(pdfs: Uint8Array[], options?: MergeOptions): Promise<Uint8Array>;
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
    addWatermark(pdfBytes: Uint8Array, options: WatermarkOptions): Promise<Uint8Array>;
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
    protect(pdfBytes: Uint8Array, options: ProtectionOptions): Promise<Uint8Array>;
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
    compress(pdfBytes: Uint8Array, options?: CompressionOptions): Promise<Uint8Array>;
    /**
     * Get page count of a PDF
     */
    getPageCount(pdfBytes: Uint8Array): Promise<number>;
    /**
     * Extract specific pages from a PDF
     */
    extractPages(pdfBytes: Uint8Array, pageNumbers: number[]): Promise<Uint8Array>;
    /**
     * Split a PDF into individual pages
     */
    split(pdfBytes: Uint8Array): Promise<Uint8Array[]>;
    /**
     * Add metadata to a PDF
     */
    setMetadata(pdfBytes: Uint8Array, metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
    }): Promise<Uint8Array>;
    /**
     * Get metadata from a PDF
     */
    getMetadata(pdfBytes: Uint8Array): Promise<{
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
    }>;
}
/**
 * Create a new PDFGenerator instance
 */
export declare function createPDFGenerator(options?: PDFGeneratorOptions): PDFGenerator;
/**
 * Quick HTML to PDF conversion
 */
export declare function htmlToPdf(html: string, options?: HTMLToPDFOptions): Promise<Uint8Array>;
/**
 * Quick merge of multiple PDFs
 */
export declare function mergePdfs(pdfs: Uint8Array[], options?: MergeOptions): Promise<Uint8Array>;
export default PDFGenerator;
//# sourceMappingURL=index.d.ts.map