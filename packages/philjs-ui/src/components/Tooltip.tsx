/**
 * PhilJS UI - Tooltip Component
 */
import { signal, effect } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: string | JSX.Element | JSX.Element[];
  children: JSX.Element | JSX.Element[] | string;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  className?: string;
  arrow?: boolean;
}

const placementStyles: Record<TooltipPlacement, { tooltip: string; arrow: string }> = {
  top: {
    tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
  },
  bottom: {
    tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
  },
  left: {
    tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
  },
  right: {
    tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  },
};

export function Tooltip(props: TooltipProps): JSX.Element {
  const {
    content,
    children,
    placement = 'top',
    delay = 0,
    disabled = false,
    className = '',
    arrow = true,
  } = props;

  const isVisible = signal(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const showTooltip = (): void => {
    if (disabled) return;
    if (delay > 0) {
      timeoutId = setTimeout(() => isVisible.set(true), delay);
    } else {
      isVisible.set(true);
    }
  };

  const hideTooltip = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isVisible.set(false);
  };

  effect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible() && (
        <div
          role="tooltip"
          className={`
            absolute z-50
            ${placementStyles[placement].tooltip}
            ${className}
          `}
        >
          <div className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {content}
          </div>
          {arrow && (
            <div
              className={`
                absolute w-0 h-0
                border-4
                ${placementStyles[placement].arrow}
              `}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Popover - More complex tooltip with interactive content
 */
export interface PopoverProps {
  trigger: JSX.Element | JSX.Element[] | string;
  children: JSX.Element | JSX.Element[] | string;
  placement?: TooltipPlacement;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  closeOnClickOutside?: boolean;
  className?: string;
}

export function Popover(props: PopoverProps): JSX.Element {
  const {
    trigger,
    children,
    placement = 'bottom',
    isOpen: controlledIsOpen,
    onOpenChange,
    closeOnClickOutside = true,
    className = '',
  } = props;

  const internalIsOpen = signal(false);
  const isOpen = controlledIsOpen ?? internalIsOpen();
  let popoverRef: HTMLDivElement | null = null;

  const toggleOpen = (): void => {
    const newValue = !isOpen;
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(newValue);
    }
    onOpenChange?.(newValue);
  };

  const close = (): void => {
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(false);
    }
    onOpenChange?.(false);
  };

  effect(() => {
    if (!closeOnClickOutside) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (popoverRef && !popoverRef.contains(e.target as Node) && isOpen) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  const placementClasses: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-0 mb-2',
    bottom: 'top-full left-0 mt-2',
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
  };

  return (
    <div ref={(el: HTMLDivElement | null) => (popoverRef = el)} className="relative inline-block">
      <div onClick={toggleOpen}>{trigger}</div>
      {isOpen && (
        <div
          className={`
            absolute z-50
            ${placementClasses[placement]}
            bg-white rounded-lg shadow-lg border border-gray-200
            p-4 min-w-[200px]
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
}
