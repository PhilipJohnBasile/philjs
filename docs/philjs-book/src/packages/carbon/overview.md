# @philjs/carbon - Carbon-Aware Computing

**Schedule compute-intensive tasks during low-carbon periods. No other JavaScript framework provides carbon-aware workload scheduling.**

@philjs/carbon brings sustainability directly into your application by monitoring carbon intensity, scheduling tasks for green periods, tracking device energy usage, estimating network carbon footprint, and managing carbon budgets.

## Installation

```bash
npm install @philjs/carbon
# or
pnpm add @philjs/carbon
# or
bun add @philjs/carbon
```

## Why @philjs/carbon?

Building sustainable applications requires:
- Awareness of grid carbon intensity in real-time
- Intelligent deferral of non-critical compute tasks
- Understanding when the device is on "green" power
- Estimating carbon cost of network transfers
- Managing carbon budgets across your application

@philjs/carbon provides a unified, type-safe API that handles all of this.

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Carbon Intensity Monitoring** | Real-time grid carbon intensity with forecasts |
| **Intelligent Task Scheduling** | Defer tasks to low-carbon windows |
| **Device Energy Monitoring** | Battery level, charging status, power source |
| **Network Carbon Estimation** | Estimate carbon cost of data transfers |
| **Carbon Budget Management** | Daily, weekly, monthly carbon budgets |
| **Carbon Footprint Reporting** | Generate reports with savings metrics |
| **Regional Grid Data** | Pre-configured intensities for major regions |
| **Hooks API** | React-style hooks for all features |

## Quick Start

```typescript
import { CarbonTaskScheduler, greenCompute } from '@philjs/carbon';

// Initialize scheduler with regional configuration
const scheduler = new CarbonTaskScheduler({
  region: 'usa-ca',
  greenThreshold: 100, // gCO2eq/kWh
  carbonBudget: {
    daily: 1000,
    weekly: 5000,
    monthly: 20000
  }
});

await scheduler.initialize();

// Schedule a task for green execution
await scheduler.scheduleTask('heavy-compute', async () => {
  // Your compute-intensive work here
  await processLargeDataset();
}, {
  priority: 'normal',
  estimatedEnergy: 50, // mWh
  preferGreen: true,
  maxDelay: 4 * 60 * 60 * 1000 // Wait up to 4 hours for green window
});
```

## Carbon Task Scheduler

The `CarbonTaskScheduler` is the core class for scheduling compute-intensive tasks during low-carbon periods.

### Configuration

```typescript
import { CarbonTaskScheduler } from '@philjs/carbon';

const scheduler = new CarbonTaskScheduler({
  // Region for carbon intensity data
  region: 'germany',

  // API key for carbon intensity providers (optional)
  apiKey: process.env.CARBON_API_KEY,

  // Enable/disable scheduling (default: true)
  enableScheduling: true,

  // Maximum queued tasks (default: 100)
  maxQueueSize: 100,

  // Default task priority
  defaultPriority: 'normal',

  // Carbon intensity threshold for "green" periods (gCO2eq/kWh)
  greenThreshold: 100,

  // Carbon budget limits (gCO2eq)
  carbonBudget: {
    daily: 1000,
    weekly: 5000,
    monthly: 20000
  }
});

// Initialize the scheduler (sets up energy monitoring and scheduling)
await scheduler.initialize();
```

### Task Priorities

Tasks can be scheduled with different priority levels:

```typescript
// Critical - Execute immediately regardless of carbon intensity
await scheduler.scheduleTask('critical-alert', async () => {
  await sendSecurityAlert();
}, { priority: 'critical' });

// High - Execute immediately or with minimal delay
await scheduler.scheduleTask('user-request', async () => {
  await processUserAction();
}, { priority: 'high' });

// Normal - Wait for green periods if current intensity is high
await scheduler.scheduleTask('background-sync', async () => {
  await syncData();
}, { priority: 'normal' });

// Low - Prefer green periods, can wait longer
await scheduler.scheduleTask('analytics', async () => {
  await processAnalytics();
}, { priority: 'low' });

// Deferrable - Only execute during very low carbon periods
await scheduler.scheduleTask('batch-process', async () => {
  await runBatchJob();
}, {
  priority: 'deferrable',
  maxDelay: 24 * 60 * 60 * 1000 // Up to 24 hours
});
```

### Task Options

```typescript
interface TaskScheduleOptions {
  // Task priority level
  priority?: 'critical' | 'high' | 'normal' | 'low' | 'deferrable';

  // Estimated energy consumption in milliwatt-hours
  estimatedEnergy?: number;

  // Maximum delay before forcing execution (ms)
  maxDelay?: number;

  // Whether to prefer green execution windows
  preferGreen?: boolean;
}

// Example with all options
await scheduler.scheduleTask(
  'image-processing',
  async () => await processImages(),
  {
    priority: 'low',
    estimatedEnergy: 100, // 100 mWh
    maxDelay: 6 * 60 * 60 * 1000, // 6 hours
    preferGreen: true
  }
);
```

### Managing Tasks

```typescript
// Force immediate execution of a queued task
const result = await scheduler.executeNow('task-id');

// Cancel a scheduled task
const cancelled = scheduler.cancelTask('task-id');

// Get all queued tasks
const queuedTasks = scheduler.getQueuedTasks();
console.log(`${queuedTasks.length} tasks in queue`);

// Get current carbon budget status
const budget = scheduler.getBudget();
console.log(`Daily budget: ${budget.used.daily}/${budget.daily} gCO2eq`);

// Clean up when done
scheduler.destroy();
```

### Carbon Reports

Generate detailed carbon footprint reports:

```typescript
// Generate report for last 24 hours
const report = await scheduler.generateReport();

console.log(`Total emissions: ${report.totalEmissions} gCO2eq`);
console.log(`Savings from scheduling: ${report.savings} gCO2eq`);
console.log(`Green execution rate: ${report.greenPercentage}%`);

// Task breakdown
report.taskBreakdown.forEach(task => {
  console.log(`${task.taskId}: ${task.emissions} gCO2eq (${task.energy} mWh)`);
});

// Generate report for specific date range
const weeklyReport = await scheduler.generateReport(
  new Date('2024-01-01'),
  new Date('2024-01-07')
);
```

## Carbon Intensity Provider

Monitor real-time carbon intensity data for your region:

```typescript
import { CarbonIntensityProvider } from '@philjs/carbon';

const provider = new CarbonIntensityProvider('uk', process.env.CARBON_API_KEY);

// Get current carbon intensity
const intensity = await provider.getCurrentIntensity();
console.log(`Current: ${intensity.value} gCO2eq/kWh`);
console.log(`Index: ${intensity.index}`); // 'very-low' | 'low' | 'moderate' | 'high' | 'very-high'
console.log(`Region: ${intensity.region}`);

// Get 24-hour forecast
const forecast = await provider.getForecast(24);
forecast.forEach(point => {
  const time = new Date(point.timestamp).toLocaleTimeString();
  console.log(`${time}: ${point.value} gCO2eq/kWh (${point.index})`);
});

// Find optimal execution window
const window = await provider.findOptimalWindow(
  5000,   // Task duration: 5 seconds
  3600000 // Max delay: 1 hour
);

if (window) {
  console.log(`Best time to execute: ${new Date(window.start)}`);
  console.log(`Expected intensity: ${window.intensity} gCO2eq/kWh`);
}

// Subscribe to intensity updates (polls every 5 minutes)
const unsubscribe = provider.subscribe((intensity) => {
  console.log(`Intensity updated: ${intensity.value} gCO2eq/kWh`);

  if (intensity.index === 'very-low') {
    console.log('Excellent time for compute-intensive tasks!');
  }
});

// Change region
provider.setRegion('france');

// Clean up subscription
unsubscribe();
```

### Carbon Intensity Index

The intensity index categorizes carbon intensity levels:

| Index | gCO2eq/kWh | Description |
|-------|------------|-------------|
| `very-low` | < 50 | Excellent - primarily renewable energy |
| `low` | 50-99 | Good - significant renewable contribution |
| `moderate` | 100-199 | Average - mixed energy sources |
| `high` | 200-349 | Poor - fossil fuel heavy |
| `very-high` | >= 350 | Bad - coal/gas dominated |

## Device Energy Monitor

Monitor device battery and power status:

```typescript
import { DeviceEnergyMonitor } from '@philjs/carbon';

const monitor = new DeviceEnergyMonitor();
await monitor.initialize();

// Get current energy status
const energy = await monitor.getCurrentEnergy();
console.log(`Battery: ${(energy.batteryLevel * 100).toFixed(0)}%`);
console.log(`Charging: ${energy.charging}`);
console.log(`Power source: ${energy.powerSource}`); // 'battery' | 'ac' | 'unknown'
console.log(`Estimated wattage: ${energy.estimatedWattage}W`);

if (energy.chargingTime) {
  console.log(`Time to full charge: ${energy.chargingTime / 60000} minutes`);
}

if (energy.dischargingTime) {
  console.log(`Time remaining: ${energy.dischargingTime / 60000} minutes`);
}

// Check if device is on "green" power
// (plugged in or battery > 80%)
if (monitor.isOnGreenPower()) {
  console.log('Good time for compute-intensive tasks');
}

// Subscribe to energy changes
const unsubscribe = monitor.subscribe((energy) => {
  if (!energy.charging && energy.batteryLevel < 0.2) {
    console.log('Low battery - deferring non-critical tasks');
  }
});

// Clean up
unsubscribe();
```

## Network Carbon Estimator

Estimate the carbon footprint of network transfers:

```typescript
import { NetworkCarbonEstimator } from '@philjs/carbon';

// Estimate carbon for a data transfer
const transferCarbon = NetworkCarbonEstimator.estimateTransfer(
  1024 * 1024 * 100, // 100 MB
  'germany'
);
console.log(`100 MB transfer in Germany: ${transferCarbon.toFixed(4)} gCO2`);

// Estimate carbon for a request/response cycle
const requestCarbon = NetworkCarbonEstimator.estimateRequest(
  1000,   // 1 KB request
  50000,  // 50 KB response
  'usa-ca'
);
console.log(`API call: ${requestCarbon.toFixed(6)} gCO2`);

// Get regional grid intensity
const franceIntensity = NetworkCarbonEstimator.getRegionIntensity('france');
console.log(`France grid: ${franceIntensity} gCO2/kWh`);

const globalAverage = NetworkCarbonEstimator.getRegionIntensity();
console.log(`Global average: ${globalAverage} gCO2/kWh`);
```

### Carbon-Aware Fetch Wrapper

Wrap the native fetch API to track carbon costs:

```typescript
import { NetworkCarbonEstimator } from '@philjs/carbon';

// Create a carbon-tracking fetch wrapper
const greenFetch = NetworkCarbonEstimator.createFetchWrapper('usa');

// Use like regular fetch
const response = await greenFetch('/api/large-dataset');
const data = await response.json();

// Access carbon estimate
const carbonCost = (response as any).__carbonEstimate;
console.log(`Request carbon cost: ${carbonCost.toFixed(6)} gCO2`);

// Use in a component to track API carbon costs
async function fetchWithTracking(url: string) {
  const response = await greenFetch(url);
  const carbon = (response as any).__carbonEstimate;

  // Report to analytics
  trackCarbonUsage('api-call', carbon);

  return response;
}
```

### Regional Grid Intensities

Pre-configured grid intensity values (gCO2/kWh):

| Region | Code | Intensity |
|--------|------|-----------|
| Iceland | `iceland` | 20 |
| Norway | `norway` | 30 |
| Sweden | `sweden` | 45 |
| France | `france` | 50 |
| Brazil | `brazil` | 100 |
| UK | `uk` | 200 |
| California | `usa-ca` | 200 |
| Germany | `germany` | 350 |
| Texas | `usa-tx` | 350 |
| USA (average) | `usa` | 400 |
| Australia | `australia` | 500 |
| China | `china` | 550 |
| Poland | `poland` | 650 |
| India | `india` | 700 |

## Green Compute Wrapper

Wrap any async function for carbon-aware execution:

```typescript
import { greenCompute, CarbonTaskScheduler } from '@philjs/carbon';

// Basic usage - creates internal scheduler
const processImages = greenCompute(async (images: string[]) => {
  const results = [];
  for (const image of images) {
    results.push(await applyFilters(image));
  }
  return results;
}, {
  estimatedEnergy: 50,
  maxDelay: 3600000, // 1 hour
  priority: 'normal'
});

// Call like a normal function - scheduling handled automatically
const processed = await processImages(['img1.jpg', 'img2.jpg']);

// With shared scheduler for better efficiency
const scheduler = new CarbonTaskScheduler({ region: 'uk' });
await scheduler.initialize();

const analyzeSentiment = greenCompute(async (texts: string[]) => {
  return await nlpAnalyze(texts);
}, {
  scheduler,
  estimatedEnergy: 30,
  priority: 'low'
});

const generateReport = greenCompute(async (data: Data) => {
  return await buildReport(data);
}, {
  scheduler,
  estimatedEnergy: 20,
  priority: 'deferrable'
});

// Both functions share the same scheduler
const sentiment = await analyzeSentiment(['Hello world']);
const report = await generateReport(salesData);
```

## Hooks API

React-style hooks for integrating carbon awareness into components:

### useCarbonScheduler

Access the carbon-aware task scheduler:

```typescript
import { useCarbonScheduler } from '@philjs/carbon';

function BackgroundSync() {
  const {
    scheduler,
    scheduleTask,
    cancelTask,
    getQueuedTasks,
    getBudget,
    generateReport
  } = useCarbonScheduler();

  async function syncData() {
    await scheduleTask('sync', async () => {
      await fetchAndStoreData();
    }, {
      priority: 'low',
      preferGreen: true
    });
  }

  const budget = getBudget();
  const queued = getQueuedTasks();

  return (
    <div>
      <p>Queued tasks: {queued.length}</p>
      <p>Daily carbon used: {budget.used.daily.toFixed(2)} gCO2eq</p>
      <button onClick={syncData}>Schedule Sync</button>
    </div>
  );
}
```

### useCarbonIntensity

Monitor carbon intensity in real-time:

```typescript
import { useCarbonIntensity } from '@philjs/carbon';

function CarbonIndicator() {
  const {
    intensity,
    loading,
    forecast,
    isGreen,
    refresh
  } = useCarbonIntensity('uk');

  if (loading) return <p>Loading intensity data...</p>;

  return (
    <div>
      <div class={`indicator ${intensity?.index}`}>
        <span>{intensity?.value.toFixed(0)} gCO2/kWh</span>
        <span class="label">{intensity?.index}</span>
      </div>

      {isGreen && (
        <p class="green-notice">
          Now is a great time for compute-intensive tasks!
        </p>
      )}

      <h4>24-Hour Forecast</h4>
      <ul>
        {forecast.slice(0, 6).map(point => (
          <li key={point.timestamp}>
            {new Date(point.timestamp).toLocaleTimeString()}:
            {point.value.toFixed(0)} gCO2/kWh
          </li>
        ))}
      </ul>

      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### useDeviceEnergy

Monitor device battery and power status:

```typescript
import { useDeviceEnergy } from '@philjs/carbon';

function BatteryStatus() {
  const {
    energy,
    isOnGreenPower,
    batteryLevel,
    isCharging
  } = useDeviceEnergy();

  return (
    <div>
      <div class="battery">
        <div
          class="level"
          style={{ width: `${batteryLevel * 100}%` }}
        />
      </div>

      <p>
        {(batteryLevel * 100).toFixed(0)}%
        {isCharging ? ' (Charging)' : ''}
      </p>

      {isOnGreenPower ? (
        <p class="green">On green power - good for heavy compute</p>
      ) : (
        <p class="warning">On battery - consider deferring tasks</p>
      )}

      {energy?.powerSource && (
        <p>Power source: {energy.powerSource}</p>
      )}
    </div>
  );
}
```

### useNetworkCarbon

Estimate network transfer carbon costs:

```typescript
import { useNetworkCarbon } from '@philjs/carbon';

function DataFetcher() {
  const {
    estimateTransfer,
    estimateRequest,
    greenFetch
  } = useNetworkCarbon('germany');

  const [totalCarbon, setTotalCarbon] = useState(0);

  async function loadData() {
    const response = await greenFetch('/api/large-dataset');
    const carbon = (response as any).__carbonEstimate;
    setTotalCarbon(prev => prev + carbon);
    return response.json();
  }

  // Estimate before fetching
  const estimatedCarbon = estimateRequest(1000, 500000); // 1KB req, 500KB res

  return (
    <div>
      <p>Estimated carbon for next request: {estimatedCarbon.toFixed(4)} gCO2</p>
      <p>Total carbon used: {totalCarbon.toFixed(4)} gCO2</p>
      <button onClick={loadData}>Fetch Data</button>
    </div>
  );
}
```

### useCarbonBudget

Track carbon budget usage:

```typescript
import { useCarbonBudget } from '@philjs/carbon';

function CarbonBudgetWidget() {
  const {
    budget,
    isWithinBudget,
    dailyRemaining,
    weeklyRemaining,
    monthlyRemaining,
    percentUsed
  } = useCarbonBudget();

  return (
    <div>
      <h3>Carbon Budget Status</h3>

      {!isWithinBudget && (
        <div class="warning">
          Carbon budget exceeded! Consider reducing compute tasks.
        </div>
      )}

      <div class="budget-meters">
        <div>
          <label>Daily</label>
          <progress value={percentUsed.daily} max="100" />
          <span>{dailyRemaining.toFixed(0)} gCO2 remaining</span>
        </div>

        <div>
          <label>Weekly</label>
          <progress value={percentUsed.weekly} max="100" />
          <span>{weeklyRemaining.toFixed(0)} gCO2 remaining</span>
        </div>

        <div>
          <label>Monthly</label>
          <progress value={percentUsed.monthly} max="100" />
          <span>{monthlyRemaining.toFixed(0)} gCO2 remaining</span>
        </div>
      </div>
    </div>
  );
}
```

## Complete Example

A full carbon-aware dashboard component:

```typescript
import {
  CarbonTaskScheduler,
  useCarbonIntensity,
  useDeviceEnergy,
  useCarbonBudget,
  greenCompute
} from '@philjs/carbon';

// Initialize shared scheduler
const scheduler = new CarbonTaskScheduler({
  region: 'uk',
  greenThreshold: 100,
  carbonBudget: {
    daily: 500,
    weekly: 2500,
    monthly: 10000
  }
});
scheduler.initialize();

// Wrap compute-heavy functions
const processAnalytics = greenCompute(async (data: AnalyticsData) => {
  return await heavyComputation(data);
}, {
  scheduler,
  estimatedEnergy: 100,
  priority: 'deferrable'
});

function CarbonDashboard() {
  const { intensity, isGreen, forecast } = useCarbonIntensity('uk');
  const { batteryLevel, isCharging, isOnGreenPower } = useDeviceEnergy();
  const { isWithinBudget, dailyRemaining, percentUsed } = useCarbonBudget();

  const canRunHeavyTasks = isGreen && isOnGreenPower && isWithinBudget;

  async function runAnalytics() {
    // Will be scheduled for optimal carbon timing
    const results = await processAnalytics(analyticsData);
    displayResults(results);
  }

  return (
    <div class="carbon-dashboard">
      <section class="status-panel">
        <h2>Carbon Status</h2>

        <div class={`intensity-badge ${intensity?.index}`}>
          <span class="value">{intensity?.value.toFixed(0)}</span>
          <span class="unit">gCO2/kWh</span>
          <span class="label">{intensity?.index}</span>
        </div>

        <div class="device-status">
          <div class="battery">
            {isCharging ? '🔌' : '🔋'} {(batteryLevel * 100).toFixed(0)}%
          </div>
          <div class={isOnGreenPower ? 'green' : 'amber'}>
            {isOnGreenPower ? 'Green Power' : 'Battery Power'}
          </div>
        </div>
      </section>

      <section class="budget-panel">
        <h2>Carbon Budget</h2>
        <div class="budget-bar">
          <div
            class="used"
            style={{ width: `${percentUsed.daily}%` }}
          />
        </div>
        <p>{dailyRemaining.toFixed(0)} gCO2 remaining today</p>
      </section>

      <section class="forecast-panel">
        <h2>24-Hour Forecast</h2>
        <div class="forecast-chart">
          {forecast.map(point => (
            <div
              key={point.timestamp}
              class={`bar ${point.index}`}
              style={{ height: `${point.value / 5}px` }}
              title={`${new Date(point.timestamp).toLocaleTimeString()}: ${point.value} gCO2/kWh`}
            />
          ))}
        </div>
      </section>

      <section class="actions-panel">
        <button
          onClick={runAnalytics}
          disabled={!isWithinBudget}
          class={canRunHeavyTasks ? 'primary' : 'secondary'}
        >
          {canRunHeavyTasks
            ? 'Run Analytics Now'
            : 'Schedule Analytics for Green Period'}
        </button>

        {!canRunHeavyTasks && (
          <p class="info">
            {!isGreen && 'Carbon intensity is high. '}
            {!isOnGreenPower && 'Device is on battery. '}
            {!isWithinBudget && 'Daily budget exceeded. '}
            Task will be scheduled for optimal timing.
          </p>
        )}
      </section>
    </div>
  );
}
```

## Types Reference

### CarbonIntensity

```typescript
interface CarbonIntensity {
  value: number;                    // gCO2eq/kWh
  index: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  timestamp: number;                // Unix timestamp
  region: string;                   // Region code
  forecast: CarbonForecast[];       // Future predictions
}
```

### CarbonForecast

```typescript
interface CarbonForecast {
  timestamp: number;                // Unix timestamp
  value: number;                    // gCO2eq/kWh
  index: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
}
```

### CarbonBudget

```typescript
interface CarbonBudget {
  daily: number;                    // Daily limit (gCO2eq)
  weekly: number;                   // Weekly limit
  monthly: number;                  // Monthly limit
  used: {
    daily: number;                  // Current daily usage
    weekly: number;                 // Current weekly usage
    monthly: number;                // Current monthly usage
  };
}
```

### TaskSchedule

```typescript
interface TaskSchedule {
  id: string;                       // Unique task identifier
  task: () => Promise<any>;         // Task function
  priority: 'critical' | 'high' | 'normal' | 'low' | 'deferrable';
  estimatedEnergy: number;          // mWh
  maxDelay: number;                 // Maximum delay (ms)
  preferGreen: boolean;             // Prefer green periods
  scheduled?: number;               // Scheduled execution time
  executed?: number;                // Actual execution time
  carbonCost?: number;              // Calculated carbon cost
}
```

### DeviceEnergy

```typescript
interface DeviceEnergy {
  batteryLevel: number;             // 0-1 percentage
  charging: boolean;                // Currently charging
  chargingTime: number | null;      // Time to full charge (ms)
  dischargingTime: number | null;   // Time to empty (ms)
  powerSource: 'battery' | 'ac' | 'unknown';
  estimatedWattage: number;         // Estimated power draw (W)
}
```

### CarbonConfig

```typescript
interface CarbonConfig {
  region?: string;                  // Region code
  apiKey?: string;                  // Carbon API key
  enableScheduling?: boolean;       // Enable task scheduling
  maxQueueSize?: number;            // Max queued tasks
  defaultPriority?: TaskSchedule['priority'];
  carbonBudget?: Partial<CarbonBudget>;
  greenThreshold?: number;          // Green threshold (gCO2eq/kWh)
}
```

### CarbonReport

```typescript
interface CarbonReport {
  totalEmissions: number;           // Total gCO2eq
  taskBreakdown: {
    taskId: string;
    emissions: number;
    energy: number;
    timestamp: number;
  }[];
  savings: number;                  // Estimated savings from scheduling
  greenPercentage: number;          // % of tasks run during green periods
  period: {
    start: number;
    end: number;
  };
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `CarbonTaskScheduler` | Main scheduler for carbon-aware task execution |
| `CarbonIntensityProvider` | Real-time carbon intensity monitoring |
| `DeviceEnergyMonitor` | Device battery and power monitoring |
| `NetworkCarbonEstimator` | Static utility for network carbon estimation |

### CarbonTaskScheduler Methods

| Method | Description |
|--------|-------------|
| `constructor(config?)` | Create scheduler with optional configuration |
| `initialize()` | Initialize scheduler and energy monitoring |
| `scheduleTask(id, task, options?)` | Schedule a task for carbon-aware execution |
| `executeNow(id)` | Force immediate execution of queued task |
| `cancelTask(id)` | Cancel a scheduled task |
| `getQueuedTasks()` | Get all pending tasks |
| `getBudget()` | Get current carbon budget status |
| `generateReport(start?, end?)` | Generate carbon footprint report |
| `destroy()` | Clean up scheduler resources |

### CarbonIntensityProvider Methods

| Method | Description |
|--------|-------------|
| `constructor(region?, apiKey?)` | Create provider for region |
| `getCurrentIntensity()` | Get current carbon intensity |
| `getForecast(hours)` | Get intensity forecast |
| `findOptimalWindow(duration, maxDelay)` | Find best execution window |
| `subscribe(callback)` | Subscribe to intensity updates |
| `setRegion(region)` | Change monitoring region |

### DeviceEnergyMonitor Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize battery monitoring |
| `getCurrentEnergy()` | Get current energy state |
| `isOnGreenPower()` | Check if on green power |
| `subscribe(callback)` | Subscribe to energy changes |

### NetworkCarbonEstimator Static Methods

| Method | Description |
|--------|-------------|
| `estimateTransfer(bytes, region?)` | Estimate transfer carbon |
| `estimateRequest(reqBytes, resBytes, region?)` | Estimate request carbon |
| `getRegionIntensity(region?)` | Get regional grid intensity |
| `createFetchWrapper(region?)` | Create carbon-tracking fetch |

### Hooks

| Hook | Description |
|------|-------------|
| `useCarbonScheduler(config?)` | Access task scheduler |
| `useCarbonIntensity(region?)` | Monitor carbon intensity |
| `useDeviceEnergy()` | Monitor device energy |
| `useNetworkCarbon(region?)` | Network carbon estimation |
| `useCarbonBudget()` | Track carbon budget usage |

### Functions

| Function | Description |
|----------|-------------|
| `greenCompute(fn, options?)` | Wrap function for carbon-aware execution |

## Best Practices

1. **Choose appropriate priorities** - Critical tasks execute immediately; deferrable tasks wait for green periods
2. **Set realistic energy estimates** - Better estimates lead to more accurate carbon tracking
3. **Configure regional data** - Use your actual region for accurate intensity data
4. **Set carbon budgets** - Establish daily/weekly/monthly limits for your application
5. **Monitor battery status** - Defer heavy tasks when on battery power
6. **Use shared schedulers** - Share a single scheduler instance across your app
7. **Generate regular reports** - Track your carbon footprint over time
8. **Combine with isGreen checks** - Use real-time intensity for immediate decisions

## License

MIT
