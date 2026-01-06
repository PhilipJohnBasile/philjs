/**
 * PhilJS UI - Classname utility
 *
 * A lightweight utility for conditionally joining class names together.
 * Inspired by clsx/classnames but optimized for PhilJS.
 */

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

/**
 * Joins class names together, filtering out falsy values.
 * Supports strings, arrays, and objects with conditional classes.
 *
 * @example
 * ```tsx
 * cn('btn', 'btn-primary') // 'btn btn-primary'
 * cn('btn', isActive && 'active') // 'btn active' or 'btn'
 * cn('btn', { active: isActive, disabled: isDisabled })
 * cn(['btn', 'btn-primary'], { active: true })
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Merges multiple class strings into one, removing duplicates.
 * Useful when combining component defaults with user-provided classes.
 *
 * @example
 * ```tsx
 * mergeClasses('px-4 py-2', 'px-6') // 'py-2 px-6'
 * ```
 */
export function mergeClasses(...classes: (string | undefined | null)[]): string {
  const classMap = new Map<string, string>();

  for (const classString of classes) {
    if (!classString) continue;

    for (const cls of classString.split(/\s+/)) {
      if (!cls) continue;

      // Extract the base class name (e.g., 'px' from 'px-4')
      const match = cls.match(/^([a-z]+(?:-[a-z]+)*)/);
      const base = match ? match[1] : cls;

      classMap.set(base, cls);
    }
  }

  return Array.from(classMap.values()).join(' ');
}

export default cn;
