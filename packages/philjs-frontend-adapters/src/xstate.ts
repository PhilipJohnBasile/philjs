import { createSignal } from '@philjs/core';

export interface XStateEvent {
    type: string;
    [key: string]: any;
}

export interface XStateContext {
    [key: string]: any;
}

export interface MachineConfig {
    initialState: string;
    context: XStateContext;
    states: Record<string, {
        on?: Record<string, string | { target: string, actions?: Function[] }>
    }>;
}

export function useMachine(machine: MachineConfig) {
    const [state, setState] = createSignal(machine.initialState);
    const [context, setContext] = createSignal(machine.context);

    const send = (event: XStateEvent | string) => {
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
