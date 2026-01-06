/**
 * PhilJS UI - Container Component
 *
 * A responsive container that centers content and provides consistent max-width.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';

const containerVariants = variants({
  base: 'mx-auto w-full px-4 sm:px-6 lg:px-8',
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
      prose: 'max-w-prose',
    },
    center: {
      true: 'flex flex-col items-center',
      false: '',
    },
  },
  defaultVariants: {
    size: 'xl',
    center: false,
  },
});

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'prose';

export interface ContainerProps extends VariantProps<typeof containerVariants> {
  children?: JSX.Element | JSX.Element[] | string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** HTML element to render as (default: div) */
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'aside' | 'nav';
  /** ARIA role */
  role?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Container component for consistent page layout.
 *
 * @example
 * ```tsx
 * <Container size="lg">
 *   <h1>Page Title</h1>
 *   <p>Content goes here</p>
 * </Container>
 *
 * <Container as="main" size="prose" center>
 *   <article>...</article>
 * </Container>
 * ```
 */
export function Container(props: ContainerProps): JSX.Element {
  const {
    children,
    size,
    center,
    className,
    style,
    as: Component = 'div',
    role,
    'aria-label': ariaLabel,
    'data-testid': testId,
  } = props;

  const classes = containerVariants({ size, center, className });

  return (
    <Component
      className={classes}
      style={style}
      role={role}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </Component>
  );
}

export default Container;
