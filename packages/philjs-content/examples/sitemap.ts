/**
 * Example: Generate XML sitemaps
 *
 * This example shows how to generate sitemaps from your
 * content collections and routes.
 */

import { getCollection } from 'philjs-content';
import {
  generateSitemap,
  generateSitemapFromCollection,
  generateSitemapIndex,
  generateRobotsTxt,
  splitSitemap,
  type SitemapUrl,
} from 'philjs-content/sitemap';

// Example 1: Basic sitemap generation
async function generateBasicSitemap() {
  const sitemap = generateSitemap({
    site: 'https://example.com',
    urls: [
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: '/about',
        changefreq: 'monthly',
        priority: 0.8,
      },
      {
        loc: '/contact',
        changefreq: 'yearly',
        priority: 0.5,
      },
    ],
  });

  await Bun.write('public/sitemap.xml', sitemap);
  console.log('Sitemap generated: public/sitemap.xml');
}

// Example 2: Generate sitemap from blog collection
async function generateBlogSitemap() {
  const posts = await getCollection('blog', {
    filter: (post) => !(post.data as { draft?: boolean }).draft,
  });

  const sitemap = generateSitemapFromCollection({
    entries: posts,
    site: 'https://example.com',
    mapping: {
      loc: (entry) => `/blog/${entry.slug}`,
      lastmod: 'date',
      changefreq: 'weekly',
      priority: 0.7,
    },
  });

  await Bun.write('public/blog-sitemap.xml', sitemap);
  console.log('Blog sitemap generated');
}

// Example 3: Sitemap with images
async function generateSitemapWithImages() {
  const posts = await getCollection('blog');

  const urls: SitemapUrl[] = posts.map(post => {
    const data = post.data as {
      title: string;
      date: Date;
      image?: string;
      images?: string[];
    };

    return {
      loc: `/blog/${post.slug}`,
      lastmod: data.date,
      changefreq: 'weekly' as const,
      priority: 0.7,
      images: data.images?.map(img => ({
        loc: img,
        title: data.title,
      })) || (data.image ? [{
        loc: data.image,
        title: data.title,
      }] : undefined),
    };
  });

  const sitemap = generateSitemap({
    site: 'https://example.com',
    urls,
  });

  await Bun.write('public/sitemap.xml', sitemap);
}

// Example 4: Multi-language sitemap
async function generateMultiLanguageSitemap() {
  const posts = await getCollection('blog');

  const urls: SitemapUrl[] = posts.map(post => ({
    loc: `/en/blog/${post.slug}`,
    lastmod: (post.data as { date: Date }).date,
    alternates: [
      { lang: 'en', href: `https://example.com/en/blog/${post.slug}` },
      { lang: 'es', href: `https://example.com/es/blog/${post.slug}` },
      { lang: 'fr', href: `https://example.com/fr/blog/${post.slug}` },
    ],
  }));

  const sitemap = generateSitemap({
    site: 'https://example.com',
    urls,
  });

  await Bun.write('public/sitemap.xml', sitemap);
}

// Example 5: Large sitemap with index
async function generateLargeSitemap() {
  // Get all content
  const blog = await getCollection('blog');
  const docs = await getCollection('docs');
  const products = await getCollection('products');

  const allUrls: SitemapUrl[] = [
    ...blog.map(p => ({
      loc: `/blog/${p.slug}`,
      lastmod: (p.data as { date: Date }).date,
    })),
    ...docs.map(d => ({
      loc: `/docs/${d.slug}`,
      lastmod: d.modifiedTime,
    })),
    ...products.map(p => ({
      loc: `/products/${p.slug}`,
      lastmod: (p.data as { updatedAt: Date }).updatedAt,
    })),
  ];

  // Split into chunks if needed
  const chunks = splitSitemap(allUrls, 50000);

  if (chunks.length > 1) {
    // Generate sitemap index
    const sitemapFiles = await Promise.all(
      chunks.map(async (chunk, index) => {
        const sitemap = generateSitemap({
          site: 'https://example.com',
          urls: chunk,
        });

        const filename = `sitemap-${index + 1}.xml`;
        await Bun.write(`public/${filename}`, sitemap);

        return {
          loc: `https://example.com/${filename}`,
          lastmod: new Date(),
        };
      })
    );

    const index = generateSitemapIndex(sitemapFiles);
    await Bun.write('public/sitemap.xml', index);
    console.log('Sitemap index generated with', chunks.length, 'sitemaps');
  } else {
    // Single sitemap
    const sitemap = generateSitemap({
      site: 'https://example.com',
      urls: allUrls,
    });
    await Bun.write('public/sitemap.xml', sitemap);
  }
}

// Example 6: Generate robots.txt
async function generateRobots() {
  const robots = generateRobotsTxt({
    sitemapUrl: 'https://example.com/sitemap.xml',
    allow: ['/'],
    disallow: ['/admin/', '/api/', '/private/'],
    crawlDelay: 1,
  });

  await Bun.write('public/robots.txt', robots);
  console.log('robots.txt generated');
}

// Example 7: Combined static and dynamic routes
async function generateCompleteSitemap() {
  // Static routes
  const staticUrls: SitemapUrl[] = [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/about', changefreq: 'monthly', priority: 0.8 },
    { loc: '/contact', changefreq: 'yearly', priority: 0.5 },
  ];

  // Dynamic routes from content
  const posts = await getCollection('blog', {
    filter: (post) => !(post.data as { draft?: boolean }).draft,
  });

  const blogUrls: SitemapUrl[] = posts.map(post => ({
    loc: `/blog/${post.slug}`,
    lastmod: (post.data as { date: Date }).date,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine all URLs
  const allUrls = [...staticUrls, ...blogUrls];

  const sitemap = generateSitemap({
    site: 'https://example.com',
    urls: allUrls,
  });

  await Bun.write('public/sitemap.xml', sitemap);
  console.log('Complete sitemap generated with', allUrls.length, 'URLs');
}

// Run examples
if (import.meta.main) {
  await generateCompleteSitemap();
  await generateRobots();
}
