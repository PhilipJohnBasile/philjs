/**
 * PhilJS GraphQL Fragments
 *
 * Provides type-safe fragment utilities:
 * - Fragment colocation with components
 * - Fragment masking for data encapsulation
 * - Type-safe fragment spreading
 * - Fragment composition and merging
 * - Automatic fragment deduplication
 */
import type { DocumentNode } from 'graphql';
export interface FragmentDefinition<TData = any> {
    /** Fragment name */
    name: string;
    /** Fragment type condition (e.g., 'User', 'Post') */
    on: string;
    /** Fragment document */
    document: string | DocumentNode;
    /** Fragment data type */
    __type?: TData;
}
export interface MaskedFragment<TData = any> {
    /** Fragment identifier */
    __fragmentId: string;
    /** Fragment name */
    __fragmentName: string;
    /** Masked data (only accessible through unmask) */
    __data: TData;
}
/**
 * Fragment Registry
 * Manages fragment definitions and prevents duplicates
 */
export declare class FragmentRegistry {
    private fragments;
    private fragmentsByType;
    /**
     * Register a fragment
     */
    register<TData = any>(fragment: FragmentDefinition<TData>): void;
    /**
     * Get a fragment by name
     */
    get<TData = any>(name: string): FragmentDefinition<TData> | undefined;
    /**
     * Get all fragments for a type
     */
    getFragmentsForType(typeName: string): FragmentDefinition[];
    /**
     * Get all registered fragments
     */
    getAll(): FragmentDefinition[];
    /**
     * Check if a fragment is registered
     */
    has(name: string): boolean;
    /**
     * Get fragment document as string
     */
    getFragmentDocument(name: string): string | undefined;
    /**
     * Collect all fragment documents for a query
     * Includes nested fragments
     */
    collectFragmentDocuments(fragmentNames: string[]): string[];
    /**
     * Extract fragment spread names from a document
     */
    private extractFragmentSpreads;
    /**
     * Convert DocumentNode to string if needed
     */
    private documentToString;
    /**
     * Clear all fragments
     */
    clear(): void;
    /**
     * Get registry size
     */
    get size(): number;
}
/**
 * Define a fragment with type safety
 */
export declare function defineFragment<TData = any>(name: string, on: string, document: string | DocumentNode, registry?: FragmentRegistry): FragmentDefinition<TData>;
/**
 * Mask fragment data to enforce data encapsulation
 * Prevents accessing fields not defined in the fragment
 */
export declare function maskFragment<TData = any>(fragment: FragmentDefinition<TData>, data: TData): MaskedFragment<TData>;
/**
 * Unmask fragment data to access the underlying data
 */
export declare function unmaskFragment<TData = any>(fragment: FragmentDefinition<TData>, masked: MaskedFragment<TData>): TData;
/**
 * Check if data is a masked fragment
 */
export declare function isMaskedFragment(data: any): data is MaskedFragment;
/**
 * Spread fragment into a query
 * Returns the fragment spread syntax and ensures fragment is in registry
 */
export declare function spreadFragment<TData = any>(fragment: FragmentDefinition<TData>, registry?: FragmentRegistry): string;
/**
 * Compose multiple fragments into a single document
 */
export declare function composeFragments(fragments: FragmentDefinition[], registry?: FragmentRegistry): string;
/**
 * Build query with fragments
 * Automatically includes all required fragment definitions
 */
export declare function buildQueryWithFragments(query: string, registry?: FragmentRegistry): string;
/**
 * Type-safe fragment data access
 * Uses fragment definition to type the data
 */
export declare function useFragment<TData = any>(fragment: FragmentDefinition<TData>, data: any): TData;
/**
 * Fragment colocation helper
 * Attaches fragment to a component for easy discovery
 */
export declare function withFragment<TProps = any, TData = any>(Component: any, fragment: FragmentDefinition<TData>): typeof Component & {
    fragment: FragmentDefinition<TData>;
};
/**
 * Extract fragment from a component
 */
export declare function getComponentFragment<TData = any>(Component: any): FragmentDefinition<TData> | undefined;
/**
 * Merge multiple fragment data objects
 * Useful when combining data from multiple fragments on the same type
 */
export declare function mergeFragmentData<T extends Record<string, any>>(...fragments: Partial<T>[]): T;
/**
 * Create a typed fragment selector
 * Allows selecting specific fields from fragment data
 */
export declare function selectFromFragment<TData, TSelected>(fragment: FragmentDefinition<TData>, data: TData | MaskedFragment<TData>, selector: (data: TData) => TSelected): TSelected;
/**
 * Get the global fragment registry
 */
export declare function getFragmentRegistry(): FragmentRegistry;
/**
 * Create a new isolated fragment registry
 */
export declare function createFragmentRegistry(): FragmentRegistry;
/**
 * Fragment definition helper with template literal
 */
export declare function fragment<TData = any>(strings: TemplateStringsArray, ...values: any[]): (name: string, on: string) => FragmentDefinition<TData>;
/**
 * Inline fragment helper
 * Creates an inline fragment condition
 */
export declare function inlineFragment(typeName: string, fields: string): string;
/**
 * Fragment optimization utilities
 */
export declare const FragmentUtils: {
    /**
     * Check if a query uses a specific fragment
     */
    queryUsesFragment(query: string, fragmentName: string): boolean;
    /**
     * Remove unused fragment definitions from a document
     */
    removeUnusedFragments(document: string): string;
    /**
     * Deduplicate fragment definitions in a document
     */
    deduplicateFragments(document: string): string;
};
//# sourceMappingURL=fragments.d.ts.map