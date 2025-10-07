export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
  /** Show home icon for first item */
  showHome?: boolean;
  /** Collapse middle items on mobile */
  collapseOnMobile?: boolean;
  className?: string;
}

/**
 * Breadcrumb Navigation Component
 *
 * Provides hierarchical navigation with SEO-friendly structured data.
 * Automatically adds schema.org markup for better search engine visibility.
 */
export function Breadcrumb({
  items,
  separator = '/',
  showHome = true,
  collapseOnMobile = true,
  className = '',
}: BreadcrumbProps) {
  // Generate schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: item.href }),
    })),
  };

  return (
    <>
      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav
        aria-label="Breadcrumb"
        className={className}
        style={{
          padding: '0.75rem 0',
        }}
      >
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            flexWrap: 'wrap',
          }}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;
            const isMiddle = !isFirst && !isLast;

            // On mobile, collapse middle items
            const shouldHideOnMobile = collapseOnMobile && isMiddle && items.length > 3;

            return (
              <li
                key={index}
                style={{
                  display: shouldHideOnMobile ? 'none' : 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                className={shouldHideOnMobile ? 'breadcrumb-collapse-mobile' : ''}
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: '0.875rem',
                      userSelect: 'none',
                    }}
                  >
                    {separator}
                  </span>
                )}

                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseOver={(e) => {
                      (e.target as HTMLElement).style.color = 'var(--color-brand)';
                      (e.target as HTMLElement).style.background = 'var(--color-hover)';
                    }}
                    onMouseOut={(e) => {
                      (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                      (e.target as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {isFirst && showHome ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    ) : item.icon ? (
                      <span>{item.icon}</span>
                    ) : null}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      color: isLast ? 'var(--color-text)' : 'var(--color-text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: isLast ? 600 : 400,
                      padding: '0.25rem 0.5rem',
                    }}
                  >
                    {isFirst && showHome && !item.icon ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    ) : item.icon ? (
                      <span>{item.icon}</span>
                    ) : null}
                    <span>{item.label}</span>
                  </span>
                )}

                {/* Show ellipsis for collapsed items */}
                {shouldHideOnMobile && index === 1 && (
                  <span
                    className="breadcrumb-ellipsis"
                    style={{
                      display: 'none',
                      color: 'var(--color-text-tertiary)',
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem',
                    }}
                    aria-label={`${items.length - 2} hidden items`}
                  >
                    ...
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile collapse styles */}
      {collapseOnMobile && (
        <style>{`
          @media (max-width: 640px) {
            .breadcrumb-collapse-mobile {
              display: none !important;
            }
            .breadcrumb-ellipsis {
              display: flex !important;
            }
          }
        `}</style>
      )}
    </>
  );
}

/**
 * Utility to generate breadcrumb items from URL path
 */
export function generateBreadcrumbsFromPath(
  pathname: string,
  labels?: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = labels?.[segment] || formatSegment(segment);
    items.push({
      label,
      href: currentPath,
    });
  }

  return items;
}

/**
 * Format URL segment into readable label
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Breadcrumb variants
 */

/**
 * Compact breadcrumb with minimal spacing
 */
export function CompactBreadcrumb(props: BreadcrumbProps) {
  return (
    <div style={{ fontSize: '0.8125rem' }}>
      <Breadcrumb {...props} />
    </div>
  );
}

/**
 * Breadcrumb with custom separator styles
 */
export function StyledBreadcrumb(props: BreadcrumbProps) {
  return (
    <Breadcrumb
      {...props}
      separator="›"
    />
  );
}

/**
 * Example usage:
 *
 * ```tsx
 * // Manual breadcrumb
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Docs', href: '/docs' },
 *     { label: 'Getting Started', href: '/docs/getting-started' },
 *     { label: 'Installation' }, // Current page
 *   ]}
 *   showHome
 *   collapseOnMobile
 * />
 *
 * // Auto-generate from URL
 * const items = generateBreadcrumbsFromPath('/docs/getting-started/installation', {
 *   'docs': 'Documentation',
 *   'getting-started': 'Getting Started',
 *   'installation': 'Installation Guide',
 * });
 * <Breadcrumb items={items} />
 *
 * // Compact variant
 * <CompactBreadcrumb items={items} separator="›" />
 *
 * // Custom icons
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/', icon: '🏠' },
 *     { label: 'Docs', href: '/docs', icon: '📚' },
 *     { label: 'Guide', icon: '📖' },
 *   ]}
 * />
 * ```
 */
