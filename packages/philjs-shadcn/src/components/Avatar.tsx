/**
 * Avatar component - shadcn/ui style for PhilJS
 */

import { signal, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface AvatarProps {
    className?: string;
    children?: any;
}

export interface AvatarImageProps {
    src?: string | Signal<string>;
    alt?: string;
    onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
    className?: string;
}

export interface AvatarFallbackProps {
    delayMs?: number;
    className?: string;
    children?: any;
}

// Context for avatar state
let currentAvatarContext: {
    imageLoaded: Signal<boolean>;
    imageError: Signal<boolean>;
} | null = null;

/**
 * Root Avatar container
 */
export function Avatar(props: AvatarProps) {
    const { className, children } = props;

    const imageLoaded = signal(false);
    const imageError = signal(false);

    const prevContext = currentAvatarContext;
    currentAvatarContext = { imageLoaded, imageError };

    const result = (
        <span
            class={cn(
                'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
                className
            )}
        >
            {children}
        </span>
    );

    currentAvatarContext = prevContext;
    return result;
}

/**
 * Avatar image element
 */
export function AvatarImage(props: AvatarImageProps) {
    const { src, alt = '', onLoadingStatusChange, className } = props;
    const context = currentAvatarContext;

    const imgSrc = typeof src === 'function' ? src() : src;

    const handleLoad = () => {
        if (context) {
            context.imageLoaded.set(true);
            context.imageError.set(false);
        }
        onLoadingStatusChange?.('loaded');
    };

    const handleError = () => {
        if (context) {
            context.imageError.set(true);
        }
        onLoadingStatusChange?.('error');
    };

    if (!imgSrc) return null;

    // Check if image is loaded/errored from context
    if (context?.imageError()) return null;

    return (
        <img
            src={imgSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            class={cn('aspect-square h-full w-full', className)}
        />
    );
}

/**
 * Fallback content when image fails to load
 */
export function AvatarFallback(props: AvatarFallbackProps) {
    const { delayMs = 0, className, children } = props;
    const context = currentAvatarContext;

    // Show fallback if image errored or not loaded after delay
    const showFallback = signal(delayMs === 0);

    if (delayMs > 0) {
        setTimeout(() => {
            showFallback.set(true);
        }, delayMs);
    }

    // Only show if image hasn't loaded successfully
    if (context?.imageLoaded() && !context?.imageError()) {
        return null;
    }

    if (!showFallback()) {
        return null;
    }

    return (
        <span
            class={cn(
                'flex h-full w-full items-center justify-center rounded-full bg-muted',
                className
            )}
        >
            {children}
        </span>
    );
}
