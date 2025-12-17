/**
 * PhilJS UI - Tabs Component
 */
import { JSX } from 'philjs-core';
export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
export type TabsSize = 'sm' | 'md' | 'lg';
export interface TabsProps {
    children: JSX.Element;
    defaultValue?: string;
    value?: string;
    variant?: TabsVariant;
    size?: TabsSize;
    onChange?: (value: string) => void;
    className?: string;
}
export declare function Tabs(props: TabsProps): import("philjs-core").JSXElement;
/**
 * Tab List - Container for tab triggers
 */
export interface TabListProps {
    children: JSX.Element | JSX.Element[];
    className?: string;
}
export declare function TabList(props: TabListProps): import("philjs-core").JSXElement;
/**
 * Tab - Individual tab trigger
 */
export interface TabProps {
    value: string;
    children: JSX.Element;
    disabled?: boolean;
    icon?: JSX.Element;
    className?: string;
}
export declare function Tab(props: TabProps): import("philjs-core").JSXElement;
/**
 * Tab Panels - Container for tab content
 */
export interface TabPanelsProps {
    children: JSX.Element | JSX.Element[];
    className?: string;
}
export declare function TabPanels(props: TabPanelsProps): import("philjs-core").JSXElement;
/**
 * Tab Panel - Individual tab content
 */
export interface TabPanelProps {
    value: string;
    children: JSX.Element;
    className?: string;
}
export declare function TabPanel(props: TabPanelProps): import("philjs-core").JSXElement | null;
//# sourceMappingURL=Tabs.d.ts.map