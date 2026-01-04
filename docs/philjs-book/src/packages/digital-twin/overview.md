# @philjs/digital-twin - IoT Device Synchronization

**Industry-first framework-native digital twin system for real-time IoT device management.**

@philjs/digital-twin provides everything needed for IoT device synchronization: real-time device state management, MQTT/WebSocket communication, device shadow patterns, predictive maintenance analytics, and time-series data storage with IndexedDB.

## Installation

```bash
npm install @philjs/digital-twin
# or
pnpm add @philjs/digital-twin
# or
bun add @philjs/digital-twin
```

## Features

- Real-time device state synchronization with reported/desired state pattern
- MQTT and WebSocket communication handlers with auto-reconnect
- Device shadow patterns (AWS IoT-style)
- Predictive maintenance with linear regression analysis
- Time-series telemetry storage using IndexedDB
- Fleet management for multiple devices
- Automatic alert generation based on property thresholds
- Command/response handling for device control
- Framework-native hooks for seamless integration

## Quick Start

```typescript
import {
  DigitalTwin,
  FleetManager,
  useDigitalTwin,
  useTelemetry,
} from '@philjs/digital-twin';

// Create a digital twin for a temperature sensor
const twin = new DigitalTwin({
  id: 'sensor-001',
  name: 'Temperature Sensor',
  type: 'temperature-sensor',
  properties: [
    { name: 'temperature', type: 'number', unit: 'celsius', min: -40, max: 85, telemetry: true },
    { name: 'humidity', type: 'number', unit: 'percent', min: 0, max: 100, telemetry: true },
    { name: 'samplingRate', type: 'number', writable: true },
  ],
  connectionType: 'websocket',
  connectionConfig: {
    url: 'wss://iot.example.com/ws',
    reconnect: true,
    reconnectInterval: 5000,
  },
});

// Connect and listen for events
await twin.connect();

twin.on('telemetry', (event) => {
  console.log('New telemetry:', event.data);
});

twin.on('alert', (event) => {
  console.log('Alert:', event.data.message);
});

// Read device state
const state = twin.getState();
console.log('Reported temperature:', state.reported.temperature);

// Set desired state (send to device)
twin.setDesired('samplingRate', 1000);

// Send a command to the device
const command = twin.sendCommand('calibrate', { reference: 25.0 });
console.log('Command ID:', command.commandId);
```

## DigitalTwin Class

The `DigitalTwin` class represents a virtual representation of a physical IoT device, maintaining synchronized state between the cloud and the device.

### Creating a Digital Twin

```typescript
import { DigitalTwin, DeviceConfig } from '@philjs/digital-twin';

const config: DeviceConfig = {
  // Required fields
  id: 'device-001',
  name: 'Smart Thermostat',
  type: 'thermostat',
  properties: [
    {
      name: 'temperature',
      type: 'number',
      unit: 'fahrenheit',
      min: 32,
      max: 100,
      writable: false,
      telemetry: true,
    },
    {
      name: 'setpoint',
      type: 'number',
      unit: 'fahrenheit',
      min: 55,
      max: 85,
      writable: true,
    },
    {
      name: 'mode',
      type: 'string',
      writable: true,
    },
    {
      name: 'isRunning',
      type: 'boolean',
      writable: false,
    },
  ],

  // Optional fields
  telemetryInterval: 30000, // 30 seconds
  connectionType: 'websocket', // 'mqtt' | 'websocket' | 'http'
  connectionConfig: {
    url: 'wss://iot.example.com/devices',
    username: 'device-001',
    password: 'secret',
    topic: 'devices/device-001',
    reconnect: true,
    reconnectInterval: 5000,
  },
};

const twin = new DigitalTwin(config);
```

### Connection Management

```typescript
// Connect to the device
await twin.connect();

// Listen for connection events
twin.on('connected', () => {
  console.log('Device connected');
});

twin.on('disconnected', () => {
  console.log('Device disconnected');
});

// Disconnect when done
twin.disconnect();
```

### State Management

The digital twin uses a reported/desired state pattern similar to AWS IoT Device Shadows:

```typescript
// Get full device state
const state = twin.getState();
console.log('Device ID:', state.deviceId);
console.log('Last updated:', new Date(state.timestamp));
console.log('Reported state:', state.reported);
console.log('Desired state:', state.desired);
console.log('Metadata:', state.metadata);

// Get a specific property value
const temp = twin.getProperty('temperature');
console.log('Current temperature:', temp);

// Set a desired value (sends to device)
twin.setDesired('setpoint', 72);
twin.setDesired('mode', 'cooling');

// Listen for state changes
twin.on('stateChange', (event) => {
  const newState = event.data as DeviceState;
  console.log('State updated:', newState.reported);
});
```

### Commands

Send commands to the physical device:

```typescript
// Send a command
const command = twin.sendCommand('restart', { delay: 5000 });
console.log('Command sent:', command.commandId);
console.log('Status:', command.status); // 'sent'

// Listen for command responses
twin.on('command', (event) => {
  const cmd = event.data as DeviceCommand;
  console.log(`Command ${cmd.commandId}: ${cmd.status}`);
  // Status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed'
});
```

### Telemetry

Access historical telemetry data:

```typescript
// Listen for telemetry events
twin.on('telemetry', (event) => {
  const telemetry = event.data as TelemetryData;
  console.log('Device:', telemetry.deviceId);
  console.log('Timestamp:', new Date(telemetry.timestamp));
  console.log('Values:', telemetry.values);
});

// Get telemetry history
const allHistory = twin.getTelemetryHistory();
console.log('Total records:', allHistory.length);

// Get history for a specific property
const tempHistory = twin.getTelemetryHistory('temperature');

// Limit the number of records
const recentHistory = twin.getTelemetryHistory('temperature', 10);
```

### Alerts

Alerts are automatically generated when telemetry values exceed property thresholds:

```typescript
twin.on('alert', (event) => {
  const alert = event.data as Alert;
  console.log('Alert ID:', alert.id);
  console.log('Device:', alert.deviceId);
  console.log('Severity:', alert.severity); // 'info' | 'warning' | 'critical'
  console.log('Message:', alert.message);
  console.log('Time:', new Date(alert.timestamp));
  console.log('Acknowledged:', alert.acknowledged);
});
```

### Event Subscription

```typescript
// Subscribe to events
const unsubscribe = twin.on('telemetry', (event) => {
  console.log('Telemetry received');
});

// Later, unsubscribe
unsubscribe();

// Available event types
type EventType =
  | 'connected'
  | 'disconnected'
  | 'stateChange'
  | 'telemetry'
  | 'alert'
  | 'command';
```

## FleetManager Class

Manage multiple digital twins as a fleet:

### Creating a Fleet

```typescript
import { FleetManager, DeviceConfig } from '@philjs/digital-twin';

const fleet = new FleetManager();

// Add devices to the fleet
const sensor1 = fleet.addDevice({
  id: 'sensor-001',
  name: 'Temperature Sensor 1',
  type: 'temperature-sensor',
  properties: [
    { name: 'temperature', type: 'number', telemetry: true },
  ],
  connectionType: 'websocket',
  connectionConfig: { url: 'wss://iot.example.com/ws' },
});

const sensor2 = fleet.addDevice({
  id: 'sensor-002',
  name: 'Temperature Sensor 2',
  type: 'temperature-sensor',
  properties: [
    { name: 'temperature', type: 'number', telemetry: true },
  ],
  connectionType: 'websocket',
  connectionConfig: { url: 'wss://iot.example.com/ws' },
});
```

### Fleet Operations

```typescript
// Get a specific device
const device = fleet.getDevice('sensor-001');

// Get all devices
const allDevices = fleet.getAllDevices();
console.log('Total devices:', allDevices.length);

// Connect all devices
await fleet.connectAll();

// Disconnect all devices
fleet.disconnectAll();

// Remove a device
fleet.removeDevice('sensor-001');

// Get fleet status
const status = fleet.getFleetStatus();
console.log('Total devices:', status.total);
console.log('Connected:', status.connected);
console.log('Disconnected:', status.disconnected);
console.log('Active alerts:', status.alerts);
```

### Fleet Events

Listen to events from all devices in the fleet:

```typescript
// Subscribe to all fleet events
const unsubscribe = fleet.onEvent((event) => {
  console.log(`[${event.deviceId}] ${event.type}:`, event.data);
});

// Events from any device in the fleet will trigger the callback
// Event types: connected, disconnected, stateChange, telemetry, alert, command
```

## PredictiveMaintenance Class

Analyze telemetry trends to predict maintenance needs:

### Setting Up Predictive Maintenance

```typescript
import { DigitalTwin, PredictiveMaintenance } from '@philjs/digital-twin';

const twin = new DigitalTwin({
  id: 'motor-001',
  name: 'Industrial Motor',
  type: 'motor',
  properties: [
    { name: 'vibration', type: 'number', unit: 'mm/s', telemetry: true },
    { name: 'temperature', type: 'number', unit: 'celsius', telemetry: true },
    { name: 'runHours', type: 'number', telemetry: true },
  ],
  connectionType: 'websocket',
  connectionConfig: { url: 'wss://iot.example.com/ws' },
});

const maintenance = new PredictiveMaintenance(twin);

// Set warning and critical thresholds
maintenance.setThreshold('vibration', 5.0, 10.0);  // warning at 5, critical at 10
maintenance.setThreshold('temperature', 80, 100); // warning at 80C, critical at 100C
```

### Running Analysis

```typescript
// Analyze telemetry trends (requires at least 10 data points)
const predictions = maintenance.analyze();

for (const prediction of predictions) {
  console.log('Property:', prediction.property);
  console.log('Current value:', prediction.currentValue);
  console.log('Predicted value (24h):', prediction.predictedValue);
  console.log('Hours to warning:', prediction.timeToWarning);
  console.log('Hours to critical:', prediction.timeToCritical);
  console.log('Confidence:', (prediction.confidence * 100).toFixed(1) + '%');
  console.log('Recommendation:', prediction.recommendation);
}

// Get prediction for a specific property
const vibrationPrediction = maintenance.getPrediction('vibration');
if (vibrationPrediction) {
  console.log('Vibration prediction:', vibrationPrediction.recommendation);
}
```

### Prediction Recommendations

The system provides actionable recommendations based on time to critical threshold:

| Time to Critical | Recommendation |
|-----------------|----------------|
| < 24 hours | "Immediate maintenance required" |
| < 168 hours (1 week) | "Schedule maintenance within this week" |
| > 168 hours | "Monitor closely, plan maintenance" |

## TimeSeriesStore Class

Persist telemetry data using IndexedDB:

### Initializing the Store

```typescript
import { TimeSeriesStore, TelemetryData } from '@philjs/digital-twin';

const store = new TimeSeriesStore();

// Initialize the database (auto-called on first operation)
await store.initialize();
```

### Storing Telemetry

```typescript
// Store telemetry data
await store.store({
  deviceId: 'sensor-001',
  timestamp: Date.now(),
  values: {
    temperature: 23.5,
    humidity: 45,
  },
});
```

### Querying Data

```typescript
// Query telemetry for a device and time range
const startTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
const endTime = Date.now();

const data = await store.query(
  'sensor-001',  // deviceId
  startTime,     // start timestamp
  endTime,       // end timestamp
);

console.log('Records found:', data.length);

// Query with property filter
const tempData = await store.query(
  'sensor-001',
  startTime,
  endTime,
  'temperature', // only records containing this property
);
```

### Aggregating Data

```typescript
// Get aggregated statistics
const hourlyStats = await store.aggregate(
  'sensor-001',   // deviceId
  'temperature',  // property
  startTime,      // start timestamp
  endTime,        // end timestamp
  'hour',         // interval: 'minute' | 'hour' | 'day'
);

for (const bucket of hourlyStats) {
  console.log('Time:', new Date(bucket.timestamp));
  console.log('Average:', bucket.avg.toFixed(2));
  console.log('Min:', bucket.min);
  console.log('Max:', bucket.max);
}
```

## Hooks

### useDigitalTwin

Reactive hook for managing a digital twin:

```typescript
import { useDigitalTwin } from '@philjs/digital-twin';

function DeviceMonitor() {
  const { twin, state, isConnected, setDesired, sendCommand } = useDigitalTwin({
    id: 'thermostat-001',
    name: 'Living Room Thermostat',
    type: 'thermostat',
    properties: [
      { name: 'temperature', type: 'number', telemetry: true },
      { name: 'setpoint', type: 'number', writable: true },
    ],
    connectionType: 'websocket',
    connectionConfig: {
      url: 'wss://iot.example.com/ws',
      reconnect: true,
    },
  });

  return (
    <div class="device-monitor">
      <h2>Thermostat</h2>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

      {state && (
        <>
          <p>Temperature: {state.reported.temperature}F</p>
          <p>Setpoint: {state.desired.setpoint}F</p>

          <input
            type="range"
            min={55}
            max={85}
            value={state.desired.setpoint}
            onChange={(e) => setDesired('setpoint', Number(e.target.value))}
          />

          <button onClick={() => sendCommand('refresh', {})}>
            Refresh
          </button>
        </>
      )}
    </div>
  );
}
```

### useFleet

Manage a fleet of devices reactively:

```typescript
import { useFleet, DeviceConfig } from '@philjs/digital-twin';

function FleetDashboard() {
  const {
    fleet,
    devices,
    events,
    addDevice,
    removeDevice,
    connectAll,
    disconnectAll,
  } = useFleet();

  const handleAddDevice = () => {
    const config: DeviceConfig = {
      id: `sensor-${Date.now()}`,
      name: 'New Sensor',
      type: 'temperature-sensor',
      properties: [
        { name: 'temperature', type: 'number', telemetry: true },
      ],
      connectionType: 'websocket',
      connectionConfig: { url: 'wss://iot.example.com/ws' },
    };
    addDevice(config);
  };

  return (
    <div class="fleet-dashboard">
      <h2>Device Fleet ({devices.length})</h2>

      <div class="controls">
        <button onClick={handleAddDevice}>Add Device</button>
        <button onClick={connectAll}>Connect All</button>
        <button onClick={disconnectAll}>Disconnect All</button>
      </div>

      <ul class="device-list">
        {devices.map((device) => (
          <li key={device.getState().deviceId}>
            {device.getState().deviceId}
            <button onClick={() => removeDevice(device.getState().deviceId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h3>Recent Events</h3>
      <ul class="event-log">
        {events.slice(-10).map((event, i) => (
          <li key={i}>
            [{event.deviceId}] {event.type}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useTelemetry

Track telemetry for a specific property:

```typescript
import { useDigitalTwin, useTelemetry } from '@philjs/digital-twin';

function TemperatureChart() {
  const { twin } = useDigitalTwin(deviceConfig);
  const { data, latestValue } = useTelemetry(twin, 'temperature', 100);

  return (
    <div class="temperature-chart">
      <h3>Temperature</h3>
      <p class="current-value">
        Current: {latestValue !== null ? `${latestValue}C` : 'N/A'}
      </p>

      <div class="chart">
        {data.map((point, i) => (
          <div
            key={i}
            class="bar"
            style={{
              height: `${(point.values.temperature as number) * 2}px`,
            }}
            title={new Date(point.timestamp).toLocaleTimeString()}
          />
        ))}
      </div>

      <p>Data points: {data.length}</p>
    </div>
  );
}
```

### usePredictiveMaintenance

Reactive predictive maintenance analysis:

```typescript
import { useDigitalTwin, usePredictiveMaintenance } from '@philjs/digital-twin';

function MaintenanceDashboard() {
  const { twin } = useDigitalTwin(motorConfig);
  const { predictions, analyze, setThreshold } = usePredictiveMaintenance(twin);

  // Set up thresholds on mount
  useEffect(() => {
    setThreshold('vibration', 5, 10);
    setThreshold('temperature', 80, 100);
  }, []);

  // Run analysis periodically
  useEffect(() => {
    const interval = setInterval(() => {
      analyze();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div class="maintenance-dashboard">
      <h2>Predictive Maintenance</h2>
      <button onClick={analyze}>Analyze Now</button>

      {predictions.length === 0 ? (
        <p>No predictions available. Need more telemetry data.</p>
      ) : (
        <ul class="predictions">
          {predictions.map((pred) => (
            <li
              key={pred.property}
              class={pred.timeToCritical < 24 ? 'critical' : 'warning'}
            >
              <h3>{pred.property}</h3>
              <p>Current: {pred.currentValue.toFixed(2)}</p>
              <p>Predicted (24h): {pred.predictedValue.toFixed(2)}</p>
              <p>Time to critical: {pred.timeToCritical.toFixed(1)} hours</p>
              <p>Confidence: {(pred.confidence * 100).toFixed(0)}%</p>
              <p class="recommendation">{pred.recommendation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Types Reference

### DeviceConfig

```typescript
interface DeviceConfig {
  id: string;                                    // Unique device identifier
  name: string;                                  // Human-readable name
  type: string;                                  // Device type/category
  properties: PropertyDefinition[];              // Device properties
  telemetryInterval?: number;                    // Telemetry interval in ms
  connectionType?: 'mqtt' | 'websocket' | 'http'; // Connection protocol
  connectionConfig?: ConnectionConfig;            // Connection settings
}
```

### PropertyDefinition

```typescript
interface PropertyDefinition {
  name: string;                                        // Property name
  type: 'number' | 'string' | 'boolean' | 'object' | 'array'; // Data type
  unit?: string;                                       // Unit of measurement
  min?: number;                                        // Minimum value (for alerts)
  max?: number;                                        // Maximum value (for alerts)
  writable?: boolean;                                  // Can be set via desired state
  telemetry?: boolean;                                 // Included in telemetry
}
```

### ConnectionConfig

```typescript
interface ConnectionConfig {
  url: string;                  // WebSocket/MQTT broker URL
  username?: string;            // Authentication username
  password?: string;            // Authentication password
  topic?: string;               // MQTT topic
  reconnect?: boolean;          // Enable auto-reconnect
  reconnectInterval?: number;   // Reconnect delay in ms
}
```

### DeviceState

```typescript
interface DeviceState {
  deviceId: string;                            // Device identifier
  timestamp: number;                           // Last update timestamp
  reported: Record<string, unknown>;           // State reported by device
  desired: Record<string, unknown>;            // Desired state from cloud
  metadata: Record<string, PropertyMetadata>;  // Property metadata
}
```

### PropertyMetadata

```typescript
interface PropertyMetadata {
  lastUpdated: number;              // Last update timestamp
  version: number;                  // Property version
  source: 'device' | 'cloud' | 'user'; // Update source
}
```

### TelemetryData

```typescript
interface TelemetryData {
  deviceId: string;                              // Device identifier
  timestamp: number;                             // Telemetry timestamp
  values: Record<string, number | string | boolean>; // Telemetry values
}
```

### DeviceCommand

```typescript
interface DeviceCommand {
  commandId: string;                                         // Unique command ID
  deviceId: string;                                          // Target device
  name: string;                                              // Command name
  payload: unknown;                                          // Command payload
  timestamp: number;                                         // Sent timestamp
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed';
}
```

### Alert

```typescript
interface Alert {
  id: string;                              // Unique alert ID
  deviceId: string;                        // Source device
  severity: 'info' | 'warning' | 'critical'; // Alert severity
  message: string;                         // Alert message
  timestamp: number;                       // Alert timestamp
  acknowledged: boolean;                   // Acknowledgment status
}
```

### DeviceEvent

```typescript
interface DeviceEvent {
  type: 'connected' | 'disconnected' | 'stateChange' | 'telemetry' | 'alert' | 'command';
  deviceId: string;     // Source device
  data: unknown;        // Event-specific data
  timestamp: number;    // Event timestamp
}
```

### MaintenancePrediction

```typescript
interface MaintenancePrediction {
  property: string;        // Property being analyzed
  currentValue: number;    // Current value
  predictedValue: number;  // Predicted value (24h ahead)
  timeToWarning: number;   // Hours until warning threshold
  timeToCritical: number;  // Hours until critical threshold
  confidence: number;      // Prediction confidence (0-1)
  recommendation: string;  // Maintenance recommendation
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `DigitalTwin` | Virtual representation of a physical IoT device |
| `FleetManager` | Manage multiple digital twins as a fleet |
| `PredictiveMaintenance` | Analyze telemetry trends for maintenance prediction |
| `TimeSeriesStore` | IndexedDB-based time-series telemetry storage |

### Hooks

| Hook | Description |
|------|-------------|
| `useDigitalTwin(config)` | Reactive digital twin management |
| `useFleet()` | Reactive fleet management |
| `useTelemetry(twin, property, limit?)` | Track telemetry for a property |
| `usePredictiveMaintenance(twin)` | Reactive predictive maintenance |

### DigitalTwin Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to the physical device |
| `disconnect()` | Disconnect from the device |
| `getState()` | Get current device state |
| `getProperty(name)` | Get a specific property value |
| `setDesired(property, value)` | Set desired state for a property |
| `sendCommand(name, payload)` | Send a command to the device |
| `getTelemetryHistory(property?, limit?)` | Get telemetry history |
| `on(event, callback)` | Subscribe to device events |

### FleetManager Methods

| Method | Description |
|--------|-------------|
| `addDevice(config)` | Add a device to the fleet |
| `getDevice(id)` | Get a device by ID |
| `getAllDevices()` | Get all devices in the fleet |
| `removeDevice(id)` | Remove a device from the fleet |
| `connectAll()` | Connect all devices |
| `disconnectAll()` | Disconnect all devices |
| `onEvent(callback)` | Subscribe to fleet events |
| `getFleetStatus()` | Get fleet status summary |

### TimeSeriesStore Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the IndexedDB database |
| `store(data)` | Store telemetry data |
| `query(deviceId, start, end, property?)` | Query telemetry data |
| `aggregate(deviceId, property, start, end, interval)` | Get aggregated statistics |

## Best Practices

1. **Use connection auto-reconnect** for resilient device connections
2. **Set property thresholds** to automatically generate alerts
3. **Store telemetry in TimeSeriesStore** for historical analysis and predictive maintenance
4. **Use the fleet manager** when working with multiple devices
5. **Implement proper cleanup** - disconnect devices when components unmount
6. **Monitor predictive maintenance** regularly to prevent equipment failures
7. **Use the reported/desired pattern** to track state synchronization

## Next Steps

- [@philjs/realtime](../realtime/overview.md) - WebSocket communication
- [@philjs/charts](../charts/overview.md) - Visualize telemetry data
- [Data Layer](../core/data-layer.md) - Server-side data management
