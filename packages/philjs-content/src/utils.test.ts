/**
 * Tests for content utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateReadingTime,
  generateExcerpt,
  extractTableOfContents,
  findRelatedPosts,
  generateTagCloud,
  groupByField,
  groupByDate,
  paginate,
  slugify,
  stripMarkdown,
  formatDate,
} from './utils.js';
import type { ContentHeading } from './types.js';

describe('calculateReadingTime', () => {
  it('should calculate reading time correctly', () => {
    const text = 'word '.repeat(200); // 200 words
    const result = calculateReadingTime(text);

    expect(result.words).toBe(200);
    expect(result.minutes).toBe(1);
    expect(result.text).toBe('1 min read');
  });

  it('should round up to nearest minute', () => {
    const text = 'word '.repeat(250); // 250 words
    const result = calculateReadingTime(text);

    expect(result.words).toBe(250);
    expect(result.minutes).toBe(2);
    expect(result.text).toBe('2 min read');
  });

  it('should exclude code blocks when specified', () => {
    const text = 'word '.repeat(100) + '\n```js\n' + 'code '.repeat(100) + '\n```\n';
    const result = calculateReadingTime(text, { includeCode: false });

    expect(result.words).toBeLessThan(150);
  });

  it('should use custom words per minute', () => {
    const text = 'word '.repeat(300);
    const result = calculateReadingTime(text, { wordsPerMinute: 300 });

    expect(result.minutes).toBe(1);
  });
});

describe('generateExcerpt', () => {
  it('should truncate text to specified length', () => {
    const text = 'a'.repeat(200);
    const excerpt = generateExcerpt(text, { length: 100 });

    expect(excerpt.length).toBeLessThanOrEqual(104); // 100 + '...' length
  });

  it('should preserve whole words', () => {
    const text = 'This is a very long sentence that should be truncated at a word boundary';
    const excerpt = generateExcerpt(text, { length: 30, preserveWords: true });

    expect(excerpt).not.toContain('boundar...');
    expect(excerpt.endsWith('...')).toBe(true);
  });

  it('should strip HTML tags', () => {
    const text = '<p>This is <strong>HTML</strong> content</p>';
    const excerpt = generateExcerpt(text, { stripHTML: true });

    expect(excerpt).not.toContain('<p>');
    expect(excerpt).not.toContain('<strong>');
    expect(excerpt).toContain('This is HTML content');
  });

  it('should strip markdown formatting', () => {
    const text = '# Heading\n\nThis is **bold** and *italic* text';
    const excerpt = generateExcerpt(text, { stripMarkdown: true });

    expect(excerpt).not.toContain('#');
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('*');
  });
});

describe('extractTableOfContents', () => {
  const mockHeadings: ContentHeading[] = [
    { depth: 1, text: 'Main Title', slug: 'main-title' },
    { depth: 2, text: 'Section 1', slug: 'section-1' },
    { depth: 3, text: 'Subsection 1.1', slug: 'subsection-1-1' },
    { depth: 2, text: 'Section 2', slug: 'section-2' },
  ];

  it('should extract table of contents', () => {
    const toc = extractTableOfContents(mockHeadings);

    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Main Title');
    expect(toc[0].children).toHaveLength(2);
  });

  it('should filter by depth', () => {
    const toc = extractTableOfContents(mockHeadings, { minDepth: 2, maxDepth: 2 });

    expect(toc).toHaveLength(2);
    expect(toc[0].text).toBe('Section 1');
    expect(toc[1].text).toBe('Section 2');
  });

  it('should build hierarchical structure', () => {
    const toc = extractTableOfContents(mockHeadings);

    expect(toc[0].children[0].text).toBe('Section 1');
    expect(toc[0].children[0].children[0].text).toBe('Subsection 1.1');
  });
});

describe('findRelatedPosts', () => {
  const mockPosts = [
    {
      type: 'content' as const,
      id: '1',
      slug: 'post-1',
      collection: 'blog',
      data: { title: 'React Hooks Tutorial', tags: ['react', 'javascript'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '2',
      slug: 'post-2',
      collection: 'blog',
      data: { title: 'Vue Composition API', tags: ['vue', 'javascript'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '3',
      slug: 'post-3',
      collection: 'blog',
      data: { title: 'React Performance', tags: ['react', 'performance'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
  ];

  it('should find related posts by tags', () => {
    const related = findRelatedPosts(mockPosts[0], mockPosts);

    expect(related).toHaveLength(2);
    expect(related[0].id).toBe('3'); // More shared tags
  });

  it('should respect limit option', () => {
    const related = findRelatedPosts(mockPosts[0], mockPosts, { limit: 1 });

    expect(related).toHaveLength(1);
  });

  it('should filter by minimum shared tags', () => {
    const related = findRelatedPosts(mockPosts[0], mockPosts, { minSharedTags: 2 });

    expect(related).toHaveLength(1);
    expect(related[0].id).toBe('3');
  });
});

describe('generateTagCloud', () => {
  const mockEntries = [
    {
      type: 'content' as const,
      id: '1',
      slug: '1',
      collection: 'blog',
      data: { tags: ['javascript', 'react'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '2',
      slug: '2',
      collection: 'blog',
      data: { tags: ['javascript', 'vue'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '3',
      slug: '3',
      collection: 'blog',
      data: { tags: ['javascript'] },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
  ];

  it('should generate tag cloud with counts', () => {
    const cloud = generateTagCloud(mockEntries);

    expect(cloud).toHaveLength(3);
    expect(cloud.find(t => t.tag === 'javascript')?.count).toBe(3);
    expect(cloud.find(t => t.tag === 'react')?.count).toBe(1);
  });

  it('should calculate weights correctly', () => {
    const cloud = generateTagCloud(mockEntries);

    const jsTag = cloud.find(t => t.tag === 'javascript');
    expect(jsTag?.weight).toBe(1); // Most common tag

    const reactTag = cloud.find(t => t.tag === 'react');
    expect(reactTag?.weight).toBe(0); // Least common tag
  });

  it('should sort by count by default', () => {
    const cloud = generateTagCloud(mockEntries);

    expect(cloud[0].tag).toBe('javascript');
  });

  it('should sort alphabetically when specified', () => {
    const cloud = generateTagCloud(mockEntries, { sort: 'alphabetical' });

    expect(cloud[0].tag).toBe('javascript');
    expect(cloud[1].tag).toBe('react');
    expect(cloud[2].tag).toBe('vue');
  });
});

describe('groupByField', () => {
  const mockEntries = [
    {
      type: 'content' as const,
      id: '1',
      slug: '1',
      collection: 'blog',
      data: { category: 'tech' },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '2',
      slug: '2',
      collection: 'blog',
      data: { category: 'tech' },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '3',
      slug: '3',
      collection: 'blog',
      data: { category: 'lifestyle' },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
  ];

  it('should group entries by field', () => {
    const groups = groupByField(mockEntries, 'category');

    expect(groups.size).toBe(2);
    expect(groups.get('tech')).toHaveLength(2);
    expect(groups.get('lifestyle')).toHaveLength(1);
  });
});

describe('groupByDate', () => {
  const mockEntries = [
    {
      type: 'content' as const,
      id: '1',
      slug: '1',
      collection: 'blog',
      data: { date: new Date('2024-01-15') },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '2',
      slug: '2',
      collection: 'blog',
      data: { date: new Date('2024-01-20') },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
    {
      type: 'content' as const,
      id: '3',
      slug: '3',
      collection: 'blog',
      data: { date: new Date('2024-02-10') },
      body: '',
      filePath: '',
      modifiedTime: new Date(),
      render: async () => ({ Content: () => {}, headings: [], images: [], readingTime: 1, tableOfContents: [] }),
    },
  ];

  it('should group by month', () => {
    const groups = groupByDate(mockEntries, { granularity: 'month' });

    expect(groups.size).toBe(2);
    expect(groups.get('2024-01')).toHaveLength(2);
    expect(groups.get('2024-02')).toHaveLength(1);
  });

  it('should group by year', () => {
    const groups = groupByDate(mockEntries, { granularity: 'year' });

    expect(groups.size).toBe(1);
    expect(groups.get('2024')).toHaveLength(3);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('should paginate items', () => {
    const result = paginate(items, { pageSize: 10, page: 1 });

    expect(result.items).toHaveLength(10);
    expect(result.items[0]).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it('should handle last page', () => {
    const result = paginate(items, { pageSize: 10, page: 3 });

    expect(result.items).toHaveLength(5);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });
});

describe('slugify', () => {
  it('should create URL-friendly slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Hello  World')).toBe('hello-world');
    expect(slugify('Hello-World')).toBe('hello-world');
    expect(slugify('Hello_World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
    expect(slugify('Hello@World#')).toBe('helloworld');
  });

  it('should trim hyphens', () => {
    expect(slugify('-Hello World-')).toBe('hello-world');
  });
});

describe('stripMarkdown', () => {
  it('should remove all markdown formatting', () => {
    const markdown = '# Heading\n\nThis is **bold** and *italic*\n\n- List item\n- Another item';
    const stripped = stripMarkdown(markdown);

    expect(stripped).not.toContain('#');
    expect(stripped).not.toContain('**');
    expect(stripped).not.toContain('*');
    expect(stripped).not.toContain('-');
  });
});

describe('formatDate', () => {
  const date = new Date('2024-01-15T12:00:00Z');

  it('should format dates', () => {
    const short = formatDate(date, 'short', 'en-US');
    const medium = formatDate(date, 'medium', 'en-US');
    const long = formatDate(date, 'long', 'en-US');

    expect(short).toMatch(/1\/15\/2024/);
    expect(medium).toContain('Jan');
    expect(long).toContain('January');
  });
});
