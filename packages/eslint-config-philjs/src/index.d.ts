/**
 * ESLint configuration for PhilJS projects.
 * Includes a11y and security plugins.
 */
declare const _default: {
    plugins: {
        "jsx-a11y": import("eslint").ESLint.Plugin;
        security: import("eslint").ESLint.Plugin;
    };
    rules: {
        "jsx-a11y/alt-text": string;
        "jsx-a11y/anchor-has-content": string;
        "jsx-a11y/aria-props": string;
        "jsx-a11y/aria-role": string;
        "security/detect-object-injection": string;
        "security/detect-non-literal-regexp": string;
        "security/detect-unsafe-regex": string;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map