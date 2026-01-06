/**
 * Slider Component
 * Range input with customizable track and thumb
 */

import { jsx, signal, memo } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, DisableableProps, Size, MaybeSignal } from '../types.js';

export interface SliderProps extends BaseProps, DisableableProps {
  /** Current value */
  value?: number | MaybeSignal<number>;
  /** Default value */
  defaultValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Label */
  label?: string;
  /** Show current value */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Show marks/ticks */
  marks?: boolean | number[] | { value: number; label?: string }[];
  /** Name for form submission */
  name?: string;
  /** Change handler */
  onChange?: (value: number) => void;
  /** Change end handler (on mouse up) */
  onChangeEnd?: (value: number) => void;
  /** Aria label */
  ariaLabel?: string;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

const trackSizeClasses = {
  horizontal: {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
    xl: 'h-3',
  },
  vertical: {
    xs: 'w-1',
    sm: 'w-1.5',
    md: 'w-2',
    lg: 'w-2.5',
    xl: 'w-3',
  },
};

const thumbSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const colorClasses = {
  primary: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  error: 'bg-red-600 dark:bg-red-500',
};

export function Slider(props: SliderProps): JSX.Element {
  const {
    value,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    size = 'md',
    color = 'primary',
    label,
    showValue = false,
    formatValue = (v) => String(v),
    showMinMax = false,
    marks = false,
    name,
    disabled,
    onChange,
    onChangeEnd,
    ariaLabel,
    orientation = 'horizontal',
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('slider');

  // Internal state
  const internalValue = signal(defaultValue);

  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    if (value === undefined) {
      internalValue.set(newValue);
    }
    onChange?.(newValue);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    onChangeEnd?.(newValue);
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const isVertical = orientation === 'vertical';

  // Calculate percentage for styling
  const percentage = memo(() => {
    const current = getCurrentValue();
    return ((current - min) / (max - min)) * 100;
  });

  const trackClasses = cn(
    'relative rounded-full',
    'bg-gray-200 dark:bg-gray-700',
    isVertical ? 'w-2 h-full' : 'w-full',
    trackSizeClasses[orientation][size]
  );

  const filledTrackClasses = cn(
    'absolute rounded-full',
    colorClasses[color],
    isVertical
      ? 'bottom-0 left-0 right-0'
      : 'top-0 bottom-0 left-0'
  );

  const thumbClasses = cn(
    'appearance-none cursor-pointer',
    'bg-white border-2 rounded-full shadow-md',
    'transition-transform duration-100',
    'hover:scale-110',
    'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
    thumbSizeClasses[size],
    isDisabled && 'cursor-not-allowed opacity-50'
  );

  // Generate marks if needed
  const markElements: JSX.Element[] = [];
  if (marks) {
    const markValues = Array.isArray(marks)
      ? marks.map(m => typeof m === 'number' ? { value: m } : m)
      : marks === true
        ? Array.from({ length: (max - min) / step + 1 }, (_, i) => ({ value: min + i * step }))
        : [];

    markValues.forEach(mark => {
      const markPercentage = ((mark.value - min) / (max - min)) * 100;
      markElements.push(
        jsx('div', {
          class: cn(
            'absolute',
            isVertical
              ? 'left-1/2 -translate-x-1/2 w-1 h-1'
              : 'top-1/2 -translate-y-1/2 w-1 h-1',
            'rounded-full bg-gray-400 dark:bg-gray-500'
          ),
          style: isVertical
            ? { bottom: `${markPercentage}%` }
            : { left: `${markPercentage}%` },
          children: mark.label && jsx('span', {
            class: cn(
              'absolute text-xs text-gray-500 dark:text-gray-400',
              isVertical ? 'left-4 -translate-y-1/2' : 'top-4 -translate-x-1/2'
            ),
            children: mark.label,
          }),
        })
      );
    });
  }

  const children: JSX.Element[] = [];

  // Header with label and value
  if (label || showValue) {
    children.push(
      jsx('div', {
        class: 'flex justify-between items-center mb-2',
        children: [
          label && jsx('label', {
            for: id,
            class: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            children: label,
          }),
          showValue && jsx('span', {
            class: 'text-sm text-gray-500 dark:text-gray-400',
            children: formatValue(getCurrentValue()),
          }),
        ],
      })
    );
  }

  // Slider track wrapper
  const sliderWrapper = jsx('div', {
    class: cn(
      'relative',
      isVertical ? 'h-full' : 'w-full'
    ),
    children: [
      // Track background
      jsx('div', {
        class: trackClasses,
        children: [
          // Filled track
          jsx('div', {
            class: filledTrackClasses,
            style: isVertical
              ? { height: `${percentage()}%` }
              : { width: `${percentage()}%` },
          }),
          // Marks
          ...markElements,
        ],
      }),
      // Native range input (positioned over track)
      jsx('input', {
        type: 'range',
        id,
        name,
        min,
        max,
        step,
        value: getCurrentValue(),
        disabled: isDisabled,
        class: cn(
          'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
          isDisabled && 'cursor-not-allowed',
          // For custom thumb styling, we use CSS custom properties
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:h-5'
        ),
        'aria-label': ariaLabel || label,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-valuenow': getCurrentValue(),
        'aria-orientation': orientation,
        'data-testid': testId,
        oninput: handleInput,
        onchange: handleChange,
        ...rest,
      }),
    ],
  });

  children.push(sliderWrapper);

  // Min/Max labels
  if (showMinMax) {
    children.push(
      jsx('div', {
        class: 'flex justify-between mt-1',
        children: [
          jsx('span', {
            class: 'text-xs text-gray-500 dark:text-gray-400',
            children: formatValue(min),
          }),
          jsx('span', {
            class: 'text-xs text-gray-500 dark:text-gray-400',
            children: formatValue(max),
          }),
        ],
      })
    );
  }

  return jsx('div', {
    class: cn(
      isVertical ? 'h-full' : 'w-full',
      className
    ),
    children,
  });
}

// Range Slider (dual handles)
export interface RangeSliderProps extends Omit<SliderProps, 'value' | 'defaultValue' | 'onChange' | 'onChangeEnd'> {
  /** Current range values [min, max] */
  value?: [number, number] | MaybeSignal<[number, number]>;
  /** Default range values */
  defaultValue?: [number, number];
  /** Change handler */
  onChange?: (value: [number, number]) => void;
  /** Change end handler */
  onChangeEnd?: (value: [number, number]) => void;
  /** Minimum gap between handles */
  minGap?: number;
}

export function RangeSlider(props: RangeSliderProps): JSX.Element {
  const {
    value,
    defaultValue = [25, 75],
    min = 0,
    max = 100,
    step = 1,
    minGap = 0,
    size = 'md',
    color = 'primary',
    label,
    showValue = false,
    formatValue = (v) => String(v),
    showMinMax = false,
    name,
    disabled,
    onChange,
    onChangeEnd,
    ariaLabel,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('range-slider');

  // Internal state
  const internalValue = signal<[number, number]>(defaultValue);

  const getCurrentValue = (): [number, number] =>
    value !== undefined ? getValue(value) : internalValue();

  const handleMinChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newMin = parseFloat(target.value);
    const [, currentMax] = getCurrentValue();

    if (newMin <= currentMax - minGap) {
      const newValue: [number, number] = [newMin, currentMax];
      if (value === undefined) {
        internalValue.set(newValue);
      }
      onChange?.(newValue);
    }
  };

  const handleMaxChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newMax = parseFloat(target.value);
    const [currentMin] = getCurrentValue();

    if (newMax >= currentMin + minGap) {
      const newValue: [number, number] = [currentMin, newMax];
      if (value === undefined) {
        internalValue.set(newValue);
      }
      onChange?.(newValue);
    }
  };

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const [minVal, maxVal] = getCurrentValue();
  const minPercentage = ((minVal - min) / (max - min)) * 100;
  const maxPercentage = ((maxVal - min) / (max - min)) * 100;

  const children: JSX.Element[] = [];

  // Header with label and value
  if (label || showValue) {
    children.push(
      jsx('div', {
        class: 'flex justify-between items-center mb-2',
        children: [
          label && jsx('label', {
            class: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            children: label,
          }),
          showValue && jsx('span', {
            class: 'text-sm text-gray-500 dark:text-gray-400',
            children: `${formatValue(minVal)} - ${formatValue(maxVal)}`,
          }),
        ],
      })
    );
  }

  // Slider track
  children.push(
    jsx('div', {
      class: 'relative h-2',
      'data-testid': testId,
      children: [
        // Track background
        jsx('div', {
          class: cn(
            'absolute w-full rounded-full',
            'bg-gray-200 dark:bg-gray-700',
            trackSizeClasses.horizontal[size]
          ),
        }),
        // Filled range
        jsx('div', {
          class: cn(
            'absolute rounded-full',
            colorClasses[color],
            trackSizeClasses.horizontal[size]
          ),
          style: {
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          },
        }),
        // Min input
        jsx('input', {
          type: 'range',
          name: name ? `${name}-min` : undefined,
          min,
          max,
          step,
          value: minVal,
          disabled: isDisabled,
          class: 'absolute w-full h-full opacity-0 cursor-pointer pointer-events-auto',
          'aria-label': `${ariaLabel || label || 'Range'} minimum`,
          oninput: handleMinChange,
          onchange: () => onChangeEnd?.(getCurrentValue()),
          ...rest,
        }),
        // Max input
        jsx('input', {
          type: 'range',
          name: name ? `${name}-max` : undefined,
          min,
          max,
          step,
          value: maxVal,
          disabled: isDisabled,
          class: 'absolute w-full h-full opacity-0 cursor-pointer pointer-events-auto',
          'aria-label': `${ariaLabel || label || 'Range'} maximum`,
          oninput: handleMaxChange,
          onchange: () => onChangeEnd?.(getCurrentValue()),
          ...rest,
        }),
      ],
    })
  );

  // Min/Max labels
  if (showMinMax) {
    children.push(
      jsx('div', {
        class: 'flex justify-between mt-1',
        children: [
          jsx('span', { class: 'text-xs text-gray-500 dark:text-gray-400', children: formatValue(min) }),
          jsx('span', { class: 'text-xs text-gray-500 dark:text-gray-400', children: formatValue(max) }),
        ],
      })
    );
  }

  return jsx('div', {
    id,
    class: cn('w-full', className),
    children,
  });
}
