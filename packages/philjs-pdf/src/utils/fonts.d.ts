/**
 * Font Management Utilities for PDF Generation
 */
import { PDFDocument, PDFFont } from 'pdf-lib';
export interface FontConfig {
    name: string;
    path?: string;
    data?: Uint8Array;
    weight?: 'normal' | 'bold';
    style?: 'normal' | 'italic';
}
export interface FontFamily {
    regular: FontConfig;
    bold?: FontConfig;
    italic?: FontConfig;
    boldItalic?: FontConfig;
}
export interface EmbeddedFont {
    font: PDFFont;
    config: FontConfig;
}
export type StandardFontName = 'Courier' | 'Courier-Bold' | 'Courier-Oblique' | 'Courier-BoldOblique' | 'Helvetica' | 'Helvetica-Bold' | 'Helvetica-Oblique' | 'Helvetica-BoldOblique' | 'Times-Roman' | 'Times-Bold' | 'Times-Italic' | 'Times-BoldItalic' | 'Symbol' | 'ZapfDingbats';
/**
 * Manages fonts for PDF generation
 */
export declare class FontManager {
    private fonts;
    private fontFamilies;
    private pdfDoc;
    /**
     * Initialize with a PDF document
     */
    init(pdfDoc: PDFDocument): Promise<void>;
    /**
     * Embed a standard PDF font
     */
    embedStandardFont(fontName: StandardFontName): Promise<PDFFont>;
    /**
     * Embed a custom font from file path or data
     */
    embedCustomFont(config: FontConfig): Promise<PDFFont>;
    /**
     * Register a font family with variants
     */
    registerFontFamily(name: string, family: FontFamily): void;
    /**
     * Get an embedded font by name
     */
    getFont(name: string): PDFFont | undefined;
    /**
     * Get a font from a family with specific weight/style
     */
    getFontFromFamily(familyName: string, options?: {
        bold?: boolean;
        italic?: boolean;
    }): FontConfig | undefined;
    /**
     * Get all embedded fonts
     */
    getAllFonts(): Map<string, EmbeddedFont>;
    /**
     * Clear all fonts
     */
    clear(): void;
}
/**
 * Get list of available standard fonts
 */
export declare function getStandardFonts(): StandardFontName[];
/**
 * Map common font names to standard PDF fonts
 */
export declare function mapToStandardFont(fontName: string): StandardFontName;
/**
 * Calculate text width for a given font and size
 */
export declare function calculateTextWidth(font: PDFFont, text: string, fontSize: number): number;
/**
 * Calculate text height for a given font and size
 */
export declare function calculateTextHeight(font: PDFFont, fontSize: number): number;
/**
 * Word wrap text to fit within a max width
 */
export declare function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[];
/**
 * Create CSS font-face declaration for web fonts
 */
export declare function createFontFaceCSS(fontFamily: string, fontUrl: string, options?: {
    weight?: number | string;
    style?: string;
    format?: string;
}): string;
/**
 * Register a font with PDFKit
 */
export declare function registerPDFKitFont(doc: PDFKit.PDFDocument, name: string, path: string): void;
/**
 * Register a font family with PDFKit
 */
export declare function registerPDFKitFontFamily(doc: PDFKit.PDFDocument, familyName: string, fonts: {
    normal?: string;
    bold?: string;
    italic?: string;
    boldItalic?: string;
}): void;
export declare const fontManager: FontManager;
export default FontManager;
//# sourceMappingURL=fonts.d.ts.map