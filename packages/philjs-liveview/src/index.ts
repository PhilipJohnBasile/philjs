/**
 * PhilJS LiveView - Server-Driven UI
 *
 * Phoenix LiveView-style real-time server rendering with minimal client JS.
 * The server maintains state and renders HTML, sending DOM patches over WebSocket.
 *
 * Features:
 * - Server-rendered HTML with real-time updates
 * - DOM diffing and patching via morphdom
 * - Optimistic UI updates
 * - Form handling with validation
 * - Navigation without full page reloads
 * - Hooks for client-side interop
 * - Minimal JavaScript footprint
 *
 * @example
 * ```typescript
 * // Server-side LiveView component
 * const CounterView = createLiveView({
 *   mount: (socket) => {
 *     return { count: 0 };
 *   },
 *
 *   handleEvent: (event, state, socket) => {
 *     switch (event.type) {
 *       case 'increment':
 *         return { count: state.count + 1 };
 *       case 'decrement':
 *         return { count: state.count - 1 };
 *       default:
 *         return state;
 *     }
 *   },
 *
 *   render: (state) => `
 *     <div>
 *       <h1>Count: ${state.count}</h1>
 *       <button phx-click="increment">+</button>
 *       <button phx-click="decrement">-</button>
 *     </div>
 *   `,
 * });
 * ```
 */

// Core exports
export * from './types';
export * from './live-view';
export * from './live-component';
export * from './live-socket';
export * from './differ';
export * from './hooks';
export * from './forms';
export * from './navigation';

// Re-export client and server
export * from './client';
export * from './server';
