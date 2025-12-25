/**
 * PhilJS UI - ScrollArea Component
 *
 * Custom scrollable area with styled scrollbars.
 * Provides consistent scroll behavior across platforms.
 */

import { signal, effect } from 'philjs-core';

export type ScrollbarVisibility = 'auto' | 'always' | 'scroll' | 'hover';

export interface ScrollAreaProps {
  children: any;
  className?: string;
  type?: ScrollbarVisibility;
  scrollHideDelay?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  scrollbarSize?: 'sm' | 'md' | 'lg';
  onScroll?: (event: Event) => void;
  onScrollEnd?: () => void;
}

const scrollbarSizes = {
  sm: { width: '6px', thumb: '4px' },
  md: { width: '10px', thumb: '8px' },
  lg: { width: '14px', thumb: '12px' },
};

export function ScrollArea(props: ScrollAreaProps) {
  const {
    children,
    className = '',
    type = 'hover',
    scrollHideDelay = 600,
    direction = 'vertical',
    scrollbarSize = 'md',
    onScroll,
    onScrollEnd,
  } = props;

  const viewportRef = signal<HTMLDivElement | null>(null);
  const isScrolling = signal(false);
  const isHovering = signal(false);
  const scrollTimeout = signal<NodeJS.Timeout | null>(null);

  const showScrollbar = () => {
    if (type === 'always') return true;
    if (type === 'hover') return isHovering();
    if (type === 'scroll') return isScrolling();
    return true; // auto
  };

  const handleScroll = (e: Event) => {
    onScroll?.(e);
    isScrolling.set(true);

    // Clear existing timeout
    const timeout = scrollTimeout();
    if (timeout) clearTimeout(timeout);

    // Set new timeout
    scrollTimeout.set(setTimeout(() => {
      isScrolling.set(false);
      onScrollEnd?.();
    }, scrollHideDelay));
  };

  const sizes = scrollbarSizes[scrollbarSize];

  const scrollbarStyles = `
    .scroll-area-viewport::-webkit-scrollbar {
      width: ${sizes.width};
      height: ${sizes.width};
    }
    .scroll-area-viewport::-webkit-scrollbar-track {
      background: transparent;
    }
    .scroll-area-viewport::-webkit-scrollbar-thumb {
      background: ${showScrollbar() ? 'rgba(0, 0, 0, 0.3)' : 'transparent'};
      border-radius: ${sizes.width};
      transition: background 0.2s;
    }
    .scroll-area-viewport::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.5);
    }
    .scroll-area-viewport::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => isHovering.set(true)}
      onMouseLeave={() => isHovering.set(false)}
    >
      <style>{scrollbarStyles}</style>
      <div
        ref={(el: HTMLDivElement) => viewportRef.set(el)}
        className={`scroll-area-viewport w-full h-full ${
          direction === 'vertical' ? 'overflow-y-auto overflow-x-hidden' :
          direction === 'horizontal' ? 'overflow-x-auto overflow-y-hidden' :
          'overflow-auto'
        }`}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * ScrollAreaViewport - Main scrollable content area
 */
export interface ScrollAreaViewportProps {
  children: any;
  className?: string;
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  const { children, className = '' } = props;
  return (
    <div className={`w-full h-full ${className}`}>
      {children}
    </div>
  );
}

/**
 * AspectRatio - Maintain aspect ratio for content
 */
export interface AspectRatioProps {
  ratio?: number;
  children: any;
  className?: string;
}

export function AspectRatio(props: AspectRatioProps) {
  const { ratio = 16 / 9, children, className = '' } = props;

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
    >
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Separator - Visual divider
 */
export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

export function Separator(props: SeparatorProps) {
  const { orientation = 'horizontal', decorative = true, className = '' } = props;

  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={`
        bg-gray-200 shrink-0
        ${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'}
        ${className}
      `}
    />
  );
}

/**
 * VisuallyHidden - Hide content visually but keep it accessible
 */
export interface VisuallyHiddenProps {
  children: any;
  asChild?: boolean;
}

export function VisuallyHidden(props: VisuallyHiddenProps) {
  const { children, asChild = false } = props;

  const styles: Record<string, any> = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  };

  if (asChild) {
    // If asChild, we'd merge props into the child - simplified here
    return children;
  }

  return <span style={styles}>{children}</span>;
}

/**
 * Collapsible - Expandable/collapsible content
 */
export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: any;
  className?: string;
}

export function Collapsible(props: CollapsibleProps) {
  const {
    open,
    defaultOpen = false,
    disabled = false,
    onOpenChange,
    children,
    className = '',
  } = props;

  const isOpen = signal(open ?? defaultOpen);

  effect(() => {
    if (open !== undefined) {
      isOpen.set(open);
    }
  });

  const toggle = () => {
    if (disabled) return;
    const newState = !isOpen();
    isOpen.set(newState);
    onOpenChange?.(newState);
  };

  return (
    <div className={className} data-state={isOpen() ? 'open' : 'closed'}>
      {typeof children === 'function' ? children({ isOpen: isOpen(), toggle }) : children}
    </div>
  );
}

export interface CollapsibleTriggerProps {
  children: any;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  const { children, onClick, className = '', asChild = false } = props;

  if (asChild) {
    return children;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface CollapsibleContentProps {
  children: any;
  className?: string;
  forceMount?: boolean;
}

export function CollapsibleContent(props: CollapsibleContentProps) {
  const { children, className = '', forceMount = false } = props;

  // This would integrate with Collapsible context in full implementation
  return (
    <div
      className={`overflow-hidden transition-all duration-200 ${className}`}
      data-state="open"
    >
      {children}
    </div>
  );
}

/**
 * Resizable - Resizable panel/container
 */
export interface ResizableProps {
  children: any;
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
  className?: string;
}

export function Resizable(props: ResizableProps) {
  const {
    children,
    direction = 'horizontal',
    defaultSize = 200,
    minSize = 100,
    maxSize = 500,
    onResize,
    onResizeEnd,
    className = '',
  } = props;

  const size = signal(defaultSize);
  const isDragging = signal(false);
  const startPosition = signal(0);
  const startSize = signal(0);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    isDragging.set(true);
    startPosition.set(direction === 'horizontal' ? e.clientX : e.clientY);
    startSize.set(size());
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    const currentPosition = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPosition - startPosition();
    const newSize = Math.max(minSize, Math.min(maxSize, startSize() + delta));

    size.set(newSize);
    onResize?.(newSize);
  };

  const handleMouseUp = () => {
    if (isDragging()) {
      isDragging.set(false);
      onResizeEnd?.(size());
    }
  };

  effect(() => {
    if (isDragging()) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div
      className={`relative ${className}`}
      style={{
        [direction === 'horizontal' ? 'width' : 'height']: `${size()}px`,
      }}
    >
      {children}

      {/* Resize Handle */}
      <div
        className={`
          absolute z-10
          ${direction === 'horizontal'
            ? 'top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500'
            : 'bottom-0 left-0 h-1 w-full cursor-row-resize hover:bg-blue-500'
          }
          ${isDragging() ? 'bg-blue-500' : 'bg-gray-300'}
          transition-colors
        `}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

/**
 * ResizablePanel - Panel within a resizable layout
 */
export interface ResizablePanelGroupProps {
  children: any;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function ResizablePanelGroup(props: ResizablePanelGroupProps) {
  const { children, direction = 'horizontal', className = '' } = props;

  return (
    <div
      className={`
        flex
        ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export interface ResizablePanelProps {
  children: any;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export function ResizablePanel(props: ResizablePanelProps) {
  const { children, defaultSize, minSize, maxSize, className = '' } = props;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{
        flexBasis: defaultSize ? `${defaultSize}%` : undefined,
        minWidth: minSize ? `${minSize}%` : undefined,
        maxWidth: maxSize ? `${maxSize}%` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export interface ResizableHandleProps {
  className?: string;
}

export function ResizableHandle(props: ResizableHandleProps) {
  const { className = '' } = props;

  return (
    <div
      className={`
        w-1 bg-gray-200 hover:bg-blue-500
        cursor-col-resize transition-colors
        flex-shrink-0
        ${className}
      `}
    />
  );
}

/**
 * HoverCard - Card that appears on hover
 */
export interface HoverCardProps {
  children: any;
  content: any;
  openDelay?: number;
  closeDelay?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function HoverCard(props: HoverCardProps) {
  const {
    children,
    content,
    openDelay = 200,
    closeDelay = 100,
    side = 'bottom',
    align = 'center',
    className = '',
  } = props;

  const isOpen = signal(false);
  const openTimeout = signal<NodeJS.Timeout | null>(null);
  const closeTimeout = signal<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const closeTimer = closeTimeout();
    if (closeTimer) clearTimeout(closeTimer);

    openTimeout.set(setTimeout(() => {
      isOpen.set(true);
    }, openDelay));
  };

  const handleMouseLeave = () => {
    const openTimer = openTimeout();
    if (openTimer) clearTimeout(openTimer);

    closeTimeout.set(setTimeout(() => {
      isOpen.set(false);
    }, closeDelay));
  };

  const getPosition = () => {
    const positions: Record<string, string> = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    };

    const alignments: Record<string, string> = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    return `${positions[side]} ${alignments[align]}`;
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen() && (
        <div
          className={`
            absolute z-50 ${getPosition()}
            min-w-64 p-4 bg-white border border-gray-200
            rounded-lg shadow-lg
            animate-in fade-in-0 zoom-in-95
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </div>
  );
}
