/**
 * PhilJS UI - Tabs Component
 */
import { signal, createContext, useContext } from 'philjs-core';
import type { JSX } from 'philjs-core/jsx-runtime';

export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
export type TabsSize = 'sm' | 'md' | 'lg';

interface TabsContextValue {
  activeTab: () => string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
  size: TabsSize;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  children: JSX.Element | JSX.Element[] | string;
  defaultValue?: string;
  value?: string;
  variant?: TabsVariant;
  size?: TabsSize;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs(props: TabsProps): JSX.Element {
  const {
    children,
    defaultValue = '',
    value,
    variant = 'line',
    size = 'md',
    onChange,
    className = '',
  } = props;

  const internalValue = signal(defaultValue);

  const activeTab = (): string => value ?? internalValue();

  const setActiveTab = (id: string): void => {
    if (value === undefined) {
      internalValue.set(id);
    }
    onChange?.(id);
  };

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
    variant,
    size,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * Tab List - Container for tab triggers
 */
export interface TabListProps {
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

export function TabList(props: TabListProps): JSX.Element {
  const { children, className = '' } = props;
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabList must be used within Tabs');
  }

  const variantStyles: Record<TabsVariant, string> = {
    line: 'border-b border-gray-200',
    enclosed: 'border-b border-gray-200',
    'soft-rounded': 'bg-gray-100 p-1 rounded-lg',
    'solid-rounded': 'bg-gray-100 p-1 rounded-lg',
  };

  return (
    <div role="tablist" className={`flex ${variantStyles[context.variant]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Tab - Individual tab trigger
 */
export interface TabProps {
  value: string;
  children: JSX.Element | JSX.Element[] | string;
  disabled?: boolean;
  icon?: JSX.Element | string;
  className?: string;
}

export function Tab(props: TabProps): JSX.Element {
  const { value, children, disabled = false, icon, className = '' } = props;
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Tab must be used within Tabs');
  }

  const isActive = context.activeTab() === value;

  const handleClick = (): void => {
    if (!disabled) {
      context.setActiveTab(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const sizeStyles: Record<TabsSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const getVariantStyles = (): string => {
    const { variant } = context;
    const baseActive = 'font-medium';
    const baseInactive = 'text-gray-500 hover:text-gray-700';

    switch (variant) {
      case 'line':
        return isActive
          ? `${baseActive} text-blue-600 border-b-2 border-blue-600 -mb-px`
          : `${baseInactive} border-b-2 border-transparent -mb-px hover:border-gray-300`;
      case 'enclosed':
        return isActive
          ? `${baseActive} text-blue-600 bg-white border border-gray-200 border-b-white rounded-t-md -mb-px`
          : `${baseInactive} border border-transparent`;
      case 'soft-rounded':
        return isActive
          ? `${baseActive} text-blue-600 bg-white rounded-md shadow-sm`
          : baseInactive;
      case 'solid-rounded':
        return isActive
          ? `${baseActive} text-white bg-blue-600 rounded-md`
          : baseInactive;
      default:
        return '';
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        ${sizeStyles[context.size]}
        ${getVariantStyles()}
        inline-flex items-center
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * Tab Panels - Container for tab content
 */
export interface TabPanelsProps {
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

export function TabPanels(props: TabPanelsProps): JSX.Element {
  const { children, className = '' } = props;
  return <div className={className}>{children}</div>;
}

/**
 * Tab Panel - Individual tab content
 */
export interface TabPanelProps {
  value: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

export function TabPanel(props: TabPanelProps): JSX.Element | null {
  const { value, children, className = '' } = props;
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabPanel must be used within Tabs');
  }

  const isActive = context.activeTab() === value;

  if (!isActive) return null;

  return (
    <div role="tabpanel" tabIndex={0} className={`py-4 ${className}`}>
      {children}
    </div>
  );
}
