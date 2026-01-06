/**
 * @philjs/tailwind-ui - Shared Types
 * Common types used across all UI components
 */

import type { Signal } from '@philjs/core';

// ============================================================================
// Base Types
// ============================================================================

/** Standard size variants */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Extended size variants */
export type ExtendedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/** Color variants for theming */
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/** Button-specific variants */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'soft';

/** Alert/status variants */
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Spacing values */
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

/** Direction for layout components */
export type Direction = 'horizontal' | 'vertical';

/** Alignment options */
export type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Justify options */
export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/** Position options */
export type Position = 'top' | 'right' | 'bottom' | 'left';

/** Extended position options */
export type ExtendedPosition =
  | 'top' | 'top-start' | 'top-end'
  | 'right' | 'right-start' | 'right-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end';

// ============================================================================
// Component Props
// ============================================================================

/** Base props for all components */
export interface BaseProps {
  /** Additional CSS classes */
  class?: string;
  /** Custom styles */
  style?: Record<string, string | number>;
  /** Unique identifier */
  id?: string;
  /** Test ID for testing */
  testId?: string;
}

/** Props for components that can be disabled */
export interface DisableableProps {
  /** Whether the component is disabled */
  disabled?: boolean | Signal<boolean>;
}

/** Props for components that can show loading state */
export interface LoadableProps {
  /** Whether the component is loading */
  loading?: boolean | Signal<boolean>;
}

/** Props for form elements */
export interface FormElementProps extends BaseProps, DisableableProps {
  /** Element name for form submission */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is readonly */
  readonly?: boolean;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Aria described by ID */
  ariaDescribedBy?: string;
}

/** Props for input-like elements */
export interface InputLikeProps<T = string> extends FormElementProps {
  /** Current value */
  value?: T | Signal<T>;
  /** Default value */
  defaultValue?: T;
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: T) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Error message or state */
  error?: string | boolean | Signal<string | boolean>;
  /** Helper text */
  helperText?: string;
}

/** Props for clickable elements */
export interface ClickableProps {
  /** Click handler */
  onClick?: (event: MouseEvent) => void;
  /** Double click handler */
  onDoubleClick?: (event: MouseEvent) => void;
}

// ============================================================================
// JSX Types
// ============================================================================

/** Children type for components */
export type Children =
  | JSX.Element
  | JSX.Element[]
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => JSX.Element);

/** Component with children */
export interface WithChildren {
  children?: Children;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Make specific props optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific props required */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Extract signal value type */
export type SignalValue<T> = T extends Signal<infer U> ? U : T;

/** Value or signal of value */
export type MaybeSignal<T> = T | Signal<T>;

// ============================================================================
// Event Types
// ============================================================================

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string | (() => JSX.Element);
  cell?: (row: T, index: number) => JSX.Element;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Animation Types
// ============================================================================

export type TransitionType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight';

export interface TransitionProps {
  /** Transition type */
  transition?: TransitionType;
  /** Transition duration in ms */
  duration?: number;
  /** Whether transition is enabled */
  animate?: boolean;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
}

export interface Theme {
  colors: ThemeColors;
  darkMode: boolean;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily: string;
}
