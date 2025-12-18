/**
 * Example: Basic Component Testing
 *
 * This example demonstrates how to test a simple counter component
 * with PhilJS testing utilities.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from 'philjs-testing';
import { userEvent } from 'philjs-testing';
import { signal } from 'philjs-core';

// Component to test
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const count = signal(initialCount);

  return (
    <div>
      <h1>Counter</h1>
      <p data-testid="count">Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>Increment</button>
      <button onClick={() => count.set(c => c - 1)}>Decrement</button>
      <button onClick={() => count.set(0)}>Reset</button>
    </div>
  );
}

describe('Counter', () => {
  it('renders with initial count', () => {
    render(() => <Counter initialCount={5} />);
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
  });

  it('increments count', async () => {
    const user = userEvent.setup();
    render(() => <Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
  });

  it('decrements count', async () => {
    const user = userEvent.setup();
    render(() => <Counter initialCount={5} />);

    await user.click(screen.getByRole('button', { name: /decrement/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 4');
  });

  it('resets count to zero', async () => {
    const user = userEvent.setup();
    render(() => <Counter initialCount={10} />);

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
  });

  it('handles multiple operations', async () => {
    const user = userEvent.setup();
    render(() => <Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));
    await user.click(screen.getByRole('button', { name: /increment/i }));
    await user.click(screen.getByRole('button', { name: /decrement/i }));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
  });
});
