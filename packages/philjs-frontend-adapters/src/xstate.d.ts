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
        on?: Record<string, string | {
            target: string;
            actions?: Function[];
        }>;
    }>;
}
export declare function useMachine(machine: MachineConfig): {
    value: any;
    context: any;
    send: (event: XStateEvent | string) => void;
};
//# sourceMappingURL=xstate.d.ts.map