# @philjs/test

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Comprehensive testing framework for PhilJS applications with AI-powered test generation, fuzzing, property-based testing, and signal-aware assertions.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add @philjs/test
```

## Features

- **Test Runner** - Familiar describe/it/expect API
- **AI Test Generation** - Generate tests with `describeAI()`
- **Fuzzing** - AI-powered edge case detection with `fuzzAI()`
- **Auto-Fix** - Automatically fix failing tests with `attemptTestFix()`
- **Property-Based Testing** - Generate random test cases with shrinking
- **Signal-Aware** - Special matchers for reactive signals
- **DOM Matchers** - Testing Library style DOM assertions
- **Component Testing** - Test harness for PhilJS components
- **Mocking** - Full mock/spy support

## Usage

### Basic Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@philjs/test';

describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  it('adds two numbers', () => {
    expect(calc.add(2, 3)).toBe(5);
  });

  it('throws on division by zero', () => {
    expect(() => calc.divide(1, 0)).toThrow('Cannot divide by zero');
  });
});
```

### Signal Testing

```typescript
import { describe, it, expect } from '@philjs/test';
import { signal } from '@philjs/core';

describe('Counter Signal', () => {
  it('tracks reactive state', () => {
    const count = signal(0);

    expect(count).toHaveSignalValue(0);
    expect(count).toBeReactive();

    count.set(5);
    expect(count).toHaveSignalValue(5);
  });
});
```

### Component Testing

```typescript
import { describe, it, expect, createTestHarness } from '@philjs/test';
import { Counter } from './Counter';

describe('Counter Component', () => {
  it('increments on button click', async () => {
    const { getByRole, signals, click } = await createTestHarness(Counter);

    expect(signals.get('count')).toBe(0);

    const button = getByRole('button', { name: 'Increment' });
    await click(button);

    expect(signals.get('count')).toBe(1);
  });

  it('displays the current count', async () => {
    const { getByText } = await createTestHarness(Counter, { initial: 5 });

    expect(getByText('5')).toBeInTheDocument();
  });
});
```

### AI-Powered Test Generation

```typescript
import { describeAI, createAITestGenerator } from '@philjs/test';

// Describe tests in natural language
await describeAI('User Authentication', 'should block after 3 failed login attempts', () => {
  // AI generates appropriate test cases
});

// Generate tests for existing code
const generator = createAITestGenerator({ complete: llmProvider.complete });
const tests = await generator.generateTests(`
  export function validateEmail(email: string): boolean {
    return /^[^@]+@[^@]+\\.[^@]+$/.test(email);
  }
`);
console.log(tests);
```

### Fuzzing AI Agents

```typescript
import { fuzzAI } from '@philjs/test';

const result = await fuzzAI({
  agent: myAgent,
  scenarios: 100,
  strategies: ['jailbreak', 'injection', 'boundary', 'unicode'],
  validator: (input, output) => {
    // Return true if output is safe/valid
    return !output.includes('SYSTEM_OVERRIDE');
  },
  timeout: 30000,
});

console.log(`Score: ${result.score}%`);
console.log(`Failures: ${result.failures.length}`);
```

### Auto-Fix Failing Tests

```typescript
import { attemptTestFix } from '@philjs/test';

const fix = await attemptTestFix(
  {
    error: 'Expected 5 but received 4',
    code: `it('adds correctly', () => expect(add(2, 2)).toBe(5));`,
  },
  llmProvider
);

if (fix.status === 'resolved') {
  console.log('Fixed:', fix.patch);
}
```

### Property-Based Testing

```typescript
import { property, arbitrary, describe } from '@philjs/test';

describe('Array operations', () => {
  property(
    'reverse is its own inverse',
    arbitrary.array(arbitrary.integer()),
    (arr) => {
      const reversed = [...arr].reverse().reverse();
      expect(reversed).toEqual(arr);
    }
  );

  property(
    'sort is idempotent',
    arbitrary.array(arbitrary.integer()),
    (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const sortedAgain = [...sorted].sort((a, b) => a - b);
      expect(sorted).toEqual(sortedAgain);
    }
  );
});
```

### Mocking

```typescript
import { mock, spy, describe, it, expect } from '@philjs/test';

describe('API calls', () => {
  it('mocks fetch', async () => {
    const mockFetch = mock<typeof fetch>()
      .mockResolvedValue({ json: () => ({ data: 'test' }) } as Response);

    const result = await mockFetch('/api/data');

    expect(mockFetch.callCount).toBe(1);
    expect(mockFetch.calledWith('/api/data')).toBe(true);
  });

  it('spies on methods', () => {
    const obj = { method: (x: number) => x * 2 };
    const spied = spy(obj, 'method', { callThrough: true });

    const result = obj.method(5);

    expect(result).toBe(10);
    expect(spied.callCount).toBe(1);
    expect(spied.lastCalledWith()).toEqual([5]);

    spied.restore();
  });
});
```

### DOM Matchers

```typescript
import { expect } from '@philjs/test';

const button = document.querySelector('button');

expect(button).toBeInTheDocument();
expect(button).toBeVisible();
expect(button).toBeEnabled();
expect(button).toHaveClass('primary');
expect(button).toHaveAttribute('type', 'submit');
expect(button).toHaveTextContent('Submit');

const input = document.querySelector('input');
expect(input).toHaveValue('hello');
expect(input).toHaveFocus();
```

### Test Runner

```typescript
import { runTests, formatResults } from '@philjs/test';

const results = await runTests({
  filter: 'auth',           // Run only tests matching "auth"
  tags: ['unit'],           // Filter by tags
  timeout: 5000,            // Test timeout
  retries: 2,               // Retry failed tests
  parallel: true,           // Run in parallel
  bail: false,              // Stop on first failure
  reporter: 'default',      // Output format
});

console.log(formatResults(results));
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
```

## API

### Test Definition

- `describe(name, fn)` - Define a test suite
- `describe.only(name, fn)` - Run only this suite
- `describe.skip(name, fn)` - Skip this suite
- `it(name, fn)` / `test(name, fn)` - Define a test
- `it.only(name, fn)` - Run only this test
- `it.skip(name, fn)` - Skip this test
- `it.todo(name)` - Mark as todo
- `it.each(cases)(name, fn)` - Parameterized tests

### Lifecycle Hooks

- `beforeAll(fn)` - Run before all tests in suite
- `afterAll(fn)` - Run after all tests in suite
- `beforeEach(fn)` - Run before each test
- `afterEach(fn)` - Run after each test

### Assertions

- `expect(value).toBe(expected)` - Strict equality
- `expect(value).toEqual(expected)` - Deep equality
- `expect(value).toStrictEqual(expected)` - Strict deep equality
- `expect(value).toBeDefined()` - Not undefined
- `expect(value).toBeUndefined()` - Is undefined
- `expect(value).toBeNull()` - Is null
- `expect(value).toBeTruthy()` - Truthy value
- `expect(value).toBeFalsy()` - Falsy value
- `expect(value).toBeGreaterThan(n)` - > n
- `expect(value).toBeLessThan(n)` - < n
- `expect(value).toContain(item)` - Array/string contains
- `expect(value).toHaveLength(n)` - Length check
- `expect(value).toMatch(pattern)` - Regex match
- `expect(value).toThrow(message?)` - Throws error
- `expect(promise).resolves.toBe(value)` - Promise resolves
- `expect(promise).rejects.toThrow()` - Promise rejects
- `expect(value).not.toBe(expected)` - Negation

### Signal Matchers

- `expect(signal).toHaveSignalValue(value)` - Signal value check
- `expect(signal).toBeReactive()` - Is a reactive signal
- `expect(emitter).toHaveEmitted(event, times?)` - Event emission

### DOM Matchers

- `expect(el).toBeInTheDocument()` - In DOM
- `expect(el).toBeVisible()` - Visible
- `expect(el).toBeEnabled()` / `toBeDisabled()` - Input state
- `expect(el).toHaveClass(...classes)` - Has CSS classes
- `expect(el).toHaveAttribute(attr, value?)` - Attribute check
- `expect(el).toHaveTextContent(text)` - Text content
- `expect(el).toHaveValue(value)` - Input value
- `expect(el).toBeChecked()` - Checkbox checked
- `expect(el).toHaveFocus()` - Has focus

### Mocking

- `mock(implementation?)` - Create mock function
- `spy(obj, method, options?)` - Spy on method
- `mockModule(path, factory?)` - Mock ES module
- `fakeTimers.enable()` / `disable()` - Fake timers
- `fakeTimers.advance(ms)` - Advance time

### Component Testing

- `createTestHarness(component, props?)` - Create test harness
- `harness.getByRole(role, options?)` - Query by ARIA role
- `harness.getByText(text)` - Query by text
- `harness.getByTestId(id)` - Query by data-testid
- `harness.click(element)` - Click element
- `harness.type(element, text)` - Type text
- `harness.waitFor(callback, options?)` - Wait for condition
- `harness.debug()` - Print DOM

### AI Testing

- `describeAI(suite, description, fn)` - AI test suite
- `fuzzAI(options)` - Fuzz test AI agents
- `attemptTestFix(failure, llm)` - Auto-fix failing test
- `createAITestGenerator(llm)` - Test generator

### Property-Based Testing

- `property(name, arbitrary, predicate)` - Property test
- `arbitrary.integer(min?, max?)` - Random integer
- `arbitrary.float(min?, max?)` - Random float
- `arbitrary.string(minLen?, maxLen?)` - Random string
- `arbitrary.boolean()` - Random boolean
- `arbitrary.array(elementArb, minLen?, maxLen?)` - Random array
- `arbitrary.object(shape)` - Random object
- `arbitrary.oneOf(...values)` - One of values

### Test Runner

- `runTests(options?)` - Execute tests
- `formatResults(results)` - Format for display

## Related Packages

- [@philjs/testing](../philjs-testing) - Additional testing utilities
- [@philjs/playwright](../philjs-playwright) - E2E testing with Playwright
- [@philjs/cypress](../philjs-cypress) - E2E testing with Cypress

## Book

See the [Confidence at Scale](../../docs/philjs-book/src/testing/overview.md) chapter in the PhilJS book.

## License

MIT
