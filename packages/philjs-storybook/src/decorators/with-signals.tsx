/**
 * Signals Decorator
 *
 * Wrap stories with signal state management
 */

import { signal } from 'philjs-core';
import { createContext, useContext } from 'philjs-core/context';
import type { StoryContext } from '../renderer.js';
import { registerSignal } from '../addons/signal-inspector.js';

export interface SignalStore {
  signals: Map<string, any>;
  register: (name: string, sig: any) => void;
  get: (name: string) => any;
}

const SignalContext = createContext<SignalStore>({
  signals: new Map(),
  register: () => {},
  get: () => undefined,
});

/**
 * Signals decorator
 */
export function withSignals(
  story: () => any,
  context: StoryContext
): any {
  const initialSignals = context.parameters?.signals || {};

  const signalStore: SignalStore = {
    signals: new Map(),
    register: (name: string, sig: any) => {
      signalStore.signals.set(name, sig);
      registerSignal(name, sig);
    },
    get: (name: string) => {
      return signalStore.signals.get(name);
    },
  };

  // Initialize signals from parameters
  Object.entries(initialSignals).forEach(([name, value]) => {
    const sig = signal(value);
    signalStore.register(name, sig);
  });

  return (
    <SignalContext.Provider value={signalStore}>
      {story()}
    </SignalContext.Provider>
  );
}

/**
 * Hook to access signal store in stories
 */
export function useSignalStore(): SignalStore {
  return useContext(SignalContext);
}
