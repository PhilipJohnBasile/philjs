/**
 * PhilJS VS Code - Completion Provider
 */
import * as vscode from 'vscode';
export declare class PhilJSCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>;
    private isPhilJSContext;
    private getPhilJSCompletions;
    private getJSXCompletions;
    private createCompletion;
}
//# sourceMappingURL=completion.d.ts.map