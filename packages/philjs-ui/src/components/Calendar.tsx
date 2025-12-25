/**
 * PhilJS UI - Calendar & DatePicker Components
 *
 * Full-featured calendar with date selection, range selection,
 * and date picker dropdown.
 */

import { signal, effect, memo } from 'philjs-core';

export interface CalendarProps {
  value?: Date;
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumbers?: boolean;
  showOutsideDays?: boolean;
  numberOfMonths?: number;
  onChange?: (date: Date) => void;
  className?: string;
}

const DAYS_IN_WEEK = 7;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinRange(date: Date, min?: Date, max?: Date): boolean {
  if (min && date < min) return false;
  if (max && date > max) return false;
  return true;
}

export function Calendar(props: CalendarProps) {
  const {
    value,
    defaultValue,
    minDate,
    maxDate,
    disabledDates,
    locale = 'en-US',
    weekStartsOn = 0,
    showWeekNumbers = false,
    showOutsideDays = true,
    numberOfMonths = 1,
    onChange,
    className = '',
  } = props;

  const selectedDate = signal<Date | undefined>(value ?? defaultValue);
  const viewDate = signal(value ?? defaultValue ?? new Date());

  effect(() => {
    if (value) {
      selectedDate.set(value);
      viewDate.set(value);
    }
  });

  const isDisabled = (date: Date): boolean => {
    if (!isWithinRange(date, minDate, maxDate)) return true;
    if (typeof disabledDates === 'function') return disabledDates(date);
    if (Array.isArray(disabledDates)) {
      return disabledDates.some(d => isSameDay(d, date));
    }
    return false;
  };

  const handleSelect = (date: Date) => {
    if (isDisabled(date)) return;
    selectedDate.set(date);
    onChange?.(date);
  };

  const handlePrevMonth = () => {
    const current = viewDate();
    viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const current = viewDate();
    viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    const current = viewDate();
    viewDate.set(new Date(current.getFullYear() - 1, current.getMonth(), 1));
  };

  const handleNextYear = () => {
    const current = viewDate();
    viewDate.set(new Date(current.getFullYear() + 1, current.getMonth(), 1));
  };

  const weekDays = memo(() => {
    const days = [];
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      const dayIndex = (weekStartsOn + i) % DAYS_IN_WEEK;
      const date = new Date(2021, 0, 3 + dayIndex); // Sunday = Jan 3, 2021
      days.push(date.toLocaleDateString(locale, { weekday: 'short' }));
    }
    return days;
  });

  const renderMonth = (monthOffset: number) => {
    const current = viewDate();
    const year = current.getFullYear();
    const month = current.getMonth() + monthOffset;
    const adjustedDate = new Date(year, month, 1);
    const adjustedYear = adjustedDate.getFullYear();
    const adjustedMonth = adjustedDate.getMonth();

    const daysInMonth = getDaysInMonth(adjustedYear, adjustedMonth);
    const firstDay = getFirstDayOfMonth(adjustedYear, adjustedMonth);
    const startOffset = (firstDay - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK;

    const prevMonthDays = getDaysInMonth(adjustedYear, adjustedMonth - 1);
    const totalCells = Math.ceil((startOffset + daysInMonth) / DAYS_IN_WEEK) * DAYS_IN_WEEK;

    const days: { date: Date; isOutside: boolean }[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(adjustedYear, adjustedMonth - 1, prevMonthDays - i),
        isOutside: true,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(adjustedYear, adjustedMonth, i),
        isOutside: false,
      });
    }

    // Next month days
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(adjustedYear, adjustedMonth + 1, i),
        isOutside: true,
      });
    }

    const weeks: { date: Date; isOutside: boolean }[][] = [];
    for (let i = 0; i < days.length; i += DAYS_IN_WEEK) {
      weeks.push(days.slice(i, i + DAYS_IN_WEEK));
    }

    return (
      <div key={monthOffset} className="p-3">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevYear}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Previous year"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                  <path d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
            </div>
          )}

          <div className="font-semibold text-gray-900">
            {MONTHS[adjustedMonth]} {adjustedYear}
          </div>

          {monthOffset === numberOfMonths - 1 && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Next year"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                  <path d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {showWeekNumbers && <div className="w-8" />}
          {weekDays().map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {showWeekNumbers && (
                <div className="w-8 text-center text-xs text-gray-400 flex items-center justify-center">
                  {getWeekNumber(week[0].date)}
                </div>
              )}
              {week.map((day, dayIndex) => {
                const isSelected = selectedDate() && isSameDay(day.date, selectedDate()!);
                const isToday = isSameDay(day.date, new Date());
                const disabled = isDisabled(day.date);

                if (day.isOutside && !showOutsideDays) {
                  return <div key={dayIndex} className="w-8 h-8" />;
                }

                return (
                  <button
                    key={dayIndex}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(day.date)}
                    className={`
                      w-8 h-8 text-sm rounded-full
                      flex items-center justify-center
                      transition-colors
                      ${day.isOutside ? 'text-gray-300' : 'text-gray-900'}
                      ${isToday && !isSelected ? 'font-bold text-blue-600' : ''}
                      ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`inline-block bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className={`flex ${numberOfMonths > 1 ? 'divide-x' : ''}`}>
        {Array.from({ length: numberOfMonths }).map((_, i) => renderMonth(i))}
      </div>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * DatePicker - Calendar in a dropdown
 */
export interface DatePickerProps extends Omit<CalendarProps, 'className'> {
  placeholder?: string;
  format?: string | ((date: Date) => string);
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  label?: string;
  className?: string;
}

export function DatePicker(props: DatePickerProps) {
  const {
    value,
    defaultValue,
    placeholder = 'Select date',
    format,
    clearable = true,
    disabled = false,
    error = false,
    label,
    onChange,
    className = '',
    ...calendarProps
  } = props;

  const isOpen = signal(false);
  const selectedDate = signal<Date | undefined>(value ?? defaultValue);

  effect(() => {
    if (value !== undefined) {
      selectedDate.set(value);
    }
  });

  const formatDate = (date: Date): string => {
    if (typeof format === 'function') return format(date);
    if (format) {
      // Simple format replacement
      return format
        .replace('yyyy', String(date.getFullYear()))
        .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('dd', String(date.getDate()).padStart(2, '0'));
    }
    return date.toLocaleDateString();
  };

  const handleSelect = (date: Date) => {
    selectedDate.set(date);
    onChange?.(date);
    isOpen.set(false);
  };

  const handleClear = (e: Event) => {
    e.stopPropagation();
    selectedDate.set(undefined);
    onChange?.(undefined as any);
  };

  const hasError = Boolean(error);

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          w-full h-10 px-4 border rounded-md bg-white
          flex items-center justify-between gap-2
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !disabled && isOpen.set(!isOpen())}
      >
        <span className={selectedDate() ? '' : 'text-gray-400'}>
          {selectedDate() ? formatDate(selectedDate()!) : placeholder}
        </span>

        <div className="flex items-center gap-1">
          {clearable && selectedDate() && !disabled && (
            <button
              type="button"
              className="p-1 hover:bg-gray-100 rounded"
              onClick={handleClear}
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {typeof error === 'string' && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen() && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => isOpen.set(false)} />
          <div className="absolute z-50 mt-1">
            <Calendar
              {...calendarProps}
              value={selectedDate()}
              onChange={handleSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * DateRangePicker - Select a date range
 */
export interface DateRangePickerProps extends Omit<CalendarProps, 'value' | 'defaultValue' | 'onChange'> {
  value?: [Date, Date];
  defaultValue?: [Date, Date];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  label?: string;
  onChange?: (range: [Date, Date] | undefined) => void;
  className?: string;
}

export function DateRangePicker(props: DateRangePickerProps) {
  const {
    value,
    defaultValue,
    placeholder = 'Select date range',
    disabled = false,
    error = false,
    label,
    onChange,
    className = '',
    ...calendarProps
  } = props;

  const isOpen = signal(false);
  const range = signal<[Date | undefined, Date | undefined]>(value ?? defaultValue ?? [undefined, undefined]);
  const selectingEnd = signal(false);

  effect(() => {
    if (value) {
      range.set(value);
    }
  });

  const handleSelect = (date: Date) => {
    const [start, end] = range();

    if (!selectingEnd() || !start) {
      range.set([date, undefined]);
      selectingEnd.set(true);
    } else {
      const newRange: [Date, Date] = date < start ? [date, start] : [start, date];
      range.set(newRange);
      selectingEnd.set(false);
      onChange?.(newRange);
      isOpen.set(false);
    }
  };

  const formatRange = (): string => {
    const [start, end] = range();
    if (!start) return '';
    if (!end) return start.toLocaleDateString();
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const hasError = Boolean(error);

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          w-full h-10 px-4 border rounded-md bg-white
          flex items-center justify-between gap-2
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !disabled && isOpen.set(!isOpen())}
      >
        <span className={range()[0] ? '' : 'text-gray-400'}>
          {formatRange() || placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>

      {typeof error === 'string' && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen() && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => isOpen.set(false)} />
          <div className="absolute z-50 mt-1">
            <Calendar
              {...calendarProps}
              numberOfMonths={2}
              onChange={handleSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}
