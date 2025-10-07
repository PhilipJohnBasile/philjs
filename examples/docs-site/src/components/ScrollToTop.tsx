import { signal, effect } from 'philjs-core';

export interface ScrollToTopProps {
  /** Show button after scrolling this many pixels */
  threshold?: number;
  /** Position of the button */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Smooth scroll behavior */
  smooth?: boolean;
  /** Show progress ring around button */
  showProgress?: boolean;
  className?: string;
}

/**
 * ScrollToTop Component
 *
 * Floating button that appears after scrolling and returns user to top of page.
 * Optionally shows scroll progress as a circular ring.
 */
export function ScrollToTop({
  threshold = 300,
  position = 'bottom-right',
  size = 'medium',
  smooth = true,
  showProgress = true,
  className = '',
}: ScrollToTopProps = {}) {
  const isVisible = signal(false);
  const scrollProgress = signal(0);

  // Track scroll position
  effect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      isVisible.set(scrollTop > threshold);
      scrollProgress.set(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const sizes = {
    small: { button: '40px', icon: '16px', stroke: 3 },
    medium: { button: '48px', icon: '20px', stroke: 4 },
    large: { button: '56px', icon: '24px', stroke: 5 },
  };

  const positions = {
    'bottom-right': { bottom: '2rem', right: '2rem' },
    'bottom-left': { bottom: '2rem', left: '2rem' },
    'bottom-center': { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' },
  };

  const config = sizes[size];
  const buttonSize = parseInt(config.button);

  if (!isVisible()) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top ${className}`}
      style={{
        position: 'fixed',
        ...positions[position],
        width: config.button,
        height: config.button,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        border: '2px solid var(--color-border)',
        borderRadius: '50%',
        color: 'var(--color-text)',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all var(--transition-fast)',
        animation: 'fadeInUp 0.3s ease-out',
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
      aria-label="Scroll to top"
      title="Back to top"
    >
      {/* Progress ring */}
      {showProgress && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
            pointerEvents: 'none',
          }}
        >
          <circle
            cx={buttonSize / 2}
            cy={buttonSize / 2}
            r={(buttonSize - config.stroke * 2) / 2}
            stroke="var(--color-brand)"
            strokeWidth={config.stroke}
            fill="none"
            strokeDasharray={Math.PI * (buttonSize - config.stroke * 2)}
            strokeDashoffset={
              Math.PI * (buttonSize - config.stroke * 2) * (1 - scrollProgress() / 100)
            }
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.15s ease-out',
            }}
          />
        </svg>
      )}

      {/* Arrow icon */}
      <svg
        width={config.icon}
        height={config.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

/**
 * Scroll to specific element
 */
export function ScrollToElement({
  targetId,
  children,
  smooth = true,
  offset = 80,
}: {
  targetId: string;
  children: any;
  smooth?: boolean;
  offset?: number;
}) {
  const scrollToElement = (e: Event) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  return (
    <a href={`#${targetId}`} onClick={scrollToElement}>
      {children}
    </a>
  );
}

/**
 * Add fade-in animation
 */
if (typeof document !== 'undefined') {
  const styleId = 'scroll-to-top-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .scroll-to-top {
          animation: none !important;
          transition: none !important;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Example usage:
 *
 * // Basic scroll to top button
 * <ScrollToTop />
 *
 * // Customized
 * <ScrollToTop
 *   threshold={500}
 *   position="bottom-left"
 *   size="large"
 *   showProgress
 * />
 *
 * // Scroll to specific element
 * <ScrollToElement targetId="installation">
 *   Go to Installation
 * </ScrollToElement>
 */
