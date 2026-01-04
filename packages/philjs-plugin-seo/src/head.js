/**
 * PhilJS SEO Plugin - Head Management
 *
 * Utilities for managing document head tags including meta, OpenGraph,
 * Twitter Cards, and JSON-LD structured data.
 */
/**
 * Generate meta tag HTML
 */
export function generateMetaTag(attrs) {
    const attrStr = Object.entries(attrs)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
    return `<meta ${attrStr} />`;
}
/**
 * Generate link tag HTML
 */
export function generateLinkTag(attrs) {
    const attrStr = Object.entries(attrs)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
    return `<link ${attrStr} />`;
}
/**
 * Generate robots meta content
 */
export function generateRobotsContent(robots) {
    const directives = [];
    if (robots.index === false)
        directives.push('noindex');
    else if (robots.index === true)
        directives.push('index');
    if (robots.follow === false)
        directives.push('nofollow');
    else if (robots.follow === true)
        directives.push('follow');
    if (robots.noarchive)
        directives.push('noarchive');
    if (robots.nosnippet)
        directives.push('nosnippet');
    if (robots.noimageindex)
        directives.push('noimageindex');
    if (robots.notranslate)
        directives.push('notranslate');
    if (robots.maxSnippet !== undefined) {
        directives.push(`max-snippet:${robots.maxSnippet}`);
    }
    if (robots.maxImagePreview) {
        directives.push(`max-image-preview:${robots.maxImagePreview}`);
    }
    if (robots.maxVideoPreview !== undefined) {
        directives.push(`max-video-preview:${robots.maxVideoPreview}`);
    }
    return directives.join(', ');
}
/**
 * Generate meta tags HTML
 */
export function generateMetaTags(meta) {
    const tags = [];
    // Title (handled separately in head, but include for reference)
    if (meta.title) {
        const title = meta.titleTemplate
            ? meta.titleTemplate.replace('%s', meta.title)
            : meta.title;
        tags.push(`<title>${escapeHtml(title)}</title>`);
    }
    // Description
    if (meta.description) {
        tags.push(generateMetaTag({ name: 'description', content: meta.description }));
    }
    // Keywords
    if (meta.keywords) {
        const keywords = Array.isArray(meta.keywords)
            ? meta.keywords.join(', ')
            : meta.keywords;
        tags.push(generateMetaTag({ name: 'keywords', content: keywords }));
    }
    // Canonical
    if (meta.canonical) {
        tags.push(generateLinkTag({ rel: 'canonical', href: meta.canonical }));
    }
    // Robots
    if (meta.robots) {
        const content = typeof meta.robots === 'string'
            ? meta.robots
            : generateRobotsContent(meta.robots);
        tags.push(generateMetaTag({ name: 'robots', content }));
    }
    // Author
    if (meta.author) {
        tags.push(generateMetaTag({ name: 'author', content: meta.author }));
    }
    // Viewport
    if (meta.viewport) {
        tags.push(generateMetaTag({ name: 'viewport', content: meta.viewport }));
    }
    // Theme color
    if (meta.themeColor) {
        tags.push(generateMetaTag({ name: 'theme-color', content: meta.themeColor }));
    }
    // Additional meta tags
    if (meta.meta) {
        for (const tag of meta.meta) {
            tags.push(generateMetaTag({
                name: tag.name,
                property: tag.property,
                content: tag.content,
                'http-equiv': tag.httpEquiv,
            }));
        }
    }
    return tags;
}
/**
 * Generate OpenGraph tags HTML
 */
export function generateOpenGraphTags(og) {
    const tags = [];
    if (og.title) {
        tags.push(generateMetaTag({ property: 'og:title', content: og.title }));
    }
    if (og.description) {
        tags.push(generateMetaTag({ property: 'og:description', content: og.description }));
    }
    if (og.type) {
        tags.push(generateMetaTag({ property: 'og:type', content: og.type }));
    }
    if (og.url) {
        tags.push(generateMetaTag({ property: 'og:url', content: og.url }));
    }
    if (og.siteName) {
        tags.push(generateMetaTag({ property: 'og:site_name', content: og.siteName }));
    }
    if (og.locale) {
        tags.push(generateMetaTag({ property: 'og:locale', content: og.locale }));
    }
    if (og.alternateLocales) {
        for (const locale of og.alternateLocales) {
            tags.push(generateMetaTag({ property: 'og:locale:alternate', content: locale }));
        }
    }
    // Images
    const images = og.images ?? (og.image ? [typeof og.image === 'string' ? { url: og.image } : og.image] : []);
    for (const image of images) {
        tags.push(generateMetaTag({ property: 'og:image', content: image.url }));
        if (image.secureUrl) {
            tags.push(generateMetaTag({ property: 'og:image:secure_url', content: image.secureUrl }));
        }
        if (image.type) {
            tags.push(generateMetaTag({ property: 'og:image:type', content: image.type }));
        }
        if (image.width) {
            tags.push(generateMetaTag({ property: 'og:image:width', content: String(image.width) }));
        }
        if (image.height) {
            tags.push(generateMetaTag({ property: 'og:image:height', content: String(image.height) }));
        }
        if (image.alt) {
            tags.push(generateMetaTag({ property: 'og:image:alt', content: image.alt }));
        }
    }
    // Article specific
    if (og.article) {
        if (og.article.publishedTime) {
            tags.push(generateMetaTag({ property: 'article:published_time', content: og.article.publishedTime }));
        }
        if (og.article.modifiedTime) {
            tags.push(generateMetaTag({ property: 'article:modified_time', content: og.article.modifiedTime }));
        }
        if (og.article.expirationTime) {
            tags.push(generateMetaTag({ property: 'article:expiration_time', content: og.article.expirationTime }));
        }
        if (og.article.author) {
            const authors = Array.isArray(og.article.author) ? og.article.author : [og.article.author];
            for (const author of authors) {
                tags.push(generateMetaTag({ property: 'article:author', content: author }));
            }
        }
        if (og.article.section) {
            tags.push(generateMetaTag({ property: 'article:section', content: og.article.section }));
        }
        if (og.article.tag) {
            for (const tag of og.article.tag) {
                tags.push(generateMetaTag({ property: 'article:tag', content: tag }));
            }
        }
    }
    // Product specific
    if (og.product?.price) {
        tags.push(generateMetaTag({ property: 'product:price:amount', content: String(og.product.price.amount) }));
        tags.push(generateMetaTag({ property: 'product:price:currency', content: og.product.price.currency }));
    }
    if (og.product?.availability) {
        tags.push(generateMetaTag({ property: 'product:availability', content: og.product.availability }));
    }
    return tags;
}
/**
 * Generate Twitter Card tags HTML
 */
export function generateTwitterTags(twitter) {
    const tags = [];
    if (twitter.card) {
        tags.push(generateMetaTag({ name: 'twitter:card', content: twitter.card }));
    }
    if (twitter.site) {
        tags.push(generateMetaTag({ name: 'twitter:site', content: twitter.site }));
    }
    if (twitter.creator) {
        tags.push(generateMetaTag({ name: 'twitter:creator', content: twitter.creator }));
    }
    if (twitter.title) {
        tags.push(generateMetaTag({ name: 'twitter:title', content: twitter.title }));
    }
    if (twitter.description) {
        tags.push(generateMetaTag({ name: 'twitter:description', content: twitter.description }));
    }
    if (twitter.image) {
        tags.push(generateMetaTag({ name: 'twitter:image', content: twitter.image }));
    }
    if (twitter.imageAlt) {
        tags.push(generateMetaTag({ name: 'twitter:image:alt', content: twitter.imageAlt }));
    }
    return tags;
}
/**
 * Generate JSON-LD script tag
 */
export function generateJsonLd(data) {
    const items = Array.isArray(data) ? data : [data];
    const withContext = items.map(item => ({
        '@context': 'https://schema.org',
        ...item,
    }));
    const json = items.length === 1
        ? JSON.stringify(withContext[0], null, 0)
        : JSON.stringify(withContext, null, 0);
    return `<script type="application/ld+json">${json}</script>`;
}
/**
 * Generate all SEO head tags
 */
export function generateSEOHead(seo) {
    const parts = [];
    if (seo.meta) {
        parts.push(...generateMetaTags(seo.meta));
    }
    if (seo.openGraph) {
        parts.push(...generateOpenGraphTags(seo.openGraph));
    }
    if (seo.twitter) {
        parts.push(...generateTwitterTags(seo.twitter));
    }
    if (seo.jsonLd) {
        parts.push(generateJsonLd(seo.jsonLd));
    }
    if (seo.links) {
        for (const link of seo.links) {
            parts.push(generateLinkTag(link));
        }
    }
    return parts.join('\n');
}
/**
 * Merge SEO configurations (later configs override earlier ones)
 */
export function mergeSEO(...configs) {
    const result = {};
    for (const config of configs) {
        if (!config)
            continue;
        if (config.meta) {
            result.meta = { ...result.meta, ...config.meta };
        }
        if (config.openGraph) {
            result.openGraph = { ...result.openGraph, ...config.openGraph };
        }
        if (config.twitter) {
            result.twitter = { ...result.twitter, ...config.twitter };
        }
        if (config.jsonLd) {
            const existing = result.jsonLd ? (Array.isArray(result.jsonLd) ? result.jsonLd : [result.jsonLd]) : [];
            const incoming = Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd];
            result.jsonLd = [...existing, ...incoming];
        }
        if (config.links) {
            result.links = [...(result.links ?? []), ...config.links];
        }
    }
    return result;
}
/**
 * Update document head with SEO tags (client-side)
 */
export function updateHead(seo) {
    if (typeof document === 'undefined')
        return;
    const head = document.head;
    // Update title
    if (seo.meta?.title) {
        const title = seo.meta.titleTemplate
            ? seo.meta.titleTemplate.replace('%s', seo.meta.title)
            : seo.meta.title;
        document.title = title;
    }
    // Remove existing SEO meta tags
    const existingMeta = head.querySelectorAll('meta[data-philjs-seo], link[data-philjs-seo], script[data-philjs-seo]');
    existingMeta.forEach(el => el.remove());
    // Add new tags
    const html = generateSEOHead(seo);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    for (const child of Array.from(temp.children)) {
        child.setAttribute('data-philjs-seo', 'true');
        head.appendChild(child);
    }
}
/**
 * Escape HTML entities
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
/**
 * Create breadcrumb JSON-LD from path segments
 */
export function createBreadcrumbs(items) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
/**
 * Create FAQ JSON-LD from Q&A pairs
 */
export function createFAQ(questions) {
    return {
        '@type': 'FAQPage',
        mainEntity: questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: q.answer,
            },
        })),
    };
}
/**
 * Create Organization JSON-LD
 */
export function createOrganization(org) {
    return {
        '@type': 'Organization',
        name: org.name,
        url: org.url,
        logo: org.logo,
        sameAs: org.sameAs,
    };
}
/**
 * Create WebSite JSON-LD with search action
 */
export function createWebSite(site) {
    const data = {
        '@type': 'WebSite',
        name: site.name,
        url: site.url,
    };
    if (site.searchUrl) {
        data['potentialAction'] = {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: site.searchUrl,
            },
            'query-input': 'required name=search_term_string',
        };
    }
    return data;
}
//# sourceMappingURL=head.js.map