/**
 * Switch Component
 * Toggle switch for boolean values
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, DisableableProps, Size, MaybeSignal } from '../types.js';

export interface SwitchProps extends BaseProps, DisableableProps {
  /** Switch label */
  label?: string | JSX.Element;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Switch description */
  description?: string;
  /** Whether checked/on */
  checked?: boolean | MaybeSignal<boolean>;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Size variant */
  size?: Size;
  /** Color variant when on */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Name for form submission */
  name?: string;
  /** Value for form submission */
  value?: string;
  /** Required field */
  required?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Aria label */
  ariaLabel?: string;
}

const trackSizeClasses = {
  xs: 'w-6 h-3',
  sm: 'w-8 h-4',
  md: 'w-11 h-6',
  lg: 'w-14 h-7',
  xl: 'w-16 h-8',
};

const thumbSizeClasses = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const thumbTranslateClasses = {
  xs: 'translate-x-3',
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-7',
  xl: 'translate-x-8',
};

const labelSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const colorClasses = {
  primary: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  error: 'bg-red-600 dark:bg-red-500',
};

const focusColorClasses = {
  primary: 'peer-focus:ring-blue-500/20',
  success: 'peer-focus:ring-green-500/20',
  warning: 'peer-focus:ring-yellow-500/20',
  error: 'peer-focus:ring-red-500/20',
};

export function Switch(props: SwitchProps): JSX.Element {
  const {
    label,
    labelPosition = 'right',
    description,
    checked,
    defaultChecked = false,
    size = 'md',
    color = 'primary',
    name,
    value,
    required,
    disabled,
    onChange,
    ariaLabel,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('switch');

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

  // Hidden input for form submission
  const input = jsx('input', {
    type: 'checkbox',
    id,
    name,
    value,
    class: 'peer sr-only',
    checked: isChecked(),
    disabled: isDisabled,
    required,
    role: 'switch',
    'aria-checked': isChecked(),
    'aria-label': ariaLabel || (typeof label === 'string' ? label : undefined),
    'aria-describedby': description ? `${id}-description` : undefined,
    'data-testid': testId,
    onchange: handleChange,
    ...rest,
  });

  // Track (background)
  const track = jsx('div', {
    class: cn(
      'relative rounded-full transition-colors duration-200',
      'bg-gray-200 dark:bg-gray-700',
      'peer-focus:ring-4',
      trackSizeClasses[size],
      // Checked state color
      isChecked() && colorClasses[color],
      focusColorClasses[color],
      // Disabled state
      isDisabled && 'opacity-50 cursor-not-allowed'
    ),
    children: jsx('div', {
      class: cn(
        'absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm',
        'transition-transform duration-200',
        thumbSizeClasses[size],
        isChecked() && thumbTranslateClasses[size]
      ),
    }),
  });

  const labelClasses = cn(
    'font-medium',
    'text-gray-700 dark:text-gray-300',
    labelSizeClasses[size],
    isDisabled && 'opacity-50 cursor-not-allowed'
  );

  const switchElement = jsx('div', {
    class: 'relative inline-flex items-center',
    children: [input, track],
  });

  // With label
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

    const labelElement = jsx('div', {
      class: 'flex flex-col',
      children: labelContent,
    });

    return jsx('label', {
      for: id,
      class: cn(
        'inline-flex items-start gap-3',
        !isDisabled && 'cursor-pointer',
        className
      ),
      children: labelPosition === 'left'
        ? [labelElement, switchElement]
        : [switchElement, labelElement],
    });
  }

  return jsx('label', {
    for: id,
    class: cn(
      'inline-flex items-center',
      !isDisabled && 'cursor-pointer',
      className
    ),
    children: switchElement,
  });
}
