/**
 * @philjs/digital-twin - IoT Device Synchronization
 *
 * Industry-first framework-native digital twin system:
 * - Real-time device state synchronization
 * - MQTT/WebSocket communication
 * - Device shadow patterns
 * - Predictive maintenance
 * - 3D device visualization
 * - Time-series data storage
 */
export interface DeviceConfig {
    id: string;
    name: string;
    type: string;
    properties: PropertyDefinition[];
    telemetryInterval?: number;
    connectionType?: 'mqtt' | 'websocket' | 'http';
    connectionConfig?: ConnectionConfig;
}
export interface PropertyDefinition {
    name: string;
    type: 'number' | 'string' | 'boolean' | 'object' | 'array';
    unit?: string;
    min?: number;
    max?: number;
    writable?: boolean;
    telemetry?: boolean;
}
export interface ConnectionConfig {
    url: string;
    username?: string;
    password?: string;
    topic?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
}
export interface DeviceState {
    deviceId: string;
    timestamp: number;
    reported: Record<string, unknown>;
    desired: Record<string, unknown>;
    metadata: Record<string, PropertyMetadata>;
}
export interface PropertyMetadata {
    lastUpdated: number;
    version: number;
    source: 'device' | 'cloud' | 'user';
}
export interface TelemetryData {
    deviceId: string;
    timestamp: number;
    values: Record<string, number | string | boolean>;
}
export interface DeviceCommand {
    commandId: string;
    deviceId: string;
    name: string;
    payload: unknown;
    timestamp: number;
    status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed';
}
export interface Alert {
    id: string;
    deviceId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
}
export type DeviceEventCallback = (event: DeviceEvent) => void;
export interface DeviceEvent {
    type: 'connected' | 'disconnected' | 'stateChange' | 'telemetry' | 'alert' | 'command';
    deviceId: string;
    data: unknown;
    timestamp: number;
}
export declare class DigitalTwin {
    private config;
    private state;
    private connection;
    private eventCallbacks;
    private telemetryHistory;
    private maxHistorySize;
    private isConnected;
    constructor(config: DeviceConfig);
    private initializeProperties;
    private getDefaultValue;
    connect(): Promise<void>;
    private handleConnect;
    private handleDisconnect;
    private handleMessage;
    private updateState;
    private processTelemetry;
    private checkAlerts;
    private handleCommandResponse;
    setDesired(property: string, value: unknown): void;
    sendCommand(name: string, payload: unknown): DeviceCommand;
    getState(): DeviceState;
    getProperty(name: string): unknown;
    getTelemetryHistory(property?: string, limit?: number): TelemetryData[];
    on(event: DeviceEvent['type'], callback: DeviceEventCallback): () => void;
    private emit;
    disconnect(): void;
}
export declare class FleetManager {
    private devices;
    private eventCallbacks;
    addDevice(config: DeviceConfig): DigitalTwin;
    getDevice(id: string): DigitalTwin | undefined;
    getAllDevices(): DigitalTwin[];
    connectAll(): Promise<void>;
    disconnectAll(): void;
    removeDevice(id: string): void;
    onEvent(callback: DeviceEventCallback): () => void;
    getFleetStatus(): {
        total: number;
        connected: number;
        disconnected: number;
        alerts: number;
    };
}
export declare class PredictiveMaintenance {
    private twin;
    private thresholds;
    private predictions;
    constructor(twin: DigitalTwin);
    setThreshold(property: string, warning: number, critical: number): void;
    analyze(): MaintenancePrediction[];
    private predictFailure;
    private getRecommendation;
    getPrediction(property: string): MaintenancePrediction | undefined;
}
export interface MaintenancePrediction {
    property: string;
    currentValue: number;
    predictedValue: number;
    timeToWarning: number;
    timeToCritical: number;
    confidence: number;
    recommendation: string;
}
export declare class TimeSeriesStore {
    private static DB_NAME;
    private static STORE_NAME;
    private db;
    initialize(): Promise<void>;
    store(data: TelemetryData): Promise<void>;
    query(deviceId: string, startTime: number, endTime: number, property?: string): Promise<TelemetryData[]>;
    aggregate(deviceId: string, property: string, startTime: number, endTime: number, interval: 'minute' | 'hour' | 'day'): Promise<Array<{
        timestamp: number;
        avg: number;
        min: number;
        max: number;
    }>>;
}
export declare function useDigitalTwin(config: DeviceConfig): {
    twin: DigitalTwin | null;
    state: DeviceState | null;
    isConnected: boolean;
    setDesired: (property: string, value: unknown) => void;
    sendCommand: (name: string, payload: unknown) => DeviceCommand | undefined;
};
export declare function useFleet(): {
    fleet: FleetManager;
    devices: DigitalTwin[];
    events: DeviceEvent[];
    addDevice: (config: DeviceConfig) => DigitalTwin;
    removeDevice: (id: string) => void;
    connectAll: () => Promise<void>;
    disconnectAll: () => void;
};
export declare function useTelemetry(twin: DigitalTwin | null, property: string, limit?: number): {
    data: TelemetryData[];
    latestValue: unknown;
};
export declare function usePredictiveMaintenance(twin: DigitalTwin | null): {
    predictions: MaintenancePrediction[];
    analyze: () => MaintenancePrediction[];
    setThreshold: (property: string, warning: number, critical: number) => void;
};
declare const _default: {
    DigitalTwin: typeof DigitalTwin;
    FleetManager: typeof FleetManager;
    PredictiveMaintenance: typeof PredictiveMaintenance;
    TimeSeriesStore: typeof TimeSeriesStore;
    useDigitalTwin: typeof useDigitalTwin;
    useFleet: typeof useFleet;
    useTelemetry: typeof useTelemetry;
    usePredictiveMaintenance: typeof usePredictiveMaintenance;
};
export default _default;
//# sourceMappingURL=index.d.ts.map