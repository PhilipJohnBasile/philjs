/**
 * PhilJS Migration Tool
 *
 * Automatically migrate from React, Vue, Angular, or Svelte to PhilJS.
 */
export interface MigrationOptions {
    source: 'react' | 'vue' | 'angular' | 'svelte' | 'solid';
    targetDir: string;
    dryRun?: boolean;
    typescript?: boolean;
    preserveComments?: boolean;
}
export interface MigrationResult {
    success: boolean;
    filesProcessed: number;
    filesModified: number;
    errors: MigrationError[];
    warnings: string[];
}
export interface MigrationError {
    file: string;
    line?: number;
    message: string;
    suggestion?: string;
}
declare const REACT_TRANSFORMS: {
    imports: {
        react: string;
        'react-dom': string;
        'react-dom/client': string;
    };
    hooks: {
        useState: string;
        useEffect: string;
        useMemo: string;
        useCallback: string;
        useRef: string;
        useContext: string;
        useReducer: string;
    };
    patterns: {
        from: RegExp;
        to: string;
    }[];
};
declare const VUE_TRANSFORMS: {
    imports: {
        vue: string;
        '@vue/reactivity': string;
    };
    api: {
        ref: string;
        reactive: string;
        computed: string;
        watch: string;
        watchEffect: string;
        onMounted: string;
        onUnmounted: string;
    };
    patterns: {
        from: RegExp;
        to: string;
    }[];
};
declare const SVELTE_TRANSFORMS: {
    stores: {
        writable: string;
        readable: string;
        derived: string;
    };
    patterns: {
        from: RegExp;
        to: string;
    }[];
};
declare const ANGULAR_TRANSFORMS: {
    decorators: {
        '@Component': string;
        '@Input': string;
        '@Output': string;
    };
    patterns: {
        from: RegExp;
        to: string;
    }[];
};
export declare function migrate(options: MigrationOptions): Promise<MigrationResult>;
export declare function analyzeProject(dir: string): {
    framework: string;
    files: number;
    complexity: 'low' | 'medium' | 'high';
};
export { REACT_TRANSFORMS, VUE_TRANSFORMS, SVELTE_TRANSFORMS, ANGULAR_TRANSFORMS };
//# sourceMappingURL=index.d.ts.map