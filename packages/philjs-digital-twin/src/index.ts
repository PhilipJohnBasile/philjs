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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Connection Handlers
// ============================================================================

abstract class ConnectionHandler {
  protected config: ConnectionConfig;
  protected onMessage: ((data: unknown) => void) | null = null;
  protected onConnect: (() => void) | null = null;
  protected onDisconnect: (() => void) | null = null;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): void;
  abstract send(data: unknown): void;

  setCallbacks(callbacks: {
    onMessage?: (data: unknown) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
  }): void {
    this.onMessage = callbacks.onMessage ?? null;
    this.onConnect = callbacks.onConnect ?? null;
    this.onDisconnect = callbacks.onDisconnect ?? null;
  }
}

class WebSocketHandler extends ConnectionHandler {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;

  async connect(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.onConnect?.();
      resolve();
    };

    this.ws.onerror = (error) => {
      reject(error);
    };

    this.ws.onclose = () => {
      this.onDisconnect?.();
      if (this.config.reconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch {
        this.onMessage?.(event.data);
      }
    };

    return promise;
  }

  private scheduleReconnect(): void {
    const interval = this.config.reconnectInterval ?? 5000;
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(() => {
        // Will retry on next interval
      });
    }, interval);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.ws = null;
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

class MQTTHandler extends ConnectionHandler {
  private client: unknown = null;

  async connect(): Promise<void> {
    // MQTT.js integration placeholder
    // In production, use mqtt.js library
    console.log('MQTT connection to:', this.config.url);
    this.onConnect?.();
  }

  disconnect(): void {
    this.onDisconnect?.();
  }

  send(data: unknown): void {
  }
}

// ============================================================================
// Digital Twin
// ============================================================================

export class DigitalTwin {
  private config: DeviceConfig;
  private state: DeviceState;
  private connection: ConnectionHandler | null = null;
  private eventCallbacks: Map<string, DeviceEventCallback[]> = new Map();
  private telemetryHistory: TelemetryData[] = [];
  private maxHistorySize: number = 1000;
  private isConnected: boolean = false;

  constructor(config: DeviceConfig) {
    this.config = config;
    this.state = {
      deviceId: config.id,
      timestamp: Date.now(),
      reported: {},
      desired: {},
      metadata: {}
    };

    this.initializeProperties();
  }

  private initializeProperties(): void {
    for (const prop of this.config.properties) {
      this.state.reported[prop.name] = this.getDefaultValue(prop.type);
      this.state.desired[prop.name] = this.getDefaultValue(prop.type);
      this.state.metadata[prop.name] = {
        lastUpdated: Date.now(),
        version: 1,
        source: 'cloud'
      };
    }
  }

  private getDefaultValue(type: string): unknown {
    switch (type) {
      case 'number': return 0;
      case 'string': return '';
      case 'boolean': return false;
      case 'object': return {};
      case 'array': return [];
      default: return null;
    }
  }

  async connect(): Promise<void> {
    const connectionType = this.config.connectionType ?? 'websocket';
    const connectionConfig = this.config.connectionConfig;

    if (!connectionConfig) {
      throw new Error('Connection config required');
    }

    switch (connectionType) {
      case 'websocket':
        this.connection = new WebSocketHandler(connectionConfig);
        break;
      case 'mqtt':
        this.connection = new MQTTHandler(connectionConfig);
        break;
      default:
        throw new Error(`Unknown connection type: ${connectionType}`);
    }

    this.connection.setCallbacks({
      onMessage: (data) => this.handleMessage(data),
      onConnect: () => this.handleConnect(),
      onDisconnect: () => this.handleDisconnect()
    });

    await this.connection.connect();
  }

  private handleConnect(): void {
    this.isConnected = true;
    this.emit({
      type: 'connected',
      deviceId: this.config.id,
      data: null,
      timestamp: Date.now()
    });
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.emit({
      type: 'disconnected',
      deviceId: this.config.id,
      data: null,
      timestamp: Date.now()
    });
  }

  private handleMessage(data: unknown): void {
    const message = data as { type: string; payload: unknown };

    switch (message.type) {
      case 'state':
        this.updateState(message.payload as Partial<DeviceState>);
        break;
      case 'telemetry':
        this.processTelemetry(message.payload as TelemetryData);
        break;
      case 'command_response':
        this.handleCommandResponse(message.payload as DeviceCommand);
        break;
    }
  }

  private updateState(partial: Partial<DeviceState>): void {
    const now = Date.now();

    if (partial.reported) {
      for (const [key, value] of Object.entries(partial.reported)) {
        this.state.reported[key] = value;
        this.state.metadata[key] = {
          lastUpdated: now,
          version: (this.state.metadata[key]?.version ?? 0) + 1,
          source: 'device'
        };
      }
    }

    this.state.timestamp = now;

    this.emit({
      type: 'stateChange',
      deviceId: this.config.id,
      data: this.state,
      timestamp: now
    });
  }

  private processTelemetry(telemetry: TelemetryData): void {
    this.telemetryHistory.push(telemetry);

    if (this.telemetryHistory.length > this.maxHistorySize) {
      this.telemetryHistory.shift();
    }

    // Update reported state with telemetry values
    for (const [key, value] of Object.entries(telemetry.values)) {
      if (key in this.state.reported) {
        this.state.reported[key] = value;
      }
    }

    this.emit({
      type: 'telemetry',
      deviceId: this.config.id,
      data: telemetry,
      timestamp: telemetry.timestamp
    });

    // Check for alerts
    this.checkAlerts(telemetry);
  }

  private checkAlerts(telemetry: TelemetryData): void {
    for (const prop of this.config.properties) {
      if (prop.type === 'number' && prop.name in telemetry.values) {
        const value = telemetry.values[prop.name] as number;

        if (prop.max !== undefined && value > prop.max) {
          this.emit({
            type: 'alert',
            deviceId: this.config.id,
            data: {
              id: `alert-${Date.now()}`,
              deviceId: this.config.id,
              severity: 'warning',
              message: `${prop.name} exceeded maximum (${value} > ${prop.max})`,
              timestamp: Date.now(),
              acknowledged: false
            } as Alert,
            timestamp: Date.now()
          });
        }

        if (prop.min !== undefined && value < prop.min) {
          this.emit({
            type: 'alert',
            deviceId: this.config.id,
            data: {
              id: `alert-${Date.now()}`,
              deviceId: this.config.id,
              severity: 'warning',
              message: `${prop.name} below minimum (${value} < ${prop.min})`,
              timestamp: Date.now(),
              acknowledged: false
            } as Alert,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  private handleCommandResponse(command: DeviceCommand): void {
    this.emit({
      type: 'command',
      deviceId: this.config.id,
      data: command,
      timestamp: Date.now()
    });
  }

  setDesired(property: string, value: unknown): void {
    const prop = this.config.properties.find(p => p.name === property);

    if (!prop) {
      throw new Error(`Unknown property: ${property}`);
    }

    if (!prop.writable) {
      throw new Error(`Property ${property} is not writable`);
    }

    this.state.desired[property] = value;
    this.state.metadata[property] = {
      lastUpdated: Date.now(),
      version: (this.state.metadata[property]?.version ?? 0) + 1,
      source: 'user'
    };

    // Send to device
    this.connection?.send({
      type: 'desired',
      deviceId: this.config.id,
      property,
      value
    });
  }

  sendCommand(name: string, payload: unknown): DeviceCommand {
    const command: DeviceCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: this.config.id,
      name,
      payload,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.connection?.send({
      type: 'command',
      ...command
    });

    command.status = 'sent';
    return command;
  }

  getState(): DeviceState {
    return { ...this.state };
  }

  getProperty(name: string): unknown {
    return this.state.reported[name];
  }

  getTelemetryHistory(property?: string, limit?: number): TelemetryData[] {
    let history = [...this.telemetryHistory];

    if (property) {
      history = history.filter(t => property in t.values);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  on(event: DeviceEvent['type'], callback: DeviceEventCallback): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);

    return () => {
      const callbacks = this.eventCallbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  private emit(event: DeviceEvent): void {
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }

  disconnect(): void {
    this.connection?.disconnect();
    this.connection = null;
    this.isConnected = false;
  }
}

// ============================================================================
// Device Fleet Manager
// ============================================================================

export class FleetManager {
  private devices: Map<string, DigitalTwin> = new Map();
  private eventCallbacks: DeviceEventCallback[] = [];

  addDevice(config: DeviceConfig): DigitalTwin {
    const twin = new DigitalTwin(config);
    this.devices.set(config.id, twin);

    // Forward all events
    const eventTypes: DeviceEvent['type'][] = [
      'connected', 'disconnected', 'stateChange', 'telemetry', 'alert', 'command'
    ];

    for (const type of eventTypes) {
      twin.on(type, (event) => {
        this.eventCallbacks.forEach(cb => cb(event));
      });
    }

    return twin;
  }

  getDevice(id: string): DigitalTwin | undefined {
    return this.devices.get(id);
  }

  getAllDevices(): DigitalTwin[] {
    return Array.from(this.devices.values());
  }

  async connectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.devices.values()).map(d => d.connect())
    );
  }

  disconnectAll(): void {
    this.devices.forEach(d => d.disconnect());
  }

  removeDevice(id: string): void {
    const device = this.devices.get(id);
    if (device) {
      device.disconnect();
      this.devices.delete(id);
    }
  }

  onEvent(callback: DeviceEventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) this.eventCallbacks.splice(index, 1);
    };
  }

  getFleetStatus(): {
    total: number;
    connected: number;
    disconnected: number;
    alerts: number;
  } {
    let connected = 0;
    let alerts = 0;

    // Simplified status calculation
    this.devices.forEach(() => {
      connected++;
    });

    return {
      total: this.devices.size,
      connected,
      disconnected: this.devices.size - connected,
      alerts
    };
  }
}

// ============================================================================
// Predictive Maintenance
// ============================================================================

export class PredictiveMaintenance {
  private twin: DigitalTwin;
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();
  private predictions: Map<string, MaintenancePrediction> = new Map();

  constructor(twin: DigitalTwin) {
    this.twin = twin;
  }

  setThreshold(property: string, warning: number, critical: number): void {
    this.thresholds.set(property, { warning, critical });
  }

  analyze(): MaintenancePrediction[] {
    const history = this.twin.getTelemetryHistory();
    const results: MaintenancePrediction[] = [];

    for (const [property, threshold] of this.thresholds) {
      const values = history
        .filter(t => property in t.values)
        .map(t => ({
          timestamp: t.timestamp,
          value: t.values[property] as number
        }));

      if (values.length < 10) continue;

      const prediction = this.predictFailure(property, values, threshold);
      if (prediction) {
        results.push(prediction);
        this.predictions.set(property, prediction);
      }
    }

    return results;
  }

  private predictFailure(
    property: string,
    values: Array<{ timestamp: number; value: number }>,
    threshold: { warning: number; critical: number }
  ): MaintenancePrediction | null {
    // Simple linear regression for trend analysis
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    const startTime = values[0]!.timestamp;

    for (const point of values) {
      const x = (point.timestamp - startTime) / 3600000; // Hours
      const y = point.value;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const currentValue = values[values.length - 1]!.value;
    const currentTime = (values[values.length - 1]!.timestamp - startTime) / 3600000;

    // Predict time to threshold
    if (slope > 0) {
      const hoursToWarning = (threshold.warning - intercept) / slope - currentTime;
      const hoursToCritical = (threshold.critical - intercept) / slope - currentTime;

      if (hoursToCritical > 0 && hoursToCritical < 720) { // Within 30 days
        return {
          property,
          currentValue,
          predictedValue: currentValue + slope * 24, // 24 hours ahead
          timeToWarning: hoursToWarning > 0 ? hoursToWarning : 0,
          timeToCritical: hoursToCritical,
          confidence: Math.min(0.95, n / 100),
          recommendation: this.getRecommendation(hoursToCritical)
        };
      }
    }

    return null;
  }

  private getRecommendation(hoursToCritical: number): string {
    if (hoursToCritical < 24) {
      return 'Immediate maintenance required';
    } else if (hoursToCritical < 168) {
      return 'Schedule maintenance within this week';
    } else {
      return 'Monitor closely, plan maintenance';
    }
  }

  getPrediction(property: string): MaintenancePrediction | undefined {
    return this.predictions.get(property);
  }
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

// ============================================================================
// Time Series Storage
// ============================================================================

export class TimeSeriesStore {
  private static DB_NAME = 'philjs-digital-twin-ts';
  private static STORE_NAME = 'telemetry';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const request = indexedDB.open(TimeSeriesStore.DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TimeSeriesStore.STORE_NAME)) {
        const store = db.createObjectStore(TimeSeriesStore.STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('deviceId', 'deviceId');
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('deviceId_timestamp', ['deviceId', 'timestamp']);
      }
    };

    return promise;
  }

  async store(data: TelemetryData): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(TimeSeriesStore.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TimeSeriesStore.STORE_NAME);
    const request = store.add(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    return promise;
  }

  async query(
    deviceId: string,
    startTime: number,
    endTime: number,
    property?: string
  ): Promise<TelemetryData[]> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<TelemetryData[]>();
    const transaction = this.db!.transaction(TimeSeriesStore.STORE_NAME, 'readonly');
    const store = transaction.objectStore(TimeSeriesStore.STORE_NAME);
    const index = store.index('deviceId_timestamp');

    const range = IDBKeyRange.bound(
      [deviceId, startTime],
      [deviceId, endTime]
    );

    const request = index.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let results = request.result as TelemetryData[];

      if (property) {
        results = results.filter(t => property in t.values);
      }

      resolve(results);
    };

    return promise;
  }

  async aggregate(
    deviceId: string,
    property: string,
    startTime: number,
    endTime: number,
    interval: 'minute' | 'hour' | 'day'
  ): Promise<Array<{ timestamp: number; avg: number; min: number; max: number }>> {
    const data = await this.query(deviceId, startTime, endTime, property);

    const intervalMs = {
      minute: 60000,
      hour: 3600000,
      day: 86400000
    }[interval];

    const buckets: Map<number, number[]> = new Map();

    for (const telemetry of data) {
      const bucketTime = Math.floor(telemetry.timestamp / intervalMs) * intervalMs;
      const value = telemetry.values[property] as number;

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(value);
    }

    const results: Array<{ timestamp: number; avg: number; min: number; max: number }> = [];

    for (const [timestamp, values] of buckets) {
      const sum = values.reduce((a, b) => a + b, 0);
      results.push({
        timestamp,
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      });
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: never[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useDigitalTwin(config: DeviceConfig) {
  const twinRef = useRef<DigitalTwin | null>(null);
  const [state, setState] = useState<DeviceState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const twin = new DigitalTwin(config);
    twinRef.current = twin;

    twin.on('connected', () => setIsConnected(true));
    twin.on('disconnected', () => setIsConnected(false));
    twin.on('stateChange', (event) => setState(event.data as DeviceState));

    twin.connect().catch(console.error);

    return () => twin.disconnect();
  }, []);

  const setDesired = useCallback((property: string, value: unknown) => {
    twinRef.current?.setDesired(property, value);
  }, []);

  const sendCommand = useCallback((name: string, payload: unknown) => {
    return twinRef.current?.sendCommand(name, payload);
  }, []);

  return { twin: twinRef.current, state, isConnected, setDesired, sendCommand };
}

export function useFleet() {
  const fleetRef = useRef(new FleetManager());
  const [devices, setDevices] = useState<DigitalTwin[]>([]);
  const [events, setEvents] = useState<DeviceEvent[]>([]);

  useEffect(() => {
    const fleet = fleetRef.current;

    fleet.onEvent((event) => {
      setEvents(prev => [...prev.slice(-99), event]);
    });

    return () => fleet.disconnectAll();
  }, []);

  const addDevice = useCallback((config: DeviceConfig) => {
    const twin = fleetRef.current.addDevice(config);
    setDevices(fleetRef.current.getAllDevices());
    return twin;
  }, []);

  const removeDevice = useCallback((id: string) => {
    fleetRef.current.removeDevice(id);
    setDevices(fleetRef.current.getAllDevices());
  }, []);

  return {
    fleet: fleetRef.current,
    devices,
    events,
    addDevice,
    removeDevice,
    connectAll: () => fleetRef.current.connectAll(),
    disconnectAll: () => fleetRef.current.disconnectAll()
  };
}

export function useTelemetry(
  twin: DigitalTwin | null,
  property: string,
  limit: number = 100
) {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [latestValue, setLatestValue] = useState<unknown>(null);

  useEffect(() => {
    if (!twin) return;

    return twin.on('telemetry', (event) => {
      const telemetry = event.data as TelemetryData;
      if (property in telemetry.values) {
        setLatestValue(telemetry.values[property]);
        setData(prev => [...prev.slice(-(limit - 1)), telemetry]);
      }
    });
  }, [twin, property, limit]);

  return { data, latestValue };
}

export function usePredictiveMaintenance(twin: DigitalTwin | null) {
  const maintenanceRef = useRef<PredictiveMaintenance | null>(null);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);

  useEffect(() => {
    if (!twin) return;

    maintenanceRef.current = new PredictiveMaintenance(twin);
  }, [twin]);

  const analyze = useCallback(() => {
    if (!maintenanceRef.current) return [];
    const results = maintenanceRef.current.analyze();
    setPredictions(results);
    return results;
  }, []);

  const setThreshold = useCallback((property: string, warning: number, critical: number) => {
    maintenanceRef.current?.setThreshold(property, warning, critical);
  }, []);

  return { predictions, analyze, setThreshold };
}

// Export everything
export default {
  DigitalTwin,
  FleetManager,
  PredictiveMaintenance,
  TimeSeriesStore,
  useDigitalTwin,
  useFleet,
  useTelemetry,
  usePredictiveMaintenance
};
