import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  const increment = () => count.set(c => c + 1);
  const decrement = () => count.set(c => c - 1);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#667eea',
        margin: '1rem 0'
      }}>
        {count()}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={decrement}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          -
        </button>
        <button
          onClick={increment}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          +
        </button>
      </div>
      <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
        Click buttons to see fine-grained reactivity
      </p>
    </div>
  );
}