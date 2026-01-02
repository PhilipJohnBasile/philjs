/**
 * PhilJS VS Code - Code Actions Provider
 * Provides quick fixes and refactorings
 */

import * as vscode from 'vscode';

export class PhilJSCodeActionsProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const actions: vscode.CodeAction[] = [];

    // Get the text at the current position
    const line = document.lineAt(range.start.line).text;

    // Quick fix: Convert signal access to .get()
    if (this.shouldAddSignalGet(line, range, document)) {
      actions.push(this.createAddSignalGetAction(document, range));
    }

    // Quick fix: Add effect cleanup
    if (this.shouldAddEffectCleanup(line, document, range)) {
      actions.push(this.createAddEffectCleanupAction(document, range));
    }

    // Quick fix: Wrap in memo
    if (this.shouldWrapInMemo(document, range)) {
      actions.push(this.createWrapInMemoAction(document, range));
    }

    // Quick fix: Add missing imports
    const missingImport = this.findMissingImport(document, range);
    if (missingImport) {
      actions.push(this.createAddImportAction(document, missingImport));
    }

    // Refactor: Extract to signal
    if (range.start.line !== range.end.line || range.start.character !== range.end.character) {
      actions.push(this.createExtractToSignalAction(document, range));
    }

    // Refactor: Convert to island
    if (this.isComponent(document, range)) {
      actions.push(this.createConvertToIslandAction(document, range));
    }

    return actions;
  }

  private shouldAddSignalGet(
    line: string,
    range: vscode.Range,
    document: vscode.TextDocument
  ): boolean {
    // Check if we're in JSX and accessing a signal without .get()
    const jsxPattern = /\{(\w+)\}/;
    const match = jsxPattern.exec(line);
    if (!match) return false;

    const varName = match[1];
    const text = document.getText();
    return text.includes(`${varName} = signal(`);
  }

  private createAddSignalGetAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Add .get() to signal access',
      vscode.CodeActionKind.QuickFix
    );
    action.isPreferred = true;

    const line = document.lineAt(range.start.line).text;
    const match = line.match(/\{(\w+)\}/);
    if (match) {
      const varName = match[1];
      const newText = `{${varName}.get()}`;
      const edit = new vscode.WorkspaceEdit();
      const matchIndex = line.indexOf(match[0]);
      const replaceRange = new vscode.Range(
        range.start.line,
        matchIndex,
        range.start.line,
        matchIndex + match[0].length
      );
      edit.replace(document.uri, replaceRange, newText);
      action.edit = edit;
    }

    return action;
  }

  private shouldAddEffectCleanup(
    line: string,
    document: vscode.TextDocument,
    range: vscode.Range
  ): boolean {
    // Check if we're in an effect without a cleanup return
    if (!line.includes('effect')) return false;

    const text = document.getText();
    const effectPattern = /effect\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)/g;
    const matches = text.matchAll(effectPattern);

    for (const match of matches) {
      if (match[0] && !match[0].includes('return () =>')) {
        return true;
      }
    }

    return false;
  }

  private createAddEffectCleanupAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Add cleanup function to effect',
      vscode.CodeActionKind.QuickFix
    );

    // Find the effect block and add cleanup
    const text = document.getText();
    const edit = new vscode.WorkspaceEdit();

    // This is a simplified version - you'd want more robust parsing
    action.command = {
      title: 'Add cleanup',
      command: 'philjs.addEffectCleanup',
      arguments: [document.uri, range],
    };

    return action;
  }

  private shouldWrapInMemo(
    document: vscode.TextDocument,
    range: vscode.Range
  ): boolean {
    const line = document.lineAt(range.start.line).text;
    // Check if we have a component function that's not already memoized
    return /export (function|const) \w+/.test(line) && !line.includes('memo');
  }

  private createWrapInMemoAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Wrap component in memo()',
      vscode.CodeActionKind.Refactor
    );

    action.command = {
      title: 'Wrap in memo',
      command: 'philjs.wrapInMemo',
      arguments: [document.uri, range],
    };

    return action;
  }

  private findMissingImport(
    document: vscode.TextDocument,
    range: vscode.Range
  ): string | null {
    const word = document.getText(
      document.getWordRangeAtPosition(range.start)
    );

    const importMap: Record<string, string> = {
      signal: '@philjs/core',
      computed: '@philjs/core',
      effect: '@philjs/core',
      memo: '@philjs/core',
      onMount: '@philjs/core',
      onCleanup: '@philjs/core',
      createContext: '@philjs/core',
      useContext: '@philjs/core',
      Link: 'philjs-router',
      Route: 'philjs-router',
      useNavigate: 'philjs-router',
      useParams: 'philjs-router',
      renderToString: 'philjs-ssr',
      hydrate: 'philjs-ssr',
      island: 'philjs-islands',
    };

    const text = document.getText();
    const packageName = importMap[word];

    if (packageName && !text.includes(`from '${packageName}'`)) {
      return packageName;
    }

    return null;
  }

  private createAddImportAction(
    document: vscode.TextDocument,
    packageName: string
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Import from '${packageName}'`,
      vscode.CodeActionKind.QuickFix
    );
    action.isPreferred = true;

    const edit = new vscode.WorkspaceEdit();
    const importStatement = `import { ${packageName} } from '${packageName}';\n`;

    // Add import at the top of the file
    edit.insert(document.uri, new vscode.Position(0, 0), importStatement);
    action.edit = edit;

    return action;
  }

  private createExtractToSignalAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Extract to signal',
      vscode.CodeActionKind.RefactorExtract
    );

    action.command = {
      title: 'Extract to signal',
      command: 'philjs.extractToSignal',
      arguments: [document.uri, range],
    };

    return action;
  }

  private isComponent(
    document: vscode.TextDocument,
    range: vscode.Range
  ): boolean {
    const line = document.lineAt(range.start.line).text;
    return /export (function|const) [A-Z]\w+/.test(line);
  }

  private createConvertToIslandAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Convert to island component',
      vscode.CodeActionKind.Refactor
    );

    action.command = {
      title: 'Convert to island',
      command: 'philjs.convertToIsland',
      arguments: [document.uri, range],
    };

    return action;
  }
}
