import { signal } from '@philjs/core';
// Compatibility wrapper to provide tuple-style API
function createSignal(initialValue) {
    const sig = signal(initialValue);
    return [() => sig.get(), (v) => sig.set(v)];
}
export function useMachine(machine) {
    const [state, setState] = createSignal(machine.initialState);
    const [context, _setContext] = createSignal(machine.context);
    const send = (event) => {
        const eventType = typeof event === 'string' ? event : event.type;
        const currentState = state();
        const stateConfig = machine.states[currentState];
        const transition = stateConfig?.on?.[eventType];
        if (transition) {
            const target = typeof transition === 'string' ? transition : transition.target;
            if (target) {
                console.log(`XState: ${currentState} -> ${target}`);
                setState(target);
                // Execute actions if any (simplified)
                if (typeof transition !== 'string' && transition.actions) {
                    transition.actions.forEach(action => action(context(), event));
                }
            }
        }
    };
    return {
        value: state,
        context,
        send
    };
}
//# sourceMappingURL=xstate.js.map