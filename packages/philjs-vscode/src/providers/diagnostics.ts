/**
 * PhilJS VS Code - Diagnostics Provider
 */

import * as vscode from 'vscode';

export class PhilJSDiagnosticsProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('philjs');

    // Listen for document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        this.updateDiagnostics(e.document);
      })
    );

    // Listen for document opens
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.updateDiagnostics(doc);
      })
    );

    // Process currently open documents
    vscode.workspace.textDocuments.forEach((doc) => {
      this.updateDiagnostics(doc);
    });
  }

  private updateDiagnostics(document: vscode.TextDocument): void {
    if (!this.isPhilJSDocument(document)) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    // Check for common issues
    this.checkSignalUsage(document, text, diagnostics);
    this.checkEffectDependencies(document, text, diagnostics);
    this.checkMemoUsage(document, text, diagnostics);
    this.checkContextUsage(document, text, diagnostics);

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private isPhilJSDocument(document: vscode.TextDocument): boolean {
    const validLanguages = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'];
    if (!validLanguages.includes(document.languageId)) {
      return false;
    }

    const text = document.getText();
    return text.includes('@philjs/core') || text.includes('philjs');
  }

  private checkSignalUsage(
    document: vscode.TextDocument,
    text: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    // Check for direct signal access without .get() in JSX
    const signalInJSXRegex = /\{(\w+)\s*\}/g;
    let match;

    while ((match = signalInJSXRegex.exec(text)) !== null) {
      const varName = match[1];
      // Check if this variable is a signal
      if (text.includes(`${varName} = signal(`)) {
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(start, end);

        diagnostics.push({
          range,
          message: `Signal '${varName}' should be accessed with .get() for reactivity`,
          severity: vscode.DiagnosticSeverity.Warning,
          source: 'PhilJS',
          code: 'signal-access',
        });
      }
    }

    // Check for signal.set() inside render (without effect/handler)
    const setInRenderRegex = /return\s*\(\s*[\s\S]*?(\w+)\.set\(/g;
    while ((match = setInRenderRegex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      diagnostics.push({
        range,
        message: 'Avoid calling signal.set() directly in render. Use event handlers or effects.',
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'PhilJS',
        code: 'set-in-render',
      });
    }
  }

  private checkEffectDependencies(
    document: vscode.TextDocument,
    text: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    // Check for effect with empty body (potential bug)
    const emptyEffectRegex = /effect\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g;
    let match;

    while ((match = emptyEffectRegex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      diagnostics.push({
        range,
        message: 'Empty effect body. Did you forget to add the implementation?',
        severity: vscode.DiagnosticSeverity.Information,
        source: 'PhilJS',
        code: 'empty-effect',
      });
    }

    // Check for async effect without cleanup
    const asyncEffectRegex = /effect\s*\(\s*async\s*\(/g;
    while ((match = asyncEffectRegex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      diagnostics.push({
        range,
        message: 'Async effects should handle cleanup. Consider using AbortController.',
        severity: vscode.DiagnosticSeverity.Information,
        source: 'PhilJS',
        code: 'async-effect',
      });
    }
  }

  private checkMemoUsage(
    document: vscode.TextDocument,
    text: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    // Check for memo with no props
    const memoNoPropsRegex = /memo\s*\(\s*\(\s*\)\s*=>/g;
    let match;

    while ((match = memoNoPropsRegex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(start, end);

      diagnostics.push({
        range,
        message: 'memo() is unnecessary for components without props',
        severity: vscode.DiagnosticSeverity.Hint,
        source: 'PhilJS',
        code: 'unnecessary-memo',
      });
    }
  }

  private checkContextUsage(
    document: vscode.TextDocument,
    text: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    // Check for useContext outside of component
    const useContextRegex = /useContext\s*\(/g;
    let match;

    while ((match = useContextRegex.exec(text)) !== null) {
      // Check if inside a function component
      const beforeMatch = text.substring(0, match.index);
      const functionMatch = beforeMatch.match(/(function\s+\w+|const\s+\w+\s*=|=>\s*\{)[^}]*$/);

      if (!functionMatch) {
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(start, end);

        diagnostics.push({
          range,
          message: 'useContext should be called inside a component function',
          severity: vscode.DiagnosticSeverity.Error,
          source: 'PhilJS',
          code: 'context-outside-component',
        });
      }
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
