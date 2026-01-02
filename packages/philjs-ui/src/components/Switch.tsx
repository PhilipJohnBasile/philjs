/**
 * PhilJS UI - Switch Component
 */
import { signal } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  name?: string;
  size?: SwitchSize;
  onChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

const sizeStyles: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
  lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
};

export function Switch(props: SwitchProps): JSX.Element {
  const {
    checked,
    defaultChecked = false,
    disabled = false,
    label,
    description,
    id,
    name,
    size = 'md',
    onChange,
    className = '',
    'aria-label': ariaLabel,
  } = props;

  const isControlled = checked !== undefined;
  const internalChecked = signal(defaultChecked);

  const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;
  const descriptionId = description ? `${switchId}-description` : undefined;

  const isChecked = isControlled ? checked : internalChecked();

  const handleClick = (): void => {
    if (disabled) return;
    const newValue = !isChecked;
    if (!isControlled) {
      internalChecked.set(newValue);
    }
    onChange?.(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const { track, thumb, translate } = sizeStyles[size];

  return (
    <div className={`flex items-start ${className}`}>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={isChecked}
        aria-label={ariaLabel || label}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${track}
          relative inline-flex flex-shrink-0
          rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isChecked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            ${thumb}
            pointer-events-none inline-block
            rounded-full bg-white shadow-lg
            transform ring-0
            transition duration-200 ease-in-out
            ${isChecked ? translate : 'translate-x-0'}
          `}
        />
      </button>
      <input
        type="checkbox"
        name={name}
        checked={isChecked}
        disabled={disabled}
        className="sr-only"
        readOnly
        tabIndex={-1}
      />
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={switchId}
              className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} ${disabled ? '' : 'cursor-pointer'}`}
              onClick={handleClick}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
