/**
 * PhilJS DevTools - Signal Inspector
 */
import type { SignalData } from '../types';
export declare class SignalInspector {
    private signals;
    private selectedSignal;
    update(signals: Map<string, SignalData>): void;
    select(signalId: string | null): void;
    render(): string;
    private renderSignalItem;
    private renderSignalDetails;
    private renderEmptyState;
    private formatValue;
}
//# sourceMappingURL=SignalInspector.d.ts.map