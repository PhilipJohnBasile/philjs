
interface MetricPoint {
    timestamp: number;
    type: 'crash' | 'heal' | 'uptime';
    details?: any;
}

/**
 * Tracks the stability and self-healing performance of the runtime.
 */
export class ReliabilityMetrics {
    private history: MetricPoint[] = [];

    recordCrash(error: Error) {
        this.history.push({
            timestamp: Date.now(),
            type: 'crash',
            details: error.message
        });
        console.log('Metrics: 📉 Crash recorded.');
    }

    recordHeal(patternName: string) {
        this.history.push({
            timestamp: Date.now(),
            type: 'heal',
            details: patternName
        });
        console.log('Metrics: 📈 Successful self-heal recorded.');
    }

    getReliabilityScore(): number {
        const crashes = this.history.filter(h => h.type === 'crash').length;
        const heals = this.history.filter(h => h.type === 'heal').length;

        if (crashes === 0) return 100;

        // Score calculation: Heals mitigate crash penalties by 50%
        const successfulMitigations = Math.min(crashes, heals);
        const unmitigatedCrashes = crashes - successfulMitigations;

        return Math.max(0, 100 - (unmitigatedCrashes * 10) - (successfulMitigations * 2));
    }

    generateReport() {
        return {
            score: this.getReliabilityScore(),
            totalIncidents: this.history.length,
            autoHealRate: `${(this.history.filter(h => h.type === 'heal').length / this.history.filter(h => h.type === 'crash').length * 100).toFixed(1)}%`
        };
    }
}
