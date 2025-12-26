// @ts-nocheck
/**
 * PhilJS UI - Slider Component
 *
 * Accessible range slider with single and dual thumb support,
 * step snapping, and vertical orientation.
 */

import { signal, effect, memo } from 'philjs-core';

export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderSize = 'sm' | 'md' | 'lg';

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: SliderOrientation;
  size?: SliderSize;
  showValue?: boolean;
  showMarks?: boolean;
  marks?: { value: number; label?: string }[];
  formatValue?: (value: number) => string;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  label?: string;
  'aria-label'?: string;
  className?: string;
}

const sizeStyles: Record<SliderSize, { track: string; thumb: string; height: string }> = {
  sm: { track: 'h-1', thumb: 'w-3 h-3', height: 'h-3' },
  md: { track: 'h-2', thumb: 'w-4 h-4', height: 'h-4' },
  lg: { track: 'h-3', thumb: 'w-5 h-5', height: 'h-5' },
};

export function Slider(props: SliderProps) {
  const {
    value,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    orientation = 'horizontal',
    size = 'md',
    showValue = false,
    showMarks = false,
    marks,
    formatValue = (v) => String(v),
    onChange,
    onChangeEnd,
    label,
    'aria-label': ariaLabel,
    className = '',
  } = props;

  const currentValue = signal(value ?? defaultValue);
  const isDragging = signal(false);
  const trackRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    if (value !== undefined) {
      currentValue.set(value);
    }
  });

  const percentage = memo(() => {
    return ((currentValue() - min) / (max - min)) * 100;
  });

  const snapToStep = (val: number): number => {
    const snapped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, snapped));
  };

  const getValueFromPosition = (clientX: number, clientY: number): number => {
    const track = trackRef();
    if (!track) return currentValue();

    const rect = track.getBoundingClientRect();
    let ratio: number;

    if (orientation === 'horizontal') {
      ratio = (clientX - rect.left) / rect.width;
    } else {
      ratio = 1 - (clientY - rect.top) / rect.height;
    }

    ratio = Math.max(0, Math.min(1, ratio));
    return snapToStep(min + ratio * (max - min));
  };

  const updateValue = (clientX: number, clientY: number) => {
    if (disabled) return;
    const newValue = getValueFromPosition(clientX, clientY);
    currentValue.set(newValue);
    onChange?.(newValue);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDragging.set(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging() || disabled) return;
    updateValue(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging()) return;
    isDragging.set(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onChangeEnd?.(currentValue());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    let newValue = currentValue();

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = snapToStep(currentValue() + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = snapToStep(currentValue() - step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      case 'PageUp':
        e.preventDefault();
        newValue = snapToStep(currentValue() + step * 10);
        break;
      case 'PageDown':
        e.preventDefault();
        newValue = snapToStep(currentValue() - step * 10);
        break;
      default:
        return;
    }

    currentValue.set(newValue);
    onChange?.(newValue);
    onChangeEnd?.(newValue);
  };

  const styles = sizeStyles[size];
  const isHorizontal = orientation === 'horizontal';

  const allMarks = marks || (showMarks ? [
    { value: min },
    { value: (min + max) / 2 },
    { value: max },
  ] : []);

  return (
    <div className={`${isHorizontal ? 'w-full' : 'h-48'} ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {showValue && (
            <span className="text-sm text-gray-500">{formatValue(currentValue())}</span>
          )}
        </div>
      )}

      <div
        className={`
          relative flex items-center
          ${isHorizontal ? 'w-full' : 'h-full flex-col justify-center'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Track Container */}
        <div
          ref={(el: HTMLDivElement) => trackRef.set(el)}
          className={`
            relative rounded-full bg-gray-200
            ${isHorizontal ? `w-full ${styles.track}` : `w-2 h-full`}
          `}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Filled Track */}
          <div
            className={`
              absolute rounded-full bg-blue-600
              ${isHorizontal ? `h-full left-0` : `w-full bottom-0`}
            `}
            style={isHorizontal
              ? { width: `${percentage()}%` }
              : { height: `${percentage()}%` }
            }
          />

          {/* Thumb */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel || label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={currentValue()}
            aria-disabled={disabled}
            className={`
              absolute ${styles.thumb}
              bg-white border-2 border-blue-600 rounded-full
              shadow-md transform -translate-x-1/2 -translate-y-1/2
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isDragging() ? 'scale-110' : ''}
              ${disabled ? '' : 'hover:scale-110'}
              transition-transform
            `}
            style={isHorizontal
              ? { left: `${percentage()}%`, top: '50%' }
              : { bottom: `${percentage()}%`, left: '50%', transform: 'translate(-50%, 50%)' }
            }
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Marks */}
        {allMarks.length > 0 && (
          <div
            className={`
              absolute ${isHorizontal ? 'w-full top-6' : 'h-full left-6'}
            `}
          >
            {allMarks.map(mark => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className={`
                    absolute text-xs text-gray-500
                    ${isHorizontal ? '-translate-x-1/2' : '-translate-y-1/2'}
                  `}
                  style={isHorizontal
                    ? { left: `${markPercentage}%` }
                    : { bottom: `${markPercentage}%` }
                  }
                >
                  {mark.label ?? formatValue(mark.value)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Range Slider - Dual thumb variant
 */
export interface RangeSliderProps extends Omit<SliderProps, 'value' | 'defaultValue' | 'onChange' | 'onChangeEnd'> {
  value?: [number, number];
  defaultValue?: [number, number];
  minDistance?: number;
  onChange?: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
}

export function RangeSlider(props: RangeSliderProps) {
  const {
    value,
    defaultValue = [25, 75],
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    size = 'md',
    minDistance = 0,
    showValue = false,
    formatValue = (v) => String(v),
    onChange,
    onChangeEnd,
    label,
    'aria-label': ariaLabel,
    className = '',
  } = props;

  const currentValue = signal<[number, number]>(value ?? defaultValue);
  const activeThumb = signal<'min' | 'max' | null>(null);
  const trackRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    if (value) {
      currentValue.set(value);
    }
  });

  const percentages = memo(() => {
    const [minVal, maxVal] = currentValue();
    return {
      min: ((minVal - min) / (max - min)) * 100,
      max: ((maxVal - min) / (max - min)) * 100,
    };
  });

  const snapToStep = (val: number): number => {
    const snapped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, snapped));
  };

  const getValueFromPosition = (clientX: number): number => {
    const track = trackRef();
    if (!track) return 0;

    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToStep(min + ratio * (max - min));
  };

  const updateValue = (clientX: number, thumb: 'min' | 'max') => {
    if (disabled) return;

    const newVal = getValueFromPosition(clientX);
    const [minVal, maxVal] = currentValue();

    let newRange: [number, number];

    if (thumb === 'min') {
      const maxAllowed = maxVal - minDistance;
      newRange = [Math.min(newVal, maxAllowed), maxVal];
    } else {
      const minAllowed = minVal + minDistance;
      newRange = [minVal, Math.max(newVal, minAllowed)];
    }

    currentValue.set(newRange);
    onChange?.(newRange);
  };

  const handlePointerDown = (e: PointerEvent, thumb: 'min' | 'max') => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    activeThumb.set(thumb);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX, thumb);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const thumb = activeThumb();
    if (!thumb || disabled) return;
    updateValue(e.clientX, thumb);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!activeThumb()) return;
    activeThumb.set(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onChangeEnd?.(currentValue());
  };

  const styles = sizeStyles[size];

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {showValue && (
            <span className="text-sm text-gray-500">
              {formatValue(currentValue()[0])} - {formatValue(currentValue()[1])}
            </span>
          )}
        </div>
      )}

      <div
        className={`
          relative flex items-center w-full
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Track */}
        <div
          ref={(el: HTMLDivElement) => trackRef.set(el)}
          className={`relative w-full ${styles.track} rounded-full bg-gray-200`}
        >
          {/* Filled Track */}
          <div
            className="absolute h-full bg-blue-600 rounded-full"
            style={{
              left: `${percentages().min}%`,
              width: `${percentages().max - percentages().min}%`,
            }}
          />

          {/* Min Thumb */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${ariaLabel || label} minimum`}
            aria-valuemin={min}
            aria-valuemax={currentValue()[1] - minDistance}
            aria-valuenow={currentValue()[0]}
            className={`
              absolute ${styles.thumb}
              bg-white border-2 border-blue-600 rounded-full shadow-md
              transform -translate-x-1/2 -translate-y-1/2 top-1/2
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${activeThumb() === 'min' ? 'scale-110 z-10' : ''}
              ${disabled ? '' : 'cursor-pointer hover:scale-110'}
              transition-transform
            `}
            style={{ left: `${percentages().min}%` }}
            onPointerDown={(e: any) => handlePointerDown(e, 'min')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Max Thumb */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${ariaLabel || label} maximum`}
            aria-valuemin={currentValue()[0] + minDistance}
            aria-valuemax={max}
            aria-valuenow={currentValue()[1]}
            className={`
              absolute ${styles.thumb}
              bg-white border-2 border-blue-600 rounded-full shadow-md
              transform -translate-x-1/2 -translate-y-1/2 top-1/2
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${activeThumb() === 'max' ? 'scale-110 z-10' : ''}
              ${disabled ? '' : 'cursor-pointer hover:scale-110'}
              transition-transform
            `}
            style={{ left: `${percentages().max}%` }}
            onPointerDown={(e: any) => handlePointerDown(e, 'max')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>
    </div>
  );
}
