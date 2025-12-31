/**
 * PhilJS Content - Content Utilities
 *
 * Utility functions for content manipulation including reading time calculation,
 * excerpt generation, table of contents extraction, related posts finding, and tag clouds.
 */
import type { CollectionEntry, ContentHeading, TOCEntry } from './types.js';
/**
 * Calculate reading time for content
 */
export declare function calculateReadingTime(text: string, options?: {
    /** Words per minute (default: 200) */
    wordsPerMinute?: number;
    /** Include code blocks in calculation */
    includeCode?: boolean;
    /** Include HTML tags in calculation */
    includeHTML?: boolean;
}): {
    /** Reading time in minutes */
    minutes: number;
    /** Total word count */
    words: number;
    /** Human-readable time string */
    text: string;
};
/**
 * Generate an excerpt from content
 */
export declare function generateExcerpt(text: string, options?: {
    /** Maximum length in characters (default: 160) */
    length?: number;
    /** Suffix to add when truncated (default: '...') */
    suffix?: string;
    /** Preserve whole words (default: true) */
    preserveWords?: boolean;
    /** Strip HTML tags (default: true) */
    stripHTML?: boolean;
    /** Strip markdown formatting (default: true) */
    stripMarkdown?: boolean;
}): string;
/**
 * Extract table of contents from headings
 */
export declare function extractTableOfContents(headings: ContentHeading[], options?: {
    /** Minimum heading depth to include (default: 1) */
    minDepth?: number;
    /** Maximum heading depth to include (default: 6) */
    maxDepth?: number;
    /** Ordered list (default: false) */
    ordered?: boolean;
}): TOCEntry[];
/**
 * Render table of contents as HTML
 */
export declare function renderTableOfContents(toc: TOCEntry[], options?: {
    /** Use ordered list (default: false) */
    ordered?: boolean;
    /** CSS class for list container */
    className?: string;
}): string;
/**
 * Find related posts based on tags and content similarity
 */
export declare function findRelatedPosts<T extends CollectionEntry>(currentPost: T, allPosts: T[], options?: {
    /** Maximum number of related posts to return (default: 5) */
    limit?: number;
    /** Tag field name (default: 'tags') */
    tagField?: string;
    /** Title field name (default: 'title') */
    titleField?: string;
    /** Minimum number of shared tags (default: 1) */
    minSharedTags?: number;
    /** Score threshold (0-1, default: 0) */
    threshold?: number;
}): Array<T & {
    score: number;
}>;
/**
 * Generate a tag cloud with counts and weights
 */
export declare function generateTagCloud<T extends CollectionEntry>(entries: T[], options?: {
    /** Tag field name (default: 'tags') */
    tagField?: string;
    /** Minimum occurrences to include (default: 1) */
    minCount?: number;
    /** Maximum number of tags (default: unlimited) */
    limit?: number;
    /** Sort order (default: 'count') */
    sort?: 'count' | 'alphabetical';
}): Array<{
    tag: string;
    count: number;
    weight: number;
}>;
/**
 * Render tag cloud as HTML
 */
export declare function renderTagCloud(cloud: Array<{
    tag: string;
    count: number;
    weight: number;
}>, options?: {
    /** Base URL for tag links (e.g., '/tags/') */
    baseUrl?: string;
    /** CSS class for container */
    className?: string;
    /** CSS class for individual tags */
    tagClassName?: string;
    /** Use weight for font size (default: true) */
    useWeightForSize?: boolean;
    /** Minimum font size in em (default: 0.8) */
    minSize?: number;
    /** Maximum font size in em (default: 2.0) */
    maxSize?: number;
}): string;
/**
 * Group entries by a field value
 */
export declare function groupByField<T extends CollectionEntry>(entries: T[], field: string): Map<string, T[]>;
/**
 * Group entries by date (year, month, or day)
 */
export declare function groupByDate<T extends CollectionEntry>(entries: T[], options?: {
    /** Date field name (default: 'date') */
    dateField?: string;
    /** Grouping granularity (default: 'month') */
    granularity?: 'year' | 'month' | 'day';
    /** Sort order (default: 'desc') */
    sort?: 'asc' | 'desc';
}): Map<string, T[]>;
/**
 * Paginate entries
 */
export declare function paginate<T>(items: T[], options?: {
    /** Page size (default: 10) */
    pageSize?: number;
    /** Current page (1-indexed, default: 1) */
    page?: number;
}): {
    items: T[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
};
/**
 * Create a slug from text
 */
export declare function slugify(text: string): string;
/**
 * Get first N words from text
 */
export declare function getFirstWords(text: string, count: number): string;
/**
 * Strip all markdown formatting
 */
export declare function stripMarkdown(text: string): string;
/**
 * Format date for display
 */
export declare function formatDate(date: Date, format?: 'short' | 'medium' | 'long' | 'full', locale?: string): string;
/**
 * Get relative time string (e.g., "2 days ago")
 */
export declare function getRelativeTime(date: Date, locale?: string): string;
//# sourceMappingURL=utils.d.ts.map