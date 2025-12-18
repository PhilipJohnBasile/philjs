/**
 * PhilJS UI - Breadcrumb Component
 */
export interface BreadcrumbProps {
    children: any | any[];
    separator?: any | string;
    className?: string;
}
export declare function Breadcrumb(props: BreadcrumbProps): import("philjs-core").JSXElement;
/**
 * Breadcrumb Item
 */
export interface BreadcrumbItemProps {
    children: any;
    href?: string;
    isCurrentPage?: boolean;
    onClick?: () => void;
    className?: string;
}
export declare function BreadcrumbItem(props: BreadcrumbItemProps): import("philjs-core").JSXElement;
/**
 * Breadcrumb Link (Alias for BreadcrumbItem with href)
 */
export declare function BreadcrumbLink(props: BreadcrumbItemProps): import("philjs-core").JSXElement;
/**
 * Breadcrumb Separator
 */
export interface BreadcrumbSeparatorProps {
    children?: any | string;
    className?: string;
}
export declare function BreadcrumbSeparator(props: BreadcrumbSeparatorProps): import("philjs-core").JSXElement;
/**
 * Common Breadcrumb Icons
 */
export declare const BreadcrumbIcons: {
    chevron: import("philjs-core").JSXElement;
    arrow: import("philjs-core").JSXElement;
    dot: import("philjs-core").JSXElement;
};
//# sourceMappingURL=Breadcrumb.d.ts.map