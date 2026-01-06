/**
 * Textarea Component
 * Multi-line text input with auto-resize support
 */

import { jsx, signal, effect } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { InputLikeProps, Size, MaybeSignal } from '../types.js';

export interface TextareaProps extends InputLikeProps<string> {
  /** Number of visible rows */
  rows?: number;
  /** Size variant */
  size?: Size;
  /** Input label */
  label?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Whether to show character count */
  showCount?: boolean;
  /** Auto resize based on content */
  autoResize?: boolean;
  /** Minimum height for auto-resize */
  minRows?: number;
  /** Maximum height for auto-resize */
  maxRows?: number;
  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Variant style */
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
}

const sizeClasses = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-4 py-2.5',
  xl: 'text-xl px-5 py-3',
};

const variantClasses = {
  outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
  filled: 'border-0 bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20',
  flushed: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none bg-transparent focus:border-blue-500',
  unstyled: 'border-0 bg-transparent focus:ring-0',
};

const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export function Textarea(props: TextareaProps): JSX.Element {
  const {
    rows = 3,
    size = 'md',
    variant = 'outline',
    label,
    value,
    defaultValue = '',
    placeholder,
    disabled,
    readonly,
    required,
    error,
    helperText,
    maxLength,
    minLength,
    showCount = false,
    autoResize = false,
    minRows = 2,
    maxRows = 10,
    resize = 'vertical',
    onChange,
    onBlur,
    onFocus,
    name,
    ariaLabel,
    ariaDescribedBy,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('textarea');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  // Internal state for uncontrolled mode
  const internalValue = signal(defaultValue);

  // Get current value
  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  // Handle input change
  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const newValue = target.value;

    if (value === undefined) {
      internalValue.set(newValue);
    }
    onChange?.(newValue);

    // Auto-resize
    if (autoResize) {
      autoResizeTextarea(target);
    }
  };

  // Auto-resize function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Reset height to calculate scrollHeight
    textarea.style.height = 'auto';

    // Calculate line height
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    // Set new height within bounds
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Add scroll if content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<string | boolean>);
  const errorMessage = typeof getValue(error as MaybeSignal<string | boolean>) === 'string'
    ? getValue(error as MaybeSignal<string>)
    : undefined;

  const textareaClasses = cn(
    'w-full rounded-md transition-colors duration-200',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'focus:outline-none',
    sizeClasses[size],
    variantClasses[variant],
    // Resize
    autoResize ? 'resize-none overflow-hidden' : resizeClasses[resize],
    // Error state
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20',
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
    className
  );

  const children: JSX.Element[] = [];

  // Label
  if (label) {
    children.push(
      jsx('label', {
        for: id,
        class: cn(
          'block text-sm font-medium mb-1.5',
          'text-gray-700 dark:text-gray-300',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        ),
        children: label,
      })
    );
  }

  // Textarea
  children.push(
    jsx('textarea', {
      id,
      name,
      class: textareaClasses,
      value: getCurrentValue(),
      placeholder,
      disabled: isDisabled,
      readonly,
      required,
      rows: autoResize ? minRows : rows,
      maxlength: maxLength,
      minlength: minLength,
      'aria-label': ariaLabel || label,
      'aria-describedby': cn(helperText && helperId, hasError && errorId, ariaDescribedBy),
      'aria-invalid': hasError,
      'aria-required': required,
      'data-testid': testId,
      oninput: handleInput,
      onblur: onBlur,
      onfocus: onFocus,
      ...rest,
    })
  );

  // Bottom row (helper text, error, character count)
  const bottomRow: JSX.Element[] = [];

  if (helperText && !hasError) {
    bottomRow.push(
      jsx('p', {
        id: helperId,
        class: 'text-sm text-gray-500 dark:text-gray-400',
        children: helperText,
      })
    );
  }

  if (hasError && errorMessage) {
    bottomRow.push(
      jsx('p', {
        id: errorId,
        class: 'text-sm text-red-500 dark:text-red-400',
        role: 'alert',
        children: errorMessage,
      })
    );
  }

  if (showCount && maxLength) {
    bottomRow.push(
      jsx('p', {
        class: 'text-sm text-gray-400 dark:text-gray-500 ml-auto',
        children: `${getCurrentValue().length}/${maxLength}`,
      })
    );
  }

  if (bottomRow.length > 0) {
    children.push(
      jsx('div', {
        class: 'flex justify-between mt-1.5',
        children: bottomRow,
      })
    );
  }

  return jsx('div', {
    class: 'w-full',
    children,
  });
}
