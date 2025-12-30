/**
 * PhilJS GraphQL Fragments
 *
 * Provides type-safe fragment utilities:
 * - Fragment colocation with components
 * - Fragment masking for data encapsulation
 * - Type-safe fragment spreading
 * - Fragment composition and merging
 * - Automatic fragment deduplication
 */

import type { DocumentNode } from 'graphql';

export interface FragmentDefinition<TData = any> {
  /** Fragment name */
  name: string;
  /** Fragment type condition (e.g., 'User', 'Post') */
  on: string;
  /** Fragment document */
  document: string | DocumentNode;
  /** Fragment data type */
  __type?: TData;
}

export interface MaskedFragment<TData = any> {
  /** Fragment identifier */
  __fragmentId: string;
  /** Fragment name */
  __fragmentName: string;
  /** Masked data (only accessible through unmask) */
  __data: TData;
}

/**
 * Fragment Registry
 * Manages fragment definitions and prevents duplicates
 */
export class FragmentRegistry {
  private fragments = new Map<string, FragmentDefinition>();
  private fragmentsByType = new Map<string, Set<string>>();

  /**
   * Register a fragment
   */
  register<TData = any>(fragment: FragmentDefinition<TData>): void {
    // Check for duplicate fragment names
    if (this.fragments.has(fragment.name)) {
      const existing = this.fragments.get(fragment.name)!;
      // Allow re-registration if the definition is identical
      if (this.documentToString(existing.document) === this.documentToString(fragment.document)) {
        return;
      }
      throw new Error(`Fragment "${fragment.name}" is already registered with a different definition`);
    }

    this.fragments.set(fragment.name, fragment);

    // Index by type
    if (!this.fragmentsByType.has(fragment.on)) {
      this.fragmentsByType.set(fragment.on, new Set());
    }
    this.fragmentsByType.get(fragment.on)!.add(fragment.name);
  }

  /**
   * Get a fragment by name
   */
  get<TData = any>(name: string): FragmentDefinition<TData> | undefined {
    return this.fragments.get(name) as FragmentDefinition<TData> | undefined;
  }

  /**
   * Get all fragments for a type
   */
  getFragmentsForType(typeName: string): FragmentDefinition[] {
    const fragmentNames = this.fragmentsByType.get(typeName);
    if (!fragmentNames) return [];

    return Array.from(fragmentNames)
      .map((name) => this.fragments.get(name))
      .filter((f): f is FragmentDefinition => f !== undefined);
  }

  /**
   * Get all registered fragments
   */
  getAll(): FragmentDefinition[] {
    return Array.from(this.fragments.values());
  }

  /**
   * Check if a fragment is registered
   */
  has(name: string): boolean {
    return this.fragments.has(name);
  }

  /**
   * Get fragment document as string
   */
  getFragmentDocument(name: string): string | undefined {
    const fragment = this.fragments.get(name);
    if (!fragment) return undefined;
    return this.documentToString(fragment.document);
  }

  /**
   * Collect all fragment documents for a query
   * Includes nested fragments
   */
  collectFragmentDocuments(fragmentNames: string[]): string[] {
    const collected = new Set<string>();
    const toProcess = [...fragmentNames];

    while (toProcess.length > 0) {
      const name = toProcess.pop()!;
      if (collected.has(name)) continue;

      const fragment = this.fragments.get(name);
      if (!fragment) {
        console.warn(`Fragment "${name}" not found in registry`);
        continue;
      }

      const doc = this.documentToString(fragment.document);
      collected.add(doc);

      // Find nested fragment spreads
      const nestedFragments = this.extractFragmentSpreads(doc);
      toProcess.push(...nestedFragments.filter((f) => !collected.has(f)));
    }

    return Array.from(collected);
  }

  /**
   * Extract fragment spread names from a document
   */
  private extractFragmentSpreads(document: string): string[] {
    const spreadRegex = /\.\.\.(\w+)/g;
    const matches: string[] = [];
    let match;

    while ((match = spreadRegex.exec(document)) !== null) {
      matches.push(match[1]!);
    }

    return matches;
  }

  /**
   * Convert DocumentNode to string if needed
   */
  private documentToString(doc: string | DocumentNode): string {
    if (typeof doc === 'string') {
      return doc;
    }
    return (doc as any).loc?.source?.body || String(doc);
  }

  /**
   * Clear all fragments
   */
  clear(): void {
    this.fragments.clear();
    this.fragmentsByType.clear();
  }

  /**
   * Get registry size
   */
  get size(): number {
    return this.fragments.size;
  }
}

/**
 * Global fragment registry instance
 */
const globalRegistry = new FragmentRegistry();

/**
 * Define a fragment with type safety
 */
export function defineFragment<TData = any>(
  name: string,
  on: string,
  document: string | DocumentNode,
  registry: FragmentRegistry = globalRegistry
): FragmentDefinition<TData> {
  const fragment: FragmentDefinition<TData> = {
    name,
    on,
    document,
  };

  registry.register(fragment);

  return fragment;
}

/**
 * Mask fragment data to enforce data encapsulation
 * Prevents accessing fields not defined in the fragment
 */
export function maskFragment<TData = any>(
  fragment: FragmentDefinition<TData>,
  data: TData
): MaskedFragment<TData> {
  return {
    __fragmentId: `${fragment.name}_${fragment.on}`,
    __fragmentName: fragment.name,
    __data: data,
  };
}

/**
 * Unmask fragment data to access the underlying data
 */
export function unmaskFragment<TData = any>(
  fragment: FragmentDefinition<TData>,
  masked: MaskedFragment<TData>
): TData {
  if (masked.__fragmentName !== fragment.name) {
    throw new Error(
      `Fragment mismatch: expected "${fragment.name}", got "${masked.__fragmentName}"`
    );
  }

  return masked.__data;
}

/**
 * Check if data is a masked fragment
 */
export function isMaskedFragment(data: any): data is MaskedFragment {
  return (
    data !== null &&
    typeof data === 'object' &&
    '__fragmentId' in data &&
    '__fragmentName' in data &&
    '__data' in data
  );
}

/**
 * Spread fragment into a query
 * Returns the fragment spread syntax and ensures fragment is in registry
 */
export function spreadFragment<TData = any>(
  fragment: FragmentDefinition<TData>,
  registry: FragmentRegistry = globalRegistry
): string {
  // Ensure fragment is registered
  if (!registry.has(fragment.name)) {
    registry.register(fragment);
  }

  return `...${fragment.name}`;
}

/**
 * Compose multiple fragments into a single document
 */
export function composeFragments(
  fragments: FragmentDefinition[],
  registry: FragmentRegistry = globalRegistry
): string {
  const fragmentDocs: string[] = [];

  fragments.forEach((fragment) => {
    // Register if not already registered
    if (!registry.has(fragment.name)) {
      registry.register(fragment);
    }

    const doc = registry.getFragmentDocument(fragment.name);
    if (doc) {
      fragmentDocs.push(doc);
    }
  });

  return fragmentDocs.join('\n\n');
}

/**
 * Build query with fragments
 * Automatically includes all required fragment definitions
 */
export function buildQueryWithFragments(
  query: string,
  registry: FragmentRegistry = globalRegistry
): string {
  // Extract fragment spreads from the query
  const spreadRegex = /\.\.\.(\w+)/g;
  const fragmentNames = new Set<string>();
  let match;

  while ((match = spreadRegex.exec(query)) !== null) {
    fragmentNames.add(match[1]!);
  }

  if (fragmentNames.size === 0) {
    return query;
  }

  // Collect all fragment documents (including nested)
  const fragmentDocs = registry.collectFragmentDocuments(
    Array.from(fragmentNames)
  );

  // Combine query with fragments
  return `${query}\n\n${fragmentDocs.join('\n\n')}`;
}

/**
 * Type-safe fragment data access
 * Uses fragment definition to type the data
 */
export function useFragment<TData = any>(
  fragment: FragmentDefinition<TData>,
  data: any
): TData {
  if (isMaskedFragment(data)) {
    return unmaskFragment(fragment, data);
  }

  // Return data as-is if not masked
  return data as TData;
}

/**
 * Fragment colocation helper
 * Attaches fragment to a component for easy discovery
 */
export function withFragment<TProps = any, TData = any>(
  Component: any,
  fragment: FragmentDefinition<TData>
): typeof Component & { fragment: FragmentDefinition<TData> } {
  (Component as any).fragment = fragment;
  return Component as typeof Component & { fragment: FragmentDefinition<TData> };
}

/**
 * Extract fragment from a component
 */
export function getComponentFragment<TData = any>(
  Component: any
): FragmentDefinition<TData> | undefined {
  return (Component as any).fragment;
}

/**
 * Merge multiple fragment data objects
 * Useful when combining data from multiple fragments on the same type
 */
export function mergeFragmentData<T extends Record<string, any>>(
  ...fragments: Partial<T>[]
): T {
  return Object.assign({}, ...fragments) as T;
}

/**
 * Create a typed fragment selector
 * Allows selecting specific fields from fragment data
 */
export function selectFromFragment<TData, TSelected>(
  fragment: FragmentDefinition<TData>,
  data: TData | MaskedFragment<TData>,
  selector: (data: TData) => TSelected
): TSelected {
  const unmasked = isMaskedFragment(data) ? unmaskFragment(fragment, data) : data;
  return selector(unmasked);
}

/**
 * Get the global fragment registry
 */
export function getFragmentRegistry(): FragmentRegistry {
  return globalRegistry;
}

/**
 * Create a new isolated fragment registry
 */
export function createFragmentRegistry(): FragmentRegistry {
  return new FragmentRegistry();
}

/**
 * Fragment definition helper with template literal
 */
export function fragment<TData = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): (name: string, on: string) => FragmentDefinition<TData> {
  const document = strings.reduce((result, str, i) => {
    return result + str + (values[i] || '');
  }, '');

  return (name: string, on: string) => {
    return defineFragment<TData>(name, on, document);
  };
}

/**
 * Inline fragment helper
 * Creates an inline fragment condition
 */
export function inlineFragment(typeName: string, fields: string): string {
  return `... on ${typeName} {
    ${fields}
  }`;
}

/**
 * Fragment optimization utilities
 */
export const FragmentUtils = {
  /**
   * Check if a query uses a specific fragment
   */
  queryUsesFragment(query: string, fragmentName: string): boolean {
    const regex = new RegExp(`\\.\\.\\.${fragmentName}\\b`);
    return regex.test(query);
  },

  /**
   * Remove unused fragment definitions from a document
   */
  removeUnusedFragments(document: string): string {
    // Extract all fragment definitions
    const fragmentDefRegex = /fragment\s+(\w+)\s+on\s+\w+\s*{[^}]*}/g;
    const fragmentDefs = new Map<string, string>();
    let match;

    while ((match = fragmentDefRegex.exec(document)) !== null) {
      fragmentDefs.set(match[1]!, match[0]);
    }

    // Find which fragments are actually used
    const usedFragments = new Set<string>();
    for (const [name] of fragmentDefs) {
      if (this.queryUsesFragment(document, name)) {
        usedFragments.add(name);
      }
    }

    // Remove unused fragment definitions
    let optimized = document;
    for (const [name, def] of fragmentDefs) {
      if (!usedFragments.has(name)) {
        optimized = optimized.replace(def, '').trim();
      }
    }

    return optimized;
  },

  /**
   * Deduplicate fragment definitions in a document
   */
  deduplicateFragments(document: string): string {
    const fragmentDefRegex = /fragment\s+(\w+)\s+on\s+\w+\s*{[^}]*}/g;
    const seenFragments = new Set<string>();
    let deduplicated = document;

    let match;
    while ((match = fragmentDefRegex.exec(document)) !== null) {
      const fragmentName = match[1]!;
      if (seenFragments.has(fragmentName)) {
        // Remove duplicate
        deduplicated = deduplicated.replace(match[0], '').trim();
      } else {
        seenFragments.add(fragmentName);
      }
    }

    return deduplicated;
  },
};
