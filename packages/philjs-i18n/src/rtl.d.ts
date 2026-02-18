/**
 * Right-to-Left (RTL) Language Support
 *
 * Utilities for handling RTL languages like Arabic, Hebrew, Persian
 */
/**
 * Languages that are written right-to-left
 */
export declare const RTL_LANGUAGES: Set<string>;
/**
 * Check if a language is RTL
 */
export declare function isRtlLanguage(locale: string): boolean;
/**
 * Get text direction for a locale
 */
export declare function getTextDirection(locale: string): 'ltr' | 'rtl';
/**
 * Set document direction based on locale
 */
export declare function setDocumentDirection(locale: string): void;
/**
 * Set direction on a specific element
 */
export declare function setElementDirection(element: HTMLElement, locale: string): void;
/**
 * Create direction-aware style values
 */
export interface DirectionalValues<T> {
    ltr: T;
    rtl: T;
}
/**
 * Get direction-specific value
 */
export declare function getDirectionalValue<T>(values: DirectionalValues<T>, locale: string): T;
/**
 * Maps physical CSS properties to their logical equivalents
 */
export declare const physicalToLogical: Record<string, string>;
/**
 * Convert physical CSS property to logical
 */
export declare function toLogicalProperty(physicalProperty: string): string;
/**
 * Flip physical CSS property for RTL
 */
export declare function flipProperty(property: string): string;
/**
 * Flip CSS value for RTL
 */
export declare function flipValue(property: string, value: string): string;
/**
 * Unicode directional characters
 */
export declare const BIDI_CHARS: {
    readonly LRM: "‎";
    readonly RLM: "‏";
    readonly LRE: "‪";
    readonly RLE: "‫";
    readonly PDF: "‬";
    readonly LRO: "‭";
    readonly RLO: "‮";
    readonly LRI: "⁦";
    readonly RLI: "⁧";
    readonly FSI: "⁨";
    readonly PDI: "⁩";
};
/**
 * Wrap text in directional isolate
 */
export declare function wrapInIsolate(text: string, direction?: 'ltr' | 'rtl' | 'auto'): string;
/**
 * Add directional mark after text (useful for punctuation)
 */
export declare function addDirectionalMark(text: string, direction: 'ltr' | 'rtl'): string;
/**
 * Strip bidirectional control characters
 */
export declare function stripBidiChars(text: string): string;
/**
 * Detect primary text direction from content
 */
export declare function detectTextDirection(text: string): 'ltr' | 'rtl' | 'neutral';
/**
 * Characters that should be mirrored in RTL context
 */
export declare const mirrorChars: Record<string, string>;
/**
 * Mirror bracket characters for RTL
 */
export declare function mirrorBrackets(text: string): string;
export interface RtlConfig {
    locale: string;
    isRtl: boolean;
    dir: 'ltr' | 'rtl';
}
/**
 * Create RTL configuration from locale
 */
export declare function createRtlConfig(locale: string): RtlConfig;
/**
 * RTL-aware start/end mapping
 */
export declare function getStartEnd(isRtl: boolean): {
    start: 'left' | 'right';
    end: 'left' | 'right';
};
/**
 * Get physical direction from logical direction
 */
export declare function logicalToPhysical(logical: 'start' | 'end', isRtl: boolean): 'left' | 'right';
