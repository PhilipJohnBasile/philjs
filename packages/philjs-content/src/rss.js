/**
 * PhilJS Content - RSS Feed Generation
 *
 * Comprehensive RSS 2.0, Atom, and JSON feed generation with support
 * for auto-generation from content collections.
 */
/**
 * Generate RSS 2.0 feed XML
 */
export function generateRSS(config) {
    const now = new Date();
    const language = config.language || 'en';
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0"';
    // Add namespaces
    xml += ' xmlns:content="http://purl.org/rss/1.0/modules/content/"';
    xml += ' xmlns:atom="http://www.w3.org/2005/Atom"';
    if (config.customNamespaces) {
        for (const [prefix, uri] of Object.entries(config.customNamespaces)) {
            xml += ` xmlns:${prefix}="${escapeXML(uri)}"`;
        }
    }
    xml += '>\n';
    xml += '  <channel>\n';
    xml += `    <title>${escapeXML(config.title)}</title>\n`;
    xml += `    <description>${escapeXML(config.description)}</description>\n`;
    xml += `    <link>${escapeXML(config.site)}</link>\n`;
    xml += `    <language>${language}</language>\n`;
    xml += `    <lastBuildDate>${formatRFC822Date(now)}</lastBuildDate>\n`;
    if (config.copyright) {
        xml += `    <copyright>${escapeXML(config.copyright)}</copyright>\n`;
    }
    if (config.managingEditor) {
        xml += `    <managingEditor>${escapeXML(config.managingEditor)}</managingEditor>\n`;
    }
    if (config.webMaster) {
        xml += `    <webMaster>${escapeXML(config.webMaster)}</webMaster>\n`;
    }
    if (config.ttl) {
        xml += `    <ttl>${config.ttl}</ttl>\n`;
    }
    if (config.image) {
        xml += '    <image>\n';
        xml += `      <url>${escapeXML(config.image.url)}</url>\n`;
        xml += `      <title>${escapeXML(config.image.title)}</title>\n`;
        xml += `      <link>${escapeXML(config.image.link)}</link>\n`;
        if (config.image.width) {
            xml += `      <width>${config.image.width}</width>\n`;
        }
        if (config.image.height) {
            xml += `      <height>${config.image.height}</height>\n`;
        }
        xml += '    </image>\n';
    }
    if (config.categories) {
        for (const category of config.categories) {
            xml += `    <category>${escapeXML(category)}</category>\n`;
        }
    }
    if (config.customData) {
        xml += `    ${config.customData}\n`;
    }
    // Add items
    for (const item of config.items) {
        xml += '    <item>\n';
        xml += `      <title>${escapeXML(item.title)}</title>\n`;
        xml += `      <link>${escapeXML(item.link)}</link>\n`;
        xml += `      <description>${escapeXML(item.description)}</description>\n`;
        xml += `      <pubDate>${formatRFC822Date(item.pubDate)}</pubDate>\n`;
        const guid = item.guid || item.link;
        xml += `      <guid isPermaLink="${item.guid ? 'false' : 'true'}">${escapeXML(guid)}</guid>\n`;
        if (item.author) {
            xml += `      <author>${escapeXML(item.author)}</author>\n`;
        }
        if (item.categories) {
            for (const category of item.categories) {
                xml += `      <category>${escapeXML(category)}</category>\n`;
            }
        }
        if (item.content) {
            xml += `      <content:encoded><![CDATA[${item.content}]]></content:encoded>\n`;
        }
        if (item.enclosure) {
            xml += `      <enclosure url="${escapeXML(item.enclosure.url)}" `;
            xml += `length="${item.enclosure.length}" `;
            xml += `type="${escapeXML(item.enclosure.type)}" />\n`;
        }
        if (item.customData) {
            xml += `      ${item.customData}\n`;
        }
        xml += '    </item>\n';
    }
    xml += '  </channel>\n';
    xml += '</rss>';
    return xml;
}
/**
 * Generate Atom feed XML
 */
export function generateAtom(config) {
    const updated = config.updated || new Date();
    const feedUrl = config.feedUrl || config.site;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom"';
    if (config.language) {
        xml += ` xml:lang="${config.language}"`;
    }
    xml += '>\n';
    xml += `  <title>${escapeXML(config.title)}</title>\n`;
    if (config.subtitle) {
        xml += `  <subtitle>${escapeXML(config.subtitle)}</subtitle>\n`;
    }
    xml += `  <link href="${escapeXML(config.site)}" />\n`;
    xml += `  <link href="${escapeXML(feedUrl)}" rel="self" type="application/atom+xml" />\n`;
    xml += `  <id>${escapeXML(config.site)}</id>\n`;
    xml += `  <updated>${formatISO8601Date(updated)}</updated>\n`;
    if (config.author) {
        xml += '  <author>\n';
        xml += `    <name>${escapeXML(config.author.name)}</name>\n`;
        if (config.author.email) {
            xml += `    <email>${escapeXML(config.author.email)}</email>\n`;
        }
        if (config.author.uri) {
            xml += `    <uri>${escapeXML(config.author.uri)}</uri>\n`;
        }
        xml += '  </author>\n';
    }
    if (config.icon) {
        xml += `  <icon>${escapeXML(config.icon)}</icon>\n`;
    }
    if (config.logo) {
        xml += `  <logo>${escapeXML(config.logo)}</logo>\n`;
    }
    if (config.categories) {
        for (const category of config.categories) {
            xml += `  <category term="${escapeXML(category)}" />\n`;
        }
    }
    // Add entries
    for (const item of config.items) {
        const itemId = item.id || item.link;
        const itemUpdated = item.updated || item.published;
        xml += '  <entry>\n';
        xml += `    <title>${escapeXML(item.title)}</title>\n`;
        xml += `    <link href="${escapeXML(item.link)}" />\n`;
        xml += `    <id>${escapeXML(itemId)}</id>\n`;
        xml += `    <published>${formatISO8601Date(item.published)}</published>\n`;
        xml += `    <updated>${formatISO8601Date(itemUpdated)}</updated>\n`;
        if (item.author) {
            xml += '    <author>\n';
            xml += `      <name>${escapeXML(item.author.name)}</name>\n`;
            if (item.author.email) {
                xml += `      <email>${escapeXML(item.author.email)}</email>\n`;
            }
            if (item.author.uri) {
                xml += `      <uri>${escapeXML(item.author.uri)}</uri>\n`;
            }
            xml += '    </author>\n';
        }
        if (item.summary) {
            xml += `    <summary>${escapeXML(item.summary)}</summary>\n`;
        }
        if (item.content) {
            xml += `    <content type="html"><![CDATA[${item.content}]]></content>\n`;
        }
        if (item.categories) {
            for (const category of item.categories) {
                xml += `    <category term="${escapeXML(category)}" />\n`;
            }
        }
        xml += '  </entry>\n';
    }
    xml += '</feed>';
    return xml;
}
/**
 * Generate JSON Feed
 */
export function generateJSONFeed(config) {
    const feed = {
        version: 'https://jsonfeed.org/version/1.1',
        title: config.title,
        home_page_url: config.home_page_url,
    };
    if (config.description)
        feed['description'] = config.description;
    if (config.feed_url)
        feed['feed_url'] = config.feed_url;
    if (config.icon)
        feed['icon'] = config.icon;
    if (config.favicon)
        feed['favicon'] = config.favicon;
    if (config.author)
        feed['author'] = config.author;
    if (config.language)
        feed['language'] = config.language;
    if (config.expired)
        feed['expired'] = config.expired;
    if (config.user_comment)
        feed['user_comment'] = config.user_comment;
    feed['items'] = config.items;
    return JSON.stringify(feed, null, 2);
}
/**
 * Generate RSS feed from content collection
 */
export function generateRSSFromCollection(options) {
    const items = createFeedItems(options);
    return generateRSS({
        title: options.title,
        description: options.description,
        site: options.site,
        items: items.map(item => {
            const rssItem = {
                title: item.title,
                link: item.link,
                description: item.description,
                pubDate: item.pubDate,
            };
            if (item.content !== undefined)
                rssItem.content = item.content;
            if (item.author !== undefined)
                rssItem.author = item.author;
            if (item.categories !== undefined)
                rssItem.categories = item.categories;
            return rssItem;
        }),
    });
}
/**
 * Generate Atom feed from content collection
 */
export function generateAtomFromCollection(options) {
    const items = createFeedItems(options);
    const atomConfig = {
        title: options.title,
        subtitle: options.description,
        site: options.site,
        items: items.map(item => {
            const atomItem = {
                title: item.title,
                link: item.link,
                summary: item.description,
                published: item.pubDate,
            };
            if (item.content !== undefined)
                atomItem.content = item.content;
            if (item.categories !== undefined)
                atomItem.categories = item.categories;
            return atomItem;
        }),
    };
    if (options.feedUrl !== undefined)
        atomConfig.feedUrl = options.feedUrl;
    return generateAtom(atomConfig);
}
/**
 * Generate JSON Feed from content collection
 */
export function generateJSONFeedFromCollection(options) {
    const items = createFeedItems(options);
    const jsonConfig = {
        title: options.title,
        description: options.description,
        home_page_url: options.site,
        items: items.map(item => {
            const jsonItem = {
                id: item.link,
                url: item.link,
                title: item.title,
                summary: item.description,
                date_published: item.pubDate.toISOString(),
            };
            if (item.content !== undefined)
                jsonItem.content_html = item.content;
            if (item.categories !== undefined)
                jsonItem.tags = item.categories;
            return jsonItem;
        }),
    };
    if (options.feedUrl !== undefined)
        jsonConfig.feed_url = options.feedUrl;
    return generateJSONFeed(jsonConfig);
}
/**
 * Helper to create feed items from collection entries
 */
function createFeedItems(options) {
    const { entries, site, mapping = {} } = options;
    const limit = options.limit || entries.length;
    return entries.slice(0, limit).map(entry => {
        const data = entry.data;
        // Extract values using mapping or defaults
        const slug = 'slug' in entry ? entry.slug : entry.id;
        const title = extractValue(mapping.title, entry, data, 'title', data['title'] || slug);
        const description = extractValue(mapping.description, entry, data, 'description', data['description'] || '');
        const link = extractValue(mapping.link, entry, data, 'slug', `${site}/${slug}`);
        const pubDate = extractValue(mapping.pubDate, entry, data, 'date', data['date'] || entry.modifiedTime);
        const author = extractValue(mapping.author, entry, data, 'author', data['author']);
        const categories = extractValue(mapping.categories, entry, data, 'tags', data['tags']);
        const content = entry.type === 'content'
            ? extractValue(mapping.content, entry, data, 'body', entry.body)
            : undefined;
        const result = {
            title: String(title),
            link: String(link),
            description: String(description),
            pubDate: pubDate instanceof Date ? pubDate : new Date(pubDate),
        };
        if (content)
            result.content = String(content);
        if (author)
            result.author = String(author);
        if (Array.isArray(categories))
            result.categories = categories.map(String);
        return result;
    });
}
/**
 * Extract value from mapping or data
 */
function extractValue(mapping, entry, data, defaultField, fallback) {
    if (typeof mapping === 'function') {
        return mapping(entry);
    }
    if (typeof mapping === 'string') {
        return data[mapping] || fallback;
    }
    return data[defaultField] || fallback;
}
/**
 * Escape XML special characters
 */
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Format date in RFC 822 format (for RSS)
 */
function formatRFC822Date(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[date.getUTCDay()];
    const d = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const h = String(date.getUTCHours()).padStart(2, '0');
    const m = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${day}, ${d} ${month} ${year} ${h}:${m}:${s} GMT`;
}
/**
 * Format date in ISO 8601 format (for Atom)
 */
function formatISO8601Date(date) {
    return date.toISOString();
}
/**
 * Validate RSS feed
 */
export function validateRSSFeed(config) {
    const errors = [];
    if (!config.title || config.title.trim() === '') {
        errors.push('Feed title is required');
    }
    if (!config.description || config.description.trim() === '') {
        errors.push('Feed description is required');
    }
    if (!config.site || config.site.trim() === '') {
        errors.push('Site URL is required');
    }
    if (!Array.isArray(config.items)) {
        errors.push('Feed items must be an array');
    }
    else {
        config.items.forEach((item, index) => {
            if (!item.title || item.title.trim() === '') {
                errors.push(`Item ${index + 1}: title is required`);
            }
            if (!item.link || item.link.trim() === '') {
                errors.push(`Item ${index + 1}: link is required`);
            }
            if (!item.description || item.description.trim() === '') {
                errors.push(`Item ${index + 1}: description is required`);
            }
            if (!(item.pubDate instanceof Date) || isNaN(item.pubDate.getTime())) {
                errors.push(`Item ${index + 1}: valid pubDate is required`);
            }
        });
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=rss.js.map