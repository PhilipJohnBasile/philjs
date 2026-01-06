/**
 * PhilJS UI - Box Component
 *
 * A primitive layout component for applying padding, margin, and other styles.
 * The building block for creating custom layouts.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';

export type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;
export type DisplayValue = 'block' | 'inline-block' | 'inline' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'hidden' | 'none';
export type PositionValue = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
export type OverflowValue = 'auto' | 'hidden' | 'visible' | 'scroll';

export interface BoxProps {
  children?: JSX.Element | JSX.Element[] | string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** HTML element to render as */
  as?: keyof JSX.IntrinsicElements;

  // Spacing
  /** Padding on all sides */
  p?: SpacingValue;
  /** Padding on x-axis (left and right) */
  px?: SpacingValue;
  /** Padding on y-axis (top and bottom) */
  py?: SpacingValue;
  /** Padding top */
  pt?: SpacingValue;
  /** Padding right */
  pr?: SpacingValue;
  /** Padding bottom */
  pb?: SpacingValue;
  /** Padding left */
  pl?: SpacingValue;
  /** Margin on all sides */
  m?: SpacingValue | 'auto';
  /** Margin on x-axis (left and right) */
  mx?: SpacingValue | 'auto';
  /** Margin on y-axis (top and bottom) */
  my?: SpacingValue | 'auto';
  /** Margin top */
  mt?: SpacingValue | 'auto';
  /** Margin right */
  mr?: SpacingValue | 'auto';
  /** Margin bottom */
  mb?: SpacingValue | 'auto';
  /** Margin left */
  ml?: SpacingValue | 'auto';

  // Display & Position
  /** Display property */
  display?: DisplayValue;
  /** Position property */
  position?: PositionValue;
  /** Overflow property */
  overflow?: OverflowValue;
  /** Overflow X property */
  overflowX?: OverflowValue;
  /** Overflow Y property */
  overflowY?: OverflowValue;

  // Sizing
  /** Width */
  w?: 'full' | 'screen' | 'auto' | 'min' | 'max' | 'fit';
  /** Height */
  h?: 'full' | 'screen' | 'auto' | 'min' | 'max' | 'fit';
  /** Min width */
  minW?: 'full' | 'min' | 'max' | 'fit' | 0;
  /** Max width */
  maxW?: 'full' | 'min' | 'max' | 'fit' | 'prose' | 'screen-sm' | 'screen-md' | 'screen-lg' | 'screen-xl' | 'screen-2xl' | 'none';
  /** Min height */
  minH?: 'full' | 'screen' | 'min' | 'max' | 'fit' | 0;
  /** Max height */
  maxH?: 'full' | 'screen' | 'min' | 'max' | 'fit' | 'none';

  // Colors & Background
  /** Background color (Tailwind color name) */
  bg?: string;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Border */
  border?: boolean | 'none' | 't' | 'r' | 'b' | 'l' | 'x' | 'y';
  /** Border color */
  borderColor?: string;
  /** Shadow */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';

  // Accessibility
  /** ARIA role */
  role?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA labelledby */
  'aria-labelledby'?: string;
  /** ARIA describedby */
  'aria-describedby'?: string;
  /** ARIA hidden */
  'aria-hidden'?: boolean;
  /** Test ID */
  'data-testid'?: string;
  /** Tab index */
  tabIndex?: number;
}

const spacingMap: Record<SpacingValue, string> = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  8: '8',
  10: '10',
  12: '12',
  16: '16',
  20: '20',
  24: '24',
  32: '32',
};

/**
 * Box component - a primitive layout building block.
 *
 * @example
 * ```tsx
 * <Box p={4} bg="gray-100" rounded="lg">
 *   <Text>Content</Text>
 * </Box>
 *
 * <Box as="section" py={8} px={4} maxW="screen-lg" mx="auto">
 *   <Container>...</Container>
 * </Box>
 * ```
 */
export function Box(props: BoxProps): JSX.Element {
  const {
    children,
    className,
    style,
    as: Component = 'div',
    // Spacing
    p, px, py, pt, pr, pb, pl,
    m, mx, my, mt, mr, mb, ml,
    // Display & Position
    display, position, overflow, overflowX, overflowY,
    // Sizing
    w, h, minW, maxW, minH, maxH,
    // Colors
    bg, rounded, border, borderColor, shadow,
    // Accessibility
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-hidden': ariaHidden,
    'data-testid': testId,
    tabIndex,
  } = props;

  const classes = cn(
    // Padding
    p !== undefined && `p-${spacingMap[p]}`,
    px !== undefined && `px-${spacingMap[px]}`,
    py !== undefined && `py-${spacingMap[py]}`,
    pt !== undefined && `pt-${spacingMap[pt]}`,
    pr !== undefined && `pr-${spacingMap[pr]}`,
    pb !== undefined && `pb-${spacingMap[pb]}`,
    pl !== undefined && `pl-${spacingMap[pl]}`,
    // Margin
    m !== undefined && (m === 'auto' ? 'm-auto' : `m-${spacingMap[m]}`),
    mx !== undefined && (mx === 'auto' ? 'mx-auto' : `mx-${spacingMap[mx]}`),
    my !== undefined && (my === 'auto' ? 'my-auto' : `my-${spacingMap[my]}`),
    mt !== undefined && (mt === 'auto' ? 'mt-auto' : `mt-${spacingMap[mt]}`),
    mr !== undefined && (mr === 'auto' ? 'mr-auto' : `mr-${spacingMap[mr]}`),
    mb !== undefined && (mb === 'auto' ? 'mb-auto' : `mb-${spacingMap[mb]}`),
    ml !== undefined && (ml === 'auto' ? 'ml-auto' : `ml-${spacingMap[ml]}`),
    // Display
    display === 'block' && 'block',
    display === 'inline-block' && 'inline-block',
    display === 'inline' && 'inline',
    display === 'flex' && 'flex',
    display === 'inline-flex' && 'inline-flex',
    display === 'grid' && 'grid',
    display === 'inline-grid' && 'inline-grid',
    (display === 'hidden' || display === 'none') && 'hidden',
    // Position
    position && position,
    // Overflow
    overflow && `overflow-${overflow}`,
    overflowX && `overflow-x-${overflowX}`,
    overflowY && `overflow-y-${overflowY}`,
    // Width
    w && `w-${w}`,
    h && `h-${h}`,
    minW !== undefined && (minW === 0 ? 'min-w-0' : `min-w-${minW}`),
    maxW && `max-w-${maxW}`,
    minH !== undefined && (minH === 0 ? 'min-h-0' : `min-h-${minH}`),
    maxH && `max-h-${maxH}`,
    // Background & Border
    bg && `bg-${bg}`,
    rounded && (rounded === 'none' ? 'rounded-none' : `rounded-${rounded}`),
    border === true && 'border',
    border === 't' && 'border-t',
    border === 'r' && 'border-r',
    border === 'b' && 'border-b',
    border === 'l' && 'border-l',
    border === 'x' && 'border-x',
    border === 'y' && 'border-y',
    borderColor && `border-${borderColor}`,
    shadow && (shadow === 'none' ? 'shadow-none' : `shadow-${shadow}`),
    className
  );

  return (
    <Component
      className={classes}
      style={style}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-hidden={ariaHidden}
      data-testid={testId}
      tabIndex={tabIndex}
    >
      {children}
    </Component>
  );
}

export default Box;
