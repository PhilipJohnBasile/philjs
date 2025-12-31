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
export interface CarbonIntensity {
    value: number;
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
    daily: number;
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
    estimatedEnergy: number;
    maxDelay: number;
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
    totalEmissions: number;
    taskBreakdown: {
        taskId: string;
        emissions: number;
        energy: number;
        timestamp: number;
    }[];
    savings: number;
    greenPercentage: number;
    period: {
        start: number;
        end: number;
    };
}
export interface CarbonConfig {
    region?: string | undefined;
    apiKey?: string | undefined;
    enableScheduling?: boolean | undefined;
    maxQueueSize?: number | undefined;
    defaultPriority?: TaskSchedule['priority'] | undefined;
    carbonBudget?: Partial<CarbonBudget> | undefined;
    greenThreshold?: number | undefined;
}
export declare class CarbonIntensityProvider {
    private region;
    private apiKey?;
    private cache;
    private listeners;
    private pollInterval?;
    constructor(region?: string, apiKey?: string);
    getCurrentIntensity(): Promise<CarbonIntensity>;
    getForecast(hours?: number): Promise<CarbonForecast[]>;
    findOptimalWindow(durationMs: number, maxDelayMs: number): Promise<{
        start: number;
        intensity: number;
    } | null>;
    subscribe(callback: (intensity: CarbonIntensity) => void): () => void;
    private startPolling;
    private stopPolling;
    private simulateIntensity;
    private simulateIntensityValue;
    private valueToIndex;
    setRegion(region: string): void;
}
export declare class DeviceEnergyMonitor {
    private listeners;
    private batteryManager?;
    initialize(): Promise<void>;
    getCurrentEnergy(): Promise<DeviceEnergy>;
    isOnGreenPower(): boolean;
    subscribe(callback: (energy: DeviceEnergy) => void): () => void;
    private setupBatteryListeners;
    private estimateWattage;
}
export declare class CarbonTaskScheduler {
    private intensityProvider;
    private energyMonitor;
    private config;
    private taskQueue;
    private budget;
    private executionHistory;
    private schedulerInterval?;
    constructor(config?: CarbonConfig);
    initialize(): Promise<void>;
    scheduleTask(id: string, task: () => Promise<any>, options?: Partial<Omit<TaskSchedule, 'id' | 'task'>>): Promise<string>;
    executeNow(id: string): Promise<any>;
    cancelTask(id: string): boolean;
    getQueuedTasks(): TaskSchedule[];
    getBudget(): CarbonBudget;
    generateReport(startDate?: Date, endDate?: Date): Promise<CarbonReport>;
    private executeTask;
    private startScheduler;
    private resetBudgetIfNeeded;
    destroy(): void;
}
export declare class NetworkCarbonEstimator {
    private static readonly ENERGY_PER_GB;
    private static readonly GLOBAL_GRID_INTENSITY;
    static estimateTransfer(bytes: number, region?: string): number;
    static estimateRequest(requestSizeBytes: number, responseSizeBytes: number, region?: string): number;
    static getRegionIntensity(region?: string): number;
    static createFetchWrapper(region?: string): typeof fetch;
}
export declare function greenCompute<T extends (...args: any[]) => Promise<any>>(fn: T, options?: {
    estimatedEnergy?: number;
    maxDelay?: number;
    priority?: TaskSchedule['priority'];
    scheduler?: CarbonTaskScheduler;
}): T;
/**
 * Hook for carbon-aware task scheduling
 */
export declare function useCarbonScheduler(config?: CarbonConfig): {
    scheduler: CarbonTaskScheduler;
    scheduleTask: (id: string, task: () => Promise<any>, options?: Partial<Omit<TaskSchedule, 'id' | 'task'>>) => Promise<string>;
    cancelTask: (id: string) => boolean;
    getQueuedTasks: () => TaskSchedule[];
    getBudget: () => CarbonBudget;
    generateReport: (start?: Date, end?: Date) => Promise<CarbonReport>;
};
/**
 * Hook for monitoring carbon intensity
 */
export declare function useCarbonIntensity(region?: string): {
    intensity: CarbonIntensity | null;
    loading: boolean;
    forecast: CarbonForecast[];
    isGreen: boolean;
    refresh: () => Promise<void>;
};
/**
 * Hook for device energy monitoring
 */
export declare function useDeviceEnergy(): {
    energy: DeviceEnergy | null;
    isOnGreenPower: boolean;
    batteryLevel: number;
    isCharging: boolean;
};
/**
 * Hook for estimating network carbon
 */
export declare function useNetworkCarbon(region?: string): {
    estimateTransfer: (bytes: number) => number;
    estimateRequest: (reqBytes: number, resBytes: number) => number;
    greenFetch: typeof fetch;
};
/**
 * Hook for carbon budget management
 */
export declare function useCarbonBudget(): {
    budget: CarbonBudget;
    isWithinBudget: boolean;
    dailyRemaining: number;
    weeklyRemaining: number;
    monthlyRemaining: number;
    percentUsed: {
        daily: number;
        weekly: number;
        monthly: number;
    };
};
declare const _default: {
    CarbonIntensityProvider: typeof CarbonIntensityProvider;
    DeviceEnergyMonitor: typeof DeviceEnergyMonitor;
    CarbonTaskScheduler: typeof CarbonTaskScheduler;
    NetworkCarbonEstimator: typeof NetworkCarbonEstimator;
    greenCompute: typeof greenCompute;
    useCarbonScheduler: typeof useCarbonScheduler;
    useCarbonIntensity: typeof useCarbonIntensity;
    useDeviceEnergy: typeof useDeviceEnergy;
    useNetworkCarbon: typeof useNetworkCarbon;
    useCarbonBudget: typeof useCarbonBudget;
};
export default _default;
//# sourceMappingURL=index.d.ts.map