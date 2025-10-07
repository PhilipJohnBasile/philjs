import { signal, effect } from 'philjs-core';

export interface ReadingProgressProps {
  /** Target element to track (defaults to document.body) */
  target?: string;
  /** Height of the progress bar in pixels */
  height?: number;
  /** Color of the progress bar */
  color?: string;
  /** Position: top or bottom */
  position?: 'top' | 'bottom';
  /** Show percentage text */
  showPercentage?: boolean;
  className?: string;
}

/**
 * ReadingProgress Component
 *
 * Displays a progress bar indicating how far the user has scrolled
 * through the document or a specific element.
 */
export function ReadingProgress({
  target,
  height = 4,
  color = 'var(--color-brand)',
  position = 'top',
  showPercentage = false,
  className = '',
}: ReadingProgressProps = {}) {
  const progress = signal(0);

  // Track scroll progress
  effect(() => {
    const calculateProgress = () => {
      const element = target ? document.querySelector(target) : document.documentElement;
      if (!element) return;

      const scrollTop = window.scrollY;
      const docHeight = element.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      progress.set(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', calculateProgress);
    window.addEventListener('resize', calculateProgress);
    calculateProgress(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', calculateProgress);
      window.removeEventListener('resize', calculateProgress);
    };
  });

  return (
    <div
      className={`reading-progress ${className}`}
      style={{
        position: 'fixed',
        [position]: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        background: 'var(--color-border)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress())}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        style={{
          width: `${progress()}%`,
          height: '100%',
          background: color,
          transition: 'width 0.15s ease-out',
        }}
      />
      {showPercentage && progress() > 5 && (
        <div
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            pointerEvents: 'auto',
          }}
        >
          {Math.round(progress())}%
        </div>
      )}
    </div>
  );
}

/**
 * Article Reading Progress - Tracks progress within an article element
 */
export function ArticleReadingProgress(props: Omit<ReadingProgressProps, 'target'>) {
  return <ReadingProgress {...props} target="article, main, .content" />;
}

/**
 * Circular Reading Progress - Shows progress in a circular indicator
 */
export function CircularReadingProgress({
  size = 48,
  strokeWidth = 4,
  color = 'var(--color-brand)',
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
} = {}) {
  const progress = signal(0);

  effect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progress.set(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', calculateProgress);
    window.addEventListener('resize', calculateProgress);
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', calculateProgress);
      window.removeEventListener('resize', calculateProgress);
    };
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress() / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      style={{
        transform: 'rotate(-90deg)',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress())}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.15s ease-out',
        }}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          fill: 'var(--color-text)',
        }}
      >
        {Math.round(progress())}%
      </text>
    </svg>
  );
}

/**
 * Example usage:
 *
 * // Linear progress bar at top
 * <ReadingProgress position="top" height={4} />
 *
 * // With percentage display
 * <ReadingProgress showPercentage />
 *
 * // Track specific article
 * <ArticleReadingProgress />
 *
 * // Circular progress indicator
 * <CircularReadingProgress size={48} />
 */
