/**
 * PhilJS VS Code - Formatting Provider
 * Provides code formatting for PhilJS files
 */
import * as vscode from 'vscode';
export class PhilJSFormattingProvider {
    provideDocumentFormattingEdits(document, options, token) {
        const edits = [];
        const text = document.getText();
        // Format signal declarations
        edits.push(...this.formatSignalDeclarations(document, text, options));
        // Format effect blocks
        edits.push(...this.formatEffectBlocks(document, text, options));
        // Format JSX expressions
        edits.push(...this.formatJSXExpressions(document, text, options));
        return edits;
    }
    formatSignalDeclarations(document, text, options) {
        const edits = [];
        // Ensure consistent spacing around signal declarations
        const signalPattern = /const\s+(\w+)\s*=\s*signal\s*\(\s*(.+?)\s*\)\s*;/g;
        let match;
        while ((match = signalPattern.exec(text)) !== null) {
            const varName = match[1];
            const value = match[2];
            const formatted = `const ${varName} = signal(${value});`;
            if (match[0] !== formatted) {
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                edits.push(vscode.TextEdit.replace(new vscode.Range(start, end), formatted));
            }
        }
        return edits;
    }
    formatEffectBlocks(document, text, options) {
        const edits = [];
        // Ensure consistent formatting for effect blocks
        // This is a simplified version - full implementation would use a proper parser
        return edits;
    }
    formatJSXExpressions(document, text, options) {
        const edits = [];
        // Ensure signal.get() is used in JSX expressions
        const jsxPattern = /\{(\w+)\}/g;
        let match;
        while ((match = jsxPattern.exec(text)) !== null) {
            const varName = match[1];
            // Check if this is a signal
            if (text.includes(`${varName} = signal(`)) {
                const formatted = `{${varName}.get()}`;
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                edits.push(vscode.TextEdit.replace(new vscode.Range(start, end), formatted));
            }
        }
        return edits;
    }
}
export class PhilJSRangeFormattingProvider {
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        const edits = [];
        const text = document.getText(range);
        // Format only the selected range
        // Implementation would be similar to full document formatting
        // but limited to the specified range
        return edits;
    }
}
//# sourceMappingURL=formatting.js.map