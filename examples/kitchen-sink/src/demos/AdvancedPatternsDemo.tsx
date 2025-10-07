import { signal, memo, effect, batch } from "philjs-core";

export function AdvancedPatternsDemo() {
  return (
    <div data-test="advanced-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Advanced Patterns</h2>

      <ComponentCompositionExample />
      <DerivedStateExample />
      <CustomHookExample />
      <PerformanceOptimizationExample />
    </div>
  );
}

function ComponentCompositionExample() {
  const count = signal(0);

  // Reusable Button component
  const Button = ({ label, onClick, variant = "primary" }: any) => {
    const buttonStyle = memo(() => ({
      background: variant === "primary" ? "var(--primary)" : variant === "secondary" ? "var(--secondary)" : "var(--error)",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600" as const,
      transition: "all 0.2s ease",
    }));

    return (
      <button style={buttonStyle} onClick={onClick}>
        {label}
      </button>
    );
  };

  // Card wrapper component
  const Card = ({ title, children }: any) => (
    <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 8px;">
      <h4 style="margin: 0 0 1rem 0;">{title}</h4>
      {children}
    </div>
  );

  return (
    <div class="card" data-test="composition">
      <h3 style="margin: 0 0 1rem 0;">Component Composition</h3>

      <Card title="Counter Component">
        <p style="margin: 0 0 1rem 0;">
          Count: <strong data-test="composition-count">{count}</strong>
        </p>
        <div style="display: flex; gap: 0.5rem;">
          <Button label="Increment" onClick={() => count.set(count() + 1)} variant="primary" data-test="composition-increment" />
          <Button label="Decrement" onClick={() => count.set(count() - 1)} variant="secondary" data-test="composition-decrement" />
          <Button label="Reset" onClick={() => count.set(0)} variant="danger" data-test="composition-reset" />
        </div>
      </Card>

      <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; margin-top: 1rem;">
        <code>{"const Button = ({ label, onClick }) => <button onClick={onClick}>{label}</button>"}</code>
      </div>
    </div>
  );
}

function DerivedStateExample() {
  const items = signal<{ id: number; price: number; quantity: number }[]>([
    { id: 1, price: 10, quantity: 2 },
    { id: 2, price: 15, quantity: 1 },
    { id: 3, price: 20, quantity: 3 },
  ]);

  // Derived computations
  const subtotal = memo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const tax = memo(() => subtotal() * 0.1);
  const total = memo(() => subtotal() + tax());
  const itemCount = memo(() => items().reduce((sum, item) => sum + item.quantity, 0));

  const updateQuantity = (id: number, delta: number) => {
    items.set(items().map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ));
  };

  return (
    <div class="card" data-test="derived-state">
      <h3 style="margin: 0 0 1rem 0;">Derived State & Memos</h3>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
        {items().map(item => (
          <div
            key={item.id}
            style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-alt); padding: 1rem; border-radius: 6px;"
            data-test={`cart-item-${item.id}`}
          >
            <div>
              <strong>Item {item.id}</strong>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                ${item.price} × {item.quantity}
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                style="background: var(--error); color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-size: 1.2rem;"
                data-test={`decrease-${item.id}`}
              >
                −
              </button>
              <span style="min-width: 30px; text-align: center; font-weight: 600;">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                style="background: var(--success); color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; font-size: 1.2rem;"
                data-test={`increase-${item.id}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style="background: var(--primary); color: white; padding: 1.5rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Items:</span>
          <strong data-test="item-count">{itemCount}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Subtotal:</span>
          <strong data-test="subtotal">${subtotal().toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Tax (10%):</span>
          <strong data-test="tax">${tax().toFixed(2)}</strong>
        </div>
        <div style="border-top: 2px solid rgba(255,255,255,0.3); padding-top: 0.5rem; margin-top: 0.5rem; display: flex; justify-content: space-between; font-size: 1.2rem;">
          <span>Total:</span>
          <strong data-test="total">${total().toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

function CustomHookExample() {
  // Custom "hook" pattern - just a function that uses signals
  const useCounter = (initialValue = 0) => {
    const count = signal(initialValue);
    const increment = () => count.set(count() + 1);
    const decrement = () => count.set(count() - 1);
    const reset = () => count.set(initialValue);

    return { count, increment, decrement, reset };
  };

  const counter1 = useCounter(0);
  const counter2 = useCounter(10);

  return (
    <div class="card" data-test="custom-hook">
      <h3 style="margin: 0 0 1rem 0;">Custom Hook Pattern</h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 8px;">
          <h4 style="margin: 0 0 0.5rem 0;">Counter 1</h4>
          <p style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 600; text-align: center;" data-test="hook-count-1">
            {counter1.count}
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button" onClick={counter1.increment} data-test="hook-inc-1">+</button>
            <button class="button" onClick={counter1.decrement} data-test="hook-dec-1">−</button>
            <button class="button" onClick={counter1.reset} data-test="hook-reset-1">↺</button>
          </div>
        </div>

        <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 8px;">
          <h4 style="margin: 0 0 0.5rem 0;">Counter 2</h4>
          <p style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 600; text-align: center;" data-test="hook-count-2">
            {counter2.count}
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button" onClick={counter2.increment} data-test="hook-inc-2">+</button>
            <button class="button" onClick={counter2.decrement} data-test="hook-dec-2">−</button>
            <button class="button" onClick={counter2.reset} data-test="hook-reset-2">↺</button>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; margin-top: 1rem;">
        <code>{"const useCounter = (initial) => { count: signal(initial), increment, decrement }"}</code>
      </div>
    </div>
  );
}

function PerformanceOptimizationExample() {
  const numbers = signal<number[]>(Array.from({ length: 1000 }, (_, i) => i));
  const multiplier = signal(1);
  const computationCount = signal(0);

  // Optimized with memo
  const sum = memo(() => {
    computationCount.set(c => c + 1);
    return numbers().reduce((a, b) => a + b, 0);
  });

  const result = memo(() => sum() * multiplier());

  const addNumbers = () => {
    batch(() => {
      const current = numbers();
      numbers.set([...current, current.length, current.length + 1, current.length + 2]);
    });
  };

  return (
    <div class="card" data-test="performance">
      <h3 style="margin: 0 0 1rem 0;">Performance Optimization</h3>

      <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
          <div>
            <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Array Size</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 600;" data-test="perf-size">{numbers().length}</p>
          </div>
          <div>
            <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Multiplier</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 600;" data-test="perf-multiplier">{multiplier}</p>
          </div>
          <div>
            <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Result</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 600;" data-test="perf-result">{result().toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <button class="button" onClick={addNumbers} data-test="perf-add">
          Add 3 Numbers (Batched)
        </button>
        <button class="button" onClick={() => multiplier.set(multiplier() + 1)} data-test="perf-multiply">
          Increase Multiplier
        </button>
      </div>

      <div style="background: var(--success); color: white; padding: 1rem; border-radius: 6px;">
        <p style="margin: 0;">
          ✓ Memo computations: <strong data-test="perf-count">{computationCount}</strong>
        </p>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
          Memos cache results and only recompute when dependencies change
        </p>
      </div>
    </div>
  );
}
