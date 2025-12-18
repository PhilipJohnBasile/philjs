/**
 * PhilJS VS Code Extension Tests
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { PhilJSCompletionProvider } from '../providers/completion-enhanced';
import { PhilJSHoverProvider } from '../providers/hover';

suite('PhilJS Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('philjs.philjs-vscode'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('philjs.philjs-vscode');
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  suite('Completion Provider', () => {
    const provider = new PhilJSCompletionProvider();

    test('Should provide signal completions', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'typescript',
        content: 'import { signal } from "philjs-core";\nconst count = sig',
      });

      const position = new vscode.Position(1, 17);
      const completions = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
      );

      assert.ok(completions);
      const items = Array.isArray(completions) ? completions : completions.items;
      const signalCompletion = items.find((item) => item.label === 'signal');
      assert.ok(signalCompletion, 'Should have signal completion');
    });

    test('Should provide JSX completions', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'typescriptreact',
        content: 'import { signal } from "philjs-core";\nfunction App() { return <',
      });

      const position = new vscode.Position(1, 31);
      const completions = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        { triggerKind: vscode.CompletionTriggerKind.TriggerCharacter, triggerCharacter: '<' }
      );

      assert.ok(completions);
      const items = Array.isArray(completions) ? completions : completions.items;
      assert.ok(items.length > 0, 'Should have JSX completions');
    });
  });

  suite('Hover Provider', () => {
    const provider = new PhilJSHoverProvider();

    test('Should provide hover for signal', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'typescript',
        content: 'import { signal } from "philjs-core";\nconst count = signal(0);',
      });

      const position = new vscode.Position(1, 14); // Position on 'signal'
      const hover = await provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(hover, 'Should provide hover');
      assert.ok(hover.contents.length > 0, 'Hover should have content');
    });

    test('Should provide hover for computed', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'typescript',
        content: 'import { computed } from "philjs-core";\nconst doubled = computed(() => 2);',
      });

      const position = new vscode.Position(1, 16); // Position on 'computed'
      const hover = await provider.provideHover(
        document,
        position,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(hover, 'Should provide hover for computed');
    });
  });

  suite('Commands', () => {
    test('Commands should be registered', async () => {
      const commands = await vscode.commands.getCommands(true);

      const philjsCommands = [
        'philjs.createComponent',
        'philjs.createRoute',
        'philjs.createPage',
        'philjs.createHook',
        'philjs.createStore',
        'philjs.openDevTools',
        'philjs.showCommands',
      ];

      for (const command of philjsCommands) {
        assert.ok(
          commands.includes(command),
          `Command ${command} should be registered`
        );
      }
    });
  });

  suite('Configuration', () => {
    test('Should have default configuration', () => {
      const config = vscode.workspace.getConfiguration('philjs');

      assert.strictEqual(
        config.get('enableIntelliSense'),
        true,
        'IntelliSense should be enabled by default'
      );

      assert.strictEqual(
        config.get('signalHighlighting'),
        true,
        'Signal highlighting should be enabled by default'
      );

      assert.strictEqual(
        config.get('componentDirectory'),
        'src/components',
        'Default component directory should be src/components'
      );
    });
  });

  suite('Snippets', () => {
    test('Should load snippets', () => {
      // Snippets are loaded by VS Code, just verify extension is active
      const ext = vscode.extensions.getExtension('philjs.philjs-vscode');
      assert.ok(ext?.isActive, 'Extension should be active to load snippets');
    });
  });
});
