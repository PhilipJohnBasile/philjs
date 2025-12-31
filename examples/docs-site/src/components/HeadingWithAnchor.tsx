import { signal } from '@philjs/core';

interface HeadingWithAnchorProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  children: any;
}

export function HeadingWithAnchor({ level, id, children }: HeadingWithAnchorProps) {
  const copied = signal(false);
  const hovered = signal(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url);
    copied.set(true);
    setTimeout(() => copied.set(false), 2000);
  };

  const Tag = `h${level}` as any;

  return (
    <Tag
      id={id}
      onMouseEnter={() => hovered.set(true)}
      onMouseLeave={() => hovered.set(false)}
      style={{
        position: 'relative',
        scrollMarginTop: '80px', // Account for fixed header
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {children}

      {/* Anchor link button - visible on hover */}
      {(hovered() || copied()) && (
        <button
          onClick={copyLink}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.5rem',
            height: '1.5rem',
            padding: 0,
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            color: copied() ? 'var(--color-success)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            fontSize: '0.875rem',
          }}
          aria-label={copied() ? 'Link copied!' : 'Copy link to this section'}
          title={copied() ? 'Link copied!' : 'Copy link'}
        >
          {copied() ? (
            // Checkmark icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          ) : (
            // Link icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          )}
        </button>
      )}
    </Tag>
  );
}

// Helper function to generate slug from text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
