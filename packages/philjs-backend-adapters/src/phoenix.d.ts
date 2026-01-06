type ChannelState = 'closed' | 'errored' | 'joined' | 'joining';
export declare class PhoenixChannel {
    topic: string;
    params: any;
    private socket;
    state: ChannelState;
    bindings: Array<{
        event: string;
        callback: Function;
    }>;
    constructor(topic: string, params: any, socket: PhoenixAdapter);
    join(): Promise<{
        status: string;
    }>;
    on(event: string, callback: Function): void;
    trigger(event: string, payload: any): void;
    push(event: string, payload: any): Promise<unknown>;
    leave(): void;
}
export declare class PhoenixAdapter {
    private endpoint;
    private channels;
    isConnected: boolean;
    private ws;
    private ref;
    constructor(endpoint: string);
    connect(): void;
    makeRef(): string;
    push(data: {
        topic: string;
        event: string;
        payload: any;
        ref: string;
    }): void;
    channel(topic: string, params?: any): PhoenixChannel;
    liveView(mountPoint: HTMLElement): void;
}
export {};
//# sourceMappingURL=phoenix.d.ts.map