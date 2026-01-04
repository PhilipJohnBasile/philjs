/**
 * Table Generation Utilities for PDF Generation
 */
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
// ============================================================================
// Table Renderer Class
// ============================================================================
/**
 * Renders tables in PDF documents
 */
export class TableRenderer {
    pdfDoc = null;
    defaultFont = null;
    defaultBoldFont = null;
    /**
     * Initialize with a PDF document
     */
    async init(pdfDoc) {
        this.pdfDoc = pdfDoc;
        this.defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        this.defaultBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
    /**
     * Draw a table on a page
     */
    drawTable(page, options) {
        const { x, y, width, columns, data, style = {}, showHeader = true, maxRowsPerPage, } = options;
        const { font = this.defaultFont, headerFont = this.defaultBoldFont, fontSize = 10, headerFontSize = 10, rowHeight = 25, headerHeight = 30, padding = 5, headerBackground = { r: 0.1, g: 0.2, b: 0.4 }, headerColor = { r: 1, g: 1, b: 1 }, alternateRowBackground, borderColor = { r: 0.8, g: 0.8, b: 0.8 }, borderWidth = 1, showHorizontalBorders = true, showVerticalBorders = false, showOuterBorder = true, } = style;
        const paddingValues = typeof padding === 'number'
            ? { top: padding, right: padding, bottom: padding, left: padding }
            : { top: 5, right: 5, bottom: 5, left: 5, ...padding };
        // Calculate column widths
        const columnWidths = this.calculateColumnWidths(columns, width, font, fontSize, data);
        let currentY = y;
        let rowsRendered = 0;
        const startY = y;
        // Draw header
        if (showHeader) {
            // Header background
            page.drawRectangle({
                x,
                y: currentY - headerHeight,
                width,
                height: headerHeight,
                color: rgb(headerBackground.r, headerBackground.g, headerBackground.b),
            });
            // Header text
            let headerX = x;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const colWidth = columnWidths[i];
                const textX = this.getTextX(headerX, colWidth, col.align, paddingValues.left, paddingValues.right);
                page.drawText(col.header, {
                    x: textX,
                    y: currentY - headerHeight / 2 - headerFontSize / 2,
                    size: headerFontSize,
                    font: headerFont,
                    color: rgb(headerColor.r, headerColor.g, headerColor.b),
                });
                headerX += colWidth;
            }
            currentY -= headerHeight;
        }
        // Draw data rows
        const maxRows = maxRowsPerPage || data.length;
        const rowsToDraw = Math.min(data.length, maxRows);
        for (let rowIndex = 0; rowIndex < rowsToDraw; rowIndex++) {
            const row = data[rowIndex];
            const rowY = currentY - rowHeight;
            // Check if row fits on page
            if (rowY < 50) {
                return {
                    endY: currentY,
                    rowsRendered,
                    truncated: rowIndex < data.length,
                    height: startY - currentY,
                };
            }
            // Alternate row background
            if (alternateRowBackground && rowIndex % 2 === 1) {
                page.drawRectangle({
                    x,
                    y: rowY,
                    width,
                    height: rowHeight,
                    color: rgb(alternateRowBackground.r, alternateRowBackground.g, alternateRowBackground.b),
                });
            }
            // Draw row content
            let cellX = x;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const colWidth = columnWidths[i];
                const value = row[col.key];
                const displayValue = col.formatter ? col.formatter(value, row) : String(value ?? '');
                const textX = this.getTextX(cellX, colWidth, col.align, paddingValues.left, paddingValues.right);
                page.drawText(displayValue, {
                    x: textX,
                    y: currentY - rowHeight / 2 - fontSize / 2,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
                cellX += colWidth;
            }
            // Draw horizontal border
            if (showHorizontalBorders) {
                page.drawLine({
                    start: { x, y: rowY },
                    end: { x: x + width, y: rowY },
                    thickness: borderWidth,
                    color: rgb(borderColor.r, borderColor.g, borderColor.b),
                });
            }
            currentY -= rowHeight;
            rowsRendered++;
        }
        // Draw vertical borders
        if (showVerticalBorders) {
            let borderX = x;
            for (let i = 0; i <= columns.length; i++) {
                page.drawLine({
                    start: { x: borderX, y: y },
                    end: { x: borderX, y: currentY },
                    thickness: borderWidth,
                    color: rgb(borderColor.r, borderColor.g, borderColor.b),
                });
                if (i < columns.length) {
                    borderX += columnWidths[i];
                }
            }
        }
        // Draw outer border
        if (showOuterBorder) {
            page.drawRectangle({
                x,
                y: currentY,
                width,
                height: y - currentY,
                borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
                borderWidth,
            });
        }
        return {
            endY: currentY,
            rowsRendered,
            truncated: false,
            height: startY - currentY,
        };
    }
    /**
     * Calculate column widths based on configuration
     */
    calculateColumnWidths(columns, totalWidth, font, fontSize, data) {
        const widths = [];
        let fixedWidth = 0;
        let autoCount = 0;
        let flexCount = 0;
        // First pass: calculate fixed and auto widths
        for (const col of columns) {
            if (typeof col.width === 'number') {
                widths.push(col.width);
                fixedWidth += col.width;
            }
            else if (col.width === 'auto') {
                // Calculate based on content
                let maxWidth = font.widthOfTextAtSize(col.header, fontSize);
                for (const row of data) {
                    const value = String(row[col.key] ?? '');
                    const valueWidth = font.widthOfTextAtSize(value, fontSize);
                    maxWidth = Math.max(maxWidth, valueWidth);
                }
                widths.push(maxWidth + 20); // Add padding
                fixedWidth += maxWidth + 20;
                autoCount++;
            }
            else {
                widths.push(-1); // Placeholder for flex
                flexCount++;
            }
        }
        // Second pass: distribute remaining width to flex columns
        const remainingWidth = totalWidth - fixedWidth;
        const flexWidth = flexCount > 0 ? remainingWidth / flexCount : 0;
        for (let i = 0; i < widths.length; i++) {
            if (widths[i] === -1) {
                widths[i] = flexWidth;
            }
        }
        return widths;
    }
    /**
     * Get text X position based on alignment
     */
    getTextX(cellX, cellWidth, align = 'left', paddingLeft, paddingRight) {
        switch (align) {
            case 'center':
                return cellX + cellWidth / 2 - paddingLeft;
            case 'right':
                return cellX + cellWidth - paddingRight;
            case 'left':
            default:
                return cellX + paddingLeft;
        }
    }
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Create a simple table definition
 */
export function createTable(columns, data) {
    const normalizedColumns = columns.map((col) => {
        if (typeof col === 'string') {
            return {
                header: col,
                key: col.toLowerCase().replace(/\s+/g, '_'),
                width: '*',
            };
        }
        return col;
    });
    return { columns: normalizedColumns, data };
}
/**
 * Format currency value
 */
export function currencyFormatter(currency = '$') {
    return (value) => {
        if (typeof value !== 'number')
            return String(value);
        return `${currency}${value.toFixed(2)}`;
    };
}
/**
 * Format percentage value
 */
export function percentFormatter(decimals = 1) {
    return (value) => {
        if (typeof value !== 'number')
            return String(value);
        return `${(value * 100).toFixed(decimals)}%`;
    };
}
/**
 * Format date value
 */
export function dateFormatter(format = 'medium') {
    return (value) => {
        const date = typeof value === 'string' ? new Date(value) : value;
        if (!(date instanceof Date) || isNaN(date.getTime()))
            return String(value);
        switch (format) {
            case 'short':
                return date.toLocaleDateString();
            case 'long':
                return date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            case 'medium':
            default:
                return date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
        }
    };
}
/**
 * Calculate table height based on rows
 */
export function calculateTableHeight(rowCount, options = {}) {
    const { showHeader = true, rowHeight = 25, headerHeight = 30 } = options;
    return (showHeader ? headerHeight : 0) + rowCount * rowHeight;
}
/**
 * Generate HTML table from data (for HTML-based PDF generation)
 */
export function generateHtmlTable(columns, data, style = {}) {
    const { className = '', striped = true, bordered = true } = style;
    const classes = [
        className,
        striped ? 'striped' : '',
        bordered ? 'bordered' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const headerHtml = columns
        .map((col) => `<th style="text-align: ${col.align || 'left'}">${col.header}</th>`)
        .join('');
    const rowsHtml = data
        .map((row) => {
        const cellsHtml = columns
            .map((col) => {
            const value = row[col.key];
            const displayValue = col.formatter ? col.formatter(value, row) : String(value ?? '');
            return `<td style="text-align: ${col.align || 'left'}">${displayValue}</td>`;
        })
            .join('');
        return `<tr>${cellsHtml}</tr>`;
    })
        .join('');
    return `
    <table class="${classes}">
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}
// ============================================================================
// Default Export
// ============================================================================
export const tableRenderer = new TableRenderer();
export default TableRenderer;
//# sourceMappingURL=tables.js.map