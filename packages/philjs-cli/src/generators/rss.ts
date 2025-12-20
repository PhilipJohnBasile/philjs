/**
 * PhilJS CLI - RSS Feed Generator
 *
 * Generates RSS/Atom/JSON feeds from content collections
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';

export interface RSSGeneratorOptions {
  /** Output file path */
  output?: string;
  /** Feed format: rss, atom, or json */
  format?: 'rss' | 'atom' | 'json';
  /** Collection name to generate feed from */
  collection?: string;
  /** Feed title */
  title?: string;
  /** Feed description */
  description?: string;
  /** Site URL */
  site?: string;
  /** Maximum number of items */
  limit?: number;
}

/**
 * Generate RSS feed
 */
export async function generateRSS(options: RSSGeneratorOptions): Promise<void> {
  const format = options.format || 'rss';
  const output = options.output || `public/feed.${format === 'json' ? 'json' : 'xml'}`;

  console.log(pc.cyan(`\nGenerating ${format.toUpperCase()} feed...\n`));

  // Create the generator file
  const generatorContent = generateRSSGeneratorFile(options);
  const generatorPath = path.join(process.cwd(), 'scripts', `generate-${format}.ts`);

  await fs.mkdir(path.dirname(generatorPath), { recursive: true });
  await fs.writeFile(generatorPath, generatorContent);

  console.log(pc.green(`  Created feed generator: ${generatorPath}`));

  // Create example config if it doesn't exist
  const configPath = path.join(process.cwd(), 'content', 'config.ts');
  const configExists = await fs.access(configPath).then(() => true).catch(() => false);

  if (!configExists) {
    const configContent = generateContentConfig();
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, configContent);
    console.log(pc.green(`  Created content config: ${configPath}`));
  }

  console.log(pc.dim(`\nTo generate the feed, run:`));
  console.log(pc.cyan(`  tsx scripts/generate-${format}.ts\n`));

  console.log(pc.dim(`Or add to your build script in package.json:`));
  console.log(pc.cyan(`  "build:feed": "tsx scripts/generate-${format}.ts"\n`));
}

/**
 * Generate RSS generator file content
 */
function generateRSSGeneratorFile(options: RSSGeneratorOptions): string {
  const format = options.format || 'rss';
  const output = options.output || `public/feed.${format === 'json' ? 'json' : 'xml'}`;
  const collection = options.collection || 'blog';
  const title = options.title || 'My Blog';
  const description = options.description || 'My blog posts';
  const site = options.site || 'https://example.com';
  const limit = options.limit || 20;

  const functionName = format === 'rss'
    ? 'generateRSSFromCollection'
    : format === 'atom'
    ? 'generateAtomFromCollection'
    : 'generateJSONFeedFromCollection';

  return `/**
 * Generate ${format.toUpperCase()} feed from content collection
 */

import { getCollection } from 'philjs-content';
import { ${functionName} } from 'philjs-content/rss';
import * as fs from 'fs/promises';
import * as path from 'path';

async function generateFeed() {
  console.log('Generating ${format.toUpperCase()} feed...');

  // Get all posts from collection
  const posts = await getCollection('${collection}', {
    filter: (post) => {
      // Filter out drafts and future posts
      const data = post.data as { draft?: boolean; date?: Date };
      return !data.draft && (!data.date || data.date <= new Date());
    },
    sort: (a, b) => {
      // Sort by date descending
      const aDate = (a.data as { date?: Date }).date || new Date(0);
      const bDate = (b.data as { date?: Date }).date || new Date(0);
      return bDate.getTime() - aDate.getTime();
    },
    limit: ${limit},
  });

  // Generate feed
  const feed = ${functionName}({
    entries: posts,
    title: '${title}',
    description: '${description}',
    site: '${site}',
    feedUrl: '${site}${output.replace('public', '')}',
    limit: ${limit},
    mapping: {
      // Customize field mapping if needed
      title: 'title',
      description: 'description',
      link: (entry) => \`${site}/\${entry.slug}\`,
      pubDate: 'date',
      author: 'author',
      categories: 'tags',
      content: 'body', // Full content in feed
    },
  });

  // Write feed to file
  const outputPath = path.join(process.cwd(), '${output}');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, feed, 'utf-8');

  console.log(\`Feed generated: \${outputPath}\`);
}

generateFeed().catch(console.error);
`;
}

/**
 * Generate example content config
 */
function generateContentConfig(): string {
  return `/**
 * Content Collections Configuration
 */

import { defineCollection, z } from 'philjs-content';

export const collections = {
  blog: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      image: z.string().optional(),
    }),
  }),
};
`;
}
