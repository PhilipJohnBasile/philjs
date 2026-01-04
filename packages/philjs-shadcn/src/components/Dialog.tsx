import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface DialogProps {
    open?: boolean | Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
    children?: any;
}

/**
 * Dialog/Modal component with native PhilJS signals
 * 
 * @example
 * ```tsx
 * const isOpen = signal(false);
 * 
 * <Dialog open={isOpen} onOpenChange={(v) => isOpen.set(v)}>
 *   <DialogTrigger>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Edit Profile</DialogTitle>
 *       <DialogDescription>Make changes here.</DialogDescription>
 *     </DialogHeader>
 *     <div>Content goes here</div>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function Dialog(props: DialogProps) {
    const { open, onOpenChange, children } = props;

    const isOpen = () => (typeof open === 'function' ? open() : open ?? false);

    return (
        <div data-dialog-root>
            {children}
            {isOpen() && (
                <div
                    class="fixed inset-0 z-50 bg-black/80"
                    onClick={() => onOpenChange?.(false)}
                />
            )}
        </div>
    );
}

export interface DialogTriggerProps {
    children?: any;
    asChild?: boolean;
}

/**
 * Trigger that opens the dialog
 */
export function DialogTrigger(props: DialogTriggerProps) {
    return <div data-dialog-trigger>{props.children}</div>;
}

export interface DialogContentProps {
    children?: any;
    class?: string;
}

/**
 * Dialog content container
 */
export function DialogContent(props: DialogContentProps) {
    return (
        <div
            class={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200',
                'sm:rounded-lg',
                props.class
            )}
            role="dialog"
            aria-modal="true"
        >
            {props.children}
        </div>
    );
}

export interface DialogHeaderProps {
    children?: any;
    class?: string;
}

/**
 * Dialog header section
 */
export function DialogHeader(props: DialogHeaderProps) {
    return (
        <div
            class={cn('flex flex-col space-y-1.5 text-center sm:text-left', props.class)}
        >
            {props.children}
        </div>
    );
}

export interface DialogTitleProps {
    children?: any;
    class?: string;
}

/**
 * Dialog title
 */
export function DialogTitle(props: DialogTitleProps) {
    return (
        <h2
            class={cn('text-lg font-semibold leading-none tracking-tight', props.class)}
        >
            {props.children}
        </h2>
    );
}

export interface DialogDescriptionProps {
    children?: any;
    class?: string;
}

/**
 * Dialog description
 */
export function DialogDescription(props: DialogDescriptionProps) {
    return (
        <p class={cn('text-sm text-muted-foreground', props.class)}>
            {props.children}
        </p>
    );
}

export interface DialogFooterProps {
    children?: any;
    class?: string;
}

/**
 * Dialog footer section
 */
export function DialogFooter(props: DialogFooterProps) {
    return (
        <div
            class={cn(
                'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
                props.class
            )}
        >
            {props.children}
        </div>
    );
}

export interface DialogCloseProps {
    children?: any;
    class?: string;
}

/**
 * Close button for dialog
 */
export function DialogClose(props: DialogCloseProps) {
    return (
        <button
            type="button"
            class={cn(
                'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
                props.class
            )}
        >
            {props.children ?? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            )}
            <span class="sr-only">Close</span>
        </button>
    );
}
