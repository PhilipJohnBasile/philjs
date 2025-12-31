# Testing

Use `@philjs/testing` for unit and integration tests.

```tsx
import { render, screen } from "@philjs/testing";
import { App } from "./App";

render(() => <App />);
expect(screen.getByText("PhilJS Counter")).toBeTruthy();
```

For end-to-end tests, use Playwright with the example app setups.
