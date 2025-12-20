/**
 * Tests for RSS feed generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateRSS,
  generateAtom,
  generateJSONFeed,
  generateRSSFromCollection,
  validateRSSFeed,
  type RSSFeedConfig,
  type AtomFeedConfig,
  type JSONFeedConfig,
} from './rss.js';

describe('RSS Feed Generation', () => {
  const mockRSSConfig: RSSFeedConfig = {
    title: 'My Blog',
    description: 'A test blog',
    site: 'https://example.com',
    items: [
      {
        title: 'First Post',
        link: 'https://example.com/posts/first',
        description: 'This is the first post',
        pubDate: new Date('2024-01-01T00:00:00Z'),
        author: 'test@example.com (Test Author)',
        categories: ['test', 'blog'],
      },
      {
        title: 'Second Post',
        link: 'https://example.com/posts/second',
        description: 'This is the second post',
        content: '<p>Full content here</p>',
        pubDate: new Date('2024-01-02T00:00:00Z'),
      },
    ],
  };

  it('should generate valid RSS 2.0 feed', () => {
    const rss = generateRSS(mockRSSConfig);

    expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rss).toContain('<rss version="2.0"');
    expect(rss).toContain('<title>My Blog</title>');
    expect(rss).toContain('<description>A test blog</description>');
    expect(rss).toContain('<link>https://example.com</link>');
    expect(rss).toContain('<item>');
    expect(rss).toContain('<title>First Post</title>');
    expect(rss).toContain('</rss>');
  });

  it('should include content:encoded for full content', () => {
    const rss = generateRSS(mockRSSConfig);

    expect(rss).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(rss).toContain('<content:encoded><![CDATA[<p>Full content here</p>]]></content:encoded>');
  });

  it('should include author and categories', () => {
    const rss = generateRSS(mockRSSConfig);

    expect(rss).toContain('<author>test@example.com (Test Author)</author>');
    expect(rss).toContain('<category>test</category>');
    expect(rss).toContain('<category>blog</category>');
  });

  it('should escape XML special characters', () => {
    const config: RSSFeedConfig = {
      title: 'Test & Demo <Site>',
      description: 'Testing "quotes" and \'apostrophes\'',
      site: 'https://example.com',
      items: [],
    };

    const rss = generateRSS(config);

    expect(rss).toContain('Test &amp; Demo &lt;Site&gt;');
    expect(rss).toContain('Testing &quot;quotes&quot; and &apos;apostrophes&apos;');
  });

  it('should validate RSS feed configuration', () => {
    const valid = validateRSSFeed(mockRSSConfig);
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it('should detect invalid RSS configuration', () => {
    const invalid: RSSFeedConfig = {
      title: '',
      description: '',
      site: '',
      items: [],
    };

    const result = validateRSSFeed(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Feed title is required');
    expect(result.errors).toContain('Feed description is required');
    expect(result.errors).toContain('Site URL is required');
  });
});

describe('Atom Feed Generation', () => {
  const mockAtomConfig: AtomFeedConfig = {
    title: 'My Blog',
    subtitle: 'A test blog',
    site: 'https://example.com',
    feedUrl: 'https://example.com/atom.xml',
    items: [
      {
        title: 'First Post',
        link: 'https://example.com/posts/first',
        summary: 'This is the first post',
        content: '<p>Full content here</p>',
        published: new Date('2024-01-01T00:00:00Z'),
        updated: new Date('2024-01-02T00:00:00Z'),
      },
    ],
    author: {
      name: 'Test Author',
      email: 'test@example.com',
    },
  };

  it('should generate valid Atom feed', () => {
    const atom = generateAtom(mockAtomConfig);

    expect(atom).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(atom).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(atom).toContain('<title>My Blog</title>');
    expect(atom).toContain('<subtitle>A test blog</subtitle>');
    expect(atom).toContain('<link href="https://example.com" />');
    expect(atom).toContain('<entry>');
    expect(atom).toContain('</feed>');
  });

  it('should include self-referencing link', () => {
    const atom = generateAtom(mockAtomConfig);

    expect(atom).toContain('<link href="https://example.com/atom.xml" rel="self" type="application/atom+xml" />');
  });

  it('should include author information', () => {
    const atom = generateAtom(mockAtomConfig);

    expect(atom).toContain('<author>');
    expect(atom).toContain('<name>Test Author</name>');
    expect(atom).toContain('<email>test@example.com</email>');
    expect(atom).toContain('</author>');
  });
});

describe('JSON Feed Generation', () => {
  const mockJSONConfig: JSONFeedConfig = {
    title: 'My Blog',
    description: 'A test blog',
    home_page_url: 'https://example.com',
    feed_url: 'https://example.com/feed.json',
    items: [
      {
        id: 'https://example.com/posts/first',
        url: 'https://example.com/posts/first',
        title: 'First Post',
        summary: 'This is the first post',
        content_html: '<p>Full content here</p>',
        date_published: '2024-01-01T00:00:00Z',
        tags: ['test', 'blog'],
      },
    ],
  };

  it('should generate valid JSON Feed', () => {
    const json = generateJSONFeed(mockJSONConfig);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('https://jsonfeed.org/version/1.1');
    expect(parsed.title).toBe('My Blog');
    expect(parsed.description).toBe('A test blog');
    expect(parsed.home_page_url).toBe('https://example.com');
    expect(parsed.items).toHaveLength(1);
  });

  it('should include all item properties', () => {
    const json = generateJSONFeed(mockJSONConfig);
    const parsed = JSON.parse(json);
    const item = parsed.items[0];

    expect(item.id).toBe('https://example.com/posts/first');
    expect(item.url).toBe('https://example.com/posts/first');
    expect(item.title).toBe('First Post');
    expect(item.summary).toBe('This is the first post');
    expect(item.content_html).toBe('<p>Full content here</p>');
    expect(item.tags).toEqual(['test', 'blog']);
  });
});

describe('Feed from Collection', () => {
  const mockEntries = [
    {
      type: 'content' as const,
      id: 'first',
      slug: 'first-post',
      collection: 'blog',
      data: {
        title: 'First Post',
        description: 'This is the first post',
        date: new Date('2024-01-01'),
        tags: ['test'],
      },
      body: 'Post content here',
      filePath: 'blog/first.md',
      modifiedTime: new Date('2024-01-01'),
      render: async () => ({
        Content: () => {},
        headings: [],
        images: [],
        readingTime: 1,
        tableOfContents: [],
      }),
    },
  ];

  it('should generate RSS from collection', () => {
    const rss = generateRSSFromCollection({
      entries: mockEntries,
      title: 'My Blog',
      description: 'A test blog',
      site: 'https://example.com',
    });

    expect(rss).toContain('<title>My Blog</title>');
    expect(rss).toContain('<title>First Post</title>');
    expect(rss).toContain('<description>This is the first post</description>');
  });

  it('should use custom mapping', () => {
    const rss = generateRSSFromCollection({
      entries: mockEntries,
      title: 'My Blog',
      description: 'A test blog',
      site: 'https://example.com',
      mapping: {
        link: (entry) => `https://example.com/blog/${entry.slug}`,
      },
    });

    expect(rss).toContain('https://example.com/blog/first-post');
  });
});
