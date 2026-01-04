/**
 * PhilJS VS Code - Enhanced Completion Provider
 */
import * as vscode from 'vscode';
export declare class PhilJSCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>;
    private isPhilJSContext;
    private getPhilJSCompletions;
    private getJSXCompletions;
    private getImportCompletions;
    private createCompletion;
    resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem>;
}
//# sourceMappingURL=completion-enhanced.d.ts.map