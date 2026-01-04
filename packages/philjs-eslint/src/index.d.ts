export declare const rules: {
    'no-unused-signals': import("@typescript-eslint/utils/ts-eslint").RuleModule<"unusedSignal", [], unknown, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
    'effect-cleanup-required': import("@typescript-eslint/utils/ts-eslint").RuleModule<"missingCleanup" | "cleanupNotReturned", [], unknown, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
    'prefer-memo-for-expensive': import("@typescript-eslint/utils/ts-eslint").RuleModule<"preferMemo", [{
        threshold?: number;
    }], unknown, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
};
export declare const configs: {
    recommended: {
        plugins: string[];
        rules: {
            'philjs/no-unused-signals': string;
            'philjs/effect-cleanup-required': string;
            'philjs/prefer-memo-for-expensive': string;
        };
    };
};
//# sourceMappingURL=index.d.ts.map