
export interface XStateEvent {
    type: string;
    [key: string]: any;
}

export interface XStateContext {
    [key: string]: any;
}

export function useMachine(machine: { initialState: string; context: XStateContext; states: any }) {
    let currentState = machine.initialState;
    let currentContext = { ...machine.context };

    const listeners: Set<Function> = new Set();

    const send = (event: XStateEvent | string) => {
        const eventType = typeof event === 'string' ? event : event.type;
        console.log(`XState: Processing event "${eventType}" in state "${currentState}"`);

        // Mock transition logic
        const nextStateConfig = machine.states[currentState]?.on?.[eventType];
        if (nextStateConfig) {
            // Handle simple string transition
            const target = typeof nextStateConfig === 'string' ? nextStateConfig : nextStateConfig.target;
            if (target) {
                currentState = target;
                console.log(`XState: Transitioned to "${currentState}"`);
                listeners.forEach(l => l({ value: currentState, context: currentContext }));
            }
        }
    };

    return [
        { value: currentState, context: currentContext },
        send,
        (cb: Function) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
        }
    ];
}
