/**
 * PhilJS Flash Messages
 *
 * Remix-style flash messages with session-based one-time messages.
 * Messages are automatically cleared after being read.
 */
import type { Session, SessionData, SessionStorage } from './session.js';
/**
 * Flash message categories
 */
export type FlashCategory = 'success' | 'error' | 'warning' | 'info';
/**
 * Flash message structure
 */
export interface FlashMessage {
    /** Message category */
    category: FlashCategory;
    /** Message content */
    message: string;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
    /** Timestamp */
    timestamp: number;
}
/**
 * Flash storage key
 */
declare const FLASH_KEY = "__flash__";
/**
 * Session data with flash support
 */
export interface FlashSessionData extends SessionData {
    [FLASH_KEY]?: FlashMessage[];
}
/**
 * Toast notification options
 */
export interface ToastOptions {
    /** Duration in milliseconds */
    duration?: number;
    /** Position on screen */
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    /** Closable */
    closable?: boolean;
    /** Auto-close */
    autoClose?: boolean;
}
/**
 * Flash message with toast options
 */
export interface FlashMessageWithToast extends FlashMessage {
    /** Toast options */
    toast?: ToastOptions;
}
/**
 * Set a flash message
 */
export declare function setFlash(session: Session<FlashSessionData>, category: FlashCategory, message: string, metadata?: Record<string, unknown>): void;
/**
 * Set a success flash message
 */
export declare function setFlashSuccess(session: Session<FlashSessionData>, message: string, metadata?: Record<string, unknown>): void;
/**
 * Set an error flash message
 */
export declare function setFlashError(session: Session<FlashSessionData>, message: string, metadata?: Record<string, unknown>): void;
/**
 * Set a warning flash message
 */
export declare function setFlashWarning(session: Session<FlashSessionData>, message: string, metadata?: Record<string, unknown>): void;
/**
 * Set an info flash message
 */
export declare function setFlashInfo(session: Session<FlashSessionData>, message: string, metadata?: Record<string, unknown>): void;
/**
 * Get all flash messages and clear them
 */
export declare function getFlashMessages(session: Session<FlashSessionData>): FlashMessage[];
/**
 * Get flash messages by category
 */
export declare function getFlashMessagesByCategory(session: Session<FlashSessionData>, category: FlashCategory): FlashMessage[];
/**
 * Peek at flash messages without clearing them
 */
export declare function peekFlashMessages(session: Session<FlashSessionData>): FlashMessage[];
/**
 * Clear all flash messages
 */
export declare function clearFlashMessages(session: Session<FlashSessionData>): void;
/**
 * Check if there are any flash messages
 */
export declare function hasFlashMessages(session: Session<FlashSessionData>): boolean;
/**
 * React hook for flash messages (client-side)
 */
export declare function useFlash(): void;
/**
 * Create flash message utilities bound to a session
 */
export declare function createFlashUtils(session: Session<FlashSessionData>): {
    set: (category: FlashCategory, message: string, metadata?: Record<string, unknown>) => void;
    success: (message: string, metadata?: Record<string, unknown>) => void;
    error: (message: string, metadata?: Record<string, unknown>) => void;
    warning: (message: string, metadata?: Record<string, unknown>) => void;
    info: (message: string, metadata?: Record<string, unknown>) => void;
    get: () => FlashMessage[];
    getByCategory: (category: FlashCategory) => FlashMessage[];
    peek: () => FlashMessage[];
    clear: () => void;
    has: () => boolean;
};
/**
 * Serialize flash messages for client hydration
 */
export declare function serializeFlashMessages(messages: FlashMessage[]): string;
/**
 * Deserialize flash messages from JSON
 */
export declare function deserializeFlashMessages(json: string): FlashMessage[];
/**
 * Flash message middleware for automatic injection
 */
export declare function flashMiddleware<T extends FlashSessionData>(sessionStorage: SessionStorage<T>): (request: Request, next: () => Promise<Response>) => Promise<Response>;
export {};
//# sourceMappingURL=flash.d.ts.map