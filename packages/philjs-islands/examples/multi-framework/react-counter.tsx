/**
 * React Counter Island Example
 * Demonstrates a simple interactive React component in an island
 */

import { useState } from 'react';

export interface CounterProps {
  initial?: number;
  step?: number;
  label?: string;
}

export default function Counter({ initial = 0, step = 1, label = 'Count' }: CounterProps) {
  const [count, setCount] = useState(initial);

  return (
    <div className="counter-island" style={{
      padding: '20px',
      border: '2px solid #61dafb',
      borderRadius: '8px',
      backgroundColor: '#282c34',
      color: 'white'
    }}>
      <h3>React Counter</h3>
      <p>{label}: {count}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setCount(c => c - step)}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          -
        </button>
        <button
          onClick={() => setCount(initial)}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + step)}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          +
        </button>
      </div>
    </div>
  );
}
