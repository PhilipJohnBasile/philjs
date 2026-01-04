# Error Handling Patterns

## Error Boundaries

Wrap parts of your UI in `<ErrorBoundary fallback={<ErrorUI />}>` to catch render errors.

## API Errors

Use `try/catch` in async actions or the `onError` callback in `@philjs/query`.

## Global Handling

Configure a global error handler in your entry point:

```typescript
setGlobalErrorHandler((err) => {
  logToService(err);
  showToast("Something went wrong");
});
```
