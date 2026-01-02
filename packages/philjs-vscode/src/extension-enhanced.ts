/**
 * PhilJS VS Code Extension - Enhanced Version
 *
 * Official VS Code extension providing comprehensive tooling for PhilJS development:
 * - IntelliSense (completions, hover, signatures)
 * - Code actions (quick fixes, refactorings)
 * - Diagnostics (real-time error detection)
 * - Code generators (components, routes, stores)
 * - Formatting and linting
 */

import * as vscode from 'vscode';
import { PhilJSCompletionProvider } from './providers/completion-enhanced.js';
import { PhilJSHoverProvider } from './providers/hover.js';
import { PhilJSDefinitionProvider } from './providers/definition.js';
import { PhilJSDiagnosticsProvider } from './providers/diagnostics.js';
import { PhilJSSignatureHelpProvider } from './providers/signature.js';
import { PhilJSCodeActionsProvider } from './providers/code-actions.js';
import { PhilJSFormattingProvider, PhilJSRangeFormattingProvider } from './providers/formatting.js';
import { createComponent, createRoute, createPage, createHook, createStore } from './generators.js';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('PhilJS extension is now active');

  const config = vscode.workspace.getConfiguration('philjs');
  const enableIntelliSense = config.get<boolean>('enableIntelliSense', true);

  // Language selector for all TypeScript/JavaScript files
  const selector: vscode.DocumentSelector = [
    { scheme: 'file', language: 'typescript' },
    { scheme: 'file', language: 'typescriptreact' },
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'javascriptreact' },
  ];

  if (enableIntelliSense) {
    // Completion provider
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        selector,
        new PhilJSCompletionProvider(),
        '.', '<', '/', '"', "'"
      )
    );

    // Hover provider
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        selector,
        new PhilJSHoverProvider()
      )
    );

    // Definition provider
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        selector,
        new PhilJSDefinitionProvider()
      )
    );

    // Signature help provider
    context.subscriptions.push(
      vscode.languages.registerSignatureHelpProvider(
        selector,
        new PhilJSSignatureHelpProvider(),
        '(', ','
      )
    );

    // Code actions provider
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        selector,
        new PhilJSCodeActionsProvider(),
        {
          providedCodeActionKinds: [
            vscode.CodeActionKind.QuickFix,
            vscode.CodeActionKind.Refactor,
            vscode.CodeActionKind.RefactorExtract,
          ],
        }
      )
    );

    // Formatting provider
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider(
        selector,
        new PhilJSFormattingProvider()
      )
    );

    context.subscriptions.push(
      vscode.languages.registerDocumentRangeFormattingEditProvider(
        selector,
        new PhilJSRangeFormattingProvider()
      )
    );

    // Diagnostics provider
    const diagnosticsProvider = new PhilJSDiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);
  }

  // Register commands
  registerCommands(context);

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(circuit-board) PhilJS';
  statusBarItem.tooltip = 'PhilJS is active - Click for commands';
  statusBarItem.command = 'philjs.showCommands';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Update status bar when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar)
  );

  // Initial status bar update
  updateStatusBar(vscode.window.activeTextEditor);
}

function registerCommands(context: vscode.ExtensionContext) {
  // Component creation
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createComponent', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter component name',
        placeHolder: 'MyComponent',
        validateInput: (value) => {
          if (!value) return 'Component name is required';
          if (!/^[A-Z]/.test(value)) return 'Component name must start with uppercase';
          return null;
        },
      });
      if (name) {
        await createComponent(name);
      }
    })
  );

  // Route creation
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createRoute', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter route name',
        placeHolder: 'users',
      });
      if (name) {
        await createRoute(name);
      }
    })
  );

  // Page creation
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createPage', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter page name',
        placeHolder: 'About',
      });
      if (name) {
        await createPage(name);
      }
    })
  );

  // Hook creation
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createHook', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter hook name (will add "use" prefix if missing)',
        placeHolder: 'Counter',
      });
      if (name) {
        await createHook(name);
      }
    })
  );

  // Store creation
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createStore', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter store name',
        placeHolder: 'user',
      });
      if (name) {
        await createStore(name);
      }
    })
  );

  // DevTools
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.openDevTools', async () => {
      const terminal = vscode.window.createTerminal('PhilJS DevTools');
      terminal.sendText('npx philjs dev');
      terminal.show();
    })
  );

  // Show commands palette
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.showCommands', async () => {
      const items = [
        {
          label: '$(file-code) Create Component',
          description: 'Generate a new PhilJS component',
          command: 'philjs.createComponent',
        },
        {
          label: '$(symbol-method) Create Route',
          description: 'Generate a new route with loader',
          command: 'philjs.createRoute',
        },
        {
          label: '$(file) Create Page',
          description: 'Generate a new page component',
          command: 'philjs.createPage',
        },
        {
          label: '$(symbol-function) Create Hook',
          description: 'Generate a custom hook',
          command: 'philjs.createHook',
        },
        {
          label: '$(database) Create Store',
          description: 'Generate a state store',
          command: 'philjs.createStore',
        },
        {
          label: '$(tools) Open DevTools',
          description: 'Start PhilJS development server',
          command: 'philjs.openDevTools',
        },
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a PhilJS command',
      });

      if (selected) {
        vscode.commands.executeCommand(selected.command);
      }
    })
  );

  // Refactoring commands
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.wrapInMemo', async (uri: vscode.Uri, range: vscode.Range) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const edit = new vscode.WorkspaceEdit();

      // Add import if needed
      const text = document.getText();
      if (!text.includes("from '@philjs/core'") || !text.includes('memo')) {
        const importLine = "import { memo } from '@philjs/core';\n";
        edit.insert(uri, new vscode.Position(0, 0), importLine);
      }

      // Wrap component in memo
      // This is a simplified implementation
      vscode.window.showInformationMessage('Wrap in memo functionality coming soon!');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.extractToSignal', async (uri: vscode.Uri, range: vscode.Range) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selectedText = editor.document.getText(range);
      const signalName = await vscode.window.showInputBox({
        prompt: 'Enter signal name',
        placeHolder: 'mySignal',
      });

      if (signalName) {
        const edit = new vscode.WorkspaceEdit();
        const signalDeclaration = `const ${signalName} = signal(${selectedText});\n`;

        // Insert signal declaration before the current line
        edit.insert(uri, new vscode.Position(range.start.line, 0), signalDeclaration);
        edit.replace(uri, range, `${signalName}.get()`);

        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`Extracted to signal: ${signalName}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.convertToIsland', async (uri: vscode.Uri, range: vscode.Range) => {
      vscode.window.showInformationMessage('Convert to island functionality coming soon!');
    })
  );
}

function updateStatusBar(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const document = editor.document;
  const text = document.getText();

  // Check if this is a PhilJS file
  const isPhilJSFile =
    text.includes('@philjs/core') ||
    text.includes('philjs-router') ||
    text.includes('philjs-ssr') ||
    document.fileName.includes('/philjs/');

  if (isPhilJSFile) {
    statusBarItem.show();

    // Count signals in the file
    const signalMatches = text.match(/signal\s*\(/g);
    const signalCount = signalMatches ? signalMatches.length : 0;

    statusBarItem.text = `$(circuit-board) PhilJS (${signalCount} signals)`;
    statusBarItem.tooltip = `PhilJS Development\n${signalCount} signals in this file`;
  } else {
    statusBarItem.hide();
  }
}

export function deactivate() {
  console.log('PhilJS extension is now deactivated');
}
