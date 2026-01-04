/**
 * CSV Export Module
 * Handles CSV generation with streaming support for large datasets
 */
import * as Papa from 'papaparse';
/**
 * Convert data to CSV string
 */
export function toCSV(data, options = {}) {
    const { delimiter = ',', header = true, quoteChar = '"', escapeChar = '"', newline = '\r\n', columns, columnHeaders, skipEmptyLines = true, transformRow, } = options;
    // Transform rows if needed
    const transformedData = transformRow ? data.map(transformRow) : data;
    // Get columns from first row if not specified
    const cols = columns || (transformedData[0] ? Object.keys(transformedData[0]) : []);
    // Apply column header mapping
    const headerRow = cols.map(col => columnHeaders?.[col] ?? col);
    const result = Papa.unparse({
        fields: header ? headerRow : [],
        data: transformedData.map(row => cols.map(col => row[col])),
    }, {
        delimiter,
        quotes: true,
        quoteChar,
        escapeChar,
        newline,
        skipEmptyLines,
    });
    return result;
}
/**
 * Stream large datasets to CSV with progress tracking
 */
export async function* streamToCSV(data, options = {}) {
    const { delimiter = ',', header = true, quoteChar = '"', columns, columnHeaders, chunkSize = 1000, onProgress, onChunk, transformRow, } = options;
    let cols = null;
    let processedRows = 0;
    let chunkIndex = 0;
    let currentChunk = [];
    let isFirstChunk = true;
    const isArray = Array.isArray(data);
    const totalRows = isArray ? data.length : undefined;
    const processChunk = (chunk, includeHeader) => {
        if (!cols && chunk.length > 0) {
            cols = columns || Object.keys(chunk[0]);
        }
        if (!cols)
            return '';
        const headerRow = cols.map(col => columnHeaders?.[col] ?? col);
        const rows = chunk.map(row => cols.map(col => formatCSVValue(row[col], quoteChar, delimiter)));
        let result = '';
        if (includeHeader && header) {
            result = headerRow.map(h => formatCSVValue(h, quoteChar, delimiter)).join(delimiter) + '\r\n';
        }
        result += rows.map(row => row.join(delimiter)).join('\r\n');
        return result;
    };
    const iterate = async function* () {
        if (isArray) {
            for (const item of data) {
                yield item;
            }
        }
        else {
            for await (const item of data) {
                yield item;
            }
        }
    };
    for await (const item of iterate()) {
        const transformedItem = transformRow ? transformRow(item) : item;
        currentChunk.push(transformedItem);
        processedRows++;
        if (currentChunk.length >= chunkSize) {
            const csvChunk = processChunk(currentChunk, isFirstChunk);
            if (csvChunk) {
                onChunk?.(csvChunk, chunkIndex);
                yield (isFirstChunk ? '' : '\r\n') + csvChunk;
            }
            currentChunk = [];
            isFirstChunk = false;
            chunkIndex++;
            if (totalRows) {
                onProgress?.(processedRows / totalRows, processedRows);
            }
        }
    }
    // Process remaining items
    if (currentChunk.length > 0) {
        const csvChunk = processChunk(currentChunk, isFirstChunk);
        if (csvChunk) {
            onChunk?.(csvChunk, chunkIndex);
            yield (isFirstChunk ? '' : '\r\n') + csvChunk;
        }
    }
    onProgress?.(1, processedRows);
}
/**
 * Format a value for CSV, handling escaping
 */
function formatCSVValue(value, quoteChar, delimiter) {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    // Check if quoting is needed
    const needsQuoting = str.includes(delimiter) ||
        str.includes(quoteChar) ||
        str.includes('\n') ||
        str.includes('\r');
    if (needsQuoting) {
        // Escape quote characters by doubling them
        const escaped = str.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar);
        return quoteChar + escaped + quoteChar;
    }
    return str;
}
/**
 * Parse CSV string to data
 */
export function parseCSV(csv, options = {}) {
    const config = {
        header: options.header ?? true,
        dynamicTyping: options.dynamicTyping ?? true,
        skipEmptyLines: true,
        download: false,
        worker: false,
    };
    if (options.transformHeader) {
        config.transformHeader = options.transformHeader;
    }
    const result = Papa.parse(csv, config);
    if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
    }
    return result.data;
}
/**
 * Create a CSV Blob for download
 */
export function createCSVBlob(csv) {
    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    return new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
}
//# sourceMappingURL=csv.js.map