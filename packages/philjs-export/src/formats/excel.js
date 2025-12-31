/**
 * Excel Export Module
 * Handles Excel generation with multiple sheets and styling
 */
import * as XLSX from 'xlsx';
/**
 * Create an Excel workbook from multiple sheets
 */
export function createWorkbook(sheets, options = {}) {
    const workbook = XLSX.utils.book_new();
    // Set workbook properties
    workbook.Props = {
        CreatedDate: new Date(),
    };
    if (options.title !== undefined) {
        workbook.Props.Title = options.title;
    }
    if (options.author !== undefined) {
        workbook.Props.Author = options.author;
    }
    for (const sheetConfig of sheets) {
        const worksheet = createSheet(sheetConfig, options);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.name);
    }
    return workbook;
}
/**
 * Create a single worksheet
 */
export function createSheet(config, options = {}) {
    const { data, columns, headerStyle, freezeRows, freezeCols, autoFilter, merges } = config;
    // Determine columns
    const cols = columns ||
        (data[0]
            ? Object.keys(data[0]).map(key => ({
                key,
                header: key,
            }))
            : []);
    // Build the worksheet data
    const wsData = [];
    // Add header row
    const headerRow = cols.map(col => col.header);
    wsData.push(headerRow);
    // Add data rows
    for (const row of data) {
        const rowData = cols.map(col => {
            const value = row[col.key];
            if (col.format) {
                return col.format(value);
            }
            return formatCellValue(value, options);
        });
        wsData.push(rowData);
    }
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths
    worksheet['!cols'] = cols.map(col => ({
        wch: col.width || calculateColumnWidth(col.header, data, col.key),
    }));
    // Apply header styles
    const defaultHeader = options.defaultHeaderStyle || headerStyle;
    if (defaultHeader) {
        for (let i = 0; i < cols.length; i++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = convertStyleToXLSX(cols[i].headerStyle || defaultHeader);
            }
        }
    }
    // Apply cell styles
    if (config.rowStyles || options.defaultCellStyle) {
        for (let r = 1; r <= data.length; r++) {
            const isEven = r % 2 === 0;
            const rowStyle = isEven ? config.rowStyles?.even : config.rowStyles?.odd;
            const style = rowStyle || options.defaultCellStyle;
            if (style) {
                for (let c = 0; c < cols.length; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r, c });
                    if (worksheet[cellRef]) {
                        worksheet[cellRef].s = convertStyleToXLSX(cols[c].style || style);
                    }
                }
            }
        }
    }
    // Apply freeze panes
    if (freezeRows || freezeCols) {
        worksheet['!freeze'] = {
            xSplit: freezeCols || 0,
            ySplit: freezeRows || 0,
        };
    }
    // Apply auto filter
    if (autoFilter) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
    // Apply merges
    if (merges && merges.length > 0) {
        worksheet['!merges'] = merges.map(merge => ({
            s: { r: merge.start.row, c: merge.start.col },
            e: { r: merge.end.row, c: merge.end.col },
        }));
    }
    return worksheet;
}
/**
 * Convert data to Excel buffer
 */
export function toExcelBuffer(sheets, options = {}) {
    const workbook = createWorkbook(sheets, options);
    return XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        compression: true,
    });
}
/**
 * Convert data to Excel Blob
 */
export function toExcelBlob(sheets, options = {}) {
    const buffer = toExcelBuffer(sheets, options);
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
}
/**
 * Stream large datasets to Excel with progress tracking
 */
export async function streamToExcel(data, sheetName, options = {}) {
    const { chunkSize = 10000, onProgress } = options;
    const allData = [];
    let processedRows = 0;
    const isArray = Array.isArray(data);
    const totalRows = isArray ? data.length : undefined;
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
    return toExcelBlob([{ name: sheetName, data: allData }], options);
}
/**
 * Calculate optimal column width
 */
function calculateColumnWidth(header, data, key) {
    let maxWidth = header.length;
    for (const row of data.slice(0, 100)) {
        // Sample first 100 rows
        const value = row[key];
        if (value !== null && value !== undefined) {
            const length = String(value).length;
            if (length > maxWidth) {
                maxWidth = length;
            }
        }
    }
    // Add some padding and cap at reasonable max
    return Math.min(Math.max(maxWidth + 2, 8), 50);
}
/**
 * Format cell value for Excel
 */
function formatCellValue(value, _options) {
    if (value === null || value === undefined) {
        return '';
    }
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    return String(value);
}
/**
 * Convert our style format to XLSX style format
 */
function convertStyleToXLSX(style) {
    const xlsxStyle = {};
    if (style.font) {
        xlsxStyle['font'] = {
            name: style.font.name,
            sz: style.font.size,
            bold: style.font.bold,
            italic: style.font.italic,
            underline: style.font.underline,
            color: style.font.color ? { rgb: style.font.color.replace('#', '') } : undefined,
        };
    }
    if (style.fill) {
        xlsxStyle['fill'] = {
            patternType: style.fill.patternType || 'solid',
            fgColor: style.fill.fgColor ? { rgb: style.fill.fgColor.replace('#', '') } : undefined,
            bgColor: style.fill.bgColor ? { rgb: style.fill.bgColor.replace('#', '') } : undefined,
        };
    }
    if (style.border) {
        xlsxStyle['border'] = {
            top: style.border.top
                ? { style: style.border.top.style, color: { rgb: style.border.top.color?.replace('#', '') } }
                : undefined,
            bottom: style.border.bottom
                ? { style: style.border.bottom.style, color: { rgb: style.border.bottom.color?.replace('#', '') } }
                : undefined,
            left: style.border.left
                ? { style: style.border.left.style, color: { rgb: style.border.left.color?.replace('#', '') } }
                : undefined,
            right: style.border.right
                ? { style: style.border.right.style, color: { rgb: style.border.right.color?.replace('#', '') } }
                : undefined,
        };
    }
    if (style.alignment) {
        xlsxStyle['alignment'] = {
            horizontal: style.alignment.horizontal,
            vertical: style.alignment.vertical,
            wrapText: style.alignment.wrapText,
        };
    }
    if (style.numFmt) {
        xlsxStyle['numFmt'] = style.numFmt;
    }
    return xlsxStyle;
}
/**
 * Parse Excel file to data
 */
export function parseExcel(buffer, options = {}) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = options.sheetName || (options.sheetIndex !== undefined
        ? workbook.SheetNames[options.sheetIndex]
        : workbook.SheetNames[0]);
    const worksheet = workbook.Sheets[sheetName];
    const jsonOptions = {
        defval: '',
    };
    if (options.header === false) {
        jsonOptions.header = 1;
    }
    return XLSX.utils.sheet_to_json(worksheet, jsonOptions);
}
//# sourceMappingURL=excel.js.map