/**
 * Example: Generate RSS/Atom/JSON feeds
 *
 * This example shows how to generate various feed formats
 * from your content collections.
 */

import { getCollection } from 'philjs-content';
import {
  generateRSS,
  generateAtom,
  generateJSONFeed,
  generateRSSFromCollection,
  generateAtomFromCollection,
  generateJSONFeedFromCollection,
  type RSSFeedConfig,
} from 'philjs-content/rss';

// Example 1: Manual RSS feed generation
async function generateManualRSS() {
  const config: RSSFeedConfig = {
    title: 'My Awesome Blog',
    description: 'Thoughts on web development and technology',
    site: 'https://example.com',
    language: 'en',
    copyright: '2024 My Company',
    items: [
      {
        title: 'Getting Started with PhilJS',
        link: 'https://example.com/blog/getting-started',
        description: 'Learn how to build modern web apps with PhilJS',
        content: '<p>Full article content here...</p>',
        pubDate: new Date('2024-01-15'),
        author: 'hello@example.com (John Doe)',
        categories: ['web-development', 'javascript'],
      },
      {
        title: 'Advanced Routing Patterns',
        link: 'https://example.com/blog/advanced-routing',
        description: 'Explore advanced routing techniques',
        pubDate: new Date('2024-01-20'),
        categories: ['web-development'],
      },
    ],
  };

  const rss = generateRSS(config);
  console.log(rss);
}

// Example 2: Generate RSS from content collection
async function generateRSSFromBlog() {
  // Get all published blog posts
  const posts = await getCollection('blog', {
    filter: (post) => {
      const data = post.data as { draft?: boolean; date?: Date };
      return !data.draft && (!data.date || data.date <= new Date());
    },
    sort: (a, b) => {
      const aDate = (a.data as { date?: Date }).date || new Date(0);
      const bDate = (b.data as { date?: Date }).date || new Date(0);
      return bDate.getTime() - aDate.getTime();
    },
    limit: 20,
  });

  // Generate RSS feed
  const rss = generateRSSFromCollection({
    entries: posts,
    title: 'My Blog',
    description: 'Latest blog posts',
    site: 'https://example.com',
    feedUrl: 'https://example.com/rss.xml',
    limit: 20,
    mapping: {
      title: 'title',
      description: 'description',
      link: (entry) => `https://example.com/blog/${entry.slug}`,
      pubDate: 'date',
      author: 'author',
      categories: 'tags',
      content: 'body', // Include full content
    },
  });

  // Write to file
  await Bun.write('public/rss.xml', rss);
  console.log('RSS feed generated: public/rss.xml');
}

// Example 3: Generate Atom feed
async function generateAtomFeed() {
  const posts = await getCollection('blog', {
    filter: (post) => !(post.data as { draft?: boolean }).draft,
    sort: (a, b) => {
      const aDate = (a.data as { date?: Date }).date || new Date(0);
      const bDate = (b.data as { date?: Date }).date || new Date(0);
      return bDate.getTime() - aDate.getTime();
    },
    limit: 20,
  });

  const atom = generateAtomFromCollection({
    entries: posts,
    title: 'My Blog',
    description: 'Latest blog posts',
    site: 'https://example.com',
    feedUrl: 'https://example.com/atom.xml',
  });

  await Bun.write('public/atom.xml', atom);
  console.log('Atom feed generated: public/atom.xml');
}

// Example 4: Generate JSON Feed
async function generateJSONFeedExample() {
  const posts = await getCollection('blog', {
    filter: (post) => !(post.data as { draft?: boolean }).draft,
    limit: 20,
  });

  const feed = generateJSONFeedFromCollection({
    entries: posts,
    title: 'My Blog',
    description: 'Latest blog posts',
    site: 'https://example.com',
    feedUrl: 'https://example.com/feed.json',
  });

  await Bun.write('public/feed.json', feed);
  console.log('JSON Feed generated: public/feed.json');
}

// Example 5: Generate podcast RSS feed
async function generatePodcastFeed() {
  const episodes = await getCollection('podcast');

  const rss = generateRSS({
    title: 'My Podcast',
    description: 'Weekly tech discussions',
    site: 'https://example.com/podcast',
    language: 'en',
    customNamespaces: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    },
    items: episodes.map(ep => {
      const data = ep.data as {
        title: string;
        description: string;
        date: Date;
        audioUrl: string;
        audioSize: number;
        duration: number;
      };

      return {
        title: data.title,
        link: `https://example.com/podcast/${ep.slug}`,
        description: data.description,
        pubDate: data.date,
        enclosure: {
          url: data.audioUrl,
          length: data.audioSize,
          type: 'audio/mpeg',
        },
        customData: `<itunes:duration>${data.duration}</itunes:duration>`,
      };
    }),
  });

  await Bun.write('public/podcast.xml', rss);
  console.log('Podcast feed generated: public/podcast.xml');
}

// Run examples
if (import.meta.main) {
  await generateRSSFromBlog();
  await generateAtomFeed();
  await generateJSONFeedExample();
}
