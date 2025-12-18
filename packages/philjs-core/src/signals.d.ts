/**
 * Fine-grained reactive signals implementation for PhilJS.
 * Inspired by SolidJS with automatic dependency tracking.
 */
import type { Signal, Memo, LinkedSignal, LinkedSignalOptions, Resource, EffectCleanup, EffectFunction, ResourceFetcher } from './types.js';
export type { Signal, Memo, LinkedSignal, LinkedSignalOptions, Resource, EffectCleanup, EffectFunction, ResourceFetcher };
/**
 * Create a reactive signal with automatic dependency tracking.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * console.log(count()); // 0
 * count.set(5);
 * console.log(count()); // 5
 * count.set(c => c + 1); // Updater function
 * ```
 */
export declare function signal<T>(initialValue: T): Signal<T>;
/**
 * Create a memoized computation that automatically tracks dependencies.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const doubled = memo(() => count() * 2);
 * console.log(doubled()); // 0
 * count.set(5);
 * console.log(doubled()); // 10
 * ```
 */
export declare function memo<T>(calc: () => T): Memo<T>;
/**
 * Create a writable computed signal (like Angular's linkedSignal).
 * Acts like a memo by default, but can be manually overridden.
 * When dependencies change, it resets to the computed value unless configured otherwise.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
 *
 * console.log(fullName()); // "John Doe"
 * fullName.set('Jane Smith'); // Manual override
 * console.log(fullName()); // "Jane Smith"
 * console.log(fullName.isOverridden()); // true
 *
 * firstName.set('Bob'); // Dependency changed - resets to computed
 * console.log(fullName()); // "Bob Doe"
 * console.log(fullName.isOverridden()); // false
 * ```
 */
export declare function linkedSignal<T>(computation: () => T, options?: LinkedSignalOptions): LinkedSignal<T>;
/**
 * Create a side effect that automatically tracks dependencies and re-runs when they change.
 * Returns a cleanup function to dispose the effect.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 *   return () => console.log('Cleanup!');
 * });
 *
 * count.set(5); // Logs: "Cleanup!" then "Count is: 5"
 * dispose(); // Stop the effect
 * ```
 */
export declare function effect(fn: EffectFunction): EffectCleanup;
/**
 * Batch multiple signal updates into a single update cycle.
 * This prevents unnecessary re-computations.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * batch(() => {
 *   firstName.set('Jane');
 *   lastName.set('Smith');
 * }); // Only triggers one update to dependents
 * ```
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Run a function without tracking dependencies.
 * Useful for reading signals without creating dependencies.
 *
 * @example
 * ```ts
 * const a = signal(1);
 * const b = signal(2);
 *
 * const sum = memo(() => {
 *   const aVal = a(); // Tracked
 *   const bVal = untrack(() => b()); // Not tracked
 *   return aVal + bVal;
 * });
 *
 * b.set(100); // Won't trigger sum to recompute
 * a.set(5); // Will trigger sum to recompute
 * ```
 */
export declare function untrack<T>(fn: () => T): T;
/**
 * Register a cleanup function to be called when the current effect is disposed.
 *
 * @example
 * ```ts
 * effect(() => {
 *   const timer = setInterval(() => console.log('tick'), 1000);
 *   onCleanup(() => clearInterval(timer));
 * });
 * ```
 */
export declare function onCleanup(cleanup: EffectCleanup): void;
/**
 * Create a root scope for effects that lives until explicitly disposed.
 * Useful for managing long-lived reactive scopes.
 *
 * @example
 * ```ts
 * const dispose = createRoot(dispose => {
 *   const count = signal(0);
 *   effect(() => console.log(count()));
 *   return dispose; // Return dispose function
 * });
 *
 * // Later...
 * dispose(); // Clean up all effects
 * ```
 */
export declare function createRoot<T>(fn: (dispose: () => void) => T): T;
/**
 * Create a resource that tracks loading and error states.
 *
 * @example
 * ```ts
 * const userId = signal(1);
 * const user = resource(async () => {
 *   const response = await fetch(`/api/users/${userId()}`);
 *   return response.json();
 * });
 *
 * if (user.loading()) {
 *   return <div>Loading...</div>;
 * }
 * if (user.error()) {
 *   return <div>Error: {user.error().message}</div>;
 * }
 * return <div>User: {user().name}</div>;
 * ```
 */
export declare function resource<T>(fetcher: ResourceFetcher<T>): Resource<T>;
//# sourceMappingURL=signals.d.ts.map