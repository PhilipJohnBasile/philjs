/**
 * PhilJS VS Code Extension
 *
 * Official VS Code extension providing snippets, IntelliSense,
 * code generators, and tooling for PhilJS development.
 */

import * as vscode from 'vscode';
import { PhilJSCompletionProvider } from './providers/completion.js';
import { PhilJSHoverProvider } from './providers/hover.js';
import { PhilJSDefinitionProvider } from './providers/definition.js';
import { PhilJSDiagnosticsProvider } from './providers/diagnostics.js';
import { createComponent, createRoute, createPage, createHook, createStore } from './generators.js';

export function activate(context: vscode.ExtensionContext) {

  const config = vscode.workspace.getConfiguration('philjs');
  const enableIntelliSense = config.get<boolean>('enableIntelliSense', true);

  // Register language features
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
        '.', '<', '/'
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

    // Diagnostics provider
    const diagnosticsProvider = new PhilJSDiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.createComponent', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Enter component name',
        placeHolder: 'MyComponent',
      });
      if (name) {
        await createComponent(name);
      }
    })
  );

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

  context.subscriptions.push(
    vscode.commands.registerCommand('philjs.openDevTools', async () => {
      const terminal = vscode.window.createTerminal('PhilJS DevTools');
      terminal.sendText('npx philjs dev');
      terminal.show();
    })
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(circuit-board) PhilJS';
  statusBarItem.tooltip = 'PhilJS is active';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {
}
