/**
 * Input Masking System
 *
 * Format and mask input values in real-time:
 * - Phone number formatting
 * - Credit card formatting
 * - Currency formatting
 * - Date formatting
 * - Custom mask patterns
 */
export interface MaskConfig {
    pattern: string;
    placeholder?: string;
    guide?: boolean;
    keepCharPositions?: boolean;
    showMaskOnFocus?: boolean;
    showMaskOnHover?: boolean;
}
export interface MaskResult {
    maskedValue: string;
    rawValue: string;
    isComplete: boolean;
    isValid: boolean;
}
export type MaskChar = string | RegExp;
export interface MaskDefinition {
    pattern: MaskChar[];
    placeholder: string;
    validator?: (value: string) => boolean;
}
export declare const maskChars: Record<string, RegExp>;
/**
 * Parse a mask pattern string into an array of mask characters
 */
export declare function parseMaskPattern(pattern: string): MaskChar[];
/**
 * Apply a mask to a value
 */
export declare function applyMask(value: string, pattern: string | MaskChar[]): MaskResult;
/**
 * Remove mask from a value, keeping only raw input
 */
export declare function unmask(maskedValue: string, pattern: string | MaskChar[]): string;
/**
 * Phone number mask (US format)
 */
export declare function phoneMask(value: string, options?: {
    format?: 'us' | 'international' | 'simple';
    countryCode?: string;
}): MaskResult;
/**
 * Credit card mask
 */
export declare function creditCardMask(value: string): MaskResult & {
    cardType: string | null;
};
/**
 * Detect credit card type from number
 */
export declare function detectCardType(number: string): string | null;
/**
 * Luhn algorithm for credit card validation
 */
export declare function luhnCheck(number: string): boolean;
/**
 * Currency mask
 */
export declare function currencyMask(value: string, options?: {
    symbol?: string;
    symbolPosition?: 'prefix' | 'suffix';
    thousandsSeparator?: string;
    decimalSeparator?: string;
    decimalPlaces?: number;
    allowNegative?: boolean;
}): MaskResult;
/**
 * Date mask
 */
export declare function dateMask(value: string, options?: {
    format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
    separator?: string;
}): MaskResult & {
    date: Date | null;
};
/**
 * Time mask
 */
export declare function timeMask(value: string, options?: {
    format?: '12h' | '24h';
    showSeconds?: boolean;
}): MaskResult;
/**
 * SSN mask (US Social Security Number)
 */
export declare function ssnMask(value: string): MaskResult;
/**
 * ZIP code mask
 */
export declare function zipCodeMask(value: string, options?: {
    format?: 'us' | 'us-extended' | 'canada' | 'uk';
}): MaskResult;
export interface MaskInputHandler {
    onInput: (event: {
        target: {
            value: string;
        };
    }) => void;
    onKeyDown: (event: KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
}
/**
 * Create an input handler for masked input
 */
export declare function createMaskInputHandler(maskFn: (value: string) => MaskResult, onChange: (result: MaskResult) => void): MaskInputHandler;
export declare const maskPresets: {
    readonly phone: {
        readonly us: "(999) 999-9999";
        readonly international: "+9 (999) 999-9999";
    };
    readonly creditCard: {
        readonly standard: "9999 9999 9999 9999";
        readonly amex: "9999 999999 99999";
    };
    readonly date: {
        readonly 'MM/DD/YYYY': "99/99/9999";
        readonly 'DD/MM/YYYY': "99/99/9999";
        readonly 'YYYY-MM-DD': "9999-99-99";
    };
    readonly time: {
        readonly '12h': "99:99";
        readonly '24h': "99:99";
        readonly withSeconds: "99:99:99";
    };
    readonly ssn: "999-99-9999";
    readonly zip: {
        readonly us: "99999";
        readonly usExtended: "99999-9999";
    };
};
//# sourceMappingURL=input-mask.d.ts.map