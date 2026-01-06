/**
 * Tabs Component
 * Tab navigation with panel content
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, WithChildren, Size, MaybeSignal } from '../types.js';

export interface TabItem {
  id: string;
  label: string | JSX.Element;
  icon?: JSX.Element | (() => JSX.Element);
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps extends BaseProps {
  /** Tab items */
  items: TabItem[];
  /** Currently active tab */
  activeTab?: string | MaybeSignal<string>;
  /** Default active tab */
  defaultActiveTab?: string;
  /** Tab change handler */
  onChange?: (tabId: string) => void;
  /** Size variant */
  size?: Size;
  /** Visual variant */
  variant?: 'line' | 'enclosed' | 'pills' | 'soft';
  /** Color variant */
  color?: 'primary' | 'neutral';
  /** Full width tabs */
  fullWidth?: boolean;
  /** Tabs alignment */
  align?: 'start' | 'center' | 'end';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Fitted (equal width tabs) */
  fitted?: boolean;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const paddingClasses = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5',
  xl: 'px-6 py-3',
};

export function Tabs(props: TabsProps): JSX.Element {
  const {
    items,
    activeTab,
    defaultActiveTab,
    onChange,
    size = 'md',
    variant = 'line',
    color = 'primary',
    fullWidth = false,
    align = 'start',
    orientation = 'horizontal',
    fitted = false,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('tabs');

  // Internal state
  const internalActiveTab = signal(defaultActiveTab || items[0]?.id || '');

  const getActiveTab = () => activeTab !== undefined ? getValue(activeTab) : internalActiveTab();

  const handleTabClick = (tabId: string) => {
    if (activeTab === undefined) {
      internalActiveTab.set(tabId);
    }
    onChange?.(tabId);
  };

  const isVertical = orientation === 'vertical';

  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  };

  const containerClasses = cn(
    'flex',
    isVertical ? 'flex-col' : 'flex-row',
    !isVertical && alignClasses[align],
    fullWidth && 'w-full',
    // Border for line variant
    variant === 'line' && (isVertical ? 'border-r' : 'border-b'),
    'border-gray-200 dark:border-gray-700',
    className
  );

  const getTabClasses = (tab: TabItem) => {
    const isActive = getActiveTab() === tab.id;
    const isDisabled = tab.disabled;

    const baseClasses = cn(
      'inline-flex items-center gap-2',
      'font-medium cursor-pointer',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
      sizeClasses[size],
      paddingClasses[size],
      fitted && 'flex-1 justify-center',
      isDisabled && 'opacity-50 cursor-not-allowed'
    );

    const variantStyles = {
      line: cn(
        isVertical ? '-mr-px border-r-2' : '-mb-px border-b-2',
        isActive
          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
      ),
      enclosed: cn(
        'border rounded-t-md',
        isActive
          ? 'border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-900 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      ),
      pills: cn(
        'rounded-md',
        isActive
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
      ),
      soft: cn(
        'rounded-md',
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
      ),
    };

    return cn(baseClasses, variantStyles[variant]);
  };

  return jsx('div', {
    class: containerClasses,
    role: 'tablist',
    'aria-orientation': orientation,
    id,
    'data-testid': testId,
    ...rest,
    children: items.map(tab =>
      jsx('button', {
        type: 'button',
        role: 'tab',
        id: `${id}-tab-${tab.id}`,
        class: getTabClasses(tab),
        'aria-selected': getActiveTab() === tab.id,
        'aria-controls': `${id}-panel-${tab.id}`,
        'aria-disabled': tab.disabled,
        tabindex: getActiveTab() === tab.id ? 0 : -1,
        disabled: tab.disabled,
        onclick: () => !tab.disabled && handleTabClick(tab.id),
        children: [
          // Icon
          tab.icon && jsx('span', {
            class: 'flex-shrink-0',
            children: typeof tab.icon === 'function' ? tab.icon() : tab.icon,
          }),
          // Label
          jsx('span', { children: tab.label }),
          // Badge
          tab.badge !== undefined && jsx('span', {
            class: cn(
              'inline-flex items-center justify-center',
              'min-w-[1.25rem] h-5 px-1.5',
              'text-xs font-medium rounded-full',
              getActiveTab() === tab.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            ),
            children: String(tab.badge),
          }),
        ],
      })
    ),
  });
}

// Tab Panel
export interface TabPanelProps extends BaseProps, WithChildren {
  /** Tab ID this panel belongs to */
  tabId: string;
  /** Tabs component ID */
  tabsId: string;
  /** Active tab */
  activeTab?: string | MaybeSignal<string>;
  /** Keep mounted when inactive */
  keepMounted?: boolean;
}

export function TabPanel(props: TabPanelProps): JSX.Element {
  const {
    tabId,
    tabsId,
    activeTab,
    keepMounted = false,
    class: className,
    children,
    testId,
    ...rest
  } = props;

  const isActive = getValue(activeTab as MaybeSignal<string>) === tabId;

  if (!isActive && !keepMounted) {
    return jsx('div', { style: { display: 'none' } });
  }

  return jsx('div', {
    role: 'tabpanel',
    id: `${tabsId}-panel-${tabId}`,
    'aria-labelledby': `${tabsId}-tab-${tabId}`,
    class: cn(
      'focus:outline-none',
      !isActive && 'hidden',
      className
    ),
    'data-testid': testId,
    tabindex: 0,
    hidden: !isActive,
    ...rest,
    children,
  });
}

// Tabs with Panels wrapper
export interface TabsWithPanelsProps extends Omit<TabsProps, 'items'> {
  /** Tab data with content */
  tabs: Array<TabItem & { content: JSX.Element | (() => JSX.Element) }>;
  /** Keep all panels mounted */
  keepMounted?: boolean;
  /** Panel class name */
  panelClassName?: string;
}

export function TabsWithPanels(props: TabsWithPanelsProps): JSX.Element {
  const {
    tabs,
    activeTab,
    defaultActiveTab,
    onChange,
    keepMounted = false,
    panelClassName,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('tabs-with-panels');
  const internalActiveTab = signal(defaultActiveTab || tabs[0]?.id || '');

  const getActiveTab = () => activeTab !== undefined ? getValue(activeTab) : internalActiveTab();

  const handleChange = (tabId: string) => {
    if (activeTab === undefined) {
      internalActiveTab.set(tabId);
    }
    onChange?.(tabId);
  };

  return jsx('div', {
    'data-testid': testId,
    children: [
      // Tabs
      Tabs({
        items: tabs.map(({ content, ...item }) => item),
        activeTab: getActiveTab(),
        onChange: handleChange,
        id,
        class: className,
        ...rest,
      }),
      // Panels
      jsx('div', {
        class: cn('mt-4', panelClassName),
        children: tabs.map(tab =>
          TabPanel({
            tabId: tab.id,
            tabsId: id,
            activeTab: getActiveTab(),
            keepMounted,
            children: typeof tab.content === 'function' ? tab.content() : tab.content,
          })
        ),
      }),
    ],
  });
}
