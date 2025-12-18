/**
 * PhilJS UI - Card Component
 */
export type CardVariant = 'elevated' | 'outlined' | 'filled';
export interface CardProps {
    children: any;
    variant?: CardVariant;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    clickable?: boolean;
    onClick?: () => void;
    className?: string;
}
export declare function Card(props: CardProps): import("philjs-core").JSXElement;
/**
 * Card Header
 */
export declare function CardHeader(props: {
    children: any;
    action?: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Card Title
 */
export declare function CardTitle(props: {
    children: any;
    subtitle?: string;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Card Body
 */
export declare function CardBody(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Card Footer
 */
export declare function CardFooter(props: {
    children: any;
    divider?: boolean;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Card Image
 */
export declare function CardImage(props: {
    src: string;
    alt: string;
    position?: 'top' | 'bottom';
    className?: string;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Card.d.ts.map