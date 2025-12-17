/**
 * PhilJS Head Component
 *
 * Manages document head tags (title, meta, link)
 */
import { JSX } from 'philjs-core';
import type { MetaTag, LinkTag } from './types';
interface HeadContextValue {
    addMeta: (tag: MetaTag) => () => void;
    addLink: (tag: LinkTag) => () => void;
    setTitle: (title: string) => void;
}
/**
 * Head Provider - Should wrap the app root
 */
export declare function HeadProvider(props: {
    children: JSX.Element;
}): import("philjs-core").JSXElement;
/**
 * Head Component - Declarative head management
 */
export declare function Head(props: {
    children: JSX.Element | JSX.Element[];
}): null;
/**
 * Meta Component - Convenience component for meta tags
 */
export declare function Meta(props: MetaTag): null;
/**
 * Link Component - Convenience component for link tags
 */
export declare function Link(props: LinkTag): null;
/**
 * Title Component - Convenience component for title
 */
export declare function Title(props: {
    children: string;
    template?: string;
}): null;
/**
 * useHead hook - Programmatic head management
 */
export declare function useHead(): HeadContextValue;
export {};
//# sourceMappingURL=Head.d.ts.map