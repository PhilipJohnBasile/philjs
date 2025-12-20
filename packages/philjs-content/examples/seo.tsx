/**
 * Example: SEO utilities with PhilJS
 *
 * This example shows how to use SEO utilities to generate
 * meta tags, Open Graph, Twitter Cards, and JSON-LD.
 */

import { getEntry } from 'philjs-content';
import {
  generateMetaTags,
  generateSEOFromEntry,
  useSEO,
  type SEOConfig,
  type JSONLDArticle,
} from 'philjs-content/seo';

// Example 1: Basic SEO component
export function BlogPost({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);

  const seo = useSEO({
    title: `${post.data.title} | My Blog`,
    description: post.data.description,
    canonical: `https://example.com/blog/${slug}`,
    keywords: post.data.tags,
    openGraph: {
      type: 'article',
      title: post.data.title,
      description: post.data.description,
      url: `https://example.com/blog/${slug}`,
      siteName: 'My Blog',
      images: post.data.image ? [{
        url: post.data.image,
        alt: post.data.title,
        width: 1200,
        height: 630,
      }] : undefined,
      article: {
        publishedTime: post.data.date,
        modifiedTime: post.data.updatedDate,
        authors: [post.data.author],
        tags: post.data.tags,
      },
    },
    twitter: {
      card: 'summary_large_image',
      site: '@myblog',
      creator: '@author',
      title: post.data.title,
      description: post.data.description,
      image: post.data.image,
    },
  });

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <article>
          <h1>{post.data.title}</h1>
          <p>{post.data.description}</p>
          <div innerHTML={await post.render()} />
        </article>
      </body>
    </html>
  );
}

// Example 2: Auto-generate SEO from entry
export function SimpleBlogPost({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);

  const seo = useSEO(
    generateSEOFromEntry(post, 'https://example.com', {
      titleTemplate: '%s | My Awesome Blog',
      defaultImage: 'https://example.com/og-default.jpg',
      siteName: 'My Awesome Blog',
      twitterHandle: '@myblog',
    })
  );

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <article>
          <h1>{post.data.title}</h1>
        </article>
      </body>
    </html>
  );
}

// Example 3: Homepage with JSON-LD
export function Homepage() {
  const seoConfig: SEOConfig = {
    title: 'My Awesome Blog - Web Development & Tech',
    description: 'Thoughts and tutorials on modern web development',
    canonical: 'https://example.com',
    openGraph: {
      type: 'website',
      title: 'My Awesome Blog',
      description: 'Thoughts and tutorials on modern web development',
      url: 'https://example.com',
      siteName: 'My Awesome Blog',
      images: [{
        url: 'https://example.com/og-home.jpg',
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@myblog',
    },
    jsonLd: [
      // Website schema
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'My Awesome Blog',
        url: 'https://example.com',
        description: 'Thoughts and tutorials on modern web development',
        publisher: {
          '@type': 'Organization',
          name: 'My Company',
          logo: 'https://example.com/logo.png',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://example.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      // Organization schema
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'My Company',
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
        sameAs: [
          'https://twitter.com/myblog',
          'https://github.com/mycompany',
        ],
      },
    ],
  };

  const seo = useSEO(seoConfig);

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <h1>Welcome to My Blog</h1>
      </body>
    </html>
  );
}

// Example 4: Article with rich JSON-LD
export function ArticleWithSchema({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);

  const articleSchema: JSONLDArticle = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    description: post.data.description,
    image: post.data.image,
    datePublished: post.data.date.toISOString(),
    dateModified: (post.data.updatedDate || post.data.date).toISOString(),
    author: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: post.data.author,
      url: `https://example.com/authors/${post.data.author.toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'My Blog',
      logo: 'https://example.com/logo.png',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://example.com/blog/${slug}`,
    },
    keywords: post.data.tags,
    wordCount: post.body.split(/\s+/).length,
  };

  const seo = useSEO({
    title: `${post.data.title} | My Blog`,
    description: post.data.description,
    canonical: `https://example.com/blog/${slug}`,
    jsonLd: articleSchema,
  });

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <article>
          <h1>{post.data.title}</h1>
        </article>
      </body>
    </html>
  );
}

// Example 5: Product page with structured data
export function ProductPage({ slug }: { slug: string }) {
  const product = await getEntry('products', slug);

  const seo = useSEO({
    title: `${product.data.name} - Buy Now`,
    description: product.data.description,
    canonical: `https://example.com/products/${slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.data.name,
      description: product.data.description,
      image: product.data.images,
      brand: product.data.brand,
      offers: {
        '@type': 'Offer',
        price: product.data.price.toString(),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `https://example.com/products/${slug}`,
      },
      aggregateRating: product.data.rating ? {
        '@type': 'AggregateRating',
        ratingValue: product.data.rating,
        reviewCount: product.data.reviewCount,
      } : undefined,
    },
  });

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <div>
          <h1>{product.data.name}</h1>
          <p>{product.data.description}</p>
          <p>Price: ${product.data.price}</p>
        </div>
      </body>
    </html>
  );
}

// Example 6: Breadcrumb navigation with schema
export function DocsPage({ slug }: { slug: string }) {
  const doc = await getEntry('docs', slug);
  const pathParts = slug.split('/');

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: pathParts.map((part, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: part.charAt(0).toUpperCase() + part.slice(1),
      item: index < pathParts.length - 1
        ? `https://example.com/docs/${pathParts.slice(0, index + 1).join('/')}`
        : undefined,
    })),
  };

  const seo = useSEO({
    title: `${doc.data.title} - Documentation`,
    description: doc.data.description,
    jsonLd: breadcrumbSchema,
  });

  return (
    <html>
      <head innerHTML={seo.head} />
      <body>
        <article>{doc.data.title}</article>
      </body>
    </html>
  );
}
