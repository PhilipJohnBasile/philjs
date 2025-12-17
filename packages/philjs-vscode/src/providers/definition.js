/**
 * PhilJS VS Code - Definition Provider
 */
import * as vscode from 'vscode';
import * as path from 'path';
export class PhilJSDefinitionProvider {
    async provideDefinition(document, position, token) {
        const range = document.getWordRangeAtPosition(position);
        if (!range)
            return null;
        const word = document.getText(range);
        const line = document.lineAt(position.line).text;
        // Handle component references in JSX
        if (this.isJSXTag(line, word, position.character)) {
            return this.findComponentDefinition(document, word);
        }
        // Handle signal references
        if (this.isSignalAccess(line, position.character)) {
            return this.findSignalDefinition(document, word);
        }
        // Handle imports
        if (line.includes('import') && line.includes('from')) {
            return this.resolveImport(document, line, word);
        }
        return null;
    }
    isJSXTag(line, word, character) {
        // Check if word follows < or is a component name (PascalCase)
        const beforeWord = line.substring(0, character).trim();
        return beforeWord.endsWith('<') || (word[0] === word[0].toUpperCase() && /^[A-Z]/.test(word));
    }
    isSignalAccess(line, character) {
        // Check for .get() or .set() patterns
        return line.includes('.get()') || line.includes('.set(');
    }
    async findComponentDefinition(document, componentName) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder)
            return null;
        // Search for component definition
        const pattern = new vscode.RelativePattern(workspaceFolder, `**/${componentName}.{tsx,jsx,ts,js}`);
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 10);
        const locations = [];
        for (const file of files) {
            const doc = await vscode.workspace.openTextDocument(file);
            const text = doc.getText();
            // Find export statement
            const exportMatch = text.match(new RegExp(`export\\s+(function|const|class)\\s+${componentName}`, 'm'));
            if (exportMatch && exportMatch.index !== undefined) {
                const pos = doc.positionAt(exportMatch.index);
                locations.push(new vscode.Location(file, pos));
            }
        }
        return locations.length > 0 ? locations : null;
    }
    async findSignalDefinition(document, signalName) {
        const text = document.getText();
        // Find signal declaration
        const signalMatch = text.match(new RegExp(`(const|let)\\s+${signalName}\\s*=\\s*signal\\s*\\(`, 'm'));
        if (signalMatch && signalMatch.index !== undefined) {
            const pos = document.positionAt(signalMatch.index);
            return new vscode.Location(document.uri, pos);
        }
        return null;
    }
    async resolveImport(document, line, word) {
        // Extract import path
        const importMatch = line.match(/from\s+['"](.+)['"]/);
        if (!importMatch)
            return null;
        const importPath = importMatch[1];
        // Handle relative imports
        if (importPath.startsWith('.')) {
            const dir = path.dirname(document.uri.fsPath);
            const resolvedPath = path.resolve(dir, importPath);
            // Try different extensions
            const extensions = ['.tsx', '.ts', '.jsx', '.js'];
            for (const ext of extensions) {
                const fullPath = resolvedPath + ext;
                try {
                    const uri = vscode.Uri.file(fullPath);
                    const doc = await vscode.workspace.openTextDocument(uri);
                    // Find the export
                    const text = doc.getText();
                    const exportMatch = text.match(new RegExp(`export\\s+(function|const|class)\\s+${word}`, 'm'));
                    if (exportMatch && exportMatch.index !== undefined) {
                        const pos = doc.positionAt(exportMatch.index);
                        return new vscode.Location(uri, pos);
                    }
                }
                catch {
                    // File doesn't exist with this extension
                }
            }
        }
        return null;
    }
}
//# sourceMappingURL=definition.js.map