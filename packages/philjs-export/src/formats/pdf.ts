/**
 * PDF Export Module
 * Handles PDF generation with tables and styling using jsPDF
 */

import { jsPDF } from 'jspdf';
import autoTable, { type UserOptions, type RowInput } from 'jspdf-autotable';

/** jsPDF with autoTable extension */
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export interface PDFStyle {
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
  textColor?: string | [number, number, number];
  fillColor?: string | [number, number, number];
  halign?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  cellPadding?: number;
}

export interface PDFColumnConfig {
  key: string;
  header: string;
  width?: number | 'auto' | 'wrap';
  style?: PDFStyle;
  headerStyle?: PDFStyle;
  format?: (value: unknown) => string;
}

export interface PDFTableConfig<T = Record<string, unknown>> {
  data: T[];
  columns?: PDFColumnConfig[];
  title?: string;
  headerStyle?: PDFStyle;
  bodyStyle?: PDFStyle;
  alternateRowStyle?: PDFStyle;
  showHeader?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface PDFOptions {
  /** Document title */
  title?: string;
  /** Document author */
  author?: string;
  /** Document subject */
  subject?: string;
  /** Document keywords */
  keywords?: string;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Page format */
  format?: 'a4' | 'letter' | 'legal' | [number, number];
  /** Default font size */
  fontSize?: number;
  /** Header text to show on each page */
  header?: string;
  /** Footer text to show on each page */
  footer?: string;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Margins */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface StreamingPDFOptions extends PDFOptions {
  /** Chunk size for processing */
  chunkSize?: number;
  /** Progress callback */
  onProgress?: (progress: number, processedRows: number) => void;
}

/**
 * Create a PDF document from data
 */
export function createPDF<T extends Record<string, unknown>>(
  data: T[],
  options: PDFOptions = {}
): jsPDF {
  const {
    title,
    author,
    subject,
    keywords,
    orientation = 'portrait',
    format = 'a4',
    fontSize = 10,
    header,
    footer,
    showPageNumbers = true,
    margin = {},
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  // Set document properties
  doc.setProperties({
    title: title || 'Export',
    author: author || 'PhilJS Export',
    subject: subject || '',
    keywords: keywords || '',
    creator: 'PhilJS Export',
  });

  // Set default font
  doc.setFontSize(fontSize);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = margin.top ?? 20;
  const marginRight = margin.right ?? 14;
  const marginBottom = margin.bottom ?? 20;
  const marginLeft = margin.left ?? 14;

  let currentY = marginTop;

  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
  }

  // Generate columns from data keys if not provided
  const columns = data[0]
    ? Object.keys(data[0]).map(key => ({
        key,
        header: formatHeader(key),
      }))
    : [];

  // Convert data to table format
  const tableHeaders = columns.map(col => col.header);
  const tableBody: RowInput[] = data.map(row =>
    columns.map(col => formatCellValue((row as Record<string, unknown>)[col.key]))
  );

  // Add table using autoTable
  const tableOptions: UserOptions = {
    startY: currentY,
    head: [tableHeaders],
    body: tableBody,
    margin: { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft },
    styles: {
      fontSize: fontSize - 1,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (hookData) => {
      // Add header on each page
      if (header) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(header, marginLeft, 10);
        doc.setTextColor(0);
        doc.setFontSize(fontSize);
      }

      // Add footer and page numbers on each page
      const footerY = pageHeight - 10;
      if (footer || showPageNumbers) {
        doc.setFontSize(8);
        doc.setTextColor(100);

        if (footer) {
          doc.text(footer, marginLeft, footerY);
        }

        if (showPageNumbers) {
          const pageNumber = `Page ${hookData.pageNumber}`;
          doc.text(pageNumber, pageWidth - marginRight, footerY, { align: 'right' });
        }

        doc.setTextColor(0);
        doc.setFontSize(fontSize);
      }
    },
  };

  (autoTable as unknown as (doc: jsPDF, options: UserOptions) => void)(doc, tableOptions);

  return doc;
}

/**
 * Create a PDF with multiple tables
 */
export function createMultiTablePDF<T extends Record<string, unknown>>(
  tables: PDFTableConfig<T>[],
  options: PDFOptions = {}
): jsPDF {
  const {
    title,
    orientation = 'portrait',
    format = 'a4',
    fontSize = 10,
    margin = {},
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginTop = margin.top ?? 20;
  const marginRight = margin.right ?? 14;
  const marginBottom = margin.bottom ?? 20;
  const marginLeft = margin.left ?? 14;

  let currentY = marginTop;

  // Add document title
  if (title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
  }

  // Add each table
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]!;
    const { data, columns: tableColumns, title: tableTitle, showHeader = true } = table;

    // Add table title
    if (tableTitle) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(tableTitle, marginLeft, currentY);
      currentY += 8;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
    }

    // Generate columns if not provided
    const columns: PDFColumnConfig[] = tableColumns ?? (data[0]
      ? Object.keys(data[0]).map(key => ({
          key,
          header: formatHeader(key),
        }))
      : []);

    // Convert data to table format
    const tableHeaders = columns.map((col: PDFColumnConfig) => col.header);
    const tableBody: RowInput[] = data.map((row: T) =>
      columns.map((col: PDFColumnConfig) => {
        const value = (row as Record<string, unknown>)[col.key];
        return col.format ? col.format(value) : formatCellValue(value);
      })
    );

    // Add table
    const autoTableOptions: UserOptions = {
      startY: currentY,
      body: tableBody,
      margin: { left: marginLeft, right: marginRight },
      styles: { fontSize: fontSize - 1 },
      headStyles: convertStyleToAutoTable(table.headerStyle),
      bodyStyles: convertStyleToAutoTable(table.bodyStyle),
      alternateRowStyles: table.alternateRowStyle
        ? convertStyleToAutoTable(table.alternateRowStyle)
        : { fillColor: [250, 250, 250] },
    };
    if (showHeader) {
      autoTableOptions.head = [tableHeaders];
    }
    (autoTable as unknown as (doc: jsPDF, options: UserOptions) => void)(doc, autoTableOptions);

    // Update Y position for next table
    currentY = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? currentY + 15;

    // Add new page if needed (except for last table)
    if (i < tables.length - 1 && currentY > doc.internal.pageSize.getHeight() - marginBottom - 50) {
      doc.addPage();
      currentY = marginTop;
    }
  }

  return doc;
}

/**
 * Convert data to PDF ArrayBuffer
 */
export function toPDFBuffer<T extends Record<string, unknown>>(
  data: T[],
  options: PDFOptions = {}
): ArrayBuffer {
  const doc = createPDF(data, options);
  return doc.output('arraybuffer');
}

/**
 * Convert data to PDF Blob
 */
export function toPDFBlob<T extends Record<string, unknown>>(
  data: T[],
  options: PDFOptions = {}
): Blob {
  const doc = createPDF(data, options);
  return doc.output('blob');
}

/**
 * Convert data to PDF base64 string
 */
export function toPDFBase64<T extends Record<string, unknown>>(
  data: T[],
  options: PDFOptions = {}
): string {
  const doc = createPDF(data, options);
  return doc.output('datauristring');
}

/**
 * Stream large datasets to PDF with progress tracking
 */
export async function streamToPDF<T extends Record<string, unknown>>(
  data: T[] | AsyncIterable<T>,
  options: StreamingPDFOptions = {}
): Promise<Blob> {
  const { chunkSize = 1000, onProgress } = options;

  const allData: T[] = [];
  let processedRows = 0;
  const isArray = Array.isArray(data);
  const totalRows = isArray ? data.length : undefined;

  const iterate = async function* () {
    if (isArray) {
      for (const item of data) {
        yield item;
      }
    } else {
      for await (const item of data as AsyncIterable<T>) {
        yield item;
      }
    }
  };

  for await (const item of iterate()) {
    allData.push(item);
    processedRows++;

    if (processedRows % chunkSize === 0) {
      if (totalRows) {
        onProgress?.(processedRows / totalRows, processedRows);
      }
      // Yield to event loop for large datasets
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress?.(1, processedRows);

  return toPDFBlob(allData, options);
}

/**
 * Add a chart or image to PDF
 */
export function addImageToPDF(
  doc: jsPDF,
  imageData: string | HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  format: 'JPEG' | 'PNG' | 'GIF' | 'WEBP' = 'PNG'
): void {
  doc.addImage(imageData, format, x, y, width, height);
}

/**
 * Format header from camelCase or snake_case to Title Case
 */
function formatHeader(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Format cell value for PDF
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Convert PDFStyle to autoTable style format
 */
function convertStyleToAutoTable(style?: PDFStyle): Record<string, unknown> {
  if (!style) return {};

  const result: Record<string, unknown> = {};

  if (style.fontSize) result['fontSize'] = style.fontSize;
  if (style.fontStyle) result['fontStyle'] = style.fontStyle;
  if (style.textColor) result['textColor'] = parseColor(style.textColor);
  if (style.fillColor) result['fillColor'] = parseColor(style.fillColor);
  if (style.halign) result['halign'] = style.halign;
  if (style.valign) result['valign'] = style.valign;
  if (style.cellPadding) result['cellPadding'] = style.cellPadding;

  return result;
}

/**
 * Parse color string or RGB array
 */
function parseColor(color: string | [number, number, number]): [number, number, number] {
  if (Array.isArray(color)) {
    return color;
  }

  // Parse hex color
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  }

  // Default to black
  return [0, 0, 0];
}
