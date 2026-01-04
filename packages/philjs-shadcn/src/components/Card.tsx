import { cn } from '../utils.js';

export interface CardProps {
    children?: any;
    class?: string;
}

/**
 * Card container component
 */
export function Card(props: CardProps) {
    return (
        <div
            class={cn(
                'rounded-lg border bg-card text-card-foreground shadow-sm',
                props.class
            )}
        >
            {props.children}
        </div>
    );
}

export interface CardHeaderProps {
    children?: any;
    class?: string;
}

/**
 * Card header section
 */
export function CardHeader(props: CardHeaderProps) {
    return (
        <div class={cn('flex flex-col space-y-1.5 p-6', props.class)}>
            {props.children}
        </div>
    );
}

export interface CardTitleProps {
    children?: any;
    class?: string;
}

/**
 * Card title
 */
export function CardTitle(props: CardTitleProps) {
    return (
        <h3
            class={cn(
                'text-2xl font-semibold leading-none tracking-tight',
                props.class
            )}
        >
            {props.children}
        </h3>
    );
}

export interface CardDescriptionProps {
    children?: any;
    class?: string;
}

/**
 * Card description text
 */
export function CardDescription(props: CardDescriptionProps) {
    return (
        <p class={cn('text-sm text-muted-foreground', props.class)}>
            {props.children}
        </p>
    );
}

export interface CardContentProps {
    children?: any;
    class?: string;
}

/**
 * Card content area
 */
export function CardContent(props: CardContentProps) {
    return <div class={cn('p-6 pt-0', props.class)}>{props.children}</div>;
}

export interface CardFooterProps {
    children?: any;
    class?: string;
}

/**
 * Card footer section
 */
export function CardFooter(props: CardFooterProps) {
    return (
        <div class={cn('flex items-center p-6 pt-0', props.class)}>
            {props.children}
        </div>
    );
}
