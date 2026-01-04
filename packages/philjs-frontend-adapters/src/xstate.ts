
// Stub for usage of XState machines
export function useMachine(machine: any) {
    // Integrate XState interpreter with PhilJS signals
    const state = { value: machine.initialState, context: machine.context };
    const send = (event: string) => console.log('XState event sent', event);
    return [state, send];
}
