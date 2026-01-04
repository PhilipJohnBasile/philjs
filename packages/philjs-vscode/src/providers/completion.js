/**
 * PhilJS VS Code - Completion Provider
 */
import * as vscode from 'vscode';
export class PhilJSCompletionProvider {
    provideCompletionItems(document, position, token, context) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        // PhilJS Core completions
        if (this.isPhilJSContext(document, position)) {
            return this.getPhilJSCompletions(linePrefix);
        }
        // JSX completions
        if (context.triggerCharacter === '<') {
            return this.getJSXCompletions();
        }
        return [];
    }
    isPhilJSContext(document, position) {
        const text = document.getText();
        return text.includes('@philjs/core') || text.includes('philjs');
    }
    getPhilJSCompletions(linePrefix) {
        const completions = [];
        // Signal completions
        if (linePrefix.includes('signal') || linePrefix.endsWith('.')) {
            completions.push(this.createCompletion('signal', 'Create a reactive signal', 'const $1 = signal($2);', vscode.CompletionItemKind.Function), this.createCompletion('signal.get', 'Get signal value', '.get()', vscode.CompletionItemKind.Method), this.createCompletion('signal.set', 'Set signal value', '.set($1)', vscode.CompletionItemKind.Method), this.createCompletion('signal.update', 'Update signal with function', '.update(prev => $1)', vscode.CompletionItemKind.Method));
        }
        // Computed completions
        completions.push(this.createCompletion('computed', 'Create a computed value', 'const $1 = computed(() => $2);', vscode.CompletionItemKind.Function));
        // Effect completions
        completions.push(this.createCompletion('effect', 'Create a side effect', 'effect(() => {\n\t$1\n});', vscode.CompletionItemKind.Function));
        // Lifecycle completions
        completions.push(this.createCompletion('onMount', 'Run on component mount', 'onMount(() => {\n\t$1\n});', vscode.CompletionItemKind.Function), this.createCompletion('onCleanup', 'Run on cleanup', 'onCleanup(() => {\n\t$1\n});', vscode.CompletionItemKind.Function));
        // Memo completions
        completions.push(this.createCompletion('memo', 'Memoize a component', 'const $1 = memo(($2) => {\n\treturn (\n\t\t$3\n\t);\n});', vscode.CompletionItemKind.Function));
        // Context completions
        completions.push(this.createCompletion('createContext', 'Create a context', 'const $1Context = createContext<$2 | null>(null);', vscode.CompletionItemKind.Function), this.createCompletion('useContext', 'Use a context', 'const $1 = useContext($2Context);', vscode.CompletionItemKind.Function));
        return completions;
    }
    getJSXCompletions() {
        return [
            // PhilJS UI Components
            this.createCompletion('Button', 'PhilJS UI Button', '<Button $1>$2</Button>', vscode.CompletionItemKind.Class),
            this.createCompletion('Input', 'PhilJS UI Input', '<Input placeholder="$1" $2/>', vscode.CompletionItemKind.Class),
            this.createCompletion('Select', 'PhilJS UI Select', '<Select options={$1} $2/>', vscode.CompletionItemKind.Class),
            this.createCompletion('Modal', 'PhilJS UI Modal', '<Modal isOpen={$1} onClose={$2}>\n\t$3\n</Modal>', vscode.CompletionItemKind.Class),
            this.createCompletion('Card', 'PhilJS UI Card', '<Card>\n\t$1\n</Card>', vscode.CompletionItemKind.Class),
            this.createCompletion('Alert', 'PhilJS UI Alert', '<Alert status="$1">$2</Alert>', vscode.CompletionItemKind.Class),
            this.createCompletion('Tabs', 'PhilJS UI Tabs', '<Tabs defaultValue="$1">\n\t<TabList>\n\t\t<Tab value="$1">$2</Tab>\n\t</TabList>\n\t<TabPanels>\n\t\t<TabPanel value="$1">$3</TabPanel>\n\t</TabPanels>\n</Tabs>', vscode.CompletionItemKind.Class),
            // PhilJS Router Components
            this.createCompletion('Link', 'PhilJS Router Link', '<Link to="$1">$2</Link>', vscode.CompletionItemKind.Class),
            this.createCompletion('Route', 'PhilJS Route', '<Route path="$1" element={<$2 />} />', vscode.CompletionItemKind.Class),
            this.createCompletion('Outlet', 'PhilJS Router Outlet', '<Outlet />', vscode.CompletionItemKind.Class),
            // PhilJS Meta Components
            this.createCompletion('Head', 'PhilJS Meta Head', '<Head>\n\t<Title>$1</Title>\n\t<Meta name="description" content="$2" />\n</Head>', vscode.CompletionItemKind.Class),
            this.createCompletion('Title', 'PhilJS Meta Title', '<Title>$1</Title>', vscode.CompletionItemKind.Class),
            this.createCompletion('Meta', 'PhilJS Meta Tag', '<Meta name="$1" content="$2" />', vscode.CompletionItemKind.Class),
        ];
    }
    createCompletion(label, detail, insertText, kind) {
        const completion = new vscode.CompletionItem(label, kind);
        completion.detail = detail;
        completion.insertText = new vscode.SnippetString(insertText);
        completion.documentation = new vscode.MarkdownString(`**${label}**\n\n${detail}`);
        return completion;
    }
}
//# sourceMappingURL=completion.js.map