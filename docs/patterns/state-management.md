# State Management Patterns

## When to use what?

1. **Local State**: Use `signal()` inside a component.
2. **Global State**: Export a `signal()` from a shared module.
3. **Complex State**: Use `@philjs/store` (Zustand-like) for actions/reducers.
4. **Server State**: Use `@philjs/query` (TanStack Query) for async data.

## Anti-Patterns

- Avoid "Prop Drilling". Use Context or Signals instead.
- Avoid large monolithic stores. Split state by domain.
