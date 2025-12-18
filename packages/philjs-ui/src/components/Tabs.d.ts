/**
 * PhilJS UI - Tabs Component
 */
export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
export type TabsSize = 'sm' | 'md' | 'lg';
export interface TabsProps {
    children: any;
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
    children: any;
    className?: string;
}
export declare function TabList(props: TabListProps): import("philjs-core").JSXElement;
/**
 * Tab - Individual tab trigger
 */
export interface TabProps {
    value: string;
    children: any;
    disabled?: boolean;
    icon?: any;
    className?: string;
}
export declare function Tab(props: TabProps): import("philjs-core").JSXElement;
/**
 * Tab Panels - Container for tab content
 */
export interface TabPanelsProps {
    children: any;
    className?: string;
}
export declare function TabPanels(props: TabPanelsProps): import("philjs-core").JSXElement;
/**
 * Tab Panel - Individual tab content
 */
export interface TabPanelProps {
    value: string;
    children: any;
    className?: string;
}
export declare function TabPanel(props: TabPanelProps): import("philjs-core").JSXElement | null;
//# sourceMappingURL=Tabs.d.ts.map