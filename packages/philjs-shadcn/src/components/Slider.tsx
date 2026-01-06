/**
 * Slider component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface SliderProps {
    value?: number[] | Signal<number[]>;
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
    onValueCommit?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean | Signal<boolean>;
    orientation?: 'horizontal' | 'vertical';
    name?: string;
    className?: string;
}

/**
 * Slider/range input component
 */
export function Slider(props: SliderProps) {
    const {
        value,
        defaultValue = [0],
        onValueChange,
        onValueCommit,
        min = 0,
        max = 100,
        step = 1,
        disabled,
        orientation = 'horizontal',
        name,
        className,
    } = props;

    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;

    const internalValue = signal<number[]>(
        typeof value === 'function' ? value() : (value ?? defaultValue)
    );

    // Sync with external value
    if (typeof value === 'function') {
        effect(() => {
            internalValue.set(value());
        });
    }

    const currentValue = typeof value === 'function'
        ? value()
        : (value ?? internalValue());

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

    const handleTrackClick = (e: MouseEvent) => {
        if (isDisabled) return;

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        let percentage: number;
        if (orientation === 'horizontal') {
            percentage = ((e.clientX - rect.left) / rect.width) * 100;
        } else {
            percentage = ((rect.bottom - e.clientY) / rect.height) * 100;
        }

        const newValue = Math.round((percentage / 100) * (max - min) / step) * step + min;
        const clampedValue = Math.max(min, Math.min(max, newValue));

        // Find closest thumb and update
        const newValues = [...currentValue];
        if (newValues.length === 1) {
            newValues[0] = clampedValue;
        } else {
            // Find closest thumb
            const distances = newValues.map(v => Math.abs(v - clampedValue));
            const closestIndex = distances.indexOf(Math.min(...distances));
            newValues[closestIndex] = clampedValue;
            // Keep values sorted
            newValues.sort((a, b) => a - b);
        }

        if (typeof value !== 'function' && value === undefined) {
            internalValue.set(newValues);
        }
        onValueChange?.(newValues);
    };

    const handleThumbDrag = (index: number) => (e: MouseEvent) => {
        if (isDisabled) return;
        e.preventDefault();

        const track = (e.currentTarget as HTMLElement).parentElement;
        if (!track) return;

        const updateValue = (clientX: number, clientY: number) => {
            const rect = track.getBoundingClientRect();

            let percentage: number;
            if (orientation === 'horizontal') {
                percentage = ((clientX - rect.left) / rect.width) * 100;
            } else {
                percentage = ((rect.bottom - clientY) / rect.height) * 100;
            }

            const newValue = Math.round((percentage / 100) * (max - min) / step) * step + min;
            const clampedValue = Math.max(min, Math.min(max, newValue));

            const newValues = [...currentValue];
            newValues[index] = clampedValue;
            newValues.sort((a, b) => a - b);

            if (typeof value !== 'function' && value === undefined) {
                internalValue.set(newValues);
            }
            onValueChange?.(newValues);
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            updateValue(moveEvent.clientX, moveEvent.clientY);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            onValueCommit?.(currentValue);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleKeyDown = (index: number) => (e: KeyboardEvent) => {
        if (isDisabled) return;

        let delta = 0;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                delta = step;
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                delta = -step;
                break;
            case 'PageUp':
                delta = step * 10;
                break;
            case 'PageDown':
                delta = -step * 10;
                break;
            case 'Home':
                delta = min - currentValue[index];
                break;
            case 'End':
                delta = max - currentValue[index];
                break;
            default:
                return;
        }

        e.preventDefault();
        const newValue = Math.max(min, Math.min(max, currentValue[index] + delta));
        const newValues = [...currentValue];
        newValues[index] = newValue;
        newValues.sort((a, b) => a - b);

        if (typeof value !== 'function' && value === undefined) {
            internalValue.set(newValues);
        }
        onValueChange?.(newValues);
    };

    const isVertical = orientation === 'vertical';

    return (
        <div
            class={cn(
                'relative flex touch-none select-none',
                isVertical ? 'h-full w-5 flex-col items-center' : 'w-full items-center',
                isDisabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            data-orientation={orientation}
        >
            {/* Track */}
            <div
                class={cn(
                    'relative grow overflow-hidden rounded-full bg-primary/20',
                    isVertical ? 'w-1.5' : 'h-1.5 w-full'
                )}
                onClick={handleTrackClick}
            >
                {/* Range/fill */}
                <div
                    class={cn(
                        'absolute bg-primary',
                        isVertical ? 'w-full' : 'h-full'
                    )}
                    style={
                        currentValue.length === 1
                            ? isVertical
                                ? { bottom: '0%', height: `${getPercentage(currentValue[0])}%` }
                                : { left: '0%', width: `${getPercentage(currentValue[0])}%` }
                            : isVertical
                                ? { bottom: `${getPercentage(currentValue[0])}%`, height: `${getPercentage(currentValue[1]) - getPercentage(currentValue[0])}%` }
                                : { left: `${getPercentage(currentValue[0])}%`, width: `${getPercentage(currentValue[1]) - getPercentage(currentValue[0])}%` }
                    }
                />

                {/* Thumbs */}
                {currentValue.map((val, index) => (
                    <div
                        key={index}
                        role="slider"
                        tabindex={isDisabled ? -1 : 0}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={val}
                        aria-orientation={orientation}
                        onMouseDown={handleThumbDrag(index)}
                        onKeyDown={handleKeyDown(index)}
                        class={cn(
                            'absolute block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            'disabled:pointer-events-none',
                            isVertical ? '-translate-x-1/2 left-1/2' : '-translate-y-1/2 top-1/2'
                        )}
                        style={
                            isVertical
                                ? { bottom: `calc(${getPercentage(val)}% - 8px)` }
                                : { left: `calc(${getPercentage(val)}% - 8px)` }
                        }
                    />
                ))}
            </div>

            {/* Hidden input for forms */}
            {name && currentValue.map((val, index) => (
                <input
                    key={index}
                    type="hidden"
                    name={currentValue.length > 1 ? `${name}[${index}]` : name}
                    value={val}
                />
            ))}
        </div>
    );
}
