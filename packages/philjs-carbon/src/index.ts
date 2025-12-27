/**
 * @philjs/carbon - Carbon-Aware Computing
 *
 * Schedule compute-intensive tasks during low-carbon periods.
 * No other framework provides carbon-aware workload scheduling.
 *
 * Features:
 * - Real-time carbon intensity monitoring
 * - Intelligent task scheduling during green periods
 * - Battery-aware execution strategies
 * - Network carbon estimation
 * - Carbon budget management
 * - Renewable energy preference
 * - Carbon footprint reporting
 */

// ============================================================================
// Types
// ============================================================================

export interface CarbonIntensity {
  value: number; // gCO2eq/kWh
  index: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  timestamp: number;
  region: string;
  forecast: CarbonForecast[];
}

export interface CarbonForecast {
  timestamp: number;
  value: number;
  index: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
}

export interface CarbonBudget {
  daily: number; // gCO2eq
  weekly: number;
  monthly: number;
  used: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface TaskSchedule {
  id: string;
  task: () => Promise<any>;
  priority: 'critical' | 'high' | 'normal' | 'low' | 'deferrable';
  estimatedEnergy: number; // mWh
  maxDelay: number; // ms - maximum acceptable delay
  preferGreen: boolean;
  scheduled?: number;
  executed?: number;
  carbonCost?: number;
}

export interface DeviceEnergy {
  batteryLevel: number;
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
  powerSource: 'battery' | 'ac' | 'unknown';
  estimatedWattage: number;
}

export interface CarbonReport {
  totalEmissions: number; // gCO2eq
  taskBreakdown: {
    taskId: string;
    emissions: number;
    energy: number;
    timestamp: number;
  }[];
  savings: number; // Estimated savings from scheduling
  greenPercentage: number; // % of tasks run during green periods
  period: {
    start: number;
    end: number;
  };
}

export interface CarbonConfig {
  region?: string;
  apiKey?: string; // For carbon intensity APIs
  enableScheduling?: boolean;
  maxQueueSize?: number;
  defaultPriority?: TaskSchedule['priority'];
  carbonBudget?: Partial<CarbonBudget>;
  greenThreshold?: number; // gCO2eq/kWh below which is considered "green"
}

// ============================================================================
// Carbon Intensity Provider
// ============================================================================

export class CarbonIntensityProvider {
  private region: string;
  private apiKey?: string;
  private cache: Map<string, { data: CarbonIntensity; expires: number }> = new Map();
  private listeners: Set<(intensity: CarbonIntensity) => void> = new Set();
  private pollInterval?: ReturnType<typeof setInterval>;

  constructor(region: string = 'global', apiKey?: string) {
    this.region = region;
    this.apiKey = apiKey;
  }

  async getCurrentIntensity(): Promise<CarbonIntensity> {
    const cacheKey = `current:${this.region}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // In production, this would call real APIs:
    // - Electricity Maps API
    // - UK Carbon Intensity API
    // - WattTime API
    // For now, simulate with time-based variation
    const intensity = this.simulateIntensity();

    this.cache.set(cacheKey, {
      data: intensity,
      expires: Date.now() + 5 * 60 * 1000 // 5 min cache
    });

    return intensity;
  }

  async getForecast(hours: number = 24): Promise<CarbonForecast[]> {
    const forecasts: CarbonForecast[] = [];
    const now = Date.now();

    for (let i = 0; i < hours; i++) {
      const timestamp = now + i * 60 * 60 * 1000;
      const value = this.simulateIntensityValue(timestamp);
      forecasts.push({
        timestamp,
        value,
        index: this.valueToIndex(value)
      });
    }

    return forecasts;
  }

  async findOptimalWindow(
    durationMs: number,
    maxDelayMs: number
  ): Promise<{ start: number; intensity: number } | null> {
    const forecast = await this.getForecast(Math.ceil(maxDelayMs / (60 * 60 * 1000)));

    if (forecast.length === 0) return null;

    let bestWindow = { start: Date.now(), intensity: Infinity };

    for (const point of forecast) {
      if (point.timestamp > Date.now() + maxDelayMs - durationMs) break;

      if (point.value < bestWindow.intensity) {
        bestWindow = { start: point.timestamp, intensity: point.value };
      }
    }

    return bestWindow;
  }

  subscribe(callback: (intensity: CarbonIntensity) => void): () => void {
    this.listeners.add(callback);

    if (!this.pollInterval) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private startPolling(): void {
    this.pollInterval = setInterval(async () => {
      const intensity = await this.getCurrentIntensity();
      this.listeners.forEach(cb => cb(intensity));
    }, 5 * 60 * 1000); // Poll every 5 minutes
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private simulateIntensity(): CarbonIntensity {
    const value = this.simulateIntensityValue(Date.now());

    return {
      value,
      index: this.valueToIndex(value),
      timestamp: Date.now(),
      region: this.region,
      forecast: []
    };
  }

  private simulateIntensityValue(timestamp: number): number {
    // Simulate daily patterns - lower at night, higher during peak
    const hour = new Date(timestamp).getHours();
    const baseIntensity = 200; // gCO2eq/kWh

    // Solar contribution (lower during day in regions with solar)
    const solarFactor = Math.sin((hour - 6) * Math.PI / 12);
    const solarReduction = solarFactor > 0 ? solarFactor * 100 : 0;

    // Demand factor (higher morning and evening)
    const demandFactor =
      (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 21) ? 50 : 0;

    // Wind variability (random but consistent per hour)
    const windReduction = Math.abs(Math.sin(timestamp / 3600000)) * 50;

    return Math.max(50, baseIntensity - solarReduction + demandFactor - windReduction);
  }

  private valueToIndex(value: number): CarbonIntensity['index'] {
    if (value < 50) return 'very-low';
    if (value < 100) return 'low';
    if (value < 200) return 'moderate';
    if (value < 350) return 'high';
    return 'very-high';
  }

  setRegion(region: string): void {
    this.region = region;
    this.cache.clear();
  }
}

// ============================================================================
// Device Energy Monitor
// ============================================================================

export class DeviceEnergyMonitor {
  private listeners: Set<(energy: DeviceEnergy) => void> = new Set();
  private batteryManager?: any;

  async initialize(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        this.batteryManager = await (navigator as any).getBattery();
        this.setupBatteryListeners();
      } catch (e) {
        // Battery API not available
      }
    }
  }

  async getCurrentEnergy(): Promise<DeviceEnergy> {
    if (this.batteryManager) {
      return {
        batteryLevel: this.batteryManager.level,
        charging: this.batteryManager.charging,
        chargingTime: this.batteryManager.chargingTime === Infinity
          ? null
          : this.batteryManager.chargingTime * 1000,
        dischargingTime: this.batteryManager.dischargingTime === Infinity
          ? null
          : this.batteryManager.dischargingTime * 1000,
        powerSource: this.batteryManager.charging ? 'ac' : 'battery',
        estimatedWattage: this.estimateWattage()
      };
    }

    // Fallback for browsers without Battery API
    return {
      batteryLevel: 1,
      charging: true,
      chargingTime: null,
      dischargingTime: null,
      powerSource: 'unknown',
      estimatedWattage: 15 // Assume average laptop
    };
  }

  isOnGreenPower(): boolean {
    // Consider device on "green" power if:
    // 1. Plugged in (less battery degradation)
    // 2. Battery is high (can defer work)
    if (!this.batteryManager) return true;

    return this.batteryManager.charging || this.batteryManager.level > 0.8;
  }

  subscribe(callback: (energy: DeviceEnergy) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private setupBatteryListeners(): void {
    if (!this.batteryManager) return;

    const notify = async () => {
      const energy = await this.getCurrentEnergy();
      this.listeners.forEach(cb => cb(energy));
    };

    this.batteryManager.addEventListener('chargingchange', notify);
    this.batteryManager.addEventListener('levelchange', notify);
    this.batteryManager.addEventListener('chargingtimechange', notify);
    this.batteryManager.addEventListener('dischargingtimechange', notify);
  }

  private estimateWattage(): number {
    // Estimate based on device type and activity
    // In production, could use more sophisticated heuristics
    if (typeof navigator === 'undefined') return 15;

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    return isMobile ? 5 : 20; // Watts
  }
}

// ============================================================================
// Carbon Task Scheduler
// ============================================================================

export class CarbonTaskScheduler {
  private intensityProvider: CarbonIntensityProvider;
  private energyMonitor: DeviceEnergyMonitor;
  private config: Required<CarbonConfig>;
  private taskQueue: Map<string, TaskSchedule> = new Map();
  private budget: CarbonBudget;
  private executionHistory: TaskSchedule[] = [];
  private schedulerInterval?: ReturnType<typeof setInterval>;

  constructor(config: CarbonConfig = {}) {
    this.config = {
      region: config.region ?? 'global',
      apiKey: config.apiKey,
      enableScheduling: config.enableScheduling ?? true,
      maxQueueSize: config.maxQueueSize ?? 100,
      defaultPriority: config.defaultPriority ?? 'normal',
      carbonBudget: config.carbonBudget ?? {},
      greenThreshold: config.greenThreshold ?? 100
    };

    this.intensityProvider = new CarbonIntensityProvider(
      this.config.region,
      this.config.apiKey
    );

    this.energyMonitor = new DeviceEnergyMonitor();

    this.budget = {
      daily: config.carbonBudget?.daily ?? 1000,
      weekly: config.carbonBudget?.weekly ?? 5000,
      monthly: config.carbonBudget?.monthly ?? 20000,
      used: {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    };
  }

  async initialize(): Promise<void> {
    await this.energyMonitor.initialize();
    this.startScheduler();
  }

  async scheduleTask(
    id: string,
    task: () => Promise<any>,
    options: Partial<Omit<TaskSchedule, 'id' | 'task'>> = {}
  ): Promise<string> {
    if (this.taskQueue.size >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    const schedule: TaskSchedule = {
      id,
      task,
      priority: options.priority ?? this.config.defaultPriority,
      estimatedEnergy: options.estimatedEnergy ?? 10, // Default 10mWh
      maxDelay: options.maxDelay ?? 24 * 60 * 60 * 1000, // Default 24h
      preferGreen: options.preferGreen ?? true
    };

    // Critical tasks execute immediately
    if (schedule.priority === 'critical') {
      await this.executeTask(schedule);
      return id;
    }

    // Check if current conditions are green
    const intensity = await this.intensityProvider.getCurrentIntensity();
    const energy = await this.energyMonitor.getCurrentEnergy();

    const isGreen = intensity.value < this.config.greenThreshold;
    const hasGreenPower = this.energyMonitor.isOnGreenPower();

    if (!this.config.enableScheduling || !schedule.preferGreen ||
        (isGreen && hasGreenPower) || schedule.priority === 'high') {
      await this.executeTask(schedule);
      return id;
    }

    // Find optimal window and schedule
    const window = await this.intensityProvider.findOptimalWindow(
      1000, // Assume 1 second execution
      schedule.maxDelay
    );

    if (window && window.start > Date.now() + 60000) {
      schedule.scheduled = window.start;
      this.taskQueue.set(id, schedule);
    } else {
      // No better window found, execute now
      await this.executeTask(schedule);
    }

    return id;
  }

  async executeNow(id: string): Promise<any> {
    const schedule = this.taskQueue.get(id);
    if (!schedule) {
      throw new Error(`Task ${id} not found`);
    }

    this.taskQueue.delete(id);
    return this.executeTask(schedule);
  }

  cancelTask(id: string): boolean {
    return this.taskQueue.delete(id);
  }

  getQueuedTasks(): TaskSchedule[] {
    return Array.from(this.taskQueue.values());
  }

  getBudget(): CarbonBudget {
    return { ...this.budget };
  }

  async generateReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<CarbonReport> {
    const start = startDate?.getTime() ?? Date.now() - 24 * 60 * 60 * 1000;
    const end = endDate?.getTime() ?? Date.now();

    const relevantHistory = this.executionHistory.filter(
      t => t.executed && t.executed >= start && t.executed <= end
    );

    const totalEmissions = relevantHistory.reduce(
      (sum, t) => sum + (t.carbonCost ?? 0),
      0
    );

    const greenTasks = relevantHistory.filter(
      t => (t.carbonCost ?? 0) / (t.estimatedEnergy || 1) < this.config.greenThreshold / 1000
    );

    // Estimate savings (difference between peak and actual)
    const peakIntensity = 350; // High intensity baseline
    const baselineEmissions = relevantHistory.reduce(
      (sum, t) => sum + (t.estimatedEnergy * peakIntensity / 1000),
      0
    );

    return {
      totalEmissions,
      taskBreakdown: relevantHistory.map(t => ({
        taskId: t.id,
        emissions: t.carbonCost ?? 0,
        energy: t.estimatedEnergy,
        timestamp: t.executed ?? 0
      })),
      savings: Math.max(0, baselineEmissions - totalEmissions),
      greenPercentage: relevantHistory.length > 0
        ? (greenTasks.length / relevantHistory.length) * 100
        : 100,
      period: { start, end }
    };
  }

  private async executeTask(schedule: TaskSchedule): Promise<any> {
    const intensity = await this.intensityProvider.getCurrentIntensity();

    // Calculate carbon cost: energy (mWh) * intensity (gCO2/kWh) / 1000
    const carbonCost = (schedule.estimatedEnergy * intensity.value) / 1000;

    schedule.executed = Date.now();
    schedule.carbonCost = carbonCost;

    // Update budget
    this.budget.used.daily += carbonCost;
    this.budget.used.weekly += carbonCost;
    this.budget.used.monthly += carbonCost;

    this.executionHistory.push(schedule);

    // Keep history manageable
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-500);
    }

    return schedule.task();
  }

  private startScheduler(): void {
    this.schedulerInterval = setInterval(async () => {
      const now = Date.now();
      const intensity = await this.intensityProvider.getCurrentIntensity();
      const isGreen = intensity.value < this.config.greenThreshold;

      for (const [id, schedule] of this.taskQueue) {
        // Execute if scheduled time has arrived
        if (schedule.scheduled && schedule.scheduled <= now) {
          this.taskQueue.delete(id);
          this.executeTask(schedule);
          continue;
        }

        // Execute if max delay exceeded
        if (schedule.scheduled &&
            now > (schedule.scheduled - schedule.maxDelay + schedule.maxDelay)) {
          this.taskQueue.delete(id);
          this.executeTask(schedule);
          continue;
        }

        // Execute deferrable tasks during very green periods
        if (isGreen && intensity.index === 'very-low' &&
            schedule.priority === 'deferrable') {
          this.taskQueue.delete(id);
          this.executeTask(schedule);
        }
      }

      // Reset daily budget at midnight
      this.resetBudgetIfNeeded();
    }, 60 * 1000); // Check every minute
  }

  private resetBudgetIfNeeded(): void {
    const now = new Date();

    // Reset daily at midnight
    if (now.getHours() === 0 && now.getMinutes() < 1) {
      this.budget.used.daily = 0;
    }

    // Reset weekly on Monday
    if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() < 1) {
      this.budget.used.weekly = 0;
    }

    // Reset monthly on 1st
    if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 1) {
      this.budget.used.monthly = 0;
    }
  }

  destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }
}

// ============================================================================
// Network Carbon Estimator
// ============================================================================

export class NetworkCarbonEstimator {
  // Average carbon intensity of data transfer
  // ~0.06 kWh per GB, varies by region
  private static readonly ENERGY_PER_GB = 0.06; // kWh
  private static readonly GLOBAL_GRID_INTENSITY = 475; // gCO2/kWh global average

  static estimateTransfer(bytes: number, region?: string): number {
    const gb = bytes / (1024 * 1024 * 1024);
    const energy = gb * this.ENERGY_PER_GB;
    const intensity = this.getRegionIntensity(region);
    return energy * intensity; // gCO2
  }

  static estimateRequest(
    requestSizeBytes: number,
    responseSizeBytes: number,
    region?: string
  ): number {
    return this.estimateTransfer(requestSizeBytes + responseSizeBytes, region);
  }

  static getRegionIntensity(region?: string): number {
    // Regional grid intensity approximations (gCO2/kWh)
    const intensities: Record<string, number> = {
      'france': 50,
      'sweden': 45,
      'norway': 30,
      'iceland': 20,
      'uk': 200,
      'germany': 350,
      'poland': 650,
      'usa': 400,
      'usa-ca': 200,
      'usa-tx': 350,
      'china': 550,
      'india': 700,
      'australia': 500,
      'brazil': 100,
    };

    return intensities[region?.toLowerCase() ?? ''] ?? this.GLOBAL_GRID_INTENSITY;
  }

  static createFetchWrapper(
    region?: string
  ): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, init);

      // Estimate carbon from transfer
      const requestSize = init?.body
        ? new Blob([init.body]).size
        : 0;

      const contentLength = response.headers.get('content-length');
      const responseSize = contentLength ? parseInt(contentLength, 10) : 0;

      const carbon = NetworkCarbonEstimator.estimateRequest(
        requestSize,
        responseSize,
        region
      );

      // Attach carbon estimate to response
      (response as any).__carbonEstimate = carbon;

      return response;
    };
  }
}

// ============================================================================
// Green Compute Wrapper
// ============================================================================

export function greenCompute<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    estimatedEnergy?: number;
    maxDelay?: number;
    priority?: TaskSchedule['priority'];
    scheduler?: CarbonTaskScheduler;
  } = {}
): T {
  let scheduler = options.scheduler;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!scheduler) {
      // Create default scheduler if none provided
      scheduler = new CarbonTaskScheduler();
      await scheduler.initialize();
    }

    const taskId = `greenCompute_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return new Promise((resolve, reject) => {
      scheduler!.scheduleTask(
        taskId,
        async () => {
          try {
            const result = await fn(...args);
            resolve(result);
            return result;
          } catch (e) {
            reject(e);
            throw e;
          }
        },
        {
          estimatedEnergy: options.estimatedEnergy ?? 10,
          maxDelay: options.maxDelay ?? 3600000, // 1 hour default
          priority: options.priority ?? 'normal',
          preferGreen: true
        }
      );
    });
  }) as T;
}

// ============================================================================
// React-style Hooks
// ============================================================================

// Simple reactive state for hooks
function createState<T>(initial: T): [() => T, (value: T) => void] {
  let value = initial;
  const listeners = new Set<() => void>();

  return [
    () => value,
    (newValue: T) => {
      value = newValue;
      listeners.forEach(l => l());
    }
  ];
}

// Singleton instances
let globalScheduler: CarbonTaskScheduler | null = null;
let globalIntensityProvider: CarbonIntensityProvider | null = null;
let globalEnergyMonitor: DeviceEnergyMonitor | null = null;

function getScheduler(): CarbonTaskScheduler {
  if (!globalScheduler) {
    globalScheduler = new CarbonTaskScheduler();
    globalScheduler.initialize();
  }
  return globalScheduler;
}

function getIntensityProvider(): CarbonIntensityProvider {
  if (!globalIntensityProvider) {
    globalIntensityProvider = new CarbonIntensityProvider();
  }
  return globalIntensityProvider;
}

function getEnergyMonitor(): DeviceEnergyMonitor {
  if (!globalEnergyMonitor) {
    globalEnergyMonitor = new DeviceEnergyMonitor();
    globalEnergyMonitor.initialize();
  }
  return globalEnergyMonitor;
}

/**
 * Hook for carbon-aware task scheduling
 */
export function useCarbonScheduler(config?: CarbonConfig): {
  scheduler: CarbonTaskScheduler;
  scheduleTask: (
    id: string,
    task: () => Promise<any>,
    options?: Partial<Omit<TaskSchedule, 'id' | 'task'>>
  ) => Promise<string>;
  cancelTask: (id: string) => boolean;
  getQueuedTasks: () => TaskSchedule[];
  getBudget: () => CarbonBudget;
  generateReport: (start?: Date, end?: Date) => Promise<CarbonReport>;
} {
  const scheduler = config ? new CarbonTaskScheduler(config) : getScheduler();

  return {
    scheduler,
    scheduleTask: (id, task, options) => scheduler.scheduleTask(id, task, options),
    cancelTask: (id) => scheduler.cancelTask(id),
    getQueuedTasks: () => scheduler.getQueuedTasks(),
    getBudget: () => scheduler.getBudget(),
    generateReport: (start, end) => scheduler.generateReport(start, end)
  };
}

/**
 * Hook for monitoring carbon intensity
 */
export function useCarbonIntensity(region?: string): {
  intensity: CarbonIntensity | null;
  loading: boolean;
  forecast: CarbonForecast[];
  isGreen: boolean;
  refresh: () => Promise<void>;
} {
  const provider = getIntensityProvider();
  if (region) provider.setRegion(region);

  const [getIntensity, setIntensity] = createState<CarbonIntensity | null>(null);
  const [getForecast, setForecast] = createState<CarbonForecast[]>([]);
  const [getLoading, setLoading] = createState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [current, forecast] = await Promise.all([
        provider.getCurrentIntensity(),
        provider.getForecast(24)
      ]);
      setIntensity(current);
      setForecast(forecast);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  refresh();

  // Subscribe to updates
  provider.subscribe(setIntensity);

  const intensity = getIntensity();

  return {
    intensity,
    loading: getLoading(),
    forecast: getForecast(),
    isGreen: intensity ? intensity.value < 100 : false,
    refresh
  };
}

/**
 * Hook for device energy monitoring
 */
export function useDeviceEnergy(): {
  energy: DeviceEnergy | null;
  isOnGreenPower: boolean;
  batteryLevel: number;
  isCharging: boolean;
} {
  const monitor = getEnergyMonitor();
  const [getEnergy, setEnergy] = createState<DeviceEnergy | null>(null);

  monitor.getCurrentEnergy().then(setEnergy);
  monitor.subscribe(setEnergy);

  const energy = getEnergy();

  return {
    energy,
    isOnGreenPower: monitor.isOnGreenPower(),
    batteryLevel: energy?.batteryLevel ?? 1,
    isCharging: energy?.charging ?? false
  };
}

/**
 * Hook for estimating network carbon
 */
export function useNetworkCarbon(region?: string): {
  estimateTransfer: (bytes: number) => number;
  estimateRequest: (reqBytes: number, resBytes: number) => number;
  greenFetch: typeof fetch;
} {
  return {
    estimateTransfer: (bytes) => NetworkCarbonEstimator.estimateTransfer(bytes, region),
    estimateRequest: (req, res) => NetworkCarbonEstimator.estimateRequest(req, res, region),
    greenFetch: NetworkCarbonEstimator.createFetchWrapper(region)
  };
}

/**
 * Hook for carbon budget management
 */
export function useCarbonBudget(): {
  budget: CarbonBudget;
  isWithinBudget: boolean;
  dailyRemaining: number;
  weeklyRemaining: number;
  monthlyRemaining: number;
  percentUsed: { daily: number; weekly: number; monthly: number };
} {
  const scheduler = getScheduler();
  const budget = scheduler.getBudget();

  return {
    budget,
    isWithinBudget:
      budget.used.daily < budget.daily &&
      budget.used.weekly < budget.weekly &&
      budget.used.monthly < budget.monthly,
    dailyRemaining: Math.max(0, budget.daily - budget.used.daily),
    weeklyRemaining: Math.max(0, budget.weekly - budget.used.weekly),
    monthlyRemaining: Math.max(0, budget.monthly - budget.used.monthly),
    percentUsed: {
      daily: (budget.used.daily / budget.daily) * 100,
      weekly: (budget.used.weekly / budget.weekly) * 100,
      monthly: (budget.used.monthly / budget.monthly) * 100
    }
  };
}

// ============================================================================
// Export All
// ============================================================================

export {
  CarbonIntensityProvider,
  DeviceEnergyMonitor,
  CarbonTaskScheduler,
  NetworkCarbonEstimator
};

export default {
  CarbonIntensityProvider,
  DeviceEnergyMonitor,
  CarbonTaskScheduler,
  NetworkCarbonEstimator,
  greenCompute,
  useCarbonScheduler,
  useCarbonIntensity,
  useDeviceEnergy,
  useNetworkCarbon,
  useCarbonBudget
};
