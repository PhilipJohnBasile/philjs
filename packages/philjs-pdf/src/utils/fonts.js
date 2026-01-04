/**
 * Font Management Utilities for PDF Generation
 */
import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
// ============================================================================
// Font Manager Class
// ============================================================================
/**
 * Manages fonts for PDF generation
 */
export class FontManager {
    fonts = new Map();
    fontFamilies = new Map();
    pdfDoc = null;
    /**
     * Initialize with a PDF document
     */
    async init(pdfDoc) {
        this.pdfDoc = pdfDoc;
    }
    /**
     * Embed a standard PDF font
     */
    async embedStandardFont(fontName) {
        if (!this.pdfDoc) {
            throw new Error('FontManager not initialized. Call init() first.');
        }
        const standardFont = StandardFonts[fontName];
        if (!standardFont) {
            throw new Error(`Unknown standard font: ${fontName}`);
        }
        const font = await this.pdfDoc.embedFont(standardFont);
        this.fonts.set(fontName, {
            font,
            config: { name: fontName },
        });
        return font;
    }
    /**
     * Embed a custom font from file path or data
     */
    async embedCustomFont(config) {
        if (!this.pdfDoc) {
            throw new Error('FontManager not initialized. Call init() first.');
        }
        let fontData;
        if (config.data) {
            fontData = config.data;
        }
        else if (config.path) {
            // Dynamic import for Node.js fs
            const fs = await import('fs/promises');
            fontData = await fs.readFile(config.path);
        }
        else {
            throw new Error('Font config must include either path or data');
        }
        const font = await this.pdfDoc.embedFont(fontData);
        this.fonts.set(config.name, { font, config });
        return font;
    }
    /**
     * Register a font family with variants
     */
    registerFontFamily(name, family) {
        this.fontFamilies.set(name, family);
    }
    /**
     * Get an embedded font by name
     */
    getFont(name) {
        return this.fonts.get(name)?.font;
    }
    /**
     * Get a font from a family with specific weight/style
     */
    getFontFromFamily(familyName, options = {}) {
        const family = this.fontFamilies.get(familyName);
        if (!family)
            return undefined;
        if (options.bold && options.italic && family.boldItalic) {
            return family.boldItalic;
        }
        if (options.bold && family.bold) {
            return family.bold;
        }
        if (options.italic && family.italic) {
            return family.italic;
        }
        return family.regular;
    }
    /**
     * Get all embedded fonts
     */
    getAllFonts() {
        return this.fonts;
    }
    /**
     * Clear all fonts
     */
    clear() {
        this.fonts.clear();
        this.fontFamilies.clear();
        this.pdfDoc = null;
    }
}
// ============================================================================
// Font Helper Functions
// ============================================================================
/**
 * Get list of available standard fonts
 */
export function getStandardFonts() {
    return [
        'Courier',
        'Courier-Bold',
        'Courier-Oblique',
        'Courier-BoldOblique',
        'Helvetica',
        'Helvetica-Bold',
        'Helvetica-Oblique',
        'Helvetica-BoldOblique',
        'Times-Roman',
        'Times-Bold',
        'Times-Italic',
        'Times-BoldItalic',
        'Symbol',
        'ZapfDingbats',
    ];
}
/**
 * Map common font names to standard PDF fonts
 */
export function mapToStandardFont(fontName) {
    const normalized = fontName.toLowerCase().replace(/[^a-z]/g, '');
    const mappings = {
        arial: 'Helvetica',
        arialblack: 'Helvetica-Bold',
        arialbold: 'Helvetica-Bold',
        arialitalic: 'Helvetica-Oblique',
        helvetica: 'Helvetica',
        helveticabold: 'Helvetica-Bold',
        helveticaoblique: 'Helvetica-Oblique',
        times: 'Times-Roman',
        timesnewroman: 'Times-Roman',
        timesbold: 'Times-Bold',
        timesitalic: 'Times-Italic',
        courier: 'Courier',
        couriernew: 'Courier',
        courierbold: 'Courier-Bold',
        courieroblique: 'Courier-Oblique',
        monospace: 'Courier',
        serif: 'Times-Roman',
        sansserif: 'Helvetica',
    };
    return mappings[normalized] || 'Helvetica';
}
/**
 * Calculate text width for a given font and size
 */
export function calculateTextWidth(font, text, fontSize) {
    return font.widthOfTextAtSize(text, fontSize);
}
/**
 * Calculate text height for a given font and size
 */
export function calculateTextHeight(font, fontSize) {
    return font.heightAtSize(fontSize);
}
/**
 * Word wrap text to fit within a max width
 */
export function wrapText(font, text, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        }
        else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
}
/**
 * Create CSS font-face declaration for web fonts
 */
export function createFontFaceCSS(fontFamily, fontUrl, options = {}) {
    const { weight = 'normal', style = 'normal', format = 'woff2' } = options;
    return `
@font-face {
  font-family: '${fontFamily}';
  src: url('${fontUrl}') format('${format}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
  `.trim();
}
// ============================================================================
// PDFKit Font Helpers
// ============================================================================
/**
 * Register a font with PDFKit
 */
export function registerPDFKitFont(doc, name, path) {
    doc.registerFont(name, path);
}
/**
 * Register a font family with PDFKit
 */
export function registerPDFKitFontFamily(doc, familyName, fonts) {
    if (fonts.normal) {
        doc.registerFont(`${familyName}`, fonts.normal);
    }
    if (fonts.bold) {
        doc.registerFont(`${familyName}-Bold`, fonts.bold);
    }
    if (fonts.italic) {
        doc.registerFont(`${familyName}-Italic`, fonts.italic);
    }
    if (fonts.boldItalic) {
        doc.registerFont(`${familyName}-BoldItalic`, fonts.boldItalic);
    }
}
// ============================================================================
// Default Export
// ============================================================================
export const fontManager = new FontManager();
export default FontManager;
//# sourceMappingURL=fonts.js.map