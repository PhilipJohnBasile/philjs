/**
 * PhilJS VS Code - Diagnostics Provider
 */
import * as vscode from 'vscode';
export declare class PhilJSDiagnosticsProvider implements vscode.Disposable {
    private diagnosticCollection;
    private disposables;
    constructor();
    private updateDiagnostics;
    private isPhilJSDocument;
    private checkSignalUsage;
    private checkEffectDependencies;
    private checkMemoUsage;
    private checkContextUsage;
    dispose(): void;
}
//# sourceMappingURL=diagnostics.d.ts.map