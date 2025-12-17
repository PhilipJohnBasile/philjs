import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS Meta - SEO Helpers
 *
 * OpenGraph, Twitter Cards, JSON-LD, and more
 */
import { Meta, Link } from './Head';
/**
 * SEO Component - All-in-one SEO meta tags
 */
export function SEO(props) {
    const { config, openGraph, twitter, jsonLd } = props;
    return (_jsxs(_Fragment, { children: [config && _jsx(BasicMeta, { config: config }), openGraph && _jsx(OpenGraph, { config: openGraph }), twitter && _jsx(TwitterCard, { config: twitter }), jsonLd && _jsx(JSONLD, { data: jsonLd })] }));
}
/**
 * Basic Meta Tags
 */
export function BasicMeta(props) {
    const { description, keywords, author, canonical, robots, viewport = 'width=device-width, initial-scale=1', themeColor, colorScheme, } = props.config;
    return (_jsxs(_Fragment, { children: [description && _jsx(Meta, { name: "description", content: description }), keywords && _jsx(Meta, { name: "keywords", content: keywords.join(', ') }), author && _jsx(Meta, { name: "author", content: author }), robots && _jsx(Meta, { name: "robots", content: robots }), viewport && _jsx(Meta, { name: "viewport", content: viewport }), themeColor && _jsx(Meta, { name: "theme-color", content: themeColor }), colorScheme && _jsx(Meta, { name: "color-scheme", content: colorScheme }), canonical && _jsx(Link, { rel: "canonical", href: canonical })] }));
}
/**
 * OpenGraph Meta Tags
 */
export function OpenGraph(props) {
    const { type = 'website', title, description, url, siteName, image, images, locale = 'en_US', alternateLocales, article, profile, } = props.config;
    const allImages = images || (image ? [typeof image === 'string' ? { url: image } : image] : []);
    return (_jsxs(_Fragment, { children: [_jsx(Meta, { property: "og:type", content: type }), title && _jsx(Meta, { property: "og:title", content: title }), description && _jsx(Meta, { property: "og:description", content: description }), url && _jsx(Meta, { property: "og:url", content: url }), siteName && _jsx(Meta, { property: "og:site_name", content: siteName }), locale && _jsx(Meta, { property: "og:locale", content: locale }), alternateLocales?.map((loc, i) => (_jsx(Meta, { property: "og:locale:alternate", content: loc }, i))), allImages.map((img, i) => (_jsxs("span", { children: [_jsx(Meta, { property: "og:image", content: img.url }), img.width && _jsx(Meta, { property: "og:image:width", content: String(img.width) }), img.height && _jsx(Meta, { property: "og:image:height", content: String(img.height) }), img.alt && _jsx(Meta, { property: "og:image:alt", content: img.alt }), img.type && _jsx(Meta, { property: "og:image:type", content: img.type }), img.secureUrl && _jsx(Meta, { property: "og:image:secure_url", content: img.secureUrl })] }, i))), article && (_jsxs(_Fragment, { children: [article.publishedTime && _jsx(Meta, { property: "article:published_time", content: article.publishedTime }), article.modifiedTime && _jsx(Meta, { property: "article:modified_time", content: article.modifiedTime }), article.author && _jsx(Meta, { property: "article:author", content: article.author }), article.section && _jsx(Meta, { property: "article:section", content: article.section }), article.tags?.map((tag, i) => (_jsx(Meta, { property: "article:tag", content: tag }, i)))] })), profile && (_jsxs(_Fragment, { children: [profile.firstName && _jsx(Meta, { property: "profile:first_name", content: profile.firstName }), profile.lastName && _jsx(Meta, { property: "profile:last_name", content: profile.lastName }), profile.username && _jsx(Meta, { property: "profile:username", content: profile.username }), profile.gender && _jsx(Meta, { property: "profile:gender", content: profile.gender })] }))] }));
}
/**
 * Twitter Card Meta Tags
 */
export function TwitterCard(props) {
    const { card = 'summary_large_image', site, creator, title, description, image, imageAlt, } = props.config;
    return (_jsxs(_Fragment, { children: [_jsx(Meta, { name: "twitter:card", content: card }), site && _jsx(Meta, { name: "twitter:site", content: site }), creator && _jsx(Meta, { name: "twitter:creator", content: creator }), title && _jsx(Meta, { name: "twitter:title", content: title }), description && _jsx(Meta, { name: "twitter:description", content: description }), image && _jsx(Meta, { name: "twitter:image", content: image }), imageAlt && _jsx(Meta, { name: "twitter:image:alt", content: imageAlt })] }));
}
/**
 * JSON-LD Structured Data
 */
export function JSONLD(props) {
    const data = Array.isArray(props.data) ? props.data : [props.data];
    return (_jsx(_Fragment, { children: data.map((item, i) => (_jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
                __html: JSON.stringify(item)
            } }, i))) }));
}
/**
 * Favicon Links
 */
export function Favicons(props) {
    const { favicon = '/favicon.ico', apple = '/apple-touch-icon.png', manifest = '/site.webmanifest' } = props;
    return (_jsxs(_Fragment, { children: [_jsx(Link, { rel: "icon", href: favicon }), _jsx(Link, { rel: "apple-touch-icon", href: apple }), _jsx(Link, { rel: "manifest", href: manifest })] }));
}
/**
 * Alternate Language Links
 */
export function AlternateLanguages(props) {
    return (_jsxs(_Fragment, { children: [props.languages.map((lang, i) => (_jsx(Link, { rel: "alternate", href: lang.url, hrefLang: lang.lang }, i))), props.default && (_jsx(Link, { rel: "alternate", href: props.default, hrefLang: "x-default" }))] }));
}
/**
 * Preconnect Links
 */
export function Preconnect(props) {
    return (_jsx(_Fragment, { children: props.domains.map((domain, i) => (_jsx(Link, { rel: "preconnect", href: domain, crossOrigin: props.crossOrigin ? 'anonymous' : undefined }, i))) }));
}
/**
 * DNS Prefetch Links
 */
export function DNSPrefetch(props) {
    return (_jsx(_Fragment, { children: props.domains.map((domain, i) => (_jsx(Link, { rel: "dns-prefetch", href: domain }, i))) }));
}
//# sourceMappingURL=seo.js.map