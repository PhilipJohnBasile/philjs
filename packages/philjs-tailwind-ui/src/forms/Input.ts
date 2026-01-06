/**
 * Input Component
 * Text input field with validation and styling
 */

import { jsx, signal, effect } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { InputLikeProps, Size, MaybeSignal } from '../types.js';

export interface InputProps extends InputLikeProps<string> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  /** Size variant */
  size?: Size;
  /** Input label */
  label?: string;
  /** Left icon or element */
  leftElement?: JSX.Element | (() => JSX.Element);
  /** Right icon or element */
  rightElement?: JSX.Element | (() => JSX.Element);
  /** Left addon text */
  leftAddon?: string;
  /** Right addon text */
  rightAddon?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Pattern for validation */
  pattern?: string;
  /** Autocomplete attribute */
  autocomplete?: string;
  /** Whether to show character count */
  showCount?: boolean;
  /** Clear button */
  clearable?: boolean;
  /** On clear callback */
  onClear?: () => void;
  /** Variant style */
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
}

const sizeClasses = {
  xs: 'h-6 text-xs px-2',
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-base px-4',
  lg: 'h-12 text-lg px-4',
  xl: 'h-14 text-xl px-5',
};

const variantClasses = {
  outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
  filled: 'border-0 bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20',
  flushed: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-none bg-transparent focus:border-blue-500',
  unstyled: 'border-0 bg-transparent focus:ring-0',
};

export function Input(props: InputProps): JSX.Element {
  const {
    type = 'text',
    size = 'md',
    variant = 'outline',
    label,
    leftElement,
    rightElement,
    leftAddon,
    rightAddon,
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
    pattern,
    autocomplete,
    showCount = false,
    clearable = false,
    onChange,
    onBlur,
    onFocus,
    onClear,
    name,
    ariaLabel,
    ariaDescribedBy,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('input');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  // Internal state for uncontrolled mode
  const internalValue = signal(defaultValue);

  // Get current value (controlled or uncontrolled)
  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  // Handle input change
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;

    if (value === undefined) {
      internalValue.set(newValue);
    }
    onChange?.(newValue);
  };

  // Handle clear
  const handleClear = () => {
    if (value === undefined) {
      internalValue.set('');
    }
    onChange?.('');
    onClear?.();
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<string | boolean>);
  const errorMessage = typeof getValue(error as MaybeSignal<string | boolean>) === 'string'
    ? getValue(error as MaybeSignal<string>)
    : undefined;

  const inputClasses = cn(
    'w-full rounded-md transition-colors duration-200',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'focus:outline-none',
    sizeClasses[size],
    variantClasses[variant],
    // Error state
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20',
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
    // With addons
    leftElement && 'pl-10',
    rightElement && 'pr-10',
    (clearable && getCurrentValue()) && 'pr-10',
    leftAddon && 'rounded-l-none',
    rightAddon && 'rounded-r-none',
    className
  );

  const inputElement = jsx('input', {
    type,
    id,
    name,
    class: inputClasses,
    value: getCurrentValue(),
    placeholder,
    disabled: isDisabled,
    readonly,
    required,
    maxlength: maxLength,
    minlength: minLength,
    pattern,
    autocomplete,
    'aria-label': ariaLabel || label,
    'aria-describedby': cn(helperText && helperId, hasError && errorId, ariaDescribedBy),
    'aria-invalid': hasError,
    'aria-required': required,
    'data-testid': testId,
    oninput: handleInput,
    onblur: onBlur,
    onfocus: onFocus,
    ...rest,
  });

  // Build the complete input group
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

  // Input wrapper with addons and elements
  const inputWrapperChildren: JSX.Element[] = [];

  if (leftAddon) {
    inputWrapperChildren.push(
      jsx('span', {
        class: cn(
          'inline-flex items-center px-3 rounded-l-md border border-r-0',
          'border-gray-300 dark:border-gray-600',
          'bg-gray-50 dark:bg-gray-700',
          'text-gray-500 dark:text-gray-400',
          sizeClasses[size].split(' ').find(c => c.startsWith('text-'))
        ),
        children: leftAddon,
      })
    );
  }

  // Input container (for icons)
  const inputContainerChildren: JSX.Element[] = [];

  if (leftElement) {
    inputContainerChildren.push(
      jsx('div', {
        class: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400',
        children: typeof leftElement === 'function' ? leftElement() : leftElement,
      })
    );
  }

  inputContainerChildren.push(inputElement);

  if (rightElement) {
    inputContainerChildren.push(
      jsx('div', {
        class: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400',
        children: typeof rightElement === 'function' ? rightElement() : rightElement,
      })
    );
  }

  if (clearable && getCurrentValue()) {
    inputContainerChildren.push(
      jsx('button', {
        type: 'button',
        class: cn(
          'absolute inset-y-0 right-0 flex items-center pr-3',
          'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
          'focus:outline-none'
        ),
        onclick: handleClear,
        'aria-label': 'Clear input',
        children: jsx('svg', {
          class: 'w-4 h-4',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          children: jsx('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M6 18L18 6M6 6l12 12',
          }),
        }),
      })
    );
  }

  inputWrapperChildren.push(
    jsx('div', {
      class: 'relative flex-1',
      children: inputContainerChildren,
    })
  );

  if (rightAddon) {
    inputWrapperChildren.push(
      jsx('span', {
        class: cn(
          'inline-flex items-center px-3 rounded-r-md border border-l-0',
          'border-gray-300 dark:border-gray-600',
          'bg-gray-50 dark:bg-gray-700',
          'text-gray-500 dark:text-gray-400',
          sizeClasses[size].split(' ').find(c => c.startsWith('text-'))
        ),
        children: rightAddon,
      })
    );
  }

  children.push(
    jsx('div', {
      class: 'flex rounded-md shadow-sm',
      children: inputWrapperChildren,
    })
  );

  // Helper text and character count
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
