import { signal, effect, memo } from '@philjs/core';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
}

export interface TableOfContentsProps {
  /** Content string (HTML or markdown) to parse - optional if using contentSelector */
  content?: string;
  /** CSS selector for the content container to scan for headings */
  contentSelector?: string;
  /** Minimum heading level to include (1-6) */
  minLevel?: number;
  /** Maximum heading level to include (1-6) */
  maxLevel?: number;
  /** Position: 'fixed' for sticky sidebar, 'static' for inline */
  position?: 'fixed' | 'static';
  /** Title for the TOC */
  title?: string;
  /** Show heading numbers (1.1, 1.2, etc.) */
  numbered?: boolean;
  /** Highlight active section on scroll */
  highlightActive?: boolean;
  /** Collapse subsections by default */
  collapsible?: boolean;
  /** Show progress indicator */
  showProgress?: boolean;
  className?: string;
}

/**
 * TableOfContents Component
 *
 * Automatically generates a table of contents from page headings.
 * Tracks active section on scroll and provides smooth navigation.
 * Enhanced with numbering, collapsible sections, and progress tracking.
 */
export function TableOfContents({
  content,
  contentSelector = 'main, article, .content',
  minLevel = 2,
  maxLevel = 4,
  position = 'fixed',
  title = 'On This Page',
  numbered = false,
  highlightActive = true,
  collapsible = false,
  showProgress = false,
  className = '',
}: TableOfContentsProps = {}) {
  const tocItems = signal<TocItem[]>([]);
  const activeId = signal<string>('');
  const collapsedSections = signal<Set<string>>(new Set());

  // Parse headings from content or DOM
  effect(() => {
    let items: TocItem[] = [];

    if (content) {
      // Parse from content string
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headingSelector = Array.from(
        { length: maxLevel - minLevel + 1 },
        (_, i) => `h${minLevel + i}`
      ).join(', ');
      const headings = doc.querySelectorAll(headingSelector);

      headings.forEach((heading, index) => {
        const text = heading.textContent || '';
        const level = parseInt(heading.tagName[1]);
        let id = heading.id || text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        items.push({ id, text, level });
      });
    } else {
      // Auto-detect from DOM
      const container = document.querySelector(contentSelector);
      if (!container) return;

      const headingSelector = Array.from(
        { length: maxLevel - minLevel + 1 },
        (_, i) => `h${minLevel + i}`
      ).join(', ');
      const headings = Array.from(
        container.querySelectorAll(headingSelector)
      ) as HTMLElement[];

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substring(1));

        // Ensure heading has an ID for anchor links
        if (!heading.id) {
          heading.id = `heading-${index}-${heading.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')}`;
        }

        items.push({
          id: heading.id,
          text: heading.textContent || '',
          level,
          element: heading,
        });
      });
    }

    tocItems.set(items);
  });

  // Track active heading on scroll
  effect(() => {
    if (!highlightActive) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for fixed headers
      let currentId = '';

      // Find the heading closest to the current scroll position
      for (let i = tocItems().length - 1; i >= 0; i--) {
        const item = tocItems()[i];
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          currentId = item.id;
          break;
        }
      }

      if (currentId !== activeId()) {
        activeId.set(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Smooth scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 80; // Account for fixed header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    // Update URL hash without jumping
    history.pushState(null, '', `#${id}`);
    activeId.set(id);
  };

  // Toggle section collapse
  const toggleCollapse = (id: string) => {
    const collapsed = collapsedSections();
    if (collapsed.has(id)) {
      collapsed.delete(id);
    } else {
      collapsed.add(id);
    }
    collapsedSections.set(new Set(collapsed));
  };

  // Generate heading numbers (1.1, 1.2, etc.)
  const getNumbering = (): Map<string, string> => {
    const numbering = new Map<string, string>();
    const counters: Record<number, number> = {};

    tocItems().forEach((item) => {
      // Reset deeper level counters when going back to a higher level
      for (let level = item.level + 1; level <= maxLevel; level++) {
        counters[level] = 0;
      }

      // Increment current level counter
      counters[item.level] = (counters[item.level] || 0) + 1;

      // Build number string (e.g., "1.2.3")
      const nums: number[] = [];
      for (let level = minLevel; level <= item.level; level++) {
        nums.push(counters[level] || 0);
      }
      numbering.set(item.id, nums.join('.'));
    });

    return numbering;
  };

  const numbering = memo(() => (numbered ? getNumbering() : new Map()));

  // Check if item should be visible (not collapsed by parent)
  const isVisible = (itemIndex: number): boolean => {
    if (!collapsible) return true;

    const item = tocItems()[itemIndex];

    // Find parent heading
    for (let i = itemIndex - 1; i >= 0; i--) {
      const potentialParent = tocItems()[i];
      if (potentialParent.level < item.level) {
        return !collapsedSections().has(potentialParent.id);
      }
    }

    return true;
  };

  // Check if item has children
  const hasChildren = (itemIndex: number): boolean => {
    if (!collapsible) return false;

    const item = tocItems()[itemIndex];
    const nextItem = tocItems()[itemIndex + 1];

    return nextItem && nextItem.level > item.level;
  };

  const items = tocItems();
  const hasItems = items.length > 0;

  if (!hasItems) {
    return null; // Don't render if no headings found
  }

  return (
    <aside
      class={`table-of-contents ${className}`}
      aria-label="Table of contents"
      style={`
        width: 240px;
        position: ${position === 'fixed' ? 'sticky' : 'static'};
        top: ${position === 'fixed' ? '6rem' : 'auto'};
        align-self: flex-start;
        max-height: ${position === 'fixed' ? 'calc(100vh - 8rem)' : 'none'};
        overflow-y: ${position === 'fixed' ? 'auto' : 'visible'};
        padding: 1.5rem;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        display: ${hasItems ? 'block' : 'none'};
      `}
    >
      {/* Title */}
      <h4
        style="
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1rem 0;
        "
      >
        {title}
      </h4>

      {/* TOC List */}
      <nav>
        <ul style="list-style: none; margin: 0; padding: 0;">
          {items.map((item, index) => {
            const isActive = highlightActive && activeId() === item.id;
            const indent = (item.level - minLevel) * 1;
            const visible = isVisible(index);
            const children = hasChildren(index);
            const collapsed = collapsedSections().has(item.id);

            if (!visible) return null;

            return (
              <li
                style="
                  margin-bottom: 0.5rem;
                  display: flex;
                  align-items: flex-start;
                "
              >
                {/* Collapse toggle */}
                {collapsible && children && (
                  <button
                    onClick={() => toggleCollapse(item.id)}
                    style={`
                      width: 1.25rem;
                      height: 1.25rem;
                      padding: 0;
                      margin-right: 0.25rem;
                      margin-top: 0.125rem;
                      background: transparent;
                      border: none;
                      color: var(--color-text-tertiary);
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: transform var(--transition-fast);
                      transform: ${collapsed ? 'rotate(-90deg)' : 'none'};
                    `}
                    aria-label={collapsed ? 'Expand' : 'Collapse'}
                  >
                    ▼
                  </button>
                )}

                {/* TOC Link */}
                <a
                  href={`#${item.id}`}
                  onClick={(e: MouseEvent) => {
                    e.preventDefault();
                    scrollToHeading(item.id);
                  }}
                  style={`
                    flex: 1;
                    padding-left: ${indent}rem;
                    font-size: 0.875rem;
                    color: ${
                      isActive
                        ? 'var(--color-brand)'
                        : 'var(--color-text-secondary)'
                    };
                    text-decoration: none;
                    line-height: 1.5;
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                    transition: all var(--transition-fast);
                    border-left: ${
                      isActive
                        ? '2px solid var(--color-brand)'
                        : '2px solid transparent'
                    };
                    padding-left: ${
                      isActive ? `calc(${indent}rem + 0.5rem)` : `${indent}rem`
                    };
                    font-weight: ${isActive ? '600' : '400'};
                  `}
                  onMouseEnter={(e: MouseEvent) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e: MouseEvent) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color =
                        'var(--color-text-secondary)';
                    }
                  }}
                >
                  {numbered && (
                    <span
                      style="
                        color: var(--color-text-tertiary);
                        font-family: var(--font-mono);
                        font-size: 0.75rem;
                        flex-shrink: 0;
                      "
                    >
                      {numbering().get(item.id)}
                    </span>
                  )}
                  <span>{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Progress indicator */}
      {highlightActive && showProgress && (
        <div
          style="
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 0.75rem;
              color: var(--color-text-tertiary);
              margin-bottom: 0.5rem;
            "
          >
            <span>Progress</span>
            <span>
              {items.findIndex((item) => item.id === activeId()) + 1} /{' '}
              {items.length}
            </span>
          </div>
          <div
            style="
              width: 100%;
              height: 4px;
              background: var(--color-bg-alt);
              border-radius: 2px;
              overflow: hidden;
            "
          >
            <div
              style={`
                width: ${
                  ((items.findIndex((item) => item.id === activeId()) + 1) /
                    items.length) *
                  100
                }%;
                height: 100%;
                background: var(--color-brand);
                transition: width var(--transition-normal);
              `}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Compact TOC variant for mobile/narrow spaces
 */
export function CompactTableOfContents(props: TableOfContentsProps) {
  return (
    <TableOfContents
      {...props}
      position="static"
      collapsible={true}
      numbered={false}
      showProgress={false}
    />
  );
}

/**
 * Floating TOC with collapse button
 */
export function FloatingTableOfContents(props: TableOfContentsProps) {
  const isExpanded = signal(true);

  return (
    <div
      style={`
        position: fixed;
        top: 6rem;
        right: ${isExpanded() ? '2rem' : '-280px'};
        transition: right var(--transition-normal);
        z-index: 100;
      `}
    >
      {/* Toggle button */}
      <button
        onClick={() => isExpanded.set(!isExpanded())}
        style="
          position: absolute;
          left: -2.5rem;
          top: 1rem;
          width: 2.5rem;
          height: 2.5rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 8px 0 0 8px;
          border-right: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        "
        aria-label={
          isExpanded()
            ? 'Hide table of contents'
            : 'Show table of contents'
        }
      >
        {isExpanded() ? '→' : '←'}
      </button>

      <TableOfContents {...props} position="static" />
    </div>
  );
}

/**
 * Hook to programmatically control TOC
 */
export function useTableOfContents(
  contentSelector: string = 'main, article, .content',
  minLevel: number = 2,
  maxLevel: number = 4
) {
  const items = signal<TocItem[]>([]);
  const activeId = signal<string>('');

  effect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headingSelector = Array.from(
      { length: maxLevel - minLevel + 1 },
      (_, i) => `h${minLevel + i}`
    ).join(', ');
    const headings = Array.from(
      container.querySelectorAll(headingSelector)
    ) as HTMLElement[];

    const tocItems: TocItem[] = headings.map((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));

      if (!heading.id) {
        heading.id = `heading-${index}-${heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')}`;
      }

      return {
        id: heading.id,
        text: heading.textContent || '',
        level,
        element: heading,
      };
    });

    items.set(tocItems);
  });

  const scrollToItem = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    activeId.set(id);
  };

  return {
    items: items(),
    activeId: activeId(),
    scrollToItem,
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * // Basic TOC (auto-detect from DOM)
 * <TableOfContents />
 *
 * // Legacy usage with content string
 * <TableOfContents content={htmlString} />
 *
 * // Custom configuration
 * <TableOfContents
 *   contentSelector=".documentation"
 *   minLevel={2}
 *   maxLevel={3}
 *   title="Contents"
 *   numbered
 *   highlightActive
 *   collapsible
 *   showProgress
 * />
 *
 * // Compact variant for mobile
 * <CompactTableOfContents />
 *
 * // Floating TOC with hide/show
 * <FloatingTableOfContents />
 *
 * // Use the hook programmatically
 * const { items, activeId, scrollToItem } = useTableOfContents();
 * ```
 */
