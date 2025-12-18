import { signal, Signal } from "philjs-core";

export interface MetricData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  lastActive: Date;
  revenue: number;
  country: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  transactions: number;
  avgOrderValue: number;
}

// Generate realistic time series data
export function generateTimeSeriesData(
  points: number,
  baseValue: number,
  variance: number
): MetricData[] {
  const data: MetricData[] = [];
  let currentValue = baseValue;
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
    const change = (Math.random() - 0.5) * variance;
    currentValue = Math.max(0, currentValue + change);

    data.push({
      timestamp,
      value: Math.round(currentValue * 100) / 100,
    });
  }

  return data;
}

// Generate user data
export function generateUsers(count: number): User[] {
  const countries = ["USA", "UK", "Canada", "Germany", "France", "Japan", "Australia"];
  const statuses: ("active" | "inactive" | "pending")[] = ["active", "inactive", "pending"];
  const users: User[] = [];

  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      revenue: Math.round(Math.random() * 10000 * 100) / 100,
      country: countries[Math.floor(Math.random() * countries.length)],
    });
  }

  return users;
}

// Generate revenue data
export function generateRevenueData(days: number): RevenueData[] {
  const data: RevenueData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const transactions = Math.floor(Math.random() * 100) + 50;
    const avgOrderValue = Math.round((Math.random() * 100 + 50) * 100) / 100;

    data.push({
      date: date.toISOString().split("T")[0],
      revenue: Math.round(transactions * avgOrderValue * 100) / 100,
      transactions,
      avgOrderValue,
    });
  }

  return data;
}

// Create real-time data streams
export class DataStream {
  private interval: number | null = null;

  constructor(
    public data: Signal<MetricData[]>,
    private updateInterval: number,
    private baseValue: number,
    private variance: number
  ) {}

  start() {
    this.interval = window.setInterval(() => {
      const current = this.data();
      const lastValue = current[current.length - 1]?.value || this.baseValue;
      const change = (Math.random() - 0.5) * this.variance;
      const newValue = Math.max(0, lastValue + change);

      const newData = [
        ...current.slice(-59), // Keep last 59 points
        {
          timestamp: new Date(),
          value: Math.round(newValue * 100) / 100,
        },
      ];

      this.data.set(newData);
    }, this.updateInterval);
  }

  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Create data streams for dashboard
export function createDashboardStreams() {
  const activeUsers = signal(generateTimeSeriesData(60, 1250, 50));
  const responseTime = signal(generateTimeSeriesData(60, 145, 20));
  const revenue = signal(generateTimeSeriesData(60, 5420, 300));
  const errorRate = signal(generateTimeSeriesData(60, 2.3, 0.5));

  const streams = {
    activeUsers: new DataStream(activeUsers, 2000, 1250, 50),
    responseTime: new DataStream(responseTime, 2000, 145, 20),
    revenue: new DataStream(revenue, 3000, 5420, 300),
    errorRate: new DataStream(errorRate, 2500, 2.3, 0.5),
  };

  return streams;
}

// Calculate statistics
export function calculateStats(data: MetricData[]) {
  if (data.length === 0) return { min: 0, max: 0, avg: 0, current: 0 };

  const values = data.map((d) => d.value);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    current: values[values.length - 1] || 0,
  };
}
