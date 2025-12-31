/**
 * PhilJS CLI - Sitemap Generator
 *
 * Generates XML sitemaps from content collections and routes
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
/**
 * Generate sitemap
 */
export async function generateSitemap(options) {
    const output = options.output || 'public/sitemap.xml';
    console.log(pc.cyan('\nGenerating sitemap...\n'));
    // Create the generator file
    const generatorContent = generateSitemapGeneratorFile(options);
    const generatorPath = path.join(process.cwd(), 'scripts', 'generate-sitemap.ts');
    await fs.mkdir(path.dirname(generatorPath), { recursive: true });
    await fs.writeFile(generatorPath, generatorContent);
    console.log(pc.green(`  Created sitemap generator: ${generatorPath}`));
    // Create example config if it doesn't exist
    const configPath = path.join(process.cwd(), 'content', 'config.ts');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    if (!configExists) {
        const configContent = generateContentConfig();
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, configContent);
        console.log(pc.green(`  Created content config: ${configPath}`));
    }
    // Create robots.txt generator
    const robotsContent = generateRobotsTxtGenerator(options);
    const robotsPath = path.join(process.cwd(), 'scripts', 'generate-robots.ts');
    await fs.writeFile(robotsPath, robotsContent);
    console.log(pc.green(`  Created robots.txt generator: ${robotsPath}`));
    console.log(pc.dim('\nTo generate the sitemap, run:'));
    console.log(pc.cyan('  tsx scripts/generate-sitemap.ts\n'));
    console.log(pc.dim('Or add to your build script in package.json:'));
    console.log(pc.cyan('  "build:sitemap": "tsx scripts/generate-sitemap.ts && tsx scripts/generate-robots.ts"\n'));
}
/**
 * Generate sitemap generator file content
 */
function generateSitemapGeneratorFile(options) {
    const output = options.output || 'public/sitemap.xml';
    const collection = options.collection || 'blog';
    const site = options.site || 'https://example.com';
    const changefreq = options.changefreq || 'weekly';
    const priority = options.priority || 0.7;
    return `/**
 * Generate XML sitemap from content collection
 */

import { getCollection } from 'philjs-content';
import { generateSitemapFromCollection } from 'philjs-content/sitemap';
import * as fs from 'fs/promises';
import * as path from 'path';

async function generateSitemap() {
  console.log('Generating sitemap...');

  // Get all published content
  const posts = await getCollection('${collection}', {
    filter: (post) => {
      const data = post.data as { draft?: boolean };
      return !data.draft;
    },
  });

  // Generate sitemap
  const sitemap = generateSitemapFromCollection({
    entries: posts,
    site: '${site}',
    mapping: {
      loc: (entry) => \`/\${entry.slug}\`,
      lastmod: 'date',
      changefreq: '${changefreq}',
      priority: ${priority},
    },
  });

  // Write sitemap to file
  const outputPath = path.join(process.cwd(), '${output}');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, sitemap, 'utf-8');

  console.log(\`Sitemap generated: \${outputPath}\`);
}

generateSitemap().catch(console.error);
`;
}
/**
 * Generate robots.txt generator
 */
function generateRobotsTxtGenerator(options) {
    const site = options.site || 'https://example.com';
    const sitemapPath = options.output || 'public/sitemap.xml';
    const sitemapUrl = `${site}${sitemapPath.replace('public', '')}`;
    return `/**
 * Generate robots.txt
 */

import { generateRobotsTxt } from 'philjs-content/sitemap';
import * as fs from 'fs/promises';
import * as path from 'path';

async function generateRobots() {
  console.log('Generating robots.txt...');

  const robots = generateRobotsTxt({
    sitemapUrl: '${sitemapUrl}',
    allow: ['/'],
    disallow: ['/api/', '/admin/'],
  });

  const outputPath = path.join(process.cwd(), 'public', 'robots.txt');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, robots, 'utf-8');

  console.log(\`robots.txt generated: \${outputPath}\`);
}

generateRobots().catch(console.error);
`;
}
/**
 * Generate example content config
 */
function generateContentConfig() {
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
//# sourceMappingURL=sitemap.js.map