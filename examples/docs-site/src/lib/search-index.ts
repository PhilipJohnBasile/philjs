/**
 * Search Index
 *
 * Creates and manages a searchable index of documentation content
 */

export interface SearchResult {
  title: string;
  path: string;
  section: string;
  file: string;
  excerpt: string;
  score: number;
}

export interface DocEntry {
  title: string;
  path: string;
  section: string;
  file: string;
  content: string;
  headings: string[];
}

export class SearchIndex {
  private entries: DocEntry[] = [];
  private index: Map<string, Set<number>> = new Map();

  /**
   * Add a document to the search index
   */
  addDocument(entry: DocEntry): void {
    const index = this.entries.length;
    this.entries.push(entry);

    // Index the title
    this.indexText(entry.title, index, 3); // Higher weight for titles

    // Index headings
    entry.headings.forEach(heading => {
      this.indexText(heading, index, 2); // Medium weight for headings
    });

    // Index content
    this.indexText(entry.content, index, 1); // Normal weight for content
  }

  /**
   * Index text by tokenizing and storing word positions
   */
  private indexText(text: string, docIndex: number, weight: number): void {
    const tokens = this.tokenize(text);

    tokens.forEach(token => {
      if (token.length < 2) return; // Skip very short tokens

      const key = `${token}:${weight}`;
      if (!this.index.has(key)) {
        this.index.set(key, new Set());
      }
      this.index.get(key)!.add(docIndex);
    });
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Search the index
   */
  search(query: string, limit: number = 10): SearchResult[] {
    if (!query.trim()) return [];

    const tokens = this.tokenize(query);
    const scores = new Map<number, number>();

    // Calculate scores for each document
    tokens.forEach(token => {
      // Exact matches
      for (const [key, docSet] of this.index.entries()) {
        const [indexedToken, weight] = key.split(':');
        if (indexedToken === token) {
          docSet.forEach(docIndex => {
            const currentScore = scores.get(docIndex) || 0;
            scores.set(docIndex, currentScore + parseInt(weight, 10));
          });
        }
        // Prefix matches (lower weight)
        else if (indexedToken.startsWith(token)) {
          docSet.forEach(docIndex => {
            const currentScore = scores.get(docIndex) || 0;
            scores.set(docIndex, currentScore + parseInt(weight, 10) * 0.5);
          });
        }
      }
    });

    // Convert to results and sort by score
    const results: SearchResult[] = [];

    scores.forEach((score, docIndex) => {
      const entry = this.entries[docIndex];
      if (!entry) return;

      results.push({
        title: entry.title,
        path: entry.path,
        section: entry.section,
        file: entry.file,
        excerpt: this.createExcerpt(entry.content, tokens),
        score,
      });
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Create an excerpt highlighting matching terms
   */
  private createExcerpt(content: string, tokens: string[]): string {
    const maxLength = 150;

    // Find the first occurrence of any search token
    const lowerContent = content.toLowerCase();
    let startIndex = -1;

    for (const token of tokens) {
      const index = lowerContent.indexOf(token);
      if (index !== -1 && (startIndex === -1 || index < startIndex)) {
        startIndex = index;
      }
    }

    if (startIndex === -1) {
      // No match found, return beginning
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Calculate excerpt boundaries
    const startOffset = Math.max(0, startIndex - 50);
    const endOffset = Math.min(content.length, startIndex + maxLength);

    let excerpt = content.substring(startOffset, endOffset);

    // Add ellipsis
    if (startOffset > 0) excerpt = '...' + excerpt;
    if (endOffset < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.entries = [];
    this.index.clear();
  }

  /**
   * Get total number of indexed documents
   */
  size(): number {
    return this.entries.length;
  }
}

/**
 * Global search index instance
 */
export const searchIndex = new SearchIndex();

/**
 * Initialize search index with documentation
 */
export async function initializeSearchIndex(docsStructure: any[]): Promise<void> {
  searchIndex.clear();

  for (const section of docsStructure) {
    for (const item of section.items) {
      try {
        // Fetch the markdown content
        const response = await fetch(`/md-files/${section.path}/${item.file}.md`);
        if (!response.ok) continue;

        const content = await response.text();

        // Extract headings
        const headings: string[] = [];
        const headingRegex = /^#{1,6}\s+(.+)$/gm;
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
          headings.push(match[1]);
        }

        // Remove markdown syntax for indexing
        const cleanContent = content
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/`[^`]+`/g, '') // Remove inline code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
          .replace(/[*_~]/g, '') // Remove formatting
          .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
          .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
          .replace(/\n+/g, ' ') // Normalize whitespace
          .trim();

        searchIndex.addDocument({
          title: item.title,
          path: section.path,
          section: section.title,
          file: item.file,
          content: cleanContent,
          headings,
        });
      } catch (error) {
        console.warn(`Failed to index ${section.path}/${item.file}:`, error);
      }
    }
  }

  console.log(`Search index initialized with ${searchIndex.size()} documents`);
}

/**
 * Debounce helper for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
