/**
 * PhilJS UI - Accordion Component
 */
import { signal, createContext, useContext } from '@philjs/core';
import type { Signal } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';

interface AccordionContextValue {
  expandedItems: () => string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  children: JSX.Element | JSX.Element[];
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  className?: string;
}

export function Accordion(props: AccordionProps): JSX.Element {
  const {
    children,
    allowMultiple = false,
    defaultExpanded = [],
    className = '',
  } = props;

  const expandedItems = signal<string[]>(defaultExpanded);

  const toggleItem = (id: string): void => {
    const current = expandedItems();
    if (current.includes(id)) {
      expandedItems.set(current.filter(item => item !== id));
    } else {
      if (allowMultiple) {
        expandedItems.set([...current, id]);
      } else {
        expandedItems.set([id]);
      }
    }
  };

  const contextValue: AccordionContextValue = {
    expandedItems: () => expandedItems(),
    toggleItem,
    allowMultiple,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={`divide-y divide-gray-200 border border-gray-200 rounded-lg ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  id: string;
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function AccordionItem(props: AccordionItemProps): JSX.Element {
  const { id, children, className = '' } = props;
  return (
    <div data-accordion-item={id} className={className}>
      {children}
    </div>
  );
}

export interface AccordionButtonProps {
  itemId: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

export function AccordionButton(props: AccordionButtonProps): JSX.Element {
  const { itemId, children, className = '' } = props;
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionButton must be used within an Accordion');
  }

  const isExpanded = context.expandedItems().includes(itemId);

  const handleClick = (): void => {
    context.toggleItem(itemId);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      aria-controls={`accordion-panel-${itemId}`}
      className={`
        w-full px-4 py-4
        flex items-center justify-between
        text-left font-medium text-gray-900
        hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        ${className}
      `}
    >
      {children}
      <svg
        className={`
          h-5 w-5 text-gray-500
          transition-transform duration-200
          ${isExpanded ? 'rotate-180' : ''}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}

export interface AccordionPanelProps {
  itemId: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

export function AccordionPanel(props: AccordionPanelProps): JSX.Element | null {
  const { itemId, children, className = '' } = props;
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionPanel must be used within an Accordion');
  }

  const isExpanded = context.expandedItems().includes(itemId);

  if (!isExpanded) return null;

  return (
    <div
      id={`accordion-panel-${itemId}`}
      role="region"
      aria-labelledby={`accordion-button-${itemId}`}
      className={`px-4 pb-4 text-gray-600 ${className}`}
    >
      {children}
    </div>
  );
}
