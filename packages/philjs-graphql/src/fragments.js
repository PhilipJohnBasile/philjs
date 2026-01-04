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
/**
 * Fragment Registry
 * Manages fragment definitions and prevents duplicates
 */
export class FragmentRegistry {
    fragments = new Map();
    fragmentsByType = new Map();
    /**
     * Register a fragment
     */
    register(fragment) {
        // Check for duplicate fragment names
        if (this.fragments.has(fragment.name)) {
            const existing = this.fragments.get(fragment.name);
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
        this.fragmentsByType.get(fragment.on).add(fragment.name);
    }
    /**
     * Get a fragment by name
     */
    get(name) {
        return this.fragments.get(name);
    }
    /**
     * Get all fragments for a type
     */
    getFragmentsForType(typeName) {
        const fragmentNames = this.fragmentsByType.get(typeName);
        if (!fragmentNames)
            return [];
        return Array.from(fragmentNames)
            .map((name) => this.fragments.get(name))
            .filter((f) => f !== undefined);
    }
    /**
     * Get all registered fragments
     */
    getAll() {
        return Array.from(this.fragments.values());
    }
    /**
     * Check if a fragment is registered
     */
    has(name) {
        return this.fragments.has(name);
    }
    /**
     * Get fragment document as string
     */
    getFragmentDocument(name) {
        const fragment = this.fragments.get(name);
        if (!fragment)
            return undefined;
        return this.documentToString(fragment.document);
    }
    /**
     * Collect all fragment documents for a query
     * Includes nested fragments
     */
    collectFragmentDocuments(fragmentNames) {
        const collected = new Set();
        const toProcess = [...fragmentNames];
        while (toProcess.length > 0) {
            const name = toProcess.pop();
            if (collected.has(name))
                continue;
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
    extractFragmentSpreads(document) {
        const spreadRegex = /\.\.\.(\w+)/g;
        const matches = [];
        let match;
        while ((match = spreadRegex.exec(document)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
    /**
     * Convert DocumentNode to string if needed
     */
    documentToString(doc) {
        if (typeof doc === 'string') {
            return doc;
        }
        return doc.loc?.source?.body || String(doc);
    }
    /**
     * Clear all fragments
     */
    clear() {
        this.fragments.clear();
        this.fragmentsByType.clear();
    }
    /**
     * Get registry size
     */
    get size() {
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
export function defineFragment(name, on, document, registry = globalRegistry) {
    const fragment = {
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
export function maskFragment(fragment, data) {
    return {
        __fragmentId: `${fragment.name}_${fragment.on}`,
        __fragmentName: fragment.name,
        __data: data,
    };
}
/**
 * Unmask fragment data to access the underlying data
 */
export function unmaskFragment(fragment, masked) {
    if (masked.__fragmentName !== fragment.name) {
        throw new Error(`Fragment mismatch: expected "${fragment.name}", got "${masked.__fragmentName}"`);
    }
    return masked.__data;
}
/**
 * Check if data is a masked fragment
 */
export function isMaskedFragment(data) {
    return (data !== null &&
        typeof data === 'object' &&
        '__fragmentId' in data &&
        '__fragmentName' in data &&
        '__data' in data);
}
/**
 * Spread fragment into a query
 * Returns the fragment spread syntax and ensures fragment is in registry
 */
export function spreadFragment(fragment, registry = globalRegistry) {
    // Ensure fragment is registered
    if (!registry.has(fragment.name)) {
        registry.register(fragment);
    }
    return `...${fragment.name}`;
}
/**
 * Compose multiple fragments into a single document
 */
export function composeFragments(fragments, registry = globalRegistry) {
    const fragmentDocs = [];
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
export function buildQueryWithFragments(query, registry = globalRegistry) {
    // Extract fragment spreads from the query
    const spreadRegex = /\.\.\.(\w+)/g;
    const fragmentNames = new Set();
    let match;
    while ((match = spreadRegex.exec(query)) !== null) {
        fragmentNames.add(match[1]);
    }
    if (fragmentNames.size === 0) {
        return query;
    }
    // Collect all fragment documents (including nested)
    const fragmentDocs = registry.collectFragmentDocuments(Array.from(fragmentNames));
    // Combine query with fragments
    return `${query}\n\n${fragmentDocs.join('\n\n')}`;
}
/**
 * Type-safe fragment data access
 * Uses fragment definition to type the data
 */
export function useFragment(fragment, data) {
    if (isMaskedFragment(data)) {
        return unmaskFragment(fragment, data);
    }
    // Return data as-is if not masked
    return data;
}
/**
 * Fragment colocation helper
 * Attaches fragment to a component for easy discovery
 */
export function withFragment(Component, fragment) {
    Component.fragment = fragment;
    return Component;
}
/**
 * Extract fragment from a component
 */
export function getComponentFragment(Component) {
    return Component.fragment;
}
/**
 * Merge multiple fragment data objects
 * Useful when combining data from multiple fragments on the same type
 */
export function mergeFragmentData(...fragments) {
    return Object.assign({}, ...fragments);
}
/**
 * Create a typed fragment selector
 * Allows selecting specific fields from fragment data
 */
export function selectFromFragment(fragment, data, selector) {
    const unmasked = isMaskedFragment(data) ? unmaskFragment(fragment, data) : data;
    return selector(unmasked);
}
/**
 * Get the global fragment registry
 */
export function getFragmentRegistry() {
    return globalRegistry;
}
/**
 * Create a new isolated fragment registry
 */
export function createFragmentRegistry() {
    return new FragmentRegistry();
}
/**
 * Fragment definition helper with template literal
 */
export function fragment(strings, ...values) {
    const document = strings.reduce((result, str, i) => {
        return result + str + (values[i] || '');
    }, '');
    return (name, on) => {
        return defineFragment(name, on, document);
    };
}
/**
 * Inline fragment helper
 * Creates an inline fragment condition
 */
export function inlineFragment(typeName, fields) {
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
    queryUsesFragment(query, fragmentName) {
        const regex = new RegExp(`\\.\\.\\.${fragmentName}\\b`);
        return regex.test(query);
    },
    /**
     * Remove unused fragment definitions from a document
     */
    removeUnusedFragments(document) {
        // Extract all fragment definitions
        const fragmentDefRegex = /fragment\s+(\w+)\s+on\s+\w+\s*{[^}]*}/g;
        const fragmentDefs = new Map();
        let match;
        while ((match = fragmentDefRegex.exec(document)) !== null) {
            fragmentDefs.set(match[1], match[0]);
        }
        // Find which fragments are actually used
        const usedFragments = new Set();
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
    deduplicateFragments(document) {
        const fragmentDefRegex = /fragment\s+(\w+)\s+on\s+\w+\s*{[^}]*}/g;
        const seenFragments = new Set();
        let deduplicated = document;
        let match;
        while ((match = fragmentDefRegex.exec(document)) !== null) {
            const fragmentName = match[1];
            if (seenFragments.has(fragmentName)) {
                // Remove duplicate
                deduplicated = deduplicated.replace(match[0], '').trim();
            }
            else {
                seenFragments.add(fragmentName);
            }
        }
        return deduplicated;
    },
};
//# sourceMappingURL=fragments.js.map