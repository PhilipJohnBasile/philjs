# SEO Optimization

Complete guide to optimizing your PhilJS application for search engines. Learn how to manage meta tags, implement structured data, configure Open Graph tags, leverage SSR for SEO, and generate sitemaps.

## What You'll Learn

- Meta tag management
- Structured data (JSON-LD)
- Open Graph and Twitter Cards
- SSR for SEO optimization
- Dynamic sitemap generation
- Best practices for search visibility
- SEO monitoring and debugging

## Why SEO Matters

Search engine optimization provides critical benefits:

- **Discoverability**: Help users find your content through search
- **Social Sharing**: Rich previews on social media platforms
- **Crawlability**: Enable search engines to index your content
- **Rankings**: Improve search engine rankings
- **User Experience**: Better metadata improves click-through rates
- **Performance**: SSR provides fast initial page loads

## Meta Tag Management

### Basic Meta Tags

Essential meta tags for every page:

```typescript
import { signal } from '@philjs/core';

function PageHead({ title, description, keywords }: {
  title: string;
  description: string;
  keywords?: string[];
}) {
  return (
    <head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Viewport for responsive design */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Character encoding */}
      <meta charset="UTF-8" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en" />
    </head>
  );
}

// Usage
function HomePage() {
  return (
    <>
      <PageHead
        title="PhilJS - Modern Reactive Framework"
        description="Build fast, reactive web applications with PhilJS. Features signals, SSR, and automatic optimization."
        keywords={['javascript', 'framework', 'reactive', 'signals']}
      />

      <main>
        {/* Page content */}
      </main>
    </>
  );
}
```

### Dynamic Meta Tags

Update meta tags dynamically based on content:

```typescript
import { signal, effect } from '@philjs/core';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

function SEOHead({ title, description, canonical, noindex, nofollow }: SEOProps) {
  const robots = signal<string[]>([]);

  effect(() => {
    const robotsArr: string[] = [];
    if (noindex) robotsArr.push('noindex');
    if (nofollow) robotsArr.push('nofollow');
    if (!noindex) robotsArr.push('index');
    if (!nofollow) robotsArr.push('follow');
    robots.set(robotsArr);
  });

  return (
    <head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {robots().length > 0 && (
        <meta name="robots" content={robots().join(', ')} />
      )}
    </head>
  );
}

// Usage for dynamic pages
async function BlogPost({ slug }: { slug: string }) {
  const post = signal(await fetchPost(slug));

  return (
    <>
      <SEOHead
        title={`${post().title} - My Blog`}
        description={post().excerpt}
        canonical={`https://example.com/blog/${slug}`}
      />

      <article>
        <h1>{post().title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post().content }} />
      </article>
    </>
  );
}
```

### Meta Tags Component

Create a reusable SEO component:

```typescript
interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  httpEquiv?: string;
}

interface LinkTag {
  rel: string;
  href: string;
  hreflang?: string;
}

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: string[];
  author?: string;
  publisher?: string;
  meta?: MetaTag[];
  links?: LinkTag[];
}

function SEO({
  title,
  description,
  keywords,
  canonical,
  robots = ['index', 'follow'],
  author,
  publisher,
  meta = [],
  links = []
}: SEOConfig) {
  return (
    <head>
      {/* Title */}
      <title>{title}</title>

      {/* Standard meta tags */}
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robots.join(', ')} />
      {author && <meta name="author" content={author} />}
      {publisher && <meta name="publisher" content={publisher} />}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Additional meta tags */}
      {meta.map((tag, idx) => {
        if (tag.name) {
          return <meta key={idx} name={tag.name} content={tag.content} />;
        } else if (tag.property) {
          return <meta key={idx} property={tag.property} content={tag.content} />;
        } else if (tag.httpEquiv) {
          return <meta key={idx} httpEquiv={tag.httpEquiv} content={tag.content} />;
        }
        return null;
      })}

      {/* Additional links */}
      {links.map((link, idx) => (
        <link key={idx} {...link} />
      ))}
    </head>
  );
}

// Usage
function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <SEO
        title={`${product.name} - Buy Online`}
        description={product.description}
        keywords={product.tags}
        canonical={`https://example.com/products/${product.id}`}
        author="Example Store"
        meta={[
          { property: 'product:price:amount', content: product.price.toString() },
          { property: 'product:price:currency', content: 'USD' }
        ]}
        links={[
          { rel: 'alternate', href: `/es/products/${product.id}`, hreflang: 'es' },
          { rel: 'alternate', href: `/fr/products/${product.id}`, hreflang: 'fr' }
        ]}
      />

      <div className="product">
        {/* Product content */}
      </div>
    </>
  );
}
```

## Structured Data (JSON-LD)

### JSON-LD Component

Implement structured data for rich search results:

```typescript
interface StructuredDataProps {
  type: string;
  data: Record<string, any>;
}

function StructuredData({ type, data }: StructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Article Schema

For blog posts and articles:

```typescript
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
}

function ArticleSchema(props: ArticleSchemaProps) {
  return (
    <StructuredData
      type="Article"
      data={{
        headline: props.headline,
        description: props.description,
        image: props.image,
        datePublished: props.datePublished,
        dateModified: props.dateModified || props.datePublished,
        author: {
          '@type': 'Person',
          name: props.author.name,
          ...(props.author.url && { url: props.author.url })
        },
        publisher: {
          '@type': 'Organization',
          name: props.publisher.name,
          logo: {
            '@type': 'ImageObject',
            url: props.publisher.logo
          }
        }
      }}
    />
  );
}

// Usage
function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <SEO title={post.title} description={post.excerpt} />

      <ArticleSchema
        headline={post.title}
        description={post.excerpt}
        image={post.coverImage}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        author={{
          name: post.author.name,
          url: `https://example.com/authors/${post.author.id}`
        }}
        publisher={{
          name: 'My Blog',
          logo: 'https://example.com/logo.png'
        }}
      />

      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

### Product Schema

For e-commerce products:

```typescript
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  brand: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  rating?: {
    value: number;
    count: number;
  };
  sku?: string;
}

function ProductSchema(props: ProductSchemaProps) {
  return (
    <StructuredData
      type="Product"
      data={{
        name: props.name,
        description: props.description,
        image: props.image,
        brand: {
          '@type': 'Brand',
          name: props.brand
        },
        offers: {
          '@type': 'Offer',
          price: props.price,
          priceCurrency: props.currency,
          availability: `https://schema.org/${props.availability}`,
          ...(props.condition && { itemCondition: `https://schema.org/${props.condition}` })
        },
        ...(props.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: props.rating.value,
            reviewCount: props.rating.count
          }
        }),
        ...(props.sku && { sku: props.sku })
      }}
    />
  );
}

// Usage
function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <SEO
        title={`${product.name} - Buy Online`}
        description={product.description}
      />

      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.images[0]}
        brand={product.brand}
        price={product.price}
        currency="USD"
        availability={product.inStock ? 'InStock' : 'OutOfStock'}
        condition="NewCondition"
        rating={product.rating}
        sku={product.sku}
      />

      <div className="product">
        {/* Product display */}
      </div>
    </>
  );
}
```

### Organization Schema

For your website's organization:

```typescript
interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[]; // Social media profiles
}

function OrganizationSchema(props: OrganizationSchemaProps) {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: props.name,
        url: props.url,
        logo: props.logo,
        description: props.description,
        ...(props.contactPoint && { contactPoint: {
          '@type': 'ContactPoint',
          telephone: props.contactPoint.telephone,
          contactType: props.contactPoint.contactType,
          ...(props.contactPoint.email && { email: props.contactPoint.email })
        }}),
        ...(props.sameAs && { sameAs: props.sameAs })
      }}
    />
  );
}

// Add to your root layout
function RootLayout({ children }) {
  return (
    <>
      <OrganizationSchema
        name="Example Company"
        url="https://example.com"
        logo="https://example.com/logo.png"
        description="Leading provider of innovative solutions"
        contactPoint={{
          telephone: '+1-555-123-4567',
          contactType: 'Customer Service',
          email: 'support@example.com'
        }}
        sameAs={[
          'https://twitter.com/example',
          'https://linkedin.com/company/example',
          'https://facebook.com/example'
        ]}
      />

      {children}
    </>
  );
}
```

### Breadcrumb Schema

For navigation breadcrumbs:

```typescript
interface BreadcrumbItem {
  name: string;
  url: string;
}

function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }}
    />
  );
}

// Usage
function ProductPage({ category, subcategory, product }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://example.com' },
          { name: category.name, url: `https://example.com/${category.slug}` },
          { name: subcategory.name, url: `https://example.com/${category.slug}/${subcategory.slug}` },
          { name: product.name, url: `https://example.com/${category.slug}/${subcategory.slug}/${product.slug}` }
        ]}
      />

      <nav aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li><a href={`/${category.slug}`}>{category.name}</a></li>
          <li><a href={`/${category.slug}/${subcategory.slug}`}>{subcategory.name}</a></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* Product content */}
    </>
  );
}
```

## Open Graph Tags

### Basic Open Graph

Essential Open Graph tags for social sharing:

```typescript
interface OpenGraphProps {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

function OpenGraph({
  title,
  description,
  url,
  image,
  type = 'website',
  siteName,
  locale = 'en_US'
}: OpenGraphProps) {
  return (
    <>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:locale" content={locale} />
    </>
  );
}
```

### Twitter Cards

Twitter-specific meta tags:

```typescript
interface TwitterCardProps {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string; // @username
  creator?: string; // @username
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
}

function TwitterCard({
  card,
  site,
  creator,
  title,
  description,
  image,
  imageAlt
}: TwitterCardProps) {
  return (
    <>
      <meta name="twitter:card" content={card} />
      {site && <meta name="twitter:site" content={site} />}
      {creator && <meta name="twitter:creator" content={creator} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
    </>
  );
}
```

### Complete Social Meta Component

Combine Open Graph and Twitter Cards:

```typescript
interface SocialMetaProps {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  twitterSite?: string;
  twitterCreator?: string;
  locale?: string;
}

function SocialMeta({
  title,
  description,
  url,
  image,
  imageAlt,
  type = 'website',
  siteName,
  twitterSite,
  twitterCreator,
  locale = 'en_US'
}: SocialMetaProps) {
  return (
    <>
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
    </>
  );
}

// Usage
function BlogPost({ post }: { post: Post }) {
  const fullUrl = `https://example.com/blog/${post.slug}`;

  return (
    <>
      <head>
        <title>{post.title} - My Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={fullUrl} />

        <SocialMeta
          title={post.title}
          description={post.excerpt}
          url={fullUrl}
          image={post.coverImage}
          imageAlt={post.coverImageAlt}
          type="article"
          siteName="My Blog"
          twitterSite="@myblog"
          twitterCreator={post.author.twitter}
        />
      </head>

      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

## SSR for SEO

### Server-Side Rendering Setup

Configure SSR to ensure search engines can crawl your content:

```typescript
// server.ts
import express from 'express';
import { renderToString } from '@philjs/core';
import { App } from './App';

const app = express();

app.get('*', async (req, res) => {
  try {
    // Render app on server
    const { html, head } = await renderToString(
      <App url={req.url} userAgent={req.headers['user-agent']} />
    );

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${head}
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="module" src="/assets/entry-client.ts"></script>
        </body>
      </html>
    `;

    res.status(200).set({ 'Content-Type': 'text/html' }).send(fullHtml);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000);
```

### Dynamic Meta Tags with SSR

Fetch data on the server and render meta tags:

```typescript
// App.tsx
import { signal } from '@philjs/core';

async function ProductPage({ productId }: { productId: string }) {
  // Fetch on server during SSR
  const product = signal(await fetchProduct(productId));

  return (
    <>
      <head>
        <title>{product().name} - Buy Online</title>
        <meta name="description" content={product().description} />
        <link rel="canonical" href={`https://example.com/products/${productId}`} />

        <SocialMeta
          title={product().name}
          description={product().description}
          url={`https://example.com/products/${productId}`}
          image={product().images[0]}
          type="product"
          siteName="My Store"
        />
      </head>

      <ProductSchema
        name={product().name}
        description={product().description}
        image={product().images[0]}
        brand={product().brand}
        price={product().price}
        currency="USD"
        availability={product().inStock ? 'InStock' : 'OutOfStock'}
      />

      <div className="product">
        <h1>{product().name}</h1>
        <p>{product().description}</p>
        <span>${product().price}</span>
      </div>
    </>
  );
}
```

### Bot Detection

Optimize rendering for search engine bots:

```typescript
function isBot(userAgent: string): boolean {
  const botPatterns = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot'
  ];

  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

// Use in server
app.get('*', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = isBot(userAgent);

  if (isCrawler) {
    // Full SSR for bots - no client-side hydration needed
    const html = await renderToString(<App url={req.url} />);
    res.send(html);
  } else {
    // Standard SSR + hydration for users
    const { html, head } = await renderToString(<App url={req.url} />);
    res.send(renderFullPage(html, head));
  }
});
```

## Sitemap Generation

### Dynamic Sitemap

Generate XML sitemaps automatically:

```typescript
interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemap(urls: SitemapURL[]): string {
  const urlElements = urls.map(url => `
    <url>
      <loc>${escapeXml(url.loc)}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
      ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
    </url>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlElements}
    </urlset>
  `;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Server endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch all pages
    const pages = await fetchAllPages();
    const posts = await fetchAllPosts();
    const products = await fetchAllProducts();

    const urls: SitemapURL[] = [
      // Static pages
      {
        loc: 'https://example.com',
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: 'https://example.com/about',
        changefreq: 'monthly',
        priority: 0.8
      },

      // Dynamic blog posts
      ...posts.map(post => ({
        loc: `https://example.com/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: 'weekly' as const,
        priority: 0.7
      })),

      // Products
      ...products.map(product => ({
        loc: `https://example.com/products/${product.id}`,
        lastmod: product.updatedAt,
        changefreq: 'daily' as const,
        priority: 0.9
      }))
    ];

    const sitemap = generateSitemap(urls);

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});
```

### Sitemap Index

For large sites with multiple sitemaps:

```typescript
interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

function generateSitemapIndex(sitemaps: SitemapIndexEntry[]): string {
  const sitemapElements = sitemaps.map(sitemap => `
    <sitemap>
      <loc>${escapeXml(sitemap.loc)}</loc>
      ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
    </sitemap>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapElements}
    </sitemapindex>
  `;
}

// Server endpoints
app.get('/sitemap-index.xml', async (req, res) => {
  const sitemaps: SitemapIndexEntry[] = [
    {
      loc: 'https://example.com/sitemap-pages.xml',
      lastmod: new Date().toISOString()
    },
    {
      loc: 'https://example.com/sitemap-blog.xml',
      lastmod: await getLastBlogUpdate()
    },
    {
      loc: 'https://example.com/sitemap-products.xml',
      lastmod: await getLastProductUpdate()
    }
  ];

  const sitemapIndex = generateSitemapIndex(sitemaps);

  res.set('Content-Type', 'application/xml');
  res.send(sitemapIndex);
});

app.get('/sitemap-blog.xml', async (req, res) => {
  const posts = await fetchAllPosts();

  const urls = posts.map(post => ({
    loc: `https://example.com/blog/${post.slug}`,
    lastmod: post.updatedAt,
    changefreq: 'weekly' as const,
    priority: 0.7
  }));

  res.set('Content-Type', 'application/xml');
  res.send(generateSitemap(urls));
});
```

### Robots.txt

Configure crawler access:

```typescript
app.get('/robots.txt', (req, res) => {
  const robotsTxt = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-index.xml

# Crawl delay
Crawl-delay: 1

# Specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /
  `.trim();

  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});
```

## Complete SEO Component

### All-in-One SEO Manager

Comprehensive SEO component combining all features:

```typescript
interface CompleteSEOProps {
  // Basic meta
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product';

  // Twitter
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;

  // Structured data
  structuredData?: {
    type: string;
    data: Record<string, any>;
  };

  // Additional
  robots?: string[];
  author?: string;
  language?: string;
  siteName?: string;
}

function CompleteSEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
  structuredData,
  robots = ['index', 'follow'],
  author,
  language = 'en',
  siteName
}: CompleteSEOProps) {
  const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <>
      {/* Basic meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robots.join(', ')} />
      {author && <meta name="author" content={author} />}
      <meta httpEquiv="content-language" content={language} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content={ogType} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:locale" content={language.replace('-', '_')} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

      {/* Structured data */}
      {structuredData && (
        <StructuredData
          type={structuredData.type}
          data={structuredData.data}
        />
      )}
    </>
  );
}

// Usage example
function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <CompleteSEO
        title={`${product.name} - Buy Online`}
        description={product.description}
        keywords={product.tags}
        canonical={`https://example.com/products/${product.id}`}
        ogImage={product.images[0]}
        ogImageAlt={product.name}
        ogType="product"
        twitterSite="@mystore"
        siteName="My Store"
        structuredData={{
          type: 'Product',
          data: {
            name: product.name,
            description: product.description,
            image: product.images[0],
            brand: { '@type': 'Brand', name: product.brand },
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'USD',
              availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock'
            }
          }
        }}
      />

      <div className="product">
        {/* Product content */}
      </div>
    </>
  );
}
```

## SEO Monitoring & Debugging

### SEO Audit Utility

Check SEO health of your pages:

```typescript
interface SEOAuditResult {
  score: number;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

function auditPageSEO(): SEOAuditResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check title
  const title = document.querySelector('title');
  if (!title || !title.textContent) {
    issues.push('Missing page title');
  } else if (title.textContent.length < 30) {
    warnings.push('Title is too short (< 30 characters)');
  } else if (title.textContent.length > 60) {
    warnings.push('Title is too long (> 60 characters)');
  }

  // Check meta description
  const description = document.querySelector('meta[name="description"]');
  if (!description || !description.getAttribute('content')) {
    issues.push('Missing meta description');
  } else {
    const content = description.getAttribute('content') || '';
    if (content.length < 120) {
      warnings.push('Description is too short (< 120 characters)');
    } else if (content.length > 160) {
      warnings.push('Description is too long (> 160 characters)');
    }
  }

  // Check canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    suggestions.push('Consider adding canonical URL');
  }

  // Check Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (!ogTitle || !ogDescription || !ogImage) {
    warnings.push('Missing Open Graph tags (for social sharing)');
  }

  // Check structured data
  const structuredData = document.querySelector('script[type="application/ld+json"]');
  if (!structuredData) {
    suggestions.push('Consider adding structured data (JSON-LD)');
  }

  // Check headings hierarchy
  const h1s = document.querySelectorAll('h1');
  if (h1s.length === 0) {
    issues.push('No H1 heading found');
  } else if (h1s.length > 1) {
    warnings.push('Multiple H1 headings found');
  }

  // Check images alt text
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
  if (imagesWithoutAlt.length > 0) {
    warnings.push(`${imagesWithoutAlt.length} images missing alt text`);
  }

  // Calculate score
  const totalChecks = 8;
  const issueWeight = 3;
  const warningWeight = 1;
  const deductions = (issues.length * issueWeight) + (warnings.length * warningWeight);
  const score = Math.max(0, 100 - (deductions / totalChecks * 100));

  return {
    score: Math.round(score),
    issues,
    warnings,
    suggestions
  };
}

// Use in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run audit on page load
  window.addEventListener('load', () => {
    const audit = auditPageSEO();

    console.group('SEO Audit');
    console.log(`Score: ${audit.score}/100`);

    if (audit.issues.length > 0) {
      console.group('Issues (Must Fix)');
      audit.issues.forEach(issue => console.error(`❌ ${issue}`));
      console.groupEnd();
    }

    if (audit.warnings.length > 0) {
      console.group('Warnings (Should Fix)');
      audit.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
      console.groupEnd();
    }

    if (audit.suggestions.length > 0) {
      console.group('Suggestions (Nice to Have)');
      audit.suggestions.forEach(suggestion => console.info(`💡 ${suggestion}`));
      console.groupEnd();
    }

    console.groupEnd();
  });
}
```

## Best Practices

### 1. Title Tag Optimization

```typescript
// Good - descriptive, unique, keyword-rich
<title>Organic Blue Running Shoes - Free Shipping | SportStore</title>

// Bad - too generic or too long
<title>Home</title>
<title>Buy the Best Quality Running Shoes for Men and Women Online with Free Shipping and Returns</title>

// Ideal length: 50-60 characters
function optimizeTitle(title: string, siteName: string): string {
  const maxLength = 60;
  const suffix = ` | ${siteName}`;
  const maxTitleLength = maxLength - suffix.length;

  if (title.length + suffix.length <= maxLength) {
    return title + suffix;
  }

  return title.substring(0, maxTitleLength - 3) + '...' + suffix;
}
```

### 2. Meta Description Best Practices

```typescript
// Good - compelling, actionable, includes keywords
<meta name="description" content="Shop organic blue running shoes with free shipping. Lightweight, durable, and eco-friendly. Order today and get 20% off your first purchase." />

// Bad - too short, not compelling, keyword stuffing
<meta name="description" content="Running shoes." />
<meta name="description" content="Running shoes, blue shoes, organic shoes, cheap shoes, best shoes, running, shoes for running" />

// Ideal length: 120-160 characters
function optimizeDescription(description: string): string {
  const maxLength = 160;

  if (description.length <= maxLength) {
    return description;
  }

  // Truncate at last complete sentence
  const truncated = description.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');

  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }

  return truncated.substring(0, maxLength - 3) + '...';
}
```

### 3. URL Structure

```typescript
// Good - clean, readable, keyword-rich
https://example.com/blog/seo-optimization-guide
https://example.com/products/running-shoes/blue-organic

// Bad - complex, parameters, not readable
https://example.com/page?id=12345
https://example.com/prod.aspx?cat=23&item=455

function generateSEOFriendlySlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Example
const slug = generateSEOFriendlySlug('10 Tips for Better SEO!');
// Result: "10-tips-for-better-seo"
```

### 4. Image Optimization

```typescript
// Good - descriptive alt text, optimized size
<img
  src="/images/blue-running-shoes.webp"
  alt="Organic blue running shoes with white soles"
  width="800"
  height="600"
  loading="lazy"
/>

// Bad - missing alt, generic filename, huge file size
<img src="/IMG_1234.jpg" />

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
}

function OptimizedImage({ src, alt, width, height, loading = 'lazy' }: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
    />
  );
}
```

### 5. Internal Linking

```typescript
// Good - descriptive anchor text, relevant links
<a href="/blog/seo-guide">
  Learn more about SEO optimization strategies
</a>

// Bad - generic anchor text
<a href="/blog/seo-guide">Click here</a>
<a href="/blog/seo-guide">Read more</a>

function ContentWithLinks({ content }: { content: string }) {
  // Automatically add internal links to relevant content
  const linkedContent = signal(content);

  effect(() => {
    // Find keywords and link them
    const keywords = {
      'SEO optimization': '/guides/seo',
      'structured data': '/guides/structured-data',
      'meta tags': '/guides/meta-tags'
    };

    let newContent = content;
    Object.entries(keywords).forEach(([keyword, url]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(newContent) && !newContent.includes(`href="${url}"`)) {
        newContent = newContent.replace(
          regex,
          `<a href="${url}">${keyword}</a>`
        );
      }
    });

    linkedContent.set(newContent);
  });

  return <div dangerouslySetInnerHTML={{ __html: linkedContent() }} />;
}
```

### 6. Mobile Optimization

```typescript
// Always include viewport meta tag
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

// Use responsive images
<picture>
  <source
    media="(min-width: 1024px)"
    srcset="/images/hero-large.webp"
  />
  <source
    media="(min-width: 768px)"
    srcset="/images/hero-medium.webp"
  />
  <img
    src="/images/hero-small.webp"
    alt="Hero image"
    loading="lazy"
  />
</picture>

// Test mobile-friendliness
function checkMobileFriendly(): boolean {
  const viewport = document.querySelector('meta[name="viewport"]');
  const hasViewport = !!viewport;

  const fontSize = parseInt(
    window.getComputedStyle(document.body).fontSize
  );
  const hasReadableFontSize = fontSize >= 16;

  const hasResponsiveLayout = window.innerWidth <= 768
    ? document.body.scrollWidth <= window.innerWidth
    : true;

  return hasViewport && hasReadableFontSize && hasResponsiveLayout;
}
```

## Summary

You've learned:

- Meta tag management for search engines
- Structured data implementation with JSON-LD
- Open Graph and Twitter Cards for social sharing
- Server-side rendering for SEO optimization
- Dynamic sitemap generation
- Complete SEO component patterns
- SEO auditing and monitoring
- Best practices for search visibility

Proper SEO implementation ensures your PhilJS application is discoverable and ranks well in search results!

---

**Next Steps:**

- [Server-Side Rendering](./ssr.md) - Deep dive into SSR
- [Static Site Generation](./ssg.md) - Pre-render pages at build time
- [Performance Optimization](/docs/best-practices/performance.md) - Speed up your site
- [Accessibility](./accessibility.md) - Make your site accessible to all users
