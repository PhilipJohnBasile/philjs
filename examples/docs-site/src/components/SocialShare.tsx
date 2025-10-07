import { signal } from 'philjs-core';

export interface SocialShareProps {
  /** URL to share (defaults to current page) */
  url?: string;
  /** Title of the content */
  title?: string;
  /** Description for social media */
  description?: string;
  /** Hashtags (Twitter) */
  hashtags?: string[];
  /** Via user (Twitter) */
  via?: string;
  /** Show share counts (requires API integration) */
  showCounts?: boolean;
  /** Platforms to show */
  platforms?: ('twitter' | 'linkedin' | 'facebook' | 'reddit' | 'hackernews' | 'email' | 'copy')[];
  /** Layout: horizontal or vertical */
  layout?: 'horizontal' | 'vertical';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Show labels */
  showLabels?: boolean;
  className?: string;
}

/**
 * SocialShare Component
 *
 * Provides social sharing buttons for documentation pages.
 * Supports multiple platforms and includes Web Share API fallback.
 */
export function SocialShare({
  url: customUrl,
  title: customTitle,
  description,
  hashtags = [],
  via,
  showCounts = false,
  platforms = ['twitter', 'linkedin', 'reddit', 'copy'],
  layout = 'horizontal',
  size = 'medium',
  showLabels = true,
  className = '',
}: SocialShareProps = {}) {
  const copied = signal(false);
  const shareCount = signal<Record<string, number>>({});

  // Get current page info
  const url = customUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const title =
    customTitle ||
    (typeof document !== 'undefined' ? document.title : '') ||
    'Check this out!';

  // Size configurations
  const sizeConfig = {
    small: { button: '32px', icon: '14px', fontSize: '0.75rem', padding: '0.375rem 0.75rem' },
    medium: { button: '40px', icon: '16px', fontSize: '0.875rem', padding: '0.5rem 1rem' },
    large: { button: '48px', icon: '18px', fontSize: '1rem', padding: '0.625rem 1.25rem' },
  }[size];

  // Share handlers
  const shareToTwitter = () => {
    const params = new URLSearchParams({
      url,
      text: title,
      ...(hashtags.length > 0 && { hashtags: hashtags.join(',') }),
      ...(via && { via }),
    });
    window.open(`https://twitter.com/intent/tweet?${params}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const params = new URLSearchParams({ url });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?${params}`, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const params = new URLSearchParams({ u: url });
    window.open(`https://www.facebook.com/sharer/sharer.php?${params}`, '_blank', 'width=600,height=400');
  };

  const shareToReddit = () => {
    const params = new URLSearchParams({ url, title });
    window.open(`https://reddit.com/submit?${params}`, '_blank', 'width=800,height=600');
  };

  const shareToHackerNews = () => {
    const params = new URLSearchParams({ u: url, t: title });
    window.open(`https://news.ycombinator.com/submitlink?${params}`, '_blank', 'width=800,height=600');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const bodyText = description || title;
    const body = encodeURIComponent(`${bodyText}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copied.set(true);
      setTimeout(() => copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Native Web Share API (mobile)
  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    }
  };

  // Platform configurations
  const platformConfig: Record<
    string,
    {
      label: string;
      icon: string;
      color: string;
      handler: () => void;
    }
  > = {
    twitter: {
      label: 'Twitter',
      icon: '𝕏',
      color: '#1DA1F2',
      handler: shareToTwitter,
    },
    linkedin: {
      label: 'LinkedIn',
      icon: 'in',
      color: '#0077B5',
      handler: shareToLinkedIn,
    },
    facebook: {
      label: 'Facebook',
      icon: 'f',
      color: '#1877F2',
      handler: shareToFacebook,
    },
    reddit: {
      label: 'Reddit',
      icon: '↗',
      color: '#FF4500',
      handler: shareToReddit,
    },
    hackernews: {
      label: 'HN',
      icon: 'Y',
      color: '#FF6600',
      handler: shareToHackerNews,
    },
    email: {
      label: 'Email',
      icon: '✉',
      color: '#666',
      handler: shareViaEmail,
    },
    copy: {
      label: copied() ? 'Copied!' : 'Copy',
      icon: copied() ? '✓' : '⎘',
      color: copied() ? '#10B981' : '#666',
      handler: copyToClipboard,
    },
  };

  return (
    <div
      className={`social-share ${className}`}
      style={{
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        gap: '0.5rem',
        alignItems: layout === 'horizontal' ? 'center' : 'stretch',
      }}
    >
      {/* Native share button (mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={useNativeShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: showLabels ? sizeConfig.padding : '0',
            width: showLabels ? 'auto' : sizeConfig.button,
            height: sizeConfig.button,
            justifyContent: 'center',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text)',
            fontSize: sizeConfig.fontSize,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title="Share"
        >
          <span style={{ fontSize: sizeConfig.icon }}>↗</span>
          {showLabels && <span>Share</span>}
        </button>
      )}

      {/* Platform buttons */}
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        if (!config) return null;

        return (
          <button
            key={platform}
            onClick={config.handler}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: showLabels ? sizeConfig.padding : '0',
              width: showLabels ? 'auto' : sizeConfig.button,
              height: sizeConfig.button,
              justifyContent: 'center',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: sizeConfig.fontSize,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = config.color;
              (e.currentTarget as HTMLElement).style.color = config.color;
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
            }}
            title={`Share on ${config.label}`}
          >
            <span style={{ fontSize: sizeConfig.icon, fontWeight: 'bold' }}>{config.icon}</span>
            {showLabels && <span>{config.label}</span>}
            {showCounts && shareCount()[platform] && (
              <span
                style={{
                  marginLeft: '0.25rem',
                  padding: '0.125rem 0.375rem',
                  background: 'var(--color-bg)',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {shareCount()[platform]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact share button with dropdown
 */
export function CompactShare(props: SocialShareProps) {
  const isOpen = signal(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => isOpen.set(!isOpen())}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          color: 'var(--color-text)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
      >
        <span>↗</span>
        <span>Share</span>
      </button>

      {isOpen() && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => isOpen.set(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              padding: '0.75rem',
              zIndex: 100,
              minWidth: '200px',
            }}
          >
            <SocialShare {...props} layout="vertical" showLabels size="medium" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Floating share bar
 */
export function FloatingShareBar(props: SocialShareProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
      }}
    >
      <SocialShare {...props} layout="vertical" showLabels={false} size="medium" />
    </div>
  );
}

/**
 * OpenGraph meta tags helper
 */
export function OpenGraphMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName,
  twitterCard = 'summary_large_image',
  twitterSite,
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
}) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <>
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      {image && <meta property="og:image" content={image} />}
      {siteName && <meta property="og:site_name" content={siteName} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}

      {/* Additional meta */}
      <meta name="description" content={description} />
    </>
  );
}

/**
 * Generate social share image URL (for use with Open Graph)
 */
export function generateShareImageUrl({
  title,
  subtitle,
  theme = 'light',
  logo,
}: {
  title: string;
  subtitle?: string;
  theme?: 'light' | 'dark';
  logo?: string;
}): string {
  // This would typically point to an API endpoint that generates OG images
  const params = new URLSearchParams({
    title,
    ...(subtitle && { subtitle }),
    theme,
    ...(logo && { logo }),
  });

  return `/api/og-image?${params}`;
}

/**
 * Example usage:
 *
 * Basic share buttons:
 * <SocialShare
 *   title="PhilJS Documentation"
 *   description="Modern JavaScript framework"
 *   hashtags={['philjs', 'javascript']}
 *   via="philjs"
 * />
 *
 * Custom platforms:
 * <SocialShare
 *   platforms={['twitter', 'linkedin', 'copy']}
 *   layout="vertical"
 *   size="large"
 * />
 *
 * Compact dropdown:
 * <CompactShare
 *   title="Check out PhilJS"
 *   platforms={['twitter', 'linkedin', 'reddit', 'hackernews']}
 * />
 *
 * Floating sidebar:
 * <FloatingShareBar platforms={['twitter', 'linkedin', 'copy']} />
 *
 * Open Graph meta tags:
 * <OpenGraphMeta
 *   title="PhilJS - Modern JavaScript Framework"
 *   description="Fine-grained reactivity for modern web apps"
 *   image="/og-image.png"
 *   siteName="PhilJS Docs"
 *   twitterSite="@philjs"
 * />
 */
