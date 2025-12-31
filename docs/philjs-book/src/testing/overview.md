# Testing

PhilJS includes a first-party testing library that mirrors DOM Testing Library with PhilJS-aware utilities.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@philjs/testing";
import { Counter } from "../src/Counter";

describe("Counter", () => {
  it("increments", () => {
    render(() => <Counter />);
    fireEvent.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
```

## Run tests

```bash
pnpm test
pnpm --filter @philjs/core test:coverage
```
