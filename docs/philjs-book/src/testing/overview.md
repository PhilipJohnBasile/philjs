# Chapter 8: Confidence at Scale

Unit tests are not enough. In a deterministic system, unit tests prove that A + B = C. But the Nexus is not deterministic. It involves async data, distributed systems, and non-deterministic AI agents.

To sleep at night, you need **Confidence at Scale**.

## The Testing Pyramid (Reimagined)

PhilJS advocates for a pragmatic testing strategy:

1.  **Static Analysis** (Types): The first line of defense.
2.  **Unit Tests** (Logic): Pure functions, Signals, and Reducers.
3.  **Component Tests** (Interaction): The DOM boundary.
4.  **Fuzz Tests** (Chaos): Throwing garbage at the system.

## Unit Testing Signals

Because Signals are just functions, they are trivial to test. You don't need a browser mock.

```typescript
import { signal, memo } from "@philjs/core";
import { expect, test } from "vitest";

test("reactive flow", () => {
    const quantity = signal(2);
    const price = signal(10);
    const total = memo(() => quantity() * price());

    expect(total()).toBe(20);

    quantity.set(3);
    expect(total()).toBe(30);
});
```

## Testing Components

PhilJS provides `@philjs/testing`, a lightweight wrapper around standard DOM APIs.

```typescript
import { render, screen, fireEvent } from "@philjs/testing";
import { Counter } from "./Counter";

test("counter increments", async () => {
    render(() => <Counter />);
    
    // Query by Role (Accessibility First)
    const button = screen.getByRole("button", { name: /increment/i });
    
    await fireEvent.click(button);
    
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

## Fuzzing AI Agents

How do you test an Agent that produces different output every time? You cannot assert `result === "expected"`.

You use **Semantic Assertions** and **Fuzzing**.

The `@philjs/test` package provides `fuzzAI`. It runs your agent against hundreds of generated scenarios and uses a smaller, faster model (the "Judge") to score the output.

```typescript
import { fuzzAI } from "@philjs/test";
import { MyAgent } from "./agent";

test("agent handles hostile input", async () => {
    await fuzzAI({
        agent: MyAgent,
        scenarios: 100,
        // The fuzzer will inject prompt injections, garbage execution, and edge cases
        strategies: ["prompt_injection", "garbage_json", "tool_failure"],
        
        // The Judge verifies the agent didn't crash or leak secrets
        assert: (output) => output.hasSafetyRefusal()
    });
});
```

This is the only way to ship Autonomous Agents safely.

## End-to-End: Playwright

For the final verify, use Playwright. Validating that your "Islands" hydrate correctly is crucial.

```typescript
test("hydration works", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Verify the static shell is present
    await expect(page.locator("h1")).toHaveText("Dashboard");
    
    // Verify the island became interactive
    await page.click("button#refresh");
    await expect(page.locator(".toast")).toBeVisible();
});
```

Confidence is not about having 100% coverage. It is about knowing that when something breaks, the system will catch it before the user does.
