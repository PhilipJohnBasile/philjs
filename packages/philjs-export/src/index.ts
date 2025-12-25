/**
 * PhilJS Export
 *
 * Data export utilities for CSV, Excel, JSON, XML, YAML, and PDF formats
 */

// Re-export formats
export * from './formats/index.js';

// Re-export utils
export * from './utils/index.js';

// Re-export components
export * from './components/index.js';

// Re-export hooks
export * from './hooks.js';

// Types
export interface ExportOptions {
  filename?: string;
  format?: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
  download?: boolean;
  title?: string;
  onProgress?: (progress: number) => void;
  // CSV options
  delimiter?: string;
  includeHeader?: boolean;
  // Excel options
  sheetName?: string;
  autoFilter?: boolean;
  freezeHeader?: boolean;
  // JSON options
  pretty?: boolean;
  indent?: number;
  // Allow additional properties
  [key: string]: unknown;
}

/**
 * Download a file to the user's device
 */
export function downloadFile(blob: Blob, filename: string, _mimeType?: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and optionally download
 */
export async function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): Promise<Blob> {
  const { toCSV, createCSVBlob } = await import('./formats/csv.js');
  const csv = toCSV(data);
  const blob = createCSVBlob(csv);

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.csv');
  }

  return blob;
}

/**
 * Export data to Excel and optionally download
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): Promise<Blob> {
  const { toExcelBlob } = await import('./formats/excel.js');
  const blob = toExcelBlob([{ name: options.sheetName || 'Sheet1', data }], options);

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.xlsx');
  }

  return blob;
}

/**
 * Export data to JSON and optionally download
 */
export async function exportToJSON<T>(
  data: T,
  options: ExportOptions = {}
): Promise<Blob> {
  const { toJSON, createJSONBlob } = await import('./formats/json.js');
  const json = toJSON(data);
  const blob = createJSONBlob(json);

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.json');
  }

  return blob;
}

/**
 * Export data to XML and optionally download
 */
export async function exportToXML<T>(
  data: T,
  options: ExportOptions = {}
): Promise<Blob> {
  const { toXML, createXMLBlob } = await import('./formats/xml.js');
  const xml = toXML(data);
  const blob = createXMLBlob(xml);

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.xml');
  }

  return blob;
}

/**
 * Export data to YAML and optionally download
 */
export async function exportToYAML<T>(
  data: T,
  options: ExportOptions = {}
): Promise<Blob> {
  const { toYAML, createYAMLBlob } = await import('./formats/yaml.js');
  const yaml = toYAML(data);
  const blob = createYAMLBlob(yaml);

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.yaml');
  }

  return blob;
}

/**
 * Export data to PDF (stub - requires additional implementation)
 */
export async function exportToPDF<T>(
  _data: T,
  options: ExportOptions = {}
): Promise<Blob> {
  // PDF export requires jspdf or similar library
  // This is a stub implementation
  console.warn('PDF export not fully implemented');
  const blob = new Blob(['PDF export not implemented'], { type: 'application/pdf' });

  if (options.download !== false) {
    downloadFile(blob, options.filename || 'export.pdf');
  }

  return blob;
}
