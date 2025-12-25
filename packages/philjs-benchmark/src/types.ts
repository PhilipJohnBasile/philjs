/**
 * Types for the PhilJS benchmark suite.
 */

export interface BenchmarkResult {
  name: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
  samples: number;
  ops: number;
  unit: 'ms' | 'us' | 'ns' | 'ops/s' | 'MB' | 'KB' | 'B';
}

export interface BenchmarkSuite {
  name: string;
  version: string;
  timestamp: string;
  environment: EnvironmentInfo;
  results: BenchmarkResult[];
}

export interface EnvironmentInfo {
  runtime: string;
  runtimeVersion: string;
  os: string;
  cpu: string;
  memory: string;
}

export interface ComparisonResult {
  framework: string;
  benchmarks: Record<string, {
    value: number;
    unit: string;
    comparison?: string;
  }>;
}

export interface FullBenchmarkReport {
  framework: 'philjs';
  version: string;
  timestamp: string;
  environment: EnvironmentInfo;
  suites: {
    framework: BenchmarkSuite;
    reactivity: BenchmarkSuite;
    ssr: BenchmarkSuite;
    bundle: BenchmarkSuite;
    rust?: BenchmarkSuite;
  };
  comparison?: Record<string, ComparisonResult>;
  summary: {
    totalBenchmarks: number;
    passed: number;
    failed: number;
    warnings: string[];
  };
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  verbose?: boolean;
  saveResults?: boolean;
  outputPath?: string;
}

export interface RowData {
  id: number;
  label: string;
  selected?: boolean;
}

export type BenchmarkFn = () => void | Promise<void>;
export type SetupFn = () => void | Promise<void>;
export type TeardownFn = () => void | Promise<void>;

export interface Benchmark {
  name: string;
  fn: BenchmarkFn;
  setup?: SetupFn;
  teardown?: TeardownFn;
  iterations?: number;
}
