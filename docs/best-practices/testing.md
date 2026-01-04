# Testing Best Practices

## Strategy Pyramid

1. **Unit Tests** (70%): Fast, isolated tests for utilities and logic. Use `vitest`.
2. **Component Tests** (20%): Test UI interaction. Use `@philjs/testing` (React Testing Library compat).
3. **E2E Tests** (10%): Full user flows. Use Playwright via `@philjs/playwright`.

## Utilities

- `renderHook`: For testing custom hooks/signals.
- `userEvent`: For simulating user interaction.
