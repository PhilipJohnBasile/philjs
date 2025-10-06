# Error Handling Best Practices

Robust error handling patterns for production applications.

## Error Boundaries

```tsx
import { ErrorBoundary } from 'philjs-core';

export default function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MainApp />
    </ErrorBoundary>
  );
}
```

## Async Error Handling

```tsx
const handleSubmit = async () => {
  try {
    await submitForm();
  } catch (error) {
    if (error instanceof ValidationError) {
      setErrors(error.errors);
    } else {
      showErrorToast(error.message);
    }
  }
};
```

## Best Practices

### ✅ Do: Use Error Boundaries

```tsx
// ✅ Good - catches errors
<ErrorBoundary fallback={<Error />}>
  <Component />
</ErrorBoundary>
```

### ✅ Do: Log Errors

```tsx
// ✅ Good - log to monitoring service
catch (error) {
  logError(error);
  showUserFriendlyMessage();
}
```

## Next Steps

- [Testing](/docs/best-practices/testing.md) - Test error handling
- [Deployment](/docs/best-practices/deployment.md) - Production errors

---

💡 **Tip**: Always provide user-friendly error messages.

⚠️ **Warning**: Never expose stack traces to end users in production.

ℹ️ **Note**: Use error boundaries for component errors, try/catch for async.
