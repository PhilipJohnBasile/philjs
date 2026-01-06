/**
 * DatePicker Component
 * Date selection input with calendar popup
 */

import { jsx, signal, effect } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { InputLikeProps, Size, MaybeSignal } from '../types.js';

export interface DatePickerProps extends Omit<InputLikeProps<Date | null>, 'value'> {
  /** Current date value */
  value?: Date | null | MaybeSignal<Date | null>;
  /** Default date */
  defaultValue?: Date | null;
  /** Size variant */
  size?: Size;
  /** Label */
  label?: string;
  /** Minimum date */
  minDate?: Date;
  /** Maximum date */
  maxDate?: Date;
  /** Date format for display */
  format?: string;
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;
  /** Disabled dates */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** Show today button */
  showToday?: boolean;
  /** Show clear button */
  clearable?: boolean;
  /** Variant style */
  variant?: 'outline' | 'filled' | 'flushed';
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
};

// Simple date formatter
function formatDate(date: Date | null, format = 'yyyy-MM-dd'): string {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day);
}

// Parse date string
function parseDate(str: string): Date | null {
  if (!str) return null;
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export function DatePicker(props: DatePickerProps): JSX.Element {
  const {
    value,
    defaultValue = null,
    size = 'md',
    variant = 'outline',
    label,
    placeholder = 'Select date',
    disabled,
    readonly,
    required,
    error,
    helperText,
    minDate,
    maxDate,
    format = 'yyyy-MM-dd',
    firstDayOfWeek = 0,
    disabledDates,
    showToday = true,
    clearable = true,
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

  const id = providedId || generateId('datepicker');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  // Internal state
  const internalValue = signal<Date | null>(defaultValue);
  const isOpen = signal(false);
  const viewDate = signal(defaultValue || new Date());

  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const parsed = parseDate(target.value);

    if (parsed && isValidDate(parsed)) {
      if (value === undefined) {
        internalValue.set(parsed);
      }
      onChange?.(parsed);
      viewDate.set(parsed);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (value === undefined) {
      internalValue.set(date);
    }
    onChange?.(date);
    isOpen.set(false);
  };

  const handleClear = () => {
    if (value === undefined) {
      internalValue.set(null);
    }
    onChange?.(null);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    handleDateSelect(today);
  };

  const isValidDate = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    if (disabledDates) {
      if (typeof disabledDates === 'function') {
        return !disabledDates(date);
      }
      return !disabledDates.some(d =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    }
    return true;
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
    'pr-10', // Space for calendar icon
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20',
    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
    className
  );

  // Build calendar grid
  const buildCalendarDays = (): JSX.Element[] => {
    const current = viewDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startPadding = (firstDay.getDay() - firstDayOfWeek + 7) % 7;
    const days: JSX.Element[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(createDayButton(date, true));
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(createDayButton(date, false));
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(createDayButton(date, true));
    }

    return days;
  };

  const createDayButton = (date: Date, isOutside: boolean): JSX.Element => {
    const currentValue = getCurrentValue();
    const isSelected = currentValue &&
      date.getFullYear() === currentValue.getFullYear() &&
      date.getMonth() === currentValue.getMonth() &&
      date.getDate() === currentValue.getDate();

    const isToday = new Date().toDateString() === date.toDateString();
    const isDateDisabled = !isValidDate(date);

    return jsx('button', {
      type: 'button',
      class: cn(
        'w-8 h-8 rounded-md text-sm',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        isOutside && 'text-gray-400 dark:text-gray-600',
        !isOutside && 'text-gray-700 dark:text-gray-300',
        isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
        !isSelected && !isDateDisabled && 'hover:bg-gray-100 dark:hover:bg-gray-700',
        isToday && !isSelected && 'border border-blue-500',
        isDateDisabled && 'opacity-50 cursor-not-allowed'
      ),
      disabled: isDateDisabled,
      onclick: () => !isDateDisabled && handleDateSelect(date),
      children: date.getDate(),
    });
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const orderedWeekDays = [...weekDays.slice(firstDayOfWeek), ...weekDays.slice(0, firstDayOfWeek)];

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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

  // Input wrapper
  children.push(
    jsx('div', {
      class: 'relative',
      children: [
        jsx('input', {
          type: 'date',
          id,
          name,
          class: inputClasses,
          value: formatDate(getCurrentValue()),
          placeholder,
          disabled: isDisabled,
          readonly,
          required,
          min: minDate ? formatDate(minDate) : undefined,
          max: maxDate ? formatDate(maxDate) : undefined,
          'aria-label': ariaLabel || label,
          'aria-describedby': cn(helperText && helperId, hasError && errorId, ariaDescribedBy),
          'aria-invalid': hasError,
          'data-testid': testId,
          onchange: handleInputChange,
          onblur: onBlur,
          onfocus: onFocus,
          ...rest,
        }),
        // Calendar icon
        jsx('div', {
          class: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400',
          children: jsx('svg', {
            class: 'w-5 h-5',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jsx('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
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

// Time Picker Component
export interface TimePickerProps extends Omit<InputLikeProps<string>, 'value'> {
  /** Current time value (HH:mm format) */
  value?: string | MaybeSignal<string>;
  /** Default time */
  defaultValue?: string;
  /** Size variant */
  size?: Size;
  /** Label */
  label?: string;
  /** Minimum time */
  minTime?: string;
  /** Maximum time */
  maxTime?: string;
  /** Step in seconds */
  step?: number;
  /** 12 or 24 hour format */
  hourFormat?: 12 | 24;
  /** Variant style */
  variant?: 'outline' | 'filled' | 'flushed';
}

export function TimePicker(props: TimePickerProps): JSX.Element {
  const {
    value,
    defaultValue = '',
    size = 'md',
    variant = 'outline',
    label,
    placeholder = 'Select time',
    disabled,
    readonly,
    required,
    error,
    helperText,
    minTime,
    maxTime,
    step = 60,
    hourFormat = 24,
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

  const id = providedId || generateId('timepicker');
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const internalValue = signal(defaultValue);

  const getCurrentValue = () => value !== undefined ? getValue(value) : internalValue();

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;

    if (value === undefined) {
      internalValue.set(newValue);
    }
    onChange?.(newValue);
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
    'pr-10',
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20',
    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
    className
  );

  const children: JSX.Element[] = [];

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

  children.push(
    jsx('div', {
      class: 'relative',
      children: [
        jsx('input', {
          type: 'time',
          id,
          name,
          class: inputClasses,
          value: getCurrentValue(),
          placeholder,
          disabled: isDisabled,
          readonly,
          required,
          min: minTime,
          max: maxTime,
          step,
          'aria-label': ariaLabel || label,
          'aria-describedby': cn(helperText && helperId, hasError && errorId, ariaDescribedBy),
          'aria-invalid': hasError,
          'data-testid': testId,
          onchange: handleChange,
          onblur: onBlur,
          onfocus: onFocus,
          ...rest,
        }),
        jsx('div', {
          class: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400',
          children: jsx('svg', {
            class: 'w-5 h-5',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jsx('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            }),
          }),
        }),
      ],
    })
  );

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
