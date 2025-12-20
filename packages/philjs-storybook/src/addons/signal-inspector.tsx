/**
 * Signal Inspector Addon
 *
 * Inspect and manipulate PhilJS signals in real-time
 */

import { signal, computed, effect } from 'philjs-core';
import { useEffect } from 'philjs-core';

const ADDON_ID = 'philjs/signal-inspector';
const PANEL_ID = `${ADDON_ID}/panel`;

interface SignalInfo {
  name: string;
  value: any;
  type: 'signal' | 'computed';
  dependencies?: string[];
}

/**
 * Global signal registry for tracking
 */
const signalRegistry = new Map<string, any>();

/**
 * Register a signal for inspection
 */
export function registerSignal(name: string, sig: any) {
  signalRegistry.set(name, sig);
}

/**
 * Get all registered signals
 */
export function getSignals(): SignalInfo[] {
  const signals: SignalInfo[] = [];

  signalRegistry.forEach((sig, name) => {
    try {
      const value = sig();
      const isComputed = sig.constructor.name === 'Computed';

      signals.push({
        name,
        value,
        type: isComputed ? 'computed' : 'signal',
        dependencies: isComputed ? sig.dependencies : undefined,
      });
    } catch (err) {
      // Handle errors gracefully
    }
  });

  return signals;
}

/**
 * Signal Inspector Panel Component
 */
export function SignalInspectorPanel() {
  const signals$ = signal<SignalInfo[]>([]);
  const selectedSignal$ = signal<string | null>(null);
  const editValue$ = signal<string>('');

  // Update signals list
  const updateSignals = () => {
    signals$.set(getSignals());
  };

  useEffect(() => {
    updateSignals();
    const interval = setInterval(updateSignals, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectSignal = (name: string) => {
    selectedSignal$.set(name);
    const sig = signalRegistry.get(name);
    if (sig) {
      editValue$.set(JSON.stringify(sig(), null, 2));
    }
  };

  const handleUpdateSignal = () => {
    const name = selectedSignal$();
    if (!name) return;

    const sig = signalRegistry.get(name);
    if (sig && sig.set) {
      try {
        const newValue = JSON.parse(editValue$());
        sig.set(newValue);
        updateSignals();
      } catch (err) {
        console.error('Failed to update signal:', err);
      }
    }
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h2>Signal Inspector</h2>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '16px' }}>
          <h3>Signals ({signals$().length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {signals$().map((sig) => (
              <div
                key={sig.name}
                onClick={() => handleSelectSignal(sig.name)}
                style={{
                  padding: '8px',
                  backgroundColor: selectedSignal$() === sig.name ? '#e3f2fd' : '#f5f5f5',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Type: {sig.type}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', marginTop: '4px' }}>
                  {JSON.stringify(sig.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {selectedSignal$() ? (
            <>
              <h3>Edit: {selectedSignal$()}</h3>
              <textarea
                value={editValue$()}
                onInput={(e: any) => editValue$.set(e.target.value)}
                style={{
                  width: '100%',
                  height: '200px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <button
                onClick={handleUpdateSignal}
                style={{
                  marginTop: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Update Signal
              </button>
            </>
          ) : (
            <div style={{ color: '#999' }}>Select a signal to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Addon registration
 */
export const signalInspectorAddon = {
  id: ADDON_ID,
  title: 'Signal Inspector',
  type: 'panel',
  render: () => <SignalInspectorPanel />,
};

export default signalInspectorAddon;
