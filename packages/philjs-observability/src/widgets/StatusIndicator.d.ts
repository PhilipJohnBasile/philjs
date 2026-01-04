/**
 * StatusIndicator Widget - Display system health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export interface StatusIndicatorProps {
    status: HealthStatus;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}
export interface StatusCardProps {
    title: string;
    status: HealthStatus;
    description?: string;
    lastChecked?: Date;
}
export interface UptimeBarProps {
    uptime: number;
    days?: number;
    showPercentage?: boolean;
}
export declare function StatusIndicator(props: StatusIndicatorProps): string;
export declare function StatusCard(props: StatusCardProps): string;
export declare function UptimeBar(props: UptimeBarProps): string;
//# sourceMappingURL=StatusIndicator.d.ts.map