/**
 * ESLint configuration for PhilJS projects.
 * Includes a11y and security plugins.
 */
export default {
    plugins: {
        "jsx-a11y": (await import("eslint-plugin-jsx-a11y")).default,
        "security": (await import("eslint-plugin-security")).default
    },
    rules: {
        // Accessibility rules
        "jsx-a11y/alt-text": "error",
        "jsx-a11y/anchor-has-content": "error",
        "jsx-a11y/aria-props": "error",
        "jsx-a11y/aria-role": "error",
        // Security rules
        "security/detect-object-injection": "warn",
        "security/detect-non-literal-regexp": "warn",
        "security/detect-unsafe-regex": "error"
    }
};
//# sourceMappingURL=index.js.map