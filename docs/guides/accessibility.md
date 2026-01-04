# Accessibility (a11y) in PhilJS

PhilJS is designed to be accessible by default.

## Built-in Features

- **ARIA Primitives**: Use components from `@philjs/a11y-primitives` which handle focus management and keyboard navigation automatically.
- **Linting**: `eslint-plugin-jsx-a11y` is enabled by default.

## Best Practices

1. Use semantic HTML (`<button>` not `<div>`).
2. Ensure sufficient color contrast.
3. Test with a screen reader.
