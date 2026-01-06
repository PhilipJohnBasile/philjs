/**
 * ButtonGroup Component
 * Group of buttons with shared styling
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Size, ColorVariant, ButtonVariant } from '../types.js';

export interface ButtonGroupProps extends BaseProps, WithChildren {
  /** Size for all buttons in the group */
  size?: Size;
  /** Color for all buttons */
  color?: ColorVariant;
  /** Variant for all buttons */
  variant?: ButtonVariant;
  /** Stack buttons vertically */
  vertical?: boolean;
  /** Attach buttons together (no gaps) */
  attached?: boolean;
  /** Full width group */
  fullWidth?: boolean;
  /** Spacing between buttons (when not attached) */
  spacing?: 0 | 1 | 2 | 3 | 4;
  /** Disabled state for all buttons */
  disabled?: boolean;
}

const spacingClasses = {
  horizontal: {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  },
  vertical: {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  },
};

export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const {
    size = 'md',
    color = 'primary',
    variant = 'solid',
    vertical = false,
    attached = false,
    fullWidth = false,
    spacing = 0,
    disabled = false,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const groupClasses = cn(
    'inline-flex',
    vertical ? 'flex-col' : 'flex-row',
    fullWidth && 'w-full',

    // Spacing when not attached
    !attached && spacingClasses[vertical ? 'vertical' : 'horizontal'][spacing],

    // Attached styling
    attached && [
      // Remove inner border radius
      '[&>*:not(:first-child):not(:last-child)]:rounded-none',
      vertical
        ? [
            '[&>*:first-child]:rounded-b-none',
            '[&>*:last-child]:rounded-t-none',
            '[&>*:not(:first-child)]:border-t-0',
          ]
        : [
            '[&>*:first-child]:rounded-r-none',
            '[&>*:last-child]:rounded-l-none',
            '[&>*:not(:first-child)]:border-l-0',
          ],
    ],

    className
  );

  return jsx('div', {
    class: groupClasses,
    role: 'group',
    id,
    'data-testid': testId,
    // Pass props to children through data attributes for context
    'data-button-group-size': size,
    'data-button-group-color': color,
    'data-button-group-variant': variant,
    'data-button-group-disabled': disabled ? 'true' : undefined,
    ...rest,
    children,
  });
}

// Toggle Button Group (for single/multi selection)
export interface ToggleButtonGroupProps extends BaseProps {
  /** Options for toggle buttons */
  options: Array<{
    value: string;
    label: string | JSX.Element;
    disabled?: boolean;
  }>;
  /** Selected value(s) */
  value?: string | string[];
  /** Default selected value(s) */
  defaultValue?: string | string[];
  /** Allow multiple selection */
  multiple?: boolean;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: ColorVariant;
  /** Stack vertically */
  vertical?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Change handler */
  onChange?: (value: string | string[]) => void;
  /** Aria label for the group */
  ariaLabel?: string;
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps): JSX.Element {
  const {
    options,
    value,
    defaultValue,
    multiple = false,
    size = 'md',
    color = 'primary',
    vertical = false,
    fullWidth = false,
    disabled = false,
    onChange,
    ariaLabel,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  // Normalize value to array for easier handling
  const normalizeValue = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const currentValue = normalizeValue(value ?? defaultValue);

  const handleClick = (optionValue: string) => {
    if (disabled) return;

    let newValue: string | string[];

    if (multiple) {
      const values = [...currentValue];
      const index = values.indexOf(optionValue);
      if (index >= 0) {
        values.splice(index, 1);
      } else {
        values.push(optionValue);
      }
      newValue = values;
    } else {
      newValue = optionValue;
    }

    onChange?.(newValue);
  };

  const sizeClasses = {
    xs: 'h-6 text-xs px-2',
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-5',
    xl: 'h-14 text-lg px-6',
  };

  const getButtonClasses = (isSelected: boolean, isDisabled: boolean) =>
    cn(
      'inline-flex items-center justify-center font-medium',
      'border transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:z-10',
      sizeClasses[size],

      // Selected/unselected states
      isSelected
        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700',

      // Disabled
      isDisabled && 'opacity-50 cursor-not-allowed',

      // Full width
      fullWidth && 'flex-1'
    );

  const groupClasses = cn(
    'inline-flex',
    vertical ? 'flex-col' : 'flex-row',
    fullWidth && 'w-full',
    // Attached button styling
    '[&>button:not(:first-child):not(:last-child)]:rounded-none',
    vertical
      ? [
          '[&>button:first-child]:rounded-b-none',
          '[&>button:last-child]:rounded-t-none',
          '[&>button:not(:first-child)]:-mt-px',
        ]
      : [
          '[&>button:first-child]:rounded-r-none',
          '[&>button:last-child]:rounded-l-none',
          '[&>button:not(:first-child)]:-ml-px',
        ],
    '[&>button]:rounded-md',
    className
  );

  return jsx('div', {
    class: groupClasses,
    role: multiple ? 'group' : 'radiogroup',
    id,
    'data-testid': testId,
    'aria-label': ariaLabel,
    ...rest,
    children: options.map(option => {
      const isSelected = currentValue.includes(option.value);
      const isOptionDisabled = disabled || option.disabled;

      return jsx('button', {
        type: 'button',
        class: getButtonClasses(isSelected, isOptionDisabled || false),
        disabled: isOptionDisabled,
        role: multiple ? 'checkbox' : 'radio',
        'aria-checked': isSelected,
        'aria-pressed': isSelected,
        onclick: () => handleClick(option.value),
        children: option.label,
      });
    }),
  });
}
