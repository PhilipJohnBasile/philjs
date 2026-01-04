/**
 * Tailwind CSS utility functions
 */
/**
 * Class name type
 */
export type ClassName = string | undefined | null | false | 0 | ClassName[];
/**
 * Advanced class merging with conflict resolution
 * Handles Tailwind-specific conflicts (e.g., px-4 vs px-6)
 */
export declare function cn(...inputs: ClassName[]): string;
/**
 * Conditional class names
 */
export declare function clsx(...inputs: ClassName[]): string;
/**
 * Create a variant class generator
 */
export declare function createVariants<T extends Record<string, Record<string, string>>>(variants: T): (props: {
    [K in keyof T]?: keyof T[K];
}) => string;
/**
 * Responsive utility generator
 */
export declare function responsive(base: string, breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
}): string;
/**
 * State variants generator
 */
export declare function withStates(base: string, options?: {
    hover?: boolean | string;
    focus?: boolean | string;
    active?: boolean | string;
    disabled?: boolean | string;
    group?: boolean | string;
    peer?: boolean | string;
}): string;
/**
 * Dark mode utility
 */
export declare function dark(lightClass: string, darkClass: string): string;
/**
 * Generate container queries
 */
export declare function container(base: string, sizes?: {
    "@sm"?: string;
    "@md"?: string;
    "@lg"?: string;
    "@xl"?: string;
}): string;
/**
 * CSS variable to Tailwind class converter
 */
export declare function cssVarToClass(varName: string, value: string): string;
/**
 * Extract Tailwind classes from a string
 */
export declare function extractClasses(content: string): string[];
/**
 * Validate Tailwind class name
 */
export declare function isValidClass(className: string): boolean;
/**
 * Sort classes by Tailwind's recommended order
 */
export declare function sortClasses(classes: string[]): string[];
/**
 * Generate arbitrary value class
 */
export declare function arbitrary(property: string, value: string): string;
/**
 * Merge multiple theme configs
 */
export declare function mergeThemes(...themes: Array<Record<string, any>>): Record<string, any>;
//# sourceMappingURL=utils.d.ts.map