/**
 * PhilJS UI - Accordion Component
 */
import { JSX } from 'philjs-core';
export interface AccordionProps {
    children: JSX.Element | JSX.Element[];
    allowMultiple?: boolean;
    defaultExpanded?: string[];
    className?: string;
}
export declare function Accordion(props: AccordionProps): import("philjs-core").JSXElement;
/**
 * Accordion Item
 */
export interface AccordionItemProps {
    id: string;
    children: JSX.Element | JSX.Element[];
    className?: string;
}
export declare function AccordionItem(props: AccordionItemProps): import("philjs-core").JSXElement;
/**
 * Accordion Button (Trigger)
 */
export interface AccordionButtonProps {
    itemId: string;
    children: JSX.Element;
    className?: string;
}
export declare function AccordionButton(props: AccordionButtonProps): import("philjs-core").JSXElement;
/**
 * Accordion Panel (Content)
 */
export interface AccordionPanelProps {
    itemId: string;
    children: JSX.Element;
    className?: string;
}
export declare function AccordionPanel(props: AccordionPanelProps): import("philjs-core").JSXElement | null;
//# sourceMappingURL=Accordion.d.ts.map