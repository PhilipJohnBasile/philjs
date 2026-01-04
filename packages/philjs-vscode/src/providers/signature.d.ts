/**
 * PhilJS VS Code - Signature Help Provider
 * Provides parameter hints for PhilJS functions
 */
import * as vscode from 'vscode';
export declare class PhilJSSignatureHelpProvider implements vscode.SignatureHelpProvider {
    provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp>;
    private getActiveParameter;
}
//# sourceMappingURL=signature.d.ts.map