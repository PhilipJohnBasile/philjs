/**
 * Radio Component
 * Radio button input with group support
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, DisableableProps, Size, MaybeSignal } from '../types.js';

export interface RadioProps extends BaseProps, DisableableProps {
  /** Radio label */
  label?: string | JSX.Element;
  /** Radio description */
  description?: string;
  /** Whether checked */
  checked?: boolean | MaybeSignal<boolean>;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Value for form submission */
  value: string;
  /** Name for radio group */
  name: string;
  /** Required field */
  required?: boolean;
  /** Error state */
  error?: boolean | string | MaybeSignal<boolean | string>;
  /** Change handler */
  onChange?: (value: string) => void;
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

export function Radio(props: RadioProps): JSX.Element {
  const {
    label,
    description,
    checked,
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

  const id = providedId || generateId('radio');

  const isChecked = () => checked !== undefined ? getValue(checked) : false;

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      onChange?.(value);
    }
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const hasError = !!getValue(error as MaybeSignal<boolean | string>);

  const radioClasses = cn(
    'border-gray-300 dark:border-gray-600',
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
      type: 'radio',
      id,
      name,
      value,
      class: radioClasses,
      checked: isChecked(),
      disabled: isDisabled,
      required,
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

  return jsx('label', {
    for: id,
    class: wrapperClasses,
    children,
  });
}

// Radio Group Component
export interface RadioGroupProps extends BaseProps {
  /** Group label */
  label?: string;
  /** Radio options */
  options: Array<{
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
  }>;
  /** Selected value */
  value?: string | MaybeSignal<string>;
  /** Default selected value */
  defaultValue?: string;
  /** Name for form submission */
  name: string;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Change handler */
  onChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Error state */
  error?: boolean | string;
}

export function RadioGroup(props: RadioGroupProps): JSX.Element {
  const {
    label,
    options,
    value,
    defaultValue,
    name,
    size = 'md',
    color = 'primary',
    direction = 'vertical',
    onChange,
    disabled,
    required,
    error,
    class: className,
    id: providedId,
    testId,
  } = props;

  const id = providedId || generateId('radio-group');

  const internalValue = signal<string | undefined>(defaultValue);

  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  const handleChange = (optionValue: string) => {
    if (value === undefined) {
      internalValue.set(optionValue);
    }
    onChange?.(optionValue);
  };

  const hasError = typeof error === 'string' || error === true;

  return jsx('fieldset', {
    id,
    class: className,
    'data-testid': testId,
    role: 'radiogroup',
    'aria-labelledby': label ? `${id}-label` : undefined,
    'aria-required': required,
    children: [
      label && jsx('legend', {
        id: `${id}-label`,
        class: cn(
          'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        ),
        children: label,
      }),
      jsx('div', {
        class: cn(
          'flex gap-3',
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        ),
        children: options.map(option =>
          Radio({
            label: option.label,
            description: option.description,
            value: option.value,
            name,
            size,
            color,
            checked: getCurrentValue() === option.value,
            disabled: disabled || option.disabled,
            required,
            onChange: handleChange,
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
