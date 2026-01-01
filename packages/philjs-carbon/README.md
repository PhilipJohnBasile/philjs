# @philjs/carbon

Carbon-Aware Computing for PhilJS Applications

[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Schedule compute-intensive tasks during low-carbon periods. Built for sustainable web applications.

**Features:**
- Real-time carbon intensity monitoring
- Intelligent task scheduling during green periods
- Battery-aware execution strategies
- Network carbon estimation
- Carbon budget management
- Carbon footprint reporting
- Regional grid intensity data

## Installation

```bash
npm install @philjs/carbon
```

## Quick Start

```typescript
import { CarbonTaskScheduler, greenCompute } from '@philjs/carbon';

// Initialize scheduler
const scheduler = new CarbonTaskScheduler({
  region: 'usa-ca',
  greenThreshold: 100
});
await scheduler.initialize();

// Schedule a task for green execution
await scheduler.scheduleTask('heavy-compute', async () => {
  // Your compute-intensive work
}, {
  priority: 'normal',
  estimatedEnergy: 50,
  preferGreen: true
});
```

## Usage

### Carbon Task Scheduler

```typescript
import { CarbonTaskScheduler } from '@philjs/carbon';

const scheduler = new CarbonTaskScheduler({
  region: 'germany',
  enableScheduling: true,
  maxQueueSize: 100,
  defaultPriority: 'normal',
  greenThreshold: 100, // gCO2eq/kWh
  carbonBudget: {
    daily: 1000,
    weekly: 5000,
    monthly: 20000
  }
});

await scheduler.initialize();

// Schedule tasks with different priorities
await scheduler.scheduleTask('critical-task', async () => {
  // Executes immediately regardless of carbon intensity
}, { priority: 'critical' });

await scheduler.scheduleTask('deferrable-task', async () => {
  // Waits for low-carbon window
}, {
  priority: 'deferrable',
  maxDelay: 24 * 60 * 60 * 1000, // 24 hours
  preferGreen: true
});
```

### Carbon Intensity Monitoring

```typescript
import { CarbonIntensityProvider } from '@philjs/carbon';

const provider = new CarbonIntensityProvider('uk');

// Get current intensity
const intensity = await provider.getCurrentIntensity();
console.log(`Current: ${intensity.value} gCO2eq/kWh (${intensity.index})`);

// Get 24-hour forecast
const forecast = await provider.getForecast(24);

// Find optimal execution window
const window = await provider.findOptimalWindow(
  5000,  // 5 second task duration
  3600000 // 1 hour max delay
);

// Subscribe to intensity updates
const unsubscribe = provider.subscribe((intensity) => {
  console.log(`Intensity updated: ${intensity.value}`);
});
```

### Device Energy Monitoring

```typescript
import { DeviceEnergyMonitor } from '@philjs/carbon';

const monitor = new DeviceEnergyMonitor();
await monitor.initialize();

const energy = await monitor.getCurrentEnergy();
console.log('Battery:', energy.batteryLevel * 100 + '%');
console.log('Charging:', energy.charging);
console.log('Power source:', energy.powerSource);

// Check if on "green" power
if (monitor.isOnGreenPower()) {
  // Good time for compute
}
```

### Network Carbon Estimation

```typescript
import { NetworkCarbonEstimator } from '@philjs/carbon';

// Estimate transfer carbon
const transferCarbon = NetworkCarbonEstimator.estimateTransfer(
  1024 * 1024 * 100, // 100MB
  'germany'
);

// Estimate request carbon
const requestCarbon = NetworkCarbonEstimator.estimateRequest(
  1000,  // 1KB request
  50000, // 50KB response
  'usa-ca'
);

// Create carbon-aware fetch wrapper
const greenFetch = NetworkCarbonEstimator.createFetchWrapper('france');
const response = await greenFetch('/api/data');
console.log('Carbon estimate:', (response as any).__carbonEstimate);
```

### Green Compute Wrapper

```typescript
import { greenCompute } from '@philjs/carbon';

// Wrap any async function for carbon-aware execution
const processData = greenCompute(async (data: number[]) => {
  return data.map(x => x * 2);
}, {
  estimatedEnergy: 10,
  maxDelay: 3600000,
  priority: 'normal'
});

const result = await processData([1, 2, 3, 4, 5]);
```

### Hooks API

```typescript
import {
  useCarbonScheduler,
  useCarbonIntensity,
  useDeviceEnergy,
  useNetworkCarbon,
  useCarbonBudget
} from '@philjs/carbon';

// Scheduler hook
const { scheduler, scheduleTask, cancelTask, getBudget, generateReport } =
  useCarbonScheduler();

// Intensity hook
const { intensity, loading, forecast, isGreen, refresh } =
  useCarbonIntensity('uk');

// Energy hook
const { energy, isOnGreenPower, batteryLevel, isCharging } =
  useDeviceEnergy();

// Network carbon hook
const { estimateTransfer, estimateRequest, greenFetch } =
  useNetworkCarbon('france');

// Budget hook
const { budget, isWithinBudget, dailyRemaining, percentUsed } =
  useCarbonBudget();
```

## API Reference

### Classes

#### `CarbonTaskScheduler`
Main scheduler for carbon-aware task execution.

**Methods:**
- `initialize()` - Initialize the scheduler
- `scheduleTask(id, task, options?)` - Schedule a task
- `executeNow(id)` - Force immediate execution
- `cancelTask(id)` - Cancel a scheduled task
- `getQueuedTasks()` - Get pending tasks
- `getBudget()` - Get carbon budget status
- `generateReport(start?, end?)` - Generate carbon report
- `destroy()` - Cleanup scheduler

#### `CarbonIntensityProvider`
Real-time carbon intensity data.

**Methods:**
- `getCurrentIntensity()` - Get current intensity
- `getForecast(hours)` - Get forecast
- `findOptimalWindow(duration, maxDelay)` - Find best execution window
- `subscribe(callback)` - Subscribe to updates
- `setRegion(region)` - Change region

#### `DeviceEnergyMonitor`
Device battery and power monitoring.

**Methods:**
- `initialize()` - Initialize monitor
- `getCurrentEnergy()` - Get current energy state
- `isOnGreenPower()` - Check if on green power
- `subscribe(callback)` - Subscribe to changes

#### `NetworkCarbonEstimator`
Network transfer carbon estimation.

**Static Methods:**
- `estimateTransfer(bytes, region?)` - Estimate transfer carbon
- `estimateRequest(reqBytes, resBytes, region?)` - Estimate request carbon
- `getRegionIntensity(region?)` - Get regional grid intensity
- `createFetchWrapper(region?)` - Create carbon-aware fetch

### Types

```typescript
interface CarbonConfig {
  region?: string;
  apiKey?: string;
  enableScheduling?: boolean;
  maxQueueSize?: number;
  defaultPriority?: 'critical' | 'high' | 'normal' | 'low' | 'deferrable';
  carbonBudget?: Partial<CarbonBudget>;
  greenThreshold?: number;
}

interface CarbonIntensity {
  value: number;
  index: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  timestamp: number;
  region: string;
  forecast: CarbonForecast[];
}

interface TaskSchedule {
  id: string;
  task: () => Promise<any>;
  priority: 'critical' | 'high' | 'normal' | 'low' | 'deferrable';
  estimatedEnergy: number;
  maxDelay: number;
  preferGreen: boolean;
}

interface CarbonBudget {
  daily: number;
  weekly: number;
  monthly: number;
  used: { daily: number; weekly: number; monthly: number };
}
```

## Regional Grid Intensities

Pre-configured intensities (gCO2/kWh):
- France: 50
- Sweden: 45
- Norway: 30
- Iceland: 20
- UK: 200
- Germany: 350
- USA: 400
- USA-CA: 200
- China: 550
- India: 700

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-carbon/src/index.ts

### Public API
- Direct exports: CarbonBudget, CarbonConfig, CarbonForecast, CarbonIntensity, CarbonIntensityProvider, CarbonReport, CarbonTaskScheduler, DeviceEnergy, DeviceEnergyMonitor, NetworkCarbonEstimator, TaskSchedule, greenCompute, useCarbonBudget, useCarbonIntensity, useCarbonScheduler, useDeviceEnergy, useNetworkCarbon
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
