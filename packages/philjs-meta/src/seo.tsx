/**
 * PhilJS Meta - SEO Helpers
 *
 * OpenGraph, Twitter Cards, JSON-LD, and more
 */
import type { JSX } from '@philjs/core/jsx-runtime';
import { Meta, Link } from './Head';
import type {
  MetaConfig,
  OpenGraphConfig,
  OpenGraphImage,
  TwitterConfig,
  JSONLDConfig,
} from './types';

export interface SEOProps {
  config?: MetaConfig;
  openGraph?: OpenGraphConfig;
  twitter?: TwitterConfig;
  jsonLd?: JSONLDConfig | JSONLDConfig[];
}

/**
 * SEO Component - All-in-one SEO meta tags
 */
export function SEO(props: SEOProps): JSX.Element {
  const { config, openGraph, twitter, jsonLd } = props;

  return (
    <>
      {config && <BasicMeta config={config} />}
      {openGraph && <OpenGraph config={openGraph} />}
      {twitter && <TwitterCard config={twitter} />}
      {jsonLd && <JSONLD data={jsonLd} />}
    </>
  );
}

/**
 * Basic Meta Tags
 */
export function BasicMeta(props: { config: MetaConfig }): JSX.Element {
  const {
    description,
    keywords,
    author,
    canonical,
    robots,
    viewport = 'width=device-width, initial-scale=1',
    themeColor,
    colorScheme,
  } = props.config;

  return (
    <>
      {description && <Meta name="description" content={description} />}
      {keywords && <Meta name="keywords" content={keywords.join(', ')} />}
      {author && <Meta name="author" content={author} />}
      {robots && <Meta name="robots" content={robots} />}
      {viewport && <Meta name="viewport" content={viewport} />}
      {themeColor && <Meta name="theme-color" content={themeColor} />}
      {colorScheme && <Meta name="color-scheme" content={colorScheme} />}
      {canonical && <Link rel="canonical" href={canonical} />}
    </>
  );
}

/**
 * OpenGraph Meta Tags
 */
export function OpenGraph(props: { config: OpenGraphConfig }): JSX.Element {
  const {
    type = 'website',
    title,
    description,
    url,
    siteName,
    image,
    images,
    locale = 'en_US',
    alternateLocales,
    article,
    profile,
  } = props.config;

  const allImages: OpenGraphImage[] =
    images || (image ? [typeof image === 'string' ? { url: image } : image] : []);

  return (
    <>
      <Meta property="og:type" content={type} />
      {title && <Meta property="og:title" content={title} />}
      {description && <Meta property="og:description" content={description} />}
      {url && <Meta property="og:url" content={url} />}
      {siteName && <Meta property="og:site_name" content={siteName} />}
      {locale && <Meta property="og:locale" content={locale} />}
      {alternateLocales?.map((loc, i) => (
        <Meta property="og:locale:alternate" content={loc} key={`locale-${i}`} />
      ))}
      {allImages.map((img, i) => (
        <span key={i}>
          <Meta property="og:image" content={img.url} />
          {img.width && <Meta property="og:image:width" content={String(img.width)} />}
          {img.height && <Meta property="og:image:height" content={String(img.height)} />}
          {img.alt && <Meta property="og:image:alt" content={img.alt} />}
          {img.type && <Meta property="og:image:type" content={img.type} />}
          {img.secureUrl && (
            <Meta property="og:image:secure_url" content={img.secureUrl} />
          )}
        </span>
      ))}
      {article && (
        <>
          {article.publishedTime && (
            <Meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <Meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <Meta property="article:author" content={article.author} />}
          {article.section && <Meta property="article:section" content={article.section} />}
          {article.tags?.map((tag, i) => (
            <Meta property="article:tag" content={tag} key={`tag-${i}`} />
          ))}
        </>
      )}
      {profile && (
        <>
          {profile.firstName && <Meta property="profile:first_name" content={profile.firstName} />}
          {profile.lastName && <Meta property="profile:last_name" content={profile.lastName} />}
          {profile.username && <Meta property="profile:username" content={profile.username} />}
          {profile.gender && <Meta property="profile:gender" content={profile.gender} />}
        </>
      )}
    </>
  );
}

/**
 * Twitter Card Meta Tags
 */
export function TwitterCard(props: { config: TwitterConfig }): JSX.Element {
  const {
    card = 'summary_large_image',
    site,
    creator,
    title,
    description,
    image,
    imageAlt,
  } = props.config;

  return (
    <>
      <Meta name="twitter:card" content={card} />
      {site && <Meta name="twitter:site" content={site} />}
      {creator && <Meta name="twitter:creator" content={creator} />}
      {title && <Meta name="twitter:title" content={title} />}
      {description && <Meta name="twitter:description" content={description} />}
      {image && <Meta name="twitter:image" content={image} />}
      {imageAlt && <Meta name="twitter:image:alt" content={imageAlt} />}
    </>
  );
}

/**
 * JSON-LD Structured Data
 */
export function JSONLD(props: { data: JSONLDConfig | JSONLDConfig[] }): JSX.Element {
  const data = Array.isArray(props.data) ? props.data : [props.data];

  return (
    <>
      {data.map((item, i) => (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
          key={i}
        />
      ))}
    </>
  );
}

/**
 * Favicon Links
 */
export function Favicons(props: { favicon?: string; apple?: string; manifest?: string }): JSX.Element {
  const { favicon = '/favicon.ico', apple = '/apple-touch-icon.png', manifest = '/site.webmanifest' } = props;

  return (
    <>
      <Link rel="icon" href={favicon} />
      <Link rel="apple-touch-icon" href={apple} />
      <Link rel="manifest" href={manifest} />
    </>
  );
}

/**
 * Alternate Language Links
 */
export function AlternateLanguages(props: {
  languages: Array<{ lang: string; url: string }>;
  default?: string;
}): JSX.Element {
  return (
    <>
      {props.languages.map((lang, i) => (
        <Link rel="alternate" href={lang.url} hrefLang={lang.lang} key={`lang-${i}`} />
      ))}
      {props.default && <Link rel="alternate" href={props.default} hrefLang="x-default" />}
    </>
  );
}

/**
 * Preconnect Links
 */
export function Preconnect(props: { domains: string[]; crossOrigin?: boolean }): JSX.Element {
  return (
    <>
      {props.domains.map((domain, i) => (
        <Link
          rel="preconnect"
          href={domain}
          crossOrigin={props.crossOrigin ? 'anonymous' : undefined}
          key={i}
        />
      ))}
    </>
  );
}

/**
 * DNS Prefetch Links
 */
export function DNSPrefetch(props: { domains: string[] }): JSX.Element {
  return (
    <>
      {props.domains.map((domain, i) => (
        <Link rel="dns-prefetch" href={domain} key={i} />
      ))}
    </>
  );
}
