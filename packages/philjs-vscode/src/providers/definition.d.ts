/**
 * PhilJS VS Code - Definition Provider
 */
import * as vscode from 'vscode';
export declare class PhilJSDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.LocationLink[] | null>;
    private isJSXTag;
    private isSignalAccess;
    private findComponentDefinition;
    private findSignalDefinition;
    private resolveImport;
}
//# sourceMappingURL=definition.d.ts.map