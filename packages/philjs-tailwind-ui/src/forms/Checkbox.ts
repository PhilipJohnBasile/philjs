/**
 * Checkbox Component
 * Checkbox input with label and group support
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, DisableableProps, Size, MaybeSignal } from '../types.js';

export interface CheckboxProps extends BaseProps, DisableableProps {
  /** Checkbox label */
  label?: string | JSX.Element;
  /** Checkbox description */
  description?: string;
  /** Whether checked */
  checked?: boolean | MaybeSignal<boolean>;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Value for form submission */
  value?: string;
  /** Name for form submission */
  name?: string;
  /** Required field */
  required?: boolean;
  /** Error state */
  error?: boolean | string | MaybeSignal<boolean | string>;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Aria label */
  ariaLabel?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const labelSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const colorClasses = {
  primary: 'text-blue-600 focus:ring-blue-500 dark:text-blue-500',
  success: 'text-green-600 focus:ring-green-500 dark:text-green-500',
  warning: 'text-yellow-600 focus:ring-yellow-500 dark:text-yellow-500',
  error: 'text-red-600 focus:ring-red-500 dark:text-red-500',
};

export function Checkbox(props: CheckboxProps): JSX.Element {
  const {
    label,
    description,
    checked,
    defaultChecked = false,
    indeterminate = false,
    size = 'md',
    color = 'primary',
    value,
    name,
    required,
    disabled,
    error,
    onChange,
    ariaLabel,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('checkbox');

  // Internal state
  const internalChecked = signal(defaultChecked);

  const isChecked = () => checked !== undefined ? getValue(checked) : internalChecked();

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newChecked = target.checked;

    if (checked === undefined) {
      internalChecked.set(newChecked);
    }
    onChange?.(newChecked);
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<boolean | string>);
  const errorMessage = typeof getValue(error as MaybeSignal<boolean | string>) === 'string'
    ? getValue(error as MaybeSignal<string>)
    : undefined;

  const checkboxClasses = cn(
    'rounded border-gray-300 dark:border-gray-600',
    'bg-white dark:bg-gray-800',
    'focus:ring-2 focus:ring-offset-0',
    'transition-colors duration-200',
    sizeClasses[size],
    colorClasses[color],
    // Error state
    hasError && 'border-red-500 dark:border-red-400',
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const labelClasses = cn(
    'font-medium',
    'text-gray-700 dark:text-gray-300',
    labelSizeClasses[size],
    isDisabled && 'opacity-50 cursor-not-allowed'
  );

  const wrapperClasses = cn(
    'inline-flex items-start gap-2',
    !isDisabled && 'cursor-pointer'
  );

  const children: JSX.Element[] = [
    jsx('input', {
      type: 'checkbox',
      id,
      name,
      value,
      class: checkboxClasses,
      checked: isChecked(),
      disabled: isDisabled,
      required,
      indeterminate,
      'aria-label': ariaLabel || (typeof label === 'string' ? label : undefined),
      'aria-invalid': hasError,
      'aria-describedby': description ? `${id}-description` : undefined,
      'data-testid': testId,
      onchange: handleChange,
      ...rest,
    }),
  ];

  if (label || description) {
    const labelContent: JSX.Element[] = [];

    if (label) {
      labelContent.push(
        jsx('span', {
          class: labelClasses,
          children: label,
        })
      );
    }

    if (description) {
      labelContent.push(
        jsx('span', {
          id: `${id}-description`,
          class: 'block text-sm text-gray-500 dark:text-gray-400 mt-0.5',
          children: description,
        })
      );
    }

    children.push(
      jsx('div', {
        class: 'flex flex-col',
        children: labelContent,
      })
    );
  }

  const result = jsx('label', {
    for: id,
    class: wrapperClasses,
    children,
  });

  if (hasError && errorMessage) {
    return jsx('div', {
      children: [
        result,
        jsx('p', {
          class: 'text-sm text-red-500 dark:text-red-400 mt-1 ml-7',
          role: 'alert',
          children: errorMessage,
        }),
      ],
    });
  }

  return result;
}

// Checkbox Group Component
export interface CheckboxGroupProps extends BaseProps {
  /** Group label */
  label?: string;
  /** Checkbox options */
  options: Array<{
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
  }>;
  /** Selected values */
  value?: string[] | MaybeSignal<string[]>;
  /** Default selected values */
  defaultValue?: string[];
  /** Name for form submission */
  name?: string;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Change handler */
  onChange?: (values: string[]) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean | string;
}

export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
  const {
    label,
    options,
    value,
    defaultValue = [],
    name,
    size = 'md',
    color = 'primary',
    direction = 'vertical',
    onChange,
    disabled,
    error,
    class: className,
    id: providedId,
    testId,
  } = props;

  const id = providedId || generateId('checkbox-group');

  const internalValue = signal<string[]>(defaultValue);

  const getCurrentValue = (): string[] => value !== undefined ? getValue(value) : internalValue();

  const handleChange = (optionValue: string, checked: boolean) => {
    const current = getCurrentValue();
    const newValues = checked
      ? [...current, optionValue]
      : current.filter(v => v !== optionValue);

    if (value === undefined) {
      internalValue.set(newValues);
    }
    onChange?.(newValues);
  };

  const hasError = typeof error === 'string' || error === true;

  return jsx('fieldset', {
    id,
    class: className,
    'data-testid': testId,
    role: 'group',
    'aria-labelledby': label ? `${id}-label` : undefined,
    children: [
      label && jsx('legend', {
        id: `${id}-label`,
        class: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
        children: label,
      }),
      jsx('div', {
        class: cn(
          'flex gap-3',
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        ),
        children: options.map(option =>
          Checkbox({
            label: option.label,
            description: option.description,
            value: option.value,
            name,
            size,
            color,
            checked: getCurrentValue().includes(option.value),
            disabled: disabled || option.disabled,
            onChange: (checked) => handleChange(option.value, checked),
          })
        ),
      }),
      hasError && typeof error === 'string' && jsx('p', {
        class: 'text-sm text-red-500 dark:text-red-400 mt-2',
        role: 'alert',
        children: error,
      }),
    ],
  });
}
