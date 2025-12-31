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
/**
 * Download a file to the user's device
 */
export function downloadFile(blob, filename, _mimeType) {
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
export async function exportToCSV(data, options = {}) {
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
export async function exportToExcel(data, options = {}) {
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
export async function exportToJSON(data, options = {}) {
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
export async function exportToXML(data, options = {}) {
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
export async function exportToYAML(data, options = {}) {
    const { toYAML, createYAMLBlob } = await import('./formats/yaml.js');
    const yaml = toYAML(data);
    const blob = createYAMLBlob(yaml);
    if (options.download !== false) {
        downloadFile(blob, options.filename || 'export.yaml');
    }
    return blob;
}
/**
 * Export data to PDF and optionally download
 */
export async function exportToPDF(data, options = {}) {
    const { toPDFBlob, htmlToPDF } = await import('./formats/pdf.js');
    let blob;
    // Handle different input types
    if (typeof data === 'string') {
        // HTML string - convert to PDF
        blob = await htmlToPDF(data, options);
    }
    else if (isHTMLElement(data)) {
        // DOM element - convert to PDF
        blob = await htmlToPDF(data, options);
    }
    else if (Array.isArray(data)) {
        // Data array - create table PDF
        blob = toPDFBlob(data, options);
    }
    else {
        // Single object - wrap in array
        blob = toPDFBlob([data], options);
    }
    if (options.download !== false) {
        downloadFile(blob, options.filename || 'export.pdf');
    }
    return blob;
}
/**
 * Check if value is an HTML element
 */
function isHTMLElement(value) {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}
//# sourceMappingURL=index.js.map