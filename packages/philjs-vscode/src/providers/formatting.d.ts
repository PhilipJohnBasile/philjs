/**
 * PhilJS VS Code - Formatting Provider
 * Provides code formatting for PhilJS files
 */
import * as vscode from 'vscode';
export declare class PhilJSFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]>;
    private formatSignalDeclarations;
    private formatEffectBlocks;
    private formatJSXExpressions;
}
export declare class PhilJSRangeFormattingProvider implements vscode.DocumentRangeFormattingEditProvider {
    provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]>;
}
//# sourceMappingURL=formatting.d.ts.map