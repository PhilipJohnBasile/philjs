/**
 * SuperJSON Usage Examples
 * Demonstrates various use cases for SuperJSON serialization
 */
/**
 * Example 1: Basic Date serialization
 */
export declare function exampleBasicDate(): {
    created: Date;
    updated: Date;
};
/**
 * Example 2: Map and Set serialization
 */
export declare function exampleMapAndSet(): {
    userRoles: Map<string, Set<string>>;
    settings: Map<string, string>;
};
/**
 * Example 3: Complex nested structures
 */
export declare function exampleComplexStructure(): {
    user: {
        id: bigint;
        name: string;
        registered: Date;
        preferences: {
            notifications: Set<string>;
            filters: RegExp;
        };
    };
    posts: Map<number, {
        title: string;
        views: undefined;
    } | {
        title: string;
        views: number;
    }>;
    metadata: {
        version: number;
        data: Uint8Array<ArrayBuffer>;
        score: number;
        infinity: number;
    };
};
/**
 * Example 4: Custom class serialization
 */
export declare function exampleCustomClass(): {
    start: {
        x: number;
        y: number;
        distance(other: /*elided*/ any): number;
    };
    end: {
        x: number;
        y: number;
        distance(other: /*elided*/ any): number;
    };
};
/**
 * Example 5: Global custom type registration
 */
export declare function exampleGlobalCustomTypes(): {
    primary: {
        hex: string;
        toRGB(): {
            r: number;
            g: number;
            b: number;
        };
    };
    secondary: {
        hex: string;
        toRGB(): {
            r: number;
            g: number;
            b: number;
        };
    };
};
/**
 * Example 6: Compression for large payloads
 */
export declare function exampleCompression(): Promise<{
    users: {
        id: number;
        name: string;
        email: string;
        created: Date;
        tags: Set<string>;
    }[];
}>;
/**
 * Example 7: Lazy deserialization
 */
export declare function exampleLazyDeserialization(): {
    metadata: unknown;
    lazyLargeData: import("./superjson-perf.js").LazyValue<unknown>;
};
/**
 * Example 8: Streaming serialization/deserialization
 */
export declare function exampleStreaming(): Promise<Partial<unknown>>;
export interface UserData {
    id: bigint;
    name: string;
    created: Date;
    tags: Set<string>;
}
/**
 * Example 9: RPC with SuperJSON (would be used with philjs-rpc)
 */
export declare function exampleRPCIntegration(): UserData;
export interface LoaderData {
    user: {
        id: bigint;
        name: string;
        registered: Date;
    };
    posts: Map<number, {
        title: string;
        published: Date;
    }>;
    settings: {
        theme: string;
        notifications: Set<string>;
    };
}
/**
 * Example 10: SSR loader data serialization
 */
export declare function exampleSSRLoader(): {
    hydrated: LoaderData;
    scriptContent: string;
};
/**
 * Example 11: Handling edge cases
 */
export declare function exampleEdgeCases(): {
    nan: number;
    infinity: number;
    negInfinity: number;
    negZero: number;
    undef: undefined;
    nullValue: null;
    emptyMap: Map<any, any>;
    emptySet: Set<unknown>;
    emptyArray: never[];
    emptyObject: {};
    nested: {
        value: undefined;
        array: (number | undefined)[];
    };
};
/**
 * Run all examples (for testing/demonstration).
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=superjson-examples.d.ts.map