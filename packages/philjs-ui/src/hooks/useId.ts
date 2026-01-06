/**
 * PhilJS UI - useId Hook
 *
 * Generates unique IDs for accessibility attributes.
 */

let idCounter = 0;

/**
 * Generates a unique ID for use in accessibility attributes.
 * The ID is stable across re-renders within the same component instance.
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 *
 * @example
 * ```tsx
 * function FormField(props: { label: string }) {
 *   const id = useId('field');
 *   return (
 *     <>
 *       <label htmlFor={id}>{props.label}</label>
 *       <input id={id} />
 *     </>
 *   );
 * }
 * ```
 */
export function useId(prefix = 'philjs'): string {
  // Increment counter for each call
  const id = ++idCounter;
  return `${prefix}-${id}`;
}

/**
 * Generates multiple related IDs for complex components.
 *
 * @example
 * ```tsx
 * const ids = useIds('modal', ['trigger', 'title', 'description', 'content']);
 * // { trigger: 'modal-1-trigger', title: 'modal-1-title', ... }
 * ```
 */
export function useIds<T extends string>(
  prefix: string,
  names: readonly T[]
): Record<T, string> {
  const baseId = useId(prefix);
  const result = {} as Record<T, string>;

  for (const name of names) {
    result[name] = `${baseId}-${name}`;
  }

  return result;
}

/**
 * Creates an ID generator with a shared prefix.
 *
 * @example
 * ```tsx
 * const createId = useIdGenerator('form');
 * const emailId = createId('email');   // 'form-1-email'
 * const passId = createId('password'); // 'form-1-password'
 * ```
 */
export function useIdGenerator(prefix: string): (suffix: string) => string {
  const baseId = useId(prefix);
  return (suffix: string) => `${baseId}-${suffix}`;
}

export default useId;
