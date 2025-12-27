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
export function calculateReadingTime(
  text: string,
  options: {
    /** Words per minute (default: 200) */
    wordsPerMinute?: number;
    /** Include code blocks in calculation */
    includeCode?: boolean;
    /** Include HTML tags in calculation */
    includeHTML?: boolean;
  } = {}
): {
  /** Reading time in minutes */
  minutes: number;
  /** Total word count */
  words: number;
  /** Human-readable time string */
  text: string;
} {
  const wordsPerMinute = options.wordsPerMinute || 200;

  let cleanText = text;

  // Remove code blocks if not counting them
  if (!options.includeCode) {
    cleanText = cleanText
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '');
  }

  // Remove HTML tags if not counting them
  if (!options.includeHTML) {
    cleanText = cleanText.replace(/<[^>]*>/g, '');
  }

  // Remove markdown formatting
  cleanText = cleanText
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[*_~`]/g, '') // Formatting
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Images

  // Count words (split by whitespace and filter empty strings)
  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;

  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    text: minutes === 1 ? '1 min read' : `${minutes} min read`,
  };
}

/**
 * Generate an excerpt from content
 */
export function generateExcerpt(
  text: string,
  options: {
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
  } = {}
): string {
  const maxLength = options.length || 160;
  const suffix = options.suffix || '...';
  const preserveWords = options.preserveWords !== false;
  const stripHTML = options.stripHTML !== false;
  const stripMarkdown = options.stripMarkdown !== false;

  let excerpt = text;

  // Strip HTML tags
  if (stripHTML) {
    excerpt = excerpt.replace(/<[^>]*>/g, '');
  }

  // Strip markdown formatting
  if (stripMarkdown) {
    excerpt = excerpt
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/[*_~`]/g, '') // Formatting
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
      .replace(/^[-*+]\s+/gm, '') // Lists
      .replace(/^\d+\.\s+/gm, ''); // Numbered lists
  }

  // Clean up whitespace
  excerpt = excerpt.replace(/\s+/g, ' ').trim();

  // Truncate if needed
  if (excerpt.length > maxLength) {
    let truncated = excerpt.substring(0, maxLength);

    if (preserveWords) {
      // Find the last complete word
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) {
        truncated = truncated.substring(0, lastSpace);
      }
    }

    excerpt = truncated + suffix;
  }

  return excerpt;
}

/**
 * Extract table of contents from headings
 */
export function extractTableOfContents(
  headings: ContentHeading[],
  options: {
    /** Minimum heading depth to include (default: 1) */
    minDepth?: number;
    /** Maximum heading depth to include (default: 6) */
    maxDepth?: number;
    /** Ordered list (default: false) */
    ordered?: boolean;
  } = {}
): TOCEntry[] {
  const minDepth = options.minDepth || 1;
  const maxDepth = options.maxDepth || 6;

  const filteredHeadings = headings.filter(
    h => h.depth >= minDepth && h.depth <= maxDepth
  );

  return buildTOCTree(filteredHeadings, minDepth);
}

/**
 * Build hierarchical TOC tree from flat heading list
 */
function buildTOCTree(headings: ContentHeading[], baseDepth: number): TOCEntry[] {
  const root: TOCEntry[] = [];
  const stack: TOCEntry[] = [];

  for (const heading of headings) {
    const entry: TOCEntry = {
      depth: heading.depth,
      text: heading.text,
      slug: heading.slug,
      children: [],
    };

    // Find the correct parent level
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level item
      root.push(entry);
    } else {
      // Child item
      stack[stack.length - 1].children.push(entry);
    }

    stack.push(entry);
  }

  return root;
}

/**
 * Render table of contents as HTML
 */
export function renderTableOfContents(
  toc: TOCEntry[],
  options: {
    /** Use ordered list (default: false) */
    ordered?: boolean;
    /** CSS class for list container */
    className?: string;
  } = {}
): string {
  if (toc.length === 0) return '';

  const listTag = options.ordered ? 'ol' : 'ul';
  const classAttr = options.className ? ` class="${options.className}"` : '';

  function renderList(items: TOCEntry[]): string {
    if (items.length === 0) return '';

    let html = `<${listTag}${classAttr}>`;

    for (const item of items) {
      html += `<li><a href="#${item.slug}">${escapeHTML(item.text)}</a>`;
      if (item.children.length > 0) {
        html += renderList(item.children);
      }
      html += '</li>';
    }

    html += `</${listTag}>`;
    return html;
  }

  return renderList(toc);
}

/**
 * Find related posts based on tags and content similarity
 */
export function findRelatedPosts<T extends CollectionEntry>(
  currentPost: T,
  allPosts: T[],
  options: {
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
  } = {}
): Array<T & { score: number }> {
  const limit = options.limit || 5;
  const tagField = options.tagField || 'tags';
  const titleField = options.titleField || 'title';
  const minSharedTags = options.minSharedTags || 1;
  const threshold = options.threshold || 0;

  const currentData = currentPost.data as Record<string, unknown>;
  const currentTags = (currentData[tagField] as string[]) || [];
  const currentTitle = (currentData[titleField] as string) || '';

  // Calculate similarity scores
  const scored = allPosts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const postData = post.data as Record<string, unknown>;
      const postTags = (postData[tagField] as string[]) || [];
      const postTitle = (postData[titleField] as string) || '';

      let score = 0;

      // Tag similarity (weighted higher)
      const sharedTags = currentTags.filter(tag => postTags.includes(tag));
      const tagSimilarity = sharedTags.length / Math.max(currentTags.length, postTags.length);
      score += tagSimilarity * 0.7;

      // Title similarity (basic word overlap)
      const currentWords = new Set(
        currentTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );
      const postWords = new Set(
        postTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );
      // ES2024: Use Set.intersection() for cleaner set operations
      const sharedWords = currentWords.intersection(postWords);
      const titleSimilarity = sharedWords.size / Math.max(currentWords.size, postWords.size);
      score += titleSimilarity * 0.3;

      return {
        ...post,
        score,
        sharedTags: sharedTags.length,
      };
    })
    .filter(post => post.sharedTags >= minSharedTags && post.score >= threshold)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/**
 * Generate a tag cloud with counts and weights
 */
export function generateTagCloud<T extends CollectionEntry>(
  entries: T[],
  options: {
    /** Tag field name (default: 'tags') */
    tagField?: string;
    /** Minimum occurrences to include (default: 1) */
    minCount?: number;
    /** Maximum number of tags (default: unlimited) */
    limit?: number;
    /** Sort order (default: 'count') */
    sort?: 'count' | 'alphabetical';
  } = {}
): Array<{ tag: string; count: number; weight: number }> {
  const tagField = options.tagField || 'tags';
  const minCount = options.minCount || 1;
  const sort = options.sort || 'count';

  // Count tag occurrences
  const tagCounts = new Map<string, number>();

  for (const entry of entries) {
    const data = entry.data as Record<string, unknown>;
    const tags = (data[tagField] as string[]) || [];

    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Filter by minimum count
  const filtered = Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= minCount);

  // Calculate weights (normalized to 0-1)
  const maxCount = Math.max(...filtered.map(([_, count]) => count));
  const minCountValue = Math.min(...filtered.map(([_, count]) => count));

  const cloud = filtered.map(([tag, count]) => ({
    tag,
    count,
    weight: maxCount === minCountValue
      ? 1
      : (count - minCountValue) / (maxCount - minCountValue),
  }));

  // Sort
  cloud.sort((a, b) => {
    if (sort === 'count') {
      return b.count - a.count;
    } else {
      return a.tag.localeCompare(b.tag);
    }
  });

  // Apply limit
  if (options.limit) {
    return cloud.slice(0, options.limit);
  }

  return cloud;
}

/**
 * Render tag cloud as HTML
 */
export function renderTagCloud(
  cloud: Array<{ tag: string; count: number; weight: number }>,
  options: {
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
  } = {}
): string {
  const baseUrl = options.baseUrl || '/tags/';
  const containerClass = options.className || 'tag-cloud';
  const tagClass = options.tagClassName || 'tag';
  const useWeightForSize = options.useWeightForSize !== false;
  const minSize = options.minSize || 0.8;
  const maxSize = options.maxSize || 2.0;

  let html = `<div class="${containerClass}">`;

  for (const { tag, count, weight } of cloud) {
    const fontSize = useWeightForSize
      ? minSize + (weight * (maxSize - minSize))
      : 1;

    const style = useWeightForSize ? ` style="font-size: ${fontSize}em"` : '';
    const slug = slugify(tag);

    html += `<a href="${baseUrl}${slug}" class="${tagClass}"${style} title="${count} post${count === 1 ? '' : 's'}">${escapeHTML(tag)}</a> `;
  }

  html += '</div>';

  return html;
}

/**
 * Group entries by a field value
 */
export function groupByField<T extends CollectionEntry>(
  entries: T[],
  field: string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const entry of entries) {
    const data = entry.data as Record<string, unknown>;
    const value = data[field];

    let key: string;
    if (value instanceof Date) {
      key = value.toISOString();
    } else if (Array.isArray(value)) {
      // For arrays, create groups for each value
      for (const item of value) {
        const itemKey = String(item);
        if (!groups.has(itemKey)) {
          groups.set(itemKey, []);
        }
        groups.get(itemKey)!.push(entry);
      }
      continue;
    } else {
      key = String(value);
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  }

  return groups;
}

/**
 * Group entries by date (year, month, or day)
 */
export function groupByDate<T extends CollectionEntry>(
  entries: T[],
  options: {
    /** Date field name (default: 'date') */
    dateField?: string;
    /** Grouping granularity (default: 'month') */
    granularity?: 'year' | 'month' | 'day';
    /** Sort order (default: 'desc') */
    sort?: 'asc' | 'desc';
  } = {}
): Map<string, T[]> {
  const dateField = options.dateField || 'date';
  const granularity = options.granularity || 'month';
  const sort = options.sort || 'desc';

  const groups = new Map<string, T[]>();

  for (const entry of entries) {
    const data = entry.data as Record<string, unknown>;
    const date = data[dateField] as Date;

    if (!(date instanceof Date)) continue;

    let key: string;
    if (granularity === 'year') {
      key = date.getFullYear().toString();
    } else if (granularity === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  }

  // Sort groups
  const sorted = new Map(
    Array.from(groups.entries()).sort((a, b) => {
      return sort === 'desc'
        ? b[0].localeCompare(a[0])
        : a[0].localeCompare(b[0]);
    })
  );

  return sorted;
}

/**
 * Paginate entries
 */
export function paginate<T>(
  items: T[],
  options: {
    /** Page size (default: 10) */
    pageSize?: number;
    /** Current page (1-indexed, default: 1) */
    page?: number;
  } = {}
): {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const pageSize = options.pageSize || 10;
  const page = Math.max(1, options.page || 1);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get first N words from text
 */
export function getFirstWords(text: string, count: number): string {
  return text
    .split(/\s+/)
    .slice(0, count)
    .join(' ');
}

/**
 * Strip all markdown formatting
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
    .replace(/[*_~`]/g, '') // Formatting
    .replace(/^[-*+]\s+/gm, '') // Lists
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`[^`]+`/g, '') // Inline code
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'en-US'
): string {
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };
  const options: Intl.DateTimeFormatOptions = formatOptions[format];

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date, locale: string = 'en-US'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffYear > 0) return rtf.format(-diffYear, 'year');
  if (diffMonth > 0) return rtf.format(-diffMonth, 'month');
  if (diffWeek > 0) return rtf.format(-diffWeek, 'week');
  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHour > 0) return rtf.format(-diffHour, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
}
