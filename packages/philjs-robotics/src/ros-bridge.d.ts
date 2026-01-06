export interface RosMessage {
    op: 'publish' | 'subscribe' | 'unsubscribe' | 'call_service';
    id?: string;
    topic?: string;
    type?: string;
    msg?: any;
    service?: string;
    args?: any;
}
export declare class Robot {
    private socket;
    private listeners;
    private isConnected;
    static connect(url: string): Promise<Robot>;
    private connectSocket;
    private handleMessage;
    subscribe(topic: string, messageType: string, callback: (msg: any) => void): void;
    publish(topic: string, messageType: string, msg: any): void;
    move(linearX: number, angularZ: number): void;
    moveArm(x: number, y: number, z: number): void;
    disconnect(): void;
}
//# sourceMappingURL=ros-bridge.d.ts.map