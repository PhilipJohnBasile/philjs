/**
 * Select Component
 * Dropdown select input with support for groups and custom rendering
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { InputLikeProps, Size, MaybeSignal, SelectOption } from '../types.js';

export interface SelectProps<T = string> extends Omit<InputLikeProps<T>, 'value'> {
  /** Select options */
  options: SelectOption<T>[];
  /** Currently selected value */
  value?: T | MaybeSignal<T>;
  /** Size variant */
  size?: Size;
  /** Input label */
  label?: string;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Searchable/filterable */
  searchable?: boolean;
  /** Clearable selection */
  clearable?: boolean;
  /** Variant style */
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Group options by this key */
  groupBy?: string;
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

export function Select<T = string>(props: SelectProps<T>): JSX.Element {
  const {
    options,
    size = 'md',
    variant = 'outline',
    label,
    value,
    defaultValue,
    placeholder = 'Select an option',
    disabled,
    readonly,
    required,
    error,
    helperText,
    multiple = false,
    searchable = false,
    clearable = false,
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

  const id = providedId || generateId('select');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  // Internal state
  const internalValue = signal<T | undefined>(defaultValue);

  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const selectedValue = target.value as unknown as T;

    if (value === undefined) {
      internalValue.set(selectedValue);
    }
    onChange?.(selectedValue);
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<string | boolean>);
  const errorMessage = typeof getValue(error as MaybeSignal<string | boolean>) === 'string'
    ? getValue(error as MaybeSignal<string>)
    : undefined;

  const selectClasses = cn(
    'w-full rounded-md transition-colors duration-200 appearance-none cursor-pointer',
    'bg-no-repeat bg-right',
    'focus:outline-none',
    sizeClasses[size],
    variantClasses[variant],
    // Dropdown arrow
    'pr-10',
    // Error state
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20',
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
    className
  );

  // Group options by category if specified
  const groupedOptions = new Map<string, SelectOption<T>[]>();
  const ungroupedOptions: SelectOption<T>[] = [];

  options.forEach(option => {
    if (option.group) {
      if (!groupedOptions.has(option.group)) {
        groupedOptions.set(option.group, []);
      }
      groupedOptions.get(option.group)!.push(option);
    } else {
      ungroupedOptions.push(option);
    }
  });

  const renderOption = (option: SelectOption<T>) =>
    jsx('option', {
      value: String(option.value),
      disabled: option.disabled,
      children: option.label,
    });

  const selectChildren: JSX.Element[] = [];

  // Placeholder option
  if (placeholder && !required) {
    selectChildren.push(
      jsx('option', {
        value: '',
        disabled: true,
        selected: !getCurrentValue(),
        children: placeholder,
      })
    );
  }

  // Ungrouped options
  ungroupedOptions.forEach(option => {
    selectChildren.push(renderOption(option));
  });

  // Grouped options
  groupedOptions.forEach((groupOptions, groupName) => {
    selectChildren.push(
      jsx('optgroup', {
        label: groupName,
        children: groupOptions.map(renderOption),
      })
    );
  });

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

  // Select wrapper for custom arrow
  children.push(
    jsx('div', {
      class: 'relative',
      children: [
        jsx('select', {
          id,
          name,
          class: selectClasses,
          value: String(getCurrentValue() ?? ''),
          disabled: isDisabled,
          required,
          multiple,
          'aria-label': ariaLabel || label,
          'aria-describedby': cn(helperText && helperId, hasError && errorId, ariaDescribedBy),
          'aria-invalid': hasError,
          'aria-required': required,
          'data-testid': testId,
          onchange: handleChange,
          onblur: onBlur,
          onfocus: onFocus,
          ...rest,
          children: selectChildren,
        }),
        // Custom dropdown arrow
        jsx('div', {
          class: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400',
          children: jsx('svg', {
            class: 'w-4 h-4',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jsx('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M19 9l-7 7-7-7',
            }),
          }),
        }),
      ],
    })
  );

  // Helper text and error
  if (helperText && !hasError) {
    children.push(
      jsx('p', {
        id: helperId,
        class: 'text-sm text-gray-500 dark:text-gray-400 mt-1.5',
        children: helperText,
      })
    );
  }

  if (hasError && errorMessage) {
    children.push(
      jsx('p', {
        id: errorId,
        class: 'text-sm text-red-500 dark:text-red-400 mt-1.5',
        role: 'alert',
        children: errorMessage,
      })
    );
  }

  return jsx('div', {
    class: 'w-full',
    children,
  });
}
