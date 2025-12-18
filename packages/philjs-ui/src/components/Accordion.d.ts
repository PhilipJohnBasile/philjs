/**
 * PhilJS UI - Accordion Component
 */
export interface AccordionProps {
    children: any;
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
    children: any;
    className?: string;
}
export declare function AccordionItem(props: AccordionItemProps): import("philjs-core").JSXElement;
/**
 * Accordion Button (Trigger)
 */
export interface AccordionButtonProps {
    itemId: string;
    children: any;
    className?: string;
}
export declare function AccordionButton(props: AccordionButtonProps): import("philjs-core").JSXElement;
/**
 * Accordion Panel (Content)
 */
export interface AccordionPanelProps {
    itemId: string;
    children: any;
    className?: string;
}
export declare function AccordionPanel(props: AccordionPanelProps): import("philjs-core").JSXElement | null;
//# sourceMappingURL=Accordion.d.ts.map