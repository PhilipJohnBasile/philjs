/**
 * PhilJS Content - SEO Utilities
 *
 * Comprehensive SEO utilities including meta tags, Open Graph, Twitter Cards,
 * JSON-LD structured data, and a useSEO() hook for easy integration.
 */
/**
 * Generate HTML meta tags from SEO config
 */
export function generateMetaTags(config) {
    const tags = [];
    // Basic meta tags
    if (config.title) {
        tags.push(`<title>${escapeHTML(config.title)}</title>`);
    }
    if (config.description) {
        tags.push(`<meta name="description" content="${escapeHTML(config.description)}">`);
    }
    // Keywords
    if (config.keywords) {
        const keywords = Array.isArray(config.keywords)
            ? config.keywords.join(', ')
            : config.keywords;
        tags.push(`<meta name="keywords" content="${escapeHTML(keywords)}">`);
    }
    // Robots
    if (config.robots) {
        const robots = Array.isArray(config.robots)
            ? config.robots.join(', ')
            : config.robots;
        tags.push(`<meta name="robots" content="${robots}">`);
    }
    // Language
    if (config.language) {
        tags.push(`<meta name="language" content="${config.language}">`);
    }
    // Canonical URL
    if (config.canonical) {
        tags.push(`<link rel="canonical" href="${escapeHTML(config.canonical)}">`);
    }
    // Alternate languages
    if (config.alternates) {
        for (const alt of config.alternates) {
            tags.push(`<link rel="alternate" hreflang="${alt.lang}" href="${escapeHTML(alt.href)}">`);
        }
    }
    // Open Graph tags
    if (config.openGraph) {
        tags.push(...generateOpenGraphTags(config.openGraph));
    }
    // Twitter Card tags
    if (config.twitter) {
        tags.push(...generateTwitterCardTags(config.twitter));
    }
    // JSON-LD
    if (config.jsonLd) {
        const schemas = Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd];
        for (const schema of schemas) {
            tags.push(`<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`);
        }
    }
    // Additional meta tags
    if (config.additionalMetaTags) {
        for (const tag of config.additionalMetaTags) {
            let metaTag = '<meta';
            if (tag.name)
                metaTag += ` name="${escapeHTML(tag.name)}"`;
            if (tag.property)
                metaTag += ` property="${escapeHTML(tag.property)}"`;
            if (tag.httpEquiv)
                metaTag += ` http-equiv="${escapeHTML(tag.httpEquiv)}"`;
            metaTag += ` content="${escapeHTML(tag.content)}">`;
            tags.push(metaTag);
        }
    }
    // Additional link tags
    if (config.additionalLinkTags) {
        for (const tag of config.additionalLinkTags) {
            let linkTag = `<link rel="${escapeHTML(tag.rel)}" href="${escapeHTML(tag.href)}"`;
            if (tag.type)
                linkTag += ` type="${escapeHTML(tag.type)}"`;
            if (tag.sizes)
                linkTag += ` sizes="${tag.sizes}"`;
            if (tag.media)
                linkTag += ` media="${escapeHTML(tag.media)}"`;
            if (tag.hreflang)
                linkTag += ` hreflang="${tag.hreflang}"`;
            if (tag.crossorigin)
                linkTag += ` crossorigin="${tag.crossorigin}"`;
            linkTag += '>';
            tags.push(linkTag);
        }
    }
    return tags.join('\n');
}
/**
 * Generate Open Graph meta tags
 */
function generateOpenGraphTags(config) {
    const tags = [];
    if (config.type) {
        tags.push(`<meta property="og:type" content="${config.type}">`);
    }
    if (config.title) {
        tags.push(`<meta property="og:title" content="${escapeHTML(config.title)}">`);
    }
    if (config.description) {
        tags.push(`<meta property="og:description" content="${escapeHTML(config.description)}">`);
    }
    if (config.url) {
        tags.push(`<meta property="og:url" content="${escapeHTML(config.url)}">`);
    }
    if (config.siteName) {
        tags.push(`<meta property="og:site_name" content="${escapeHTML(config.siteName)}">`);
    }
    if (config.locale) {
        tags.push(`<meta property="og:locale" content="${config.locale}">`);
    }
    if (config.alternateLocales) {
        for (const locale of config.alternateLocales) {
            tags.push(`<meta property="og:locale:alternate" content="${locale}">`);
        }
    }
    // Images
    if (config.images) {
        for (const img of config.images) {
            tags.push(`<meta property="og:image" content="${escapeHTML(img.url)}">`);
            if (img.secureUrl) {
                tags.push(`<meta property="og:image:secure_url" content="${escapeHTML(img.secureUrl)}">`);
            }
            if (img.type) {
                tags.push(`<meta property="og:image:type" content="${img.type}">`);
            }
            if (img.width) {
                tags.push(`<meta property="og:image:width" content="${img.width}">`);
            }
            if (img.height) {
                tags.push(`<meta property="og:image:height" content="${img.height}">`);
            }
            if (img.alt) {
                tags.push(`<meta property="og:image:alt" content="${escapeHTML(img.alt)}">`);
            }
        }
    }
    // Videos
    if (config.videos) {
        for (const video of config.videos) {
            tags.push(`<meta property="og:video" content="${escapeHTML(video.url)}">`);
            if (video.secureUrl) {
                tags.push(`<meta property="og:video:secure_url" content="${escapeHTML(video.secureUrl)}">`);
            }
            if (video.type) {
                tags.push(`<meta property="og:video:type" content="${video.type}">`);
            }
            if (video.width) {
                tags.push(`<meta property="og:video:width" content="${video.width}">`);
            }
            if (video.height) {
                tags.push(`<meta property="og:video:height" content="${video.height}">`);
            }
        }
    }
    // Article properties
    if (config.article) {
        if (config.article.publishedTime) {
            tags.push(`<meta property="article:published_time" content="${config.article.publishedTime.toISOString()}">`);
        }
        if (config.article.modifiedTime) {
            tags.push(`<meta property="article:modified_time" content="${config.article.modifiedTime.toISOString()}">`);
        }
        if (config.article.expirationTime) {
            tags.push(`<meta property="article:expiration_time" content="${config.article.expirationTime.toISOString()}">`);
        }
        if (config.article.authors) {
            for (const author of config.article.authors) {
                tags.push(`<meta property="article:author" content="${escapeHTML(author)}">`);
            }
        }
        if (config.article.section) {
            tags.push(`<meta property="article:section" content="${escapeHTML(config.article.section)}">`);
        }
        if (config.article.tags) {
            for (const tag of config.article.tags) {
                tags.push(`<meta property="article:tag" content="${escapeHTML(tag)}">`);
            }
        }
    }
    // Profile properties
    if (config.profile) {
        if (config.profile.firstName) {
            tags.push(`<meta property="profile:first_name" content="${escapeHTML(config.profile.firstName)}">`);
        }
        if (config.profile.lastName) {
            tags.push(`<meta property="profile:last_name" content="${escapeHTML(config.profile.lastName)}">`);
        }
        if (config.profile.username) {
            tags.push(`<meta property="profile:username" content="${escapeHTML(config.profile.username)}">`);
        }
        if (config.profile.gender) {
            tags.push(`<meta property="profile:gender" content="${escapeHTML(config.profile.gender)}">`);
        }
    }
    // Book properties
    if (config.book) {
        if (config.book.authors) {
            for (const author of config.book.authors) {
                tags.push(`<meta property="book:author" content="${escapeHTML(author)}">`);
            }
        }
        if (config.book.isbn) {
            tags.push(`<meta property="book:isbn" content="${config.book.isbn}">`);
        }
        if (config.book.releaseDate) {
            tags.push(`<meta property="book:release_date" content="${config.book.releaseDate.toISOString()}">`);
        }
        if (config.book.tags) {
            for (const tag of config.book.tags) {
                tags.push(`<meta property="book:tag" content="${escapeHTML(tag)}">`);
            }
        }
    }
    return tags;
}
/**
 * Generate Twitter Card meta tags
 */
function generateTwitterCardTags(config) {
    const tags = [];
    if (config.card) {
        tags.push(`<meta name="twitter:card" content="${config.card}">`);
    }
    if (config.site) {
        tags.push(`<meta name="twitter:site" content="${escapeHTML(config.site)}">`);
    }
    if (config.creator) {
        tags.push(`<meta name="twitter:creator" content="${escapeHTML(config.creator)}">`);
    }
    if (config.title) {
        tags.push(`<meta name="twitter:title" content="${escapeHTML(config.title)}">`);
    }
    if (config.description) {
        tags.push(`<meta name="twitter:description" content="${escapeHTML(config.description)}">`);
    }
    if (config.image) {
        tags.push(`<meta name="twitter:image" content="${escapeHTML(config.image)}">`);
    }
    if (config.imageAlt) {
        tags.push(`<meta name="twitter:image:alt" content="${escapeHTML(config.imageAlt)}">`);
    }
    // App properties
    if (config.app) {
        if (config.app.name) {
            tags.push(`<meta name="twitter:app:name" content="${escapeHTML(config.app.name)}">`);
        }
        if (config.app.idIphone) {
            tags.push(`<meta name="twitter:app:id:iphone" content="${config.app.idIphone}">`);
        }
        if (config.app.idIpad) {
            tags.push(`<meta name="twitter:app:id:ipad" content="${config.app.idIpad}">`);
        }
        if (config.app.idGoogleplay) {
            tags.push(`<meta name="twitter:app:id:googleplay" content="${config.app.idGoogleplay}">`);
        }
        if (config.app.urlIphone) {
            tags.push(`<meta name="twitter:app:url:iphone" content="${escapeHTML(config.app.urlIphone)}">`);
        }
        if (config.app.urlIpad) {
            tags.push(`<meta name="twitter:app:url:ipad" content="${escapeHTML(config.app.urlIpad)}">`);
        }
        if (config.app.urlGoogleplay) {
            tags.push(`<meta name="twitter:app:url:googleplay" content="${escapeHTML(config.app.urlGoogleplay)}">`);
        }
    }
    // Player properties
    if (config.player) {
        tags.push(`<meta name="twitter:player" content="${escapeHTML(config.player.url)}">`);
        tags.push(`<meta name="twitter:player:width" content="${config.player.width}">`);
        tags.push(`<meta name="twitter:player:height" content="${config.player.height}">`);
        if (config.player.stream) {
            tags.push(`<meta name="twitter:player:stream" content="${escapeHTML(config.player.stream)}">`);
        }
    }
    return tags;
}
/**
 * Generate SEO config from collection entry
 */
export function generateSEOFromEntry(entry, site, options) {
    const data = entry.data;
    const slug = 'slug' in entry ? entry.slug : entry.id;
    const title = data['title'] || slug;
    const description = data['description'] || '';
    const url = `${site}/${slug}`;
    const config = {
        title: options?.titleTemplate ? options.titleTemplate.replace('%s', title) : title,
        description,
        canonical: url,
        openGraph: {
            type: entry.type === 'content' ? 'article' : 'website',
            title,
            description,
            url,
            ...(options?.siteName && { siteName: options.siteName }),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(options?.twitterHandle && { site: options.twitterHandle }),
        },
    };
    // Add image if available
    const image = data['image'] || options?.defaultImage;
    if (image) {
        config.openGraph.images = [{ url: image }];
        config.twitter.image = image;
    }
    // Add article-specific properties
    if (entry.type === 'content') {
        const publishedTime = data['date'];
        const updatedTime = data['updatedDate'];
        const author = data['author'];
        const tags = data['tags'];
        config.openGraph.article = {
            publishedTime,
            modifiedTime: updatedTime,
            ...(author && { authors: [author] }),
            tags,
        };
    }
    return config;
}
/**
 * Escape HTML special characters
 */
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/**
 * useSEO hook for PhilJS components
 */
export function useSEO(config) {
    return {
        head: generateMetaTags(config),
    };
}
//# sourceMappingURL=seo.js.map