/**
 * PhilJS Flash Messages
 *
 * Remix-style flash messages with session-based one-time messages.
 * Messages are automatically cleared after being read.
 */

import type { Session, SessionData, SessionStorage } from './session';

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
const FLASH_KEY = '__flash__';

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
export function setFlash(
  session: Session<FlashSessionData>,
  category: FlashCategory,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const flashMessages = (session.get(FLASH_KEY as keyof FlashSessionData) as FlashMessage[]) || [];

  const flashMessage: FlashMessage = {
    category,
    message,
    metadata,
    timestamp: Date.now(),
  };

  flashMessages.push(flashMessage);
  session.set(FLASH_KEY as keyof FlashSessionData, flashMessages as any);
}

/**
 * Set a success flash message
 */
export function setFlashSuccess(
  session: Session<FlashSessionData>,
  message: string,
  metadata?: Record<string, unknown>
): void {
  setFlash(session, 'success', message, metadata);
}

/**
 * Set an error flash message
 */
export function setFlashError(
  session: Session<FlashSessionData>,
  message: string,
  metadata?: Record<string, unknown>
): void {
  setFlash(session, 'error', message, metadata);
}

/**
 * Set a warning flash message
 */
export function setFlashWarning(
  session: Session<FlashSessionData>,
  message: string,
  metadata?: Record<string, unknown>
): void {
  setFlash(session, 'warning', message, metadata);
}

/**
 * Set an info flash message
 */
export function setFlashInfo(
  session: Session<FlashSessionData>,
  message: string,
  metadata?: Record<string, unknown>
): void {
  setFlash(session, 'info', message, metadata);
}

/**
 * Get all flash messages and clear them
 */
export function getFlashMessages(session: Session<FlashSessionData>): FlashMessage[] {
  const flashMessages = (session.get(FLASH_KEY as keyof FlashSessionData) as FlashMessage[]) || [];

  // Clear flash messages after reading
  session.delete(FLASH_KEY as keyof FlashSessionData);

  return flashMessages;
}

/**
 * Get flash messages by category
 */
export function getFlashMessagesByCategory(
  session: Session<FlashSessionData>,
  category: FlashCategory
): FlashMessage[] {
  const allMessages = getFlashMessages(session);
  return allMessages.filter(msg => msg.category === category);
}

/**
 * Peek at flash messages without clearing them
 */
export function peekFlashMessages(session: Session<FlashSessionData>): FlashMessage[] {
  return (session.get(FLASH_KEY as keyof FlashSessionData) as FlashMessage[]) || [];
}

/**
 * Clear all flash messages
 */
export function clearFlashMessages(session: Session<FlashSessionData>): void {
  session.delete(FLASH_KEY as keyof FlashSessionData);
}

/**
 * Check if there are any flash messages
 */
export function hasFlashMessages(session: Session<FlashSessionData>): boolean {
  const flashMessages = session.get(FLASH_KEY as keyof FlashSessionData) as FlashMessage[];
  return flashMessages && flashMessages.length > 0;
}

/**
 * React hook for flash messages (client-side)
 */
export function useFlash() {
  // This would be implemented in the client-side package
  // Here we just export the type/interface
  throw new Error('useFlash must be used on the client side. Import from philjs-api/client');
}

/**
 * Create flash message utilities bound to a session
 */
export function createFlashUtils(session: Session<FlashSessionData>) {
  return {
    set: (category: FlashCategory, message: string, metadata?: Record<string, unknown>) =>
      setFlash(session, category, message, metadata),

    success: (message: string, metadata?: Record<string, unknown>) =>
      setFlashSuccess(session, message, metadata),

    error: (message: string, metadata?: Record<string, unknown>) =>
      setFlashError(session, message, metadata),

    warning: (message: string, metadata?: Record<string, unknown>) =>
      setFlashWarning(session, message, metadata),

    info: (message: string, metadata?: Record<string, unknown>) =>
      setFlashInfo(session, message, metadata),

    get: () => getFlashMessages(session),

    getByCategory: (category: FlashCategory) =>
      getFlashMessagesByCategory(session, category),

    peek: () => peekFlashMessages(session),

    clear: () => clearFlashMessages(session),

    has: () => hasFlashMessages(session),
  };
}

/**
 * Serialize flash messages for client hydration
 */
export function serializeFlashMessages(messages: FlashMessage[]): string {
  return JSON.stringify(messages);
}

/**
 * Deserialize flash messages from JSON
 */
export function deserializeFlashMessages(json: string): FlashMessage[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/**
 * Flash message middleware for automatic injection
 */
export function flashMiddleware<T extends FlashSessionData>(
  sessionStorage: SessionStorage<T>
) {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    const session = await sessionStorage.getSession(request);

    // Process the request
    const response = await next();

    // Commit session with flash messages
    const setCookie = await sessionStorage.commitSession(session);

    // Add Set-Cookie header
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', setCookie);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
