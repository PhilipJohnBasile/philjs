/**
 * PhilJS UI - Breadcrumb Component
 */

export interface BreadcrumbProps {
  children: any | any[];
  separator?: any | string;
  className?: string;
}

export function Breadcrumb(props: BreadcrumbProps) {
  const {
    children,
    separator = '/',
    className = '',
  } = props;

  const items = Array.isArray(children) ? children : [children];

  const defaultSeparator = typeof separator === 'string' ? (
    <span className="mx-2 text-gray-400">{separator}</span>
  ) : (
    <span className="mx-2">{separator}</span>
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item}
            {index < items.length - 1 && defaultSeparator}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItemProps {
  children: any;
  href?: string;
  isCurrentPage?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  const {
    children,
    href,
    isCurrentPage = false,
    onClick,
    className = '',
  } = props;

  const baseClasses = 'text-sm';
  const activeClasses = 'text-gray-900 font-medium';
  const inactiveClasses = 'text-gray-500 hover:text-gray-700';

  if (isCurrentPage) {
    return (
      <span
        aria-current="page"
        className={`${baseClasses} ${activeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`${baseClasses} ${inactiveClasses} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${inactiveClasses} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Breadcrumb Link (Alias for BreadcrumbItem with href)
 */
export function BreadcrumbLink(props: BreadcrumbItemProps) {
  return <BreadcrumbItem {...props} />;
}

/**
 * Breadcrumb Separator
 */
export interface BreadcrumbSeparatorProps {
  children?: any | string;
  className?: string;
}

export function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
  const { children = '/', className = '' } = props;

  return (
    <span className={`mx-2 text-gray-400 ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Common Breadcrumb Icons
 */
export const BreadcrumbIcons = {
  chevron: (
    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  arrow: (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  dot: (
    <span className="h-1 w-1 rounded-full bg-gray-400" />
  ),
};
