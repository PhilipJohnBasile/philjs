/**
 * PhilJS VS Code - Code Actions Provider
 * Provides quick fixes and refactorings
 */
import * as vscode from 'vscode';
export declare class PhilJSCodeActionsProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]>;
    private shouldAddSignalGet;
    private createAddSignalGetAction;
    private shouldAddEffectCleanup;
    private createAddEffectCleanupAction;
    private shouldWrapInMemo;
    private createWrapInMemoAction;
    private findMissingImport;
    private createAddImportAction;
    private createExtractToSignalAction;
    private isComponent;
    private createConvertToIslandAction;
}
//# sourceMappingURL=code-actions.d.ts.map