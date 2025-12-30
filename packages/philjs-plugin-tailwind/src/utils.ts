/**
 * Tailwind CSS utility functions
 */

/**
 * Class name type
 */
export type ClassName = string | undefined | null | false | 0 | ClassName[];

/**
 * Advanced class merging with conflict resolution
 * Handles Tailwind-specific conflicts (e.g., px-4 vs px-6)
 */
export function cn(...inputs: ClassName[]): string {
  const classes: string[] = [];

  function flatten(input: ClassName): void {
    if (!input) return;

    if (Array.isArray(input)) {
      input.forEach(flatten);
      return;
    }

    if (typeof input === "string") {
      input.split(" ").forEach((cls) => {
        if (cls) classes.push(cls);
      });
    }
  }

  flatten(inputs);

  // Conflict resolution - keep last occurrence of conflicting utilities
  const conflicts = new Map<string, string>();

  // Utility prefixes that can conflict
  const conflictPrefixes = [
    "p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-",
    "m-", "mx-", "my-", "mt-", "mr-", "mb-", "ml-",
    "w-", "h-", "min-w-", "max-w-", "min-h-", "max-h-",
    "text-", "font-", "bg-", "border-", "rounded-",
    "flex-", "grid-", "gap-", "space-x-", "space-y-",
    "top-", "right-", "bottom-", "left-", "inset-",
    "z-", "opacity-", "shadow-", "ring-",
  ];

  const result: string[] = [];

  for (const cls of classes) {
    // Check for conflicts
    let hasConflict = false;
    for (const prefix of conflictPrefixes) {
      if (cls.startsWith(prefix)) {
        conflicts.set(prefix, cls);
        hasConflict = true;
        break;
      }
    }

    // If no conflict, add directly
    if (!hasConflict) {
      result.push(cls);
    }
  }

  // Add resolved conflicts
  result.push(...conflicts.values());

  return result.join(" ");
}

/**
 * Conditional class names
 */
export function clsx(...inputs: ClassName[]): string {
  return cn(...inputs);
}

/**
 * Create a variant class generator
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
): (props: { [K in keyof T]?: keyof T[K] }) => string {
  return (props) => {
    const classes: string[] = [];

    for (const [variant, options] of Object.entries(variants)) {
      const selectedOption = props[variant as keyof typeof props];
      if (selectedOption && typeof selectedOption === "string") {
        const className = options[selectedOption];
        if (className) {
          classes.push(className);
        }
      }
    }

    return classes.join(" ");
  };
}

/**
 * Responsive utility generator
 */
export function responsive(
  base: string,
  breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  }
): string {
  const classes = [base];

  if (breakpoints) {
    for (const [bp, value] of Object.entries(breakpoints)) {
      if (value) classes.push(`${bp}:${value}`);
    }
  }

  return classes.join(" ");
}

/**
 * State variants generator
 */
export function withStates(
  base: string,
  options: {
    hover?: boolean | string;
    focus?: boolean | string;
    active?: boolean | string;
    disabled?: boolean | string;
    group?: boolean | string;
    peer?: boolean | string;
  } = {}
): string {
  const classes = [base];

  for (const [state, value] of Object.entries(options)) {
    if (value === true) {
      classes.push(`${state}:${base}`);
    } else if (typeof value === "string") {
      classes.push(`${state}:${value}`);
    }
  }

  return classes.join(" ");
}

/**
 * Dark mode utility
 */
export function dark(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`;
}

/**
 * Generate container queries
 */
export function container(
  base: string,
  sizes?: {
    "@sm"?: string;
    "@md"?: string;
    "@lg"?: string;
    "@xl"?: string;
  }
): string {
  const classes = [base];

  if (sizes) {
    for (const [size, value] of Object.entries(sizes)) {
      if (value) classes.push(`${size}:${value}`);
    }
  }

  return classes.join(" ");
}

/**
 * CSS variable to Tailwind class converter
 */
export function cssVarToClass(varName: string, value: string): string {
  // Simple conversion - can be enhanced
  const cleanName = varName.replace(/^--/, "").replace(/-/g, "_");
  return `[--${cleanName}:${value}]`;
}

/**
 * Extract Tailwind classes from a string
 */
export function extractClasses(content: string): string[] {
  const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
  const classes: string[] = [];
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    const matchedClasses = match[1];
    if (matchedClasses) {
      classes.push(...matchedClasses.split(" ").filter(Boolean));
    }
  }

  return [...new Set(classes)];
}

/**
 * Validate Tailwind class name
 */
export function isValidClass(className: string): boolean {
  // Basic validation - checks for valid Tailwind syntax
  const validPattern = /^[a-z0-9-:.\/\[\]]+$/i;
  return validPattern.test(className);
}

/**
 * Sort classes by Tailwind's recommended order
 */
export function sortClasses(classes: string[]): string[] {
  const order = [
    // Layout
    "container", "box-", "block", "inline", "flex", "grid", "table",
    // Positioning
    "static", "fixed", "absolute", "relative", "sticky",
    // Display & Visibility
    "hidden", "visible", "invisible",
    // Sizing
    "w-", "h-", "min-", "max-",
    // Spacing
    "p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-",
    "m-", "mx-", "my-", "mt-", "mr-", "mb-", "ml-",
    // Typography
    "text-", "font-", "leading-", "tracking-", "align-",
    // Colors
    "bg-", "text-", "border-", "ring-",
    // Borders
    "border", "rounded-",
    // Effects
    "shadow-", "opacity-", "blur-",
    // Transitions
    "transition", "duration-", "ease-",
  ];

  return classes.sort((a, b) => {
    const aIndex = order.findIndex((prefix) => a.startsWith(prefix));
    const bIndex = order.findIndex((prefix) => b.startsWith(prefix));

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

/**
 * Generate arbitrary value class
 */
export function arbitrary(property: string, value: string): string {
  return `[${property}:${value}]`;
}

/**
 * Merge multiple theme configs
 */
export function mergeThemes(
  ...themes: Array<Record<string, any>>
): Record<string, any> {
  const merged: Record<string, any> = {};

  for (const theme of themes) {
    for (const [key, value] of Object.entries(theme)) {
      if (typeof value === "object" && !Array.isArray(value)) {
        merged[key] = {
          ...(merged[key] || {}),
          ...value,
        };
      } else {
        merged[key] = value;
      }
    }
  }

  return merged;
}
