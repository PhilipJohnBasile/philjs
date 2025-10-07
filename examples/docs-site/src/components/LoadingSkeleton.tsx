/**
 * LoadingSkeleton Components
 *
 * Provides skeleton screens for better perceived performance
 * while content is loading. Respects prefers-reduced-motion.
 */

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  /** Disable animation */
  noAnimation?: boolean;
}

/**
 * Base skeleton component
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  noAnimation = false,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'var(--color-bg-alt)',
        animation: noAnimation ? 'none' : 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
      role="status"
      aria-label="Loading..."
      aria-live="polite"
    />
  );
}

/**
 * Text line skeleton
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '70%',
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Heading skeleton
 */
export function SkeletonHeading({ level = 2 }: { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const heights: Record<number, string> = {
    1: '2.5rem',
    2: '2rem',
    3: '1.5rem',
    4: '1.25rem',
    5: '1.125rem',
    6: '1rem',
  };

  const widths: Record<number, string> = {
    1: '80%',
    2: '70%',
    3: '60%',
    4: '50%',
    5: '45%',
    6: '40%',
  };

  return (
    <Skeleton
      height={heights[level]}
      width={widths[level]}
      borderRadius="6px"
    />
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  size = 40,
  variant = 'circular',
}: {
  size?: number;
  variant?: 'circular' | 'rounded' | 'square';
}) {
  const borderRadius = {
    circular: '50%',
    rounded: '8px',
    square: '0',
  }[variant];

  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={borderRadius}
    />
  );
}

/**
 * Card skeleton
 */
export function SkeletonCard({
  hasImage = true,
  hasAvatar = false,
}: {
  hasImage?: boolean;
  hasAvatar?: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* Image */}
      {hasImage && <Skeleton height="200px" borderRadius="0" />}

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {hasAvatar && <SkeletonAvatar size={48} />}
          <div style={{ flex: 1 }}>
            <Skeleton height="1.25rem" width="40%" />
            <div style={{ height: '0.5rem' }} />
            <Skeleton height="0.875rem" width="60%" />
          </div>
        </div>

        {/* Body */}
        <SkeletonText lines={3} />

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <Skeleton height="2.5rem" width="100px" borderRadius="6px" />
          <Skeleton height="2.5rem" width="100px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}

/**
 * List skeleton
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            background: 'var(--color-bg)',
          }}
        >
          <SkeletonAvatar size={48} variant="rounded" />
          <div style={{ flex: 1 }}>
            <Skeleton height="1rem" width="40%" />
            <div style={{ height: '0.5rem' }} />
            <Skeleton height="0.875rem" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
          padding: '1rem',
          background: 'var(--color-bg-alt)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="1rem" width="80%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '1rem',
            borderBottom: rowIndex < rows - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Documentation page skeleton
 */
export function SkeletonDocPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Title */}
      <SkeletonHeading level={1} />

      <div style={{ height: '2rem' }} />

      {/* Metadata */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Skeleton height="1.5rem" width="100px" borderRadius="16px" />
        <Skeleton height="1.5rem" width="120px" borderRadius="16px" />
      </div>

      {/* Content */}
      <SkeletonText lines={4} />

      <div style={{ height: '2rem' }} />

      {/* Section 1 */}
      <SkeletonHeading level={2} />
      <div style={{ height: '1rem' }} />
      <SkeletonText lines={5} />

      <div style={{ height: '2rem' }} />

      {/* Code block */}
      <Skeleton height="150px" borderRadius="8px" />

      <div style={{ height: '2rem' }} />

      {/* Section 2 */}
      <SkeletonHeading level={2} />
      <div style={{ height: '1rem' }} />
      <SkeletonText lines={4} />
    </div>
  );
}

/**
 * Search results skeleton
 */
export function SkeletonSearchResults({ results = 5 }: { results?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Array.from({ length: results }).map((_, index) => (
        <div key={index}>
          {/* Category badge */}
          <Skeleton height="1.25rem" width="80px" borderRadius="12px" />
          <div style={{ height: '0.5rem' }} />

          {/* Title */}
          <Skeleton height="1.5rem" width="70%" />
          <div style={{ height: '0.75rem' }} />

          {/* Description */}
          <SkeletonText lines={2} lastLineWidth="80%" />

          {/* Breadcrumb */}
          <div style={{ height: '0.75rem' }} />
          <Skeleton height="0.875rem" width="200px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Add skeleton animation styles to global CSS
 * This is automatically injected when any skeleton is used
 */
if (typeof document !== 'undefined') {
  const styleId = 'skeleton-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes skeleton-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @keyframes skeleton-wave {
        0% {
          transform: translateX(-100%);
        }
        50%, 100% {
          transform: translateX(100%);
        }
      }

      .skeleton {
        position: relative;
        overflow: hidden;
      }

      .skeleton::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent
        );
        animation: skeleton-wave 1.5s infinite;
      }

      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none !important;
        }
        .skeleton::after {
          animation: none !important;
          display: none;
        }
      }

      /* Dark theme adjustment */
      [data-theme="dark"] .skeleton::after {
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.05),
          transparent
        );
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Example usage:
 *
 * ```tsx
 * // Basic skeleton
 * <Skeleton width={200} height={24} />
 *
 * // Text lines
 * <SkeletonText lines={3} />
 *
 * // Heading
 * <SkeletonHeading level={2} />
 *
 * // Avatar
 * <SkeletonAvatar size={48} variant="circular" />
 *
 * // Card
 * <SkeletonCard hasImage hasAvatar />
 *
 * // List
 * <SkeletonList items={5} />
 *
 * // Table
 * <SkeletonTable rows={5} columns={4} />
 *
 * // Documentation page
 * <SkeletonDocPage />
 *
 * // Search results
 * <SkeletonSearchResults results={5} />
 *
 * // Conditional rendering
 * {isLoading ? <SkeletonCard /> : <Card data={data} />}
 * ```
 */
